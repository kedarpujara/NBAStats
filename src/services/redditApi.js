const TIMEOUT_MS = 8000;

// Structured client-side logger. Browser DevTools shows JSON-ish entries
// well as objects, so we pass an object instead of a stringified line.
// House rule: no console.log in committed code.
const log = (level, msg, data = {}) => {
    const entry = { ts: new Date().toISOString(), source: 'redditApi', level, msg, ...data };
    if (level === 'error') console.error('[reddit]', entry);
    else console.warn('[reddit]', entry);
};

const fetchWithTimeout = async (url, timeout = TIMEOUT_MS) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

const parseRedditData = (data) => {
    if (!data?.data?.children) {
        throw new Error('Invalid data structure');
    }

    const posts = data.data.children.map(child => {
        const post = child.data || {};

        let thumbnail = post.thumbnail;
        if (thumbnail === 'self' || thumbnail === 'default' || !thumbnail?.startsWith?.('http')) {
            thumbnail = null;
        }

        // The /api/reddit proxy already returns a fully-qualified Reddit comments URL
        // in `url`. Falling back to permalink-based construction handles a future
        // shape change defensively without producing `https://www.reddit.comundefined`.
        const postUrl = post.url
            || (post.permalink ? `https://www.reddit.com${post.permalink}` : '');

        return {
            id: post.id,
            title: post.title,
            url: postUrl,
            author: post.author,
            ups: post.ups || 0,
            num_comments: post.num_comments || 0,
            thumbnail: thumbnail,
            created: post.created ?? post.created_utc
        };
    });

    return {
        posts,
        after: data.data.after
    };
};

export const getNbaRedditFeed = async (limit = 25, after = null) => {
    let url = `/api/reddit?limit=${limit}`;
    if (after) url += `&after=${after}`;

    const start = Date.now();
    log('info', 'fetch start', { url });

    let response;
    try {
        response = await fetchWithTimeout(url);
    } catch (err) {
        const duration = Date.now() - start;
        const isTimeout = err.name === 'AbortError';
        log('error', 'fetch failed', {
            url,
            duration_ms: duration,
            reason: isTimeout ? `timeout after ${TIMEOUT_MS}ms` : err.message,
        });
        const wrapped = new Error(
            isTimeout
                ? `Request timed out after ${TIMEOUT_MS}ms`
                : `Network error: ${err.message}`,
        );
        wrapped.cause = err;
        throw wrapped;
    }

    const duration = Date.now() - start;
    const source = response.headers.get('x-reddit-source') || 'unknown';

    if (!response.ok) {
        let bodyText = '';
        try {
            bodyText = await response.text();
        } catch {
            // ignore — we'll just log without a body
        }
        log('error', 'non-2xx response from /api/reddit', {
            status: response.status,
            duration_ms: duration,
            source,
            body: bodyText.slice(0, 500),
        });
        throw new Error(`Reddit feed unavailable (HTTP ${response.status})`);
    }

    let data;
    try {
        data = await response.json();
    } catch (err) {
        log('error', 'invalid json from /api/reddit', { duration_ms: duration, source, error: err.message });
        throw new Error('Reddit feed returned malformed JSON');
    }

    let parsed;
    try {
        parsed = parseRedditData(data);
    } catch (err) {
        log('error', 'failed to parse reddit payload', {
            duration_ms: duration,
            source,
            error: err.message,
            shape_keys: data ? Object.keys(data) : null,
        });
        throw err;
    }

    log('info', 'feed loaded', {
        duration_ms: duration,
        source,
        post_count: parsed.posts.length,
        has_more: !!parsed.after,
    });

    return parsed;
};
