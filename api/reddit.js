function extractTag(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
}

function decodeXmlEntities(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'");
}

function parseAtomFeed(xml) {
    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
        const entryXml = match[1];

        const rawId = extractTag(entryXml, 'id') || '';
        const id = rawId.replace(/^t3_/, '');
        const title = decodeXmlEntities(extractTag(entryXml, 'title') || '');
        const authorName = decodeXmlEntities(extractTag(entryXml, 'name') || '');
        const author = authorName.replace(/^\/u\//, '');
        const published = extractTag(entryXml, 'published') || '';

        const linkMatch = entryXml.match(/<link[^>]+href="([^"]+)"/);
        const url = linkMatch ? linkMatch[1] : '';
        const permalinkMatch = url.match(/reddit\.com(\/r\/[^/]+\/comments\/[^/]+\/[^/?]+)/);
        const permalink = permalinkMatch ? permalinkMatch[1] + '/' : url;

        const createdUtc = published ? Math.floor(new Date(published).getTime() / 1000) : 0;

        if (id && title) {
            entries.push({
                data: {
                    id,
                    title,
                    permalink,
                    author,
                    ups: 0,
                    num_comments: 0,
                    thumbnail: null,
                    created_utc: createdUtc,
                }
            });
        }
    }

    return {
        data: {
            children: entries,
            after: null,
        }
    };
}

export default async function handler(req, res) {
    const { limit = 25 } = req.query;

    const url = `https://www.reddit.com/r/nba/hot/.rss?limit=${limit}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Reddit RSS returned ${response.status}` });
        }

        const xml = await response.text();
        const data = parseAtomFeed(xml);

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch from Reddit RSS', details: error.message });
    }
}
