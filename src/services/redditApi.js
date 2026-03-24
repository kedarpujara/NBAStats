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
        const post = child.data;

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

const fetchViaLocalApi = async (limit, after) => {
    let url = `/api/reddit?limit=${limit}`;
    if (after) url += `&after=${after}`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return parseRedditData(data);
};

const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
];

const fetchViaProxy = async (proxyFn, redditUrl) => {
    const proxyUrl = proxyFn(redditUrl);
    const response = await fetchWithTimeout(proxyUrl);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return parseRedditData(data);
};

export const getNbaRedditFeed = async (limit = 10, after = null) => {
    // Try the local Vercel serverless proxy first (most reliable)
    try {
        return await fetchViaLocalApi(limit, after);
    } catch (err) {
        console.warn('Local API proxy failed, trying CORS proxies:', err.message);
    }

    // Fallback to CORS proxies
    const REDDIT_URL = `https://www.reddit.com/r/nba/hot.json?limit=${limit}${after ? `&after=${after}` : ''}`;

    const proxyPromises = CORS_PROXIES.map(proxyFn =>
        fetchViaProxy(proxyFn, REDDIT_URL).catch(err => {
            console.warn('Proxy failed:', err.message);
            throw err;
        })
    );

    try {
        return await Promise.any(proxyPromises);
    } catch (error) {
        console.error('All Reddit proxies failed');
        throw new Error('Unable to load Reddit feed');
    }
};
