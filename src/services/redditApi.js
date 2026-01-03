export const getNbaRedditFeed = async () => {
    try {
        // Reddit blocks browser CORS requests - use a proxy
        const REDDIT_URL = 'https://www.reddit.com/r/nba/hot.json?limit=25';
        const CORS_PROXY = 'https://corsproxy.io/?';
        const response = await fetch(CORS_PROXY + encodeURIComponent(REDDIT_URL));
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        return data.data.children.map(child => {
            const post = child.data;

            // Thumbnail resolution: Reddit provides "self", "default", or a URL
            let thumbnail = post.thumbnail;
            if (thumbnail === 'self' || thumbnail === 'default' || !thumbnail.startsWith('http')) {
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
        console.error('Error fetching Reddit feed:', error);
        return [];
    }
};
