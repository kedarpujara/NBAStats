export default async function handler(req, res) {
    const { limit = 10, after } = req.query;

    let url = `https://www.reddit.com/r/nba/hot.json?limit=${limit}`;
    if (after) {
        url += `&after=${after}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'NBAStats/1.0 (web app)',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Reddit API returned ${response.status}` });
        }

        const data = await response.json();

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch from Reddit' });
    }
}
