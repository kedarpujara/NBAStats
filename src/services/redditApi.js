const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const TIMEOUT_MS = 5000; // 5 second timeout per proxy

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

const tryProxy = async (proxyFn, redditUrl) => {
    const proxyUrl = proxyFn(redditUrl);
    const response = await fetchWithTimeout(proxyUrl);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data?.data?.children) {
        throw new Error('Invalid data structure');
    }

    const posts = data.data.children.map(child => {
        const post = child.data;

        // Thumbnail resolution: Reddit provides "self", "default", or a URL
        let thumbnail = post.thumbnail;
        if (thumbnail === 'self' || thumbnail === 'default' || !thumbnail?.startsWith('http')) {
            thumbnail = null;
        }

        return {
            id: post.id,
            title: post.title,
            url: `https://www.reddit.com${post.permalink}`,
            author: post.author,
            ups: post.ups,
            num_comments: post.num_comments,
            thumbnail: thumbnail,
            created: post.created_utc
        };
    });

    return {
        posts,
        after: data.data.after
    };
};

export const getNbaRedditFeed = async (limit = 10, after = null) => {
    let REDDIT_URL = `https://www.reddit.com/r/nba/hot.json?limit=${limit}`;
    if (after) {
        REDDIT_URL += `&after=${after}`;
    }

    // Try all proxies in parallel, use whichever responds first
    const proxyPromises = CORS_PROXIES.map(proxyFn =>
        tryProxy(proxyFn, REDDIT_URL).catch(err => {
            console.warn('Proxy failed:', err.message);
            throw err;
        })
    );

    try {
        // Promise.any returns the first successful promise
        return await Promise.any(proxyPromises);
    } catch (error) {
        console.error('All Reddit proxies failed');
        throw new Error('Unable to load Reddit feed');
    }
};
