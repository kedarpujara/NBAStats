import { cacheService } from './cacheService';

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
const SEARCH_URL = 'https://site.web.api.espn.com/apis/search/v2';

// Helper to extract numerical ID from ESPN UID (e.g., s:40~l:46~a:1966 -> 1966)
export const extractNumericalId = (uid) => {
    if (!uid) return null;
    if (!isNaN(uid)) return uid; // Already numerical
    const parts = uid.split('~a:');
    return parts.length > 1 ? parts[1] : uid;
};

// Format date as YYYYMMDD for ESPN API
export const formatDateForApi = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
};

export const getScoreboard = async (forceRefresh = false, date = null) => {
    const dateStr = date ? formatDateForApi(date) : null;
    const cacheKey = dateStr ? `scoreboard_${dateStr}` : 'scoreboard';

    if (!forceRefresh) {
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;
    }

    try {
        const url = dateStr
            ? `${BASE_URL}/scoreboard?dates=${dateStr}`
            : `${BASE_URL}/scoreboard`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        // Cache historical dates longer (they won't change), today's games for 1 min
        const ttl = dateStr ? 60 : 1;
        cacheService.set(cacheKey, data, ttl);
        return data;
    } catch (error) {
        console.error('Error fetching scoreboard:', error);
        return null;
    }
};

export const getStandings = async (forceRefresh = false) => {
    if (!forceRefresh) {
        const cached = cacheService.get('standings');
        if (cached) return cached;
    }

    try {
        const response = await fetch('https://site.api.espn.com/apis/v2/sports/basketball/nba/standings');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        cacheService.set('standings', data, 60);
        return data;
    } catch (error) {
        console.error('Error fetching standings:', error);
        return null;
    }
};

export const searchPlayers = async (query) => {
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`${SEARCH_URL}?query=${encodeURIComponent(query)}&limit=15&type=player`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const playerResults = data.results?.find(r => r.type === 'player');

        // STRICT FILTER: Must be NBA. Also check subtitle for current team info to ensure they are active/relevant.
        const results = (playerResults?.contents || [])
            .filter(p => {
                const isNba = p.defaultLeagueSlug === 'nba' || p.description === 'NBA';
                const hasNbaSubtitle = p.subtitle?.includes('|') || p.subtitle?.length > 10; // Teams like 'LAL | F'
                const isNotCollege = !p.subtitle?.toLowerCase().includes('college') &&
                    !p.subtitle?.toLowerCase().includes('ncaa') &&
                    !p.subtitle?.toLowerCase().includes('university');
                return isNba && isNotCollege && hasNbaSubtitle;
            })
            .map(p => ({
                ...p,
                // Ensure we have the numerical ID for detail/stats calls
                numericalId: extractNumericalId(p.uid) || p.id
            }));

        cacheService.set(cacheKey, results, 1440);
        return results;
    } catch (error) {
        console.error('Error searching players:', error);
        return [];
    }
};

export const getPlayerDetails = async (playerId) => {
    const cacheKey = `player_details_${playerId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        cacheService.set(cacheKey, data, 1440);
        return data;
    } catch (error) {
        console.error('Error fetching player details:', error);
        return null;
    }
};

export const getPlayerStats = async (playerId) => {
    const cacheKey = `player_stats_${playerId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/stats`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        cacheService.set(cacheKey, data, 720);
        return data;
    } catch (error) {
        console.error('Error fetching player stats:', error);
        return null;
    }
};

export const getPlayerGameLog = async (playerId) => {
    const cacheKey = `player_gamelog_${playerId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/gamelog`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // Parse the complex gamelog structure into a simpler format
        const labels = data.labels || [];
        const eventsMap = data.events || {};

        // Get stats from seasonTypes -> categories -> events
        const entries = [];
        const seasonTypes = data.seasonTypes || [];

        for (const seasonType of seasonTypes) {
            const categories = seasonType.categories || [];
            for (const category of categories) {
                const categoryEvents = category.events || [];
                for (const evt of categoryEvents) {
                    const eventId = evt.eventId;
                    const eventInfo = eventsMap[eventId];
                    if (eventInfo && evt.stats) {
                        entries.push({
                            game: {
                                id: eventId,
                                date: eventInfo.gameDate
                            },
                            opponent: eventInfo.opponent || {},
                            gameResult: eventInfo.gameResult,
                            score: eventInfo.score,
                            stats: evt.stats
                        });
                    }
                }
            }
        }

        // Extract career totals from the first seasonType's category totals
        let careerTotals = null;
        if (seasonTypes.length > 0 && seasonTypes[0].categories?.length > 0) {
            careerTotals = seasonTypes[0].categories[0].totals;
        }

        const normalizedData = {
            labels,
            entries,
            careerTotals
        };

        cacheService.set(cacheKey, normalizedData, 60);
        return normalizedData;
    } catch (error) {
        console.error('Error fetching player gamelog:', error);
        return null;
    }
};

export const getGameSummary = async (eventId) => {
    const cacheKey = `game_summary_${eventId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`${BASE_URL}/summary?event=${eventId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const ttl = data.header?.competitions?.[0]?.status?.type?.state === 'post' ? 1440 : 1;
        cacheService.set(cacheKey, data, ttl);
        return data;
    } catch (error) {
        console.error('Error fetching game summary:', error);
        return null;
    }
};

export const getNbaNews = async (limit = 15) => {
    const cacheKey = `nba_news_${limit}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`${BASE_URL}/news?limit=${limit}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        cacheService.set(cacheKey, data, 15);
        return data;
    } catch (error) {
        console.error('Error fetching NBA news:', error);
        return null;
    }
};

export const getStatLeaders = async () => {
    const cached = cacheService.get('stat_leaders');
    if (cached) return cached;

    try {
        const response = await fetch('https://site.api.espn.com/apis/site/v3/sports/basketball/nba/leaders');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        cacheService.set('stat_leaders', data, 60);
        return data;
    } catch (error) {
        console.error('Error fetching stat leaders:', error);
        return null;
    }
};

export const getPlayoffBracket = async (forceRefresh = false) => {
    if (!forceRefresh) {
        const cached = cacheService.get('playoff_bracket');
        if (cached) return cached;
    }

    try {
        const response = await fetch(`${BASE_URL}/scoreboard?seasontype=3&limit=100`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        cacheService.set('playoff_bracket', data, 5);
        return data;
    } catch (error) {
        console.error('Error fetching playoff bracket:', error);
        return null;
    }
};

export const getPlayByPlay = async (eventId) => {
    const cacheKey = `play_by_play_${eventId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
        // Use the summary endpoint which contains plays data
        // The dedicated playbyplay endpoint returns empty for most games
        const response = await fetch(`${BASE_URL}/summary?event=${eventId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        const plays = data.plays || [];

        const normalizedData = {
            ...data,
            plays
        };

        // Cache for longer if game is finished
        const ttl = data.header?.competitions?.[0]?.status?.type?.state === 'post' ? 1440 : 1;
        cacheService.set(cacheKey, normalizedData, ttl);
        return normalizedData;
    } catch (error) {
        console.error('Error fetching play by play:', error);
        return { plays: [] };
    }
};
