import React, { useEffect, useState } from 'react';
import { getScoreboard } from '../services/espnApi';
import GameCard from './GameCard';
import { Loader2, Calendar, Tv } from 'lucide-react';
import GameDetail from './GameDetail';

const GamesView = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGameId, setSelectedGameId] = useState(null);

    const fetchGames = async (force = false) => {
        if (force) setLoading(true);
        const data = await getScoreboard(force);
        if (data && data.events) {
            setGames(data.events);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchGames();
        const interval = setInterval(() => fetchGames(false), 30000); // Background update
        return () => clearInterval(interval);
    }, []);

    if (selectedGameId) {
        return <GameDetail eventId={selectedGameId} onBack={() => setSelectedGameId(null)} />;
    }

    if (loading && games.length === 0) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={40} />
                <p>Loading today's matchups...</p>
            </div>
        );
    }

    return (
        <div className="games-view">
            <div className="view-header">
                <div className="header-top">
                    <h1>Nightly Games</h1>
                    <div className="header-actions">
                        <a
                            href="https://nba.footybite.to/nba-now"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="watch-btn"
                        >
                            <Tv size={16} /> Watch Now
                        </a>
                        <button className="refresh-btn" onClick={() => fetchGames(true)}>
                            Refresh
                        </button>
                    </div>
                </div>
                <p>Live scores, schedules, and detailed box scores for every matchup.</p>
            </div>

            <div className="games-grid">
                {games.map((game) => (
                    <div key={game.id} onClick={() => setSelectedGameId(game.id)} className="clickable-card">
                        <GameCard game={game} />
                    </div>
                ))}
            </div>

            {games.length === 0 && !loading && (
                <div className="empty-state">
                    <Calendar size={48} />
                    <p>No games scheduled for today.</p>
                </div>
            )}
        </div>
    );
};

export default GamesView;
