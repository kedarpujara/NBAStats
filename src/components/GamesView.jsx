import React, { useEffect, useState } from 'react';
import { getScoreboard } from '../services/espnApi';
import GameCard from './GameCard';
import { Loader2, Calendar, Tv, ChevronLeft, ChevronRight } from 'lucide-react';
import GameDetail from './GameDetail';

const GamesView = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGameId, setSelectedGameId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const formatDisplayDate = (date) => {
        if (isToday(date)) return "Today";
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const changeDate = (delta) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + delta);
        setSelectedDate(newDate);
    };

    const fetchGames = async (force = false, date = selectedDate) => {
        if (force) setLoading(true);
        const data = await getScoreboard(force, date);
        if (data && data.events) {
            setGames(data.events);
        }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        fetchGames(true, selectedDate);
        // Only auto-refresh if viewing today's games
        if (isToday(selectedDate)) {
            const interval = setInterval(() => fetchGames(false, selectedDate), 30000);
            return () => clearInterval(interval);
        }
    }, [selectedDate]);

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
                    <h1>NBA Games</h1>
                    <div className="header-actions">
                        <a
                            href="https://nba1.footybite.to/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="watch-btn"
                        >
                            <Tv size={16} /> Watch Now
                        </a>
                        <button className="refresh-btn" onClick={() => fetchGames(true, selectedDate)}>
                            Refresh
                        </button>
                    </div>
                </div>
                <div className="date-nav">
                    <button className="date-nav-btn" onClick={() => changeDate(-1)}>
                        <ChevronLeft size={20} />
                    </button>
                    <button className="date-display" onClick={() => setSelectedDate(new Date())}>
                        <Calendar size={16} />
                        <span>{formatDisplayDate(selectedDate)}</span>
                    </button>
                    <button className="date-nav-btn" onClick={() => changeDate(1)}>
                        <ChevronRight size={20} />
                    </button>
                </div>
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
                    <p>No games scheduled for {formatDisplayDate(selectedDate).toLowerCase()}.</p>
                </div>
            )}
        </div>
    );
};

export default GamesView;
