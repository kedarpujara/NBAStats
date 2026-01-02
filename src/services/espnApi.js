import { cacheService } from './cacheService';

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
const SEARCH_URL = 'https://site.web.api.espn.com/apis/search/v2';

export const getScoreboard = async (forceRefresh = false) => {
    if (!forceRefresh) {
        const cached = cacheService.get('scoreboard');
        if (cached) return cached;
    }

    try {
        const response = await fetch(`${BASE_URL}/scoreboard`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        cacheService.set('scoreboard', data, 1); // Stats refresh every 1 min
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
        cacheService.set('standings', data, 60); // Standings refresh every 1 hour
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
        const response = await fetch(`${SEARCH_URL}?query=${encodeURIComponent(query)}&limit=10&type=player`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const playerResults = data.results?.find(r => r.type === 'player');

        // Filter for NBA players specifically
        const results = (playerResults?.contents || []).filter(p =>
            p.defaultLeagueSlug === 'nba' || p.description === 'NBA' || p.sport === 'basketball'
        );

        cacheService.set(cacheKey, results, 1440); // Cache search for 24 hours
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
        cacheService.set(cacheKey, data, 1440); // Cache details 24h
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
        cacheService.set(cacheKey, data, 720); // Cache stats 12h
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
        cacheService.set(cacheKey, data, 60); // Cache gamelog 1h
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
        // If game is live, cache for short time. If finished, cache longer.
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
        cacheService.set('nba_news', data, 15); // News refresh every 15 min
        return data;
    } catch (error) {
        console.error('Error fetching NBA news:', error);
        return null;
    }
};
