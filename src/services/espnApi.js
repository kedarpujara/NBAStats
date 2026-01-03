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

export const getScoreboard = async (forceRefresh = false) => {
    if (!forceRefresh) {
        const cached = cacheService.get('scoreboard');
        if (cached) return cached;
    }

    try {
        const response = await fetch(`${BASE_URL}/scoreboard`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        cacheService.set('scoreboard', data, 1);
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
        cacheService.set(cacheKey, data, 60);
        return data;
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

export const getNbaNews = async () => {
    const cached = cacheService.get('nba_news');
    if (cached) return cached;

    try {
        const response = await fetch(`${BASE_URL}/news`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        cacheService.set('nba_news', data, 15);
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
