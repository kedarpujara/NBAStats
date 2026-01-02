export const getNbaRedditFeed = async () => {
    try {
        const rssUrl = 'https://www.reddit.com/r/nba/hot/.rss';
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        if (data.status !== 'ok') throw new Error('RSS conversion failed');

        return data.items.map(item => {
            // Extract thumbnail from content if available, or use a placeholder
            // Many times the description contains an <img> tag or a media link
            let thumbnail = null;
            const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) thumbnail = imgMatch[1];

            return {
                id: item.guid,
                title: item.title,
                url: item.link,
                author: item.author,
                ups: 0, // RSS doesn't give ups easily
                num_comments: 0, // RSS doesn't give comments count easily
                thumbnail: thumbnail,
                created: new Date(item.pubDate).getTime() / 1000
            };
        });
    } catch (error) {
        console.error('Error fetching Reddit feed:', error);
        return [];
    }
};
