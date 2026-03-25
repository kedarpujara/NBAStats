export default async function handler(req, res) {
    const { limit = 25 } = req.query;
    const url = `https://www.reddit.com/r/nba/hot.rss?limit=${limit}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'NBAStats/1.0 (web app)',
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Reddit RSS returned ${response.status}` });
        }

        const xml = await response.text();

        // Parse Atom XML entries - split on entry boundaries
        const entries = xml.split('<entry>').slice(1);

        const decodeHtml = (str) => str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

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

        const validPosts = posts.filter(p => p.url && p.title);

        // Return in the same shape as the Reddit JSON API so the client parser works unchanged
        const result = {
            data: {
                children: validPosts.map(p => ({ data: p })),
                after: null,
            }
        };

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch from Reddit', details: error.message });
    }
}
