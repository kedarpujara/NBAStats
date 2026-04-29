const TIMEOUT_MS = 8000;

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
        const url = post.url
            || (post.permalink ? `https://www.reddit.com${post.permalink}` : '');

        return {
            id: post.id,
            title: post.title,
            url,
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

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return parseRedditData(data);
};
