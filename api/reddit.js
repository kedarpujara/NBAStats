// Vercel serverless proxy for the r/nba feed.
//
// We try Reddit's JSON endpoint first because it includes upvotes,
// comment counts, and a real permalink. CLAUDE.md notes that the JSON
// endpoint has historically returned 403 server-side; that was almost
// certainly the generic User-Agent. Reddit recommends a UA of the form
// `<platform>:<app-id>:<version> (by /u/<username>)`. If JSON still
// fails for any reason, we fall back to the existing RSS path so the
// feed never goes fully dark.

const JSON_USER_AGENT = 'web:nbastats:v1.0 (by /u/nbastats)';
const RSS_USER_AGENT = 'NBAStats/1.0 (web app)';

const decodeHtml = (str) => str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

// Single-line JSON log so Vercel's log inspector keeps each event on its own row.
const log = (level, msg, data = {}) => {
    const entry = { ts: new Date().toISOString(), source: 'api/reddit', level, msg, ...data };
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else console.warn(line);
};

const cleanThumbnail = (thumb) => {
    if (!thumb || typeof thumb !== 'string') return null;
    if (thumb === 'self' || thumb === 'default' || thumb === 'nsfw' || thumb === 'spoiler') return null;
    if (!thumb.startsWith('http')) return null;
    return thumb;
};

const fetchFromJson = async (limit, after) => {
    let url = `https://www.reddit.com/r/nba/hot.json?limit=${limit}&raw_json=1`;
    if (after) url += `&after=${encodeURIComponent(after)}`;
    const start = Date.now();

    const response = await fetch(url, {
        headers: {
            'User-Agent': JSON_USER_AGENT,
            'Accept': 'application/json',
        },
    });

    const duration = Date.now() - start;
    log('info', 'reddit json fetch complete', { status: response.status, duration_ms: duration });

    if (!response.ok) {
        const bodySnippet = await response.text().catch(() => '');
        const err = new Error(`reddit json HTTP ${response.status}`);
        err.status = response.status;
        err.bodySnippet = bodySnippet.slice(0, 200);
        throw err;
    }

    const data = await response.json();
    if (!data?.data?.children) {
        throw new Error('reddit json missing data.children');
    }

    const children = data.data.children.map((child) => {
        const post = child?.data || {};
        const permalink = post.permalink || '';
        const postUrl = permalink ? `https://www.reddit.com${permalink}` : (post.url_overridden_by_dest || post.url || '');
        return {
            data: {
                id: post.id || '',
                title: post.title || '',
                url: postUrl,
                author: post.author || 'unknown',
                ups: typeof post.ups === 'number' ? post.ups : 0,
                num_comments: typeof post.num_comments === 'number' ? post.num_comments : 0,
                thumbnail: cleanThumbnail(post.thumbnail),
                created: post.created_utc ?? 0,
            },
        };
    });

    return {
        data: {
            children,
            after: data.data.after || null,
        },
    };
};

const fetchFromRss = async (limit, after) => {
    let url = `https://www.reddit.com/r/nba/hot.rss?limit=${limit}`;
    if (after) url += `&after=${encodeURIComponent(after)}`;
    const start = Date.now();

    const response = await fetch(url, {
        headers: {
            'User-Agent': RSS_USER_AGENT,
            'Accept': 'application/rss+xml, application/xml, text/xml',
        },
    });

    const duration = Date.now() - start;
    log('info', 'reddit rss fetch complete', { status: response.status, duration_ms: duration });

    if (!response.ok) {
        const err = new Error(`reddit rss HTTP ${response.status}`);
        err.status = response.status;
        throw err;
    }

    const xml = await response.text();
    // Parse Atom XML entries - split on entry boundaries
    const entries = xml.split('<entry>').slice(1);

    const posts = entries.map((entry, idx) => {
        // Use [^<]* (not [\s\S]*?) - content field is huge and causes [\s\S]*? to fail
        const getSimpleTag = (tag) => {
            const match = entry.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`));
            return match ? match[1].trim() : '';
        };

        const title = decodeHtml(getSimpleTag('title'));

        const authorName = entry.match(/<author><name>([^<]+)<\/name>/)?.[1] || 'unknown';
        const author = authorName.replace('/u/', '');

        // Link format: <link href="https://www.reddit.com/r/nba/..." />
        const linkMatch = entry.match(/href="(https:\/\/www\.reddit\.com\/r\/nba\/[^"]+)"/);
        const postUrl = linkMatch ? linkMatch[1] : '';

        const updated = getSimpleTag('updated');
        const created = updated ? Math.floor(new Date(updated).getTime() / 1000) : 0;

        // ID format: t3_XXXXXX — extract the base36 id after t3_
        const rawId = getSimpleTag('id');
        const id = rawId.startsWith('t3_') ? rawId.slice(3) : `post_${idx}`;

        const thumbnailMatch = entry.match(/media:thumbnail url="([^"]+)"/);
        const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null;

        return { id, title, url: postUrl, author, ups: 0, num_comments: 0, thumbnail, created };
    });

    const validPosts = posts.filter((p) => p.url && p.title);

    return {
        data: {
            children: validPosts.map((p) => ({ data: p })),
            after: null,
        },
    };
};

export default async function handler(req, res) {
    const { limit = 25, after } = req.query;
    const requestStart = Date.now();
    log('info', 'request received', { limit, after: after || null });

    let result;
    let source = 'json';
    let jsonError = null;

    try {
        result = await fetchFromJson(limit, after);
    } catch (err) {
        jsonError = { message: err.message, status: err.status, bodySnippet: err.bodySnippet };
        log('warn', 'json path failed, falling back to rss', jsonError);
        try {
            result = await fetchFromRss(limit, after);
            source = 'rss';
        } catch (rssErr) {
            log('error', 'both json and rss paths failed', {
                jsonError,
                rssError: { message: rssErr.message, status: rssErr.status },
                duration_ms: Date.now() - requestStart,
            });
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(502).json({
                error: 'Failed to fetch from Reddit',
                jsonError,
                rssError: { message: rssErr.message, status: rssErr.status },
            });
        }
    }

    const totalDuration = Date.now() - requestStart;
    log('info', 'request complete', {
        source,
        post_count: result.data.children.length,
        duration_ms: totalDuration,
        json_error: jsonError,
    });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Reddit-Source', source);
    return res.status(200).json(result);
}
