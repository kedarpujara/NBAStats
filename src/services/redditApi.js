export const getNbaRedditFeed = async () => {
    try {
        // Using Reddit's native JSON endpoint is much richer and doesn't rely on RSS-to-JSON conversion
        const response = await fetch('https://www.reddit.com/r/nba/hot.json?limit=25');
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
