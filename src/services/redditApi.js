const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

export const getNbaRedditFeed = async () => {
    const REDDIT_URL = 'https://www.reddit.com/r/nba/hot.json?limit=25';

    // Try each proxy until one works
    for (const proxyFn of CORS_PROXIES) {
        try {
            const proxyUrl = proxyFn(REDDIT_URL);
            const response = await fetch(proxyUrl);
            if (!response.ok) continue;
            const data = await response.json();

            if (!data?.data?.children) continue;

            return data.data.children.map(child => {
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
        } catch (error) {
            console.warn('Proxy failed, trying next:', error.message);
            continue;
        }
    }

    console.error('All Reddit proxies failed');
    return [];
};
