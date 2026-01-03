import React, { useState, useEffect } from 'react';
import { searchPlayers, getStatLeaders, extractNumericalId } from '../services/espnApi';
import { Search, Loader2, User, Trophy, TrendingUp } from 'lucide-react';
import PlayerProfile from './PlayerProfile';

const PlayerSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [leaders, setLeaders] = useState(null);
    const [leadersLoading, setLeadersLoading] = useState(true);

    // Fetch stat leaders on mount
    useEffect(() => {
        const fetchLeaders = async () => {
            setLeadersLoading(true);
            const data = await getStatLeaders();
            setLeaders(data);
            setLeadersLoading(false);
        };
        fetchLeaders();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        const players = await searchPlayers(query);
        setResults(players);
        setLoading(false);
    };

    if (selectedPlayerId) {
        return <PlayerProfile playerId={selectedPlayerId} onBack={() => setSelectedPlayerId(null)} />;
    }

    // Extract categories from the new API structure: leaders.categories[]
    const getLeaderCategory = (categoryName) => {
        if (!leaders?.leaders?.categories?.length) return null;
        return leaders.leaders.categories.find(c =>
            c.name?.toLowerCase().includes(categoryName.toLowerCase()) ||
            c.displayName?.toLowerCase().includes(categoryName.toLowerCase())
        );
    };

    const renderLeaderCard = (category, icon, title, isPercentage = false) => {
        if (!category) return null;
        const topFive = category.leaders?.slice(0, 5) || [];
        if (topFive.length === 0) return null;

        // Format display value - handle percentages correctly
        // FG% comes as 70.96 (already percentage), 3PT% comes as 0.48 (needs *100)
        const formatValue = (leader) => {
            if (isPercentage) {
                const val = leader.value;
                if (typeof val === 'number') {
                    // If value > 1, it's already a percentage (e.g., 70.96)
                    // If value < 1, it's a decimal (e.g., 0.48) that needs *100
                    if (val > 1) {
                        return val.toFixed(1) + '%';
                    } else {
                        return (val * 100).toFixed(1) + '%';
                    }
                }
            }
            return leader.displayValue || leader.value;
        };

        return (
            <div className="leader-card glass-card">
                <div className="leader-card-header">
                    {icon}
                    <h3>{title}</h3>
                </div>
                <div className="leader-list">
                    {topFive.map((leader, idx) => {
                        const playerId = extractNumericalId(leader.athlete?.id);
                        return (
                            <div
                                key={leader.athlete?.id || idx}
                                className="leader-item clickable-row"
                                onClick={() => playerId && setSelectedPlayerId(playerId)}
                            >
                                <span className="leader-rank">{idx + 1}</span>
                                <img
                                    src={leader.athlete?.headshot?.href || 'https://a.espncdn.com/i/headshots/nba/players/full/0.png'}
                                    alt=""
                                    className="leader-headshot"
                                />
                                <div className="leader-info">
                                    <span className="leader-name">{leader.athlete?.displayName}</span>
                                    <span className="leader-team">{leader.athlete?.team?.abbreviation}</span>
                                </div>
                                <span className="leader-stat">{formatValue(leader)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="player-search-view">
            <div className="view-header">
                <h1>Players</h1>
                <p>NBA stat leaders and player search.</p>
            </div>

            {/* Search Bar */}
            <form className="search-bar" onSubmit={handleSearch}>
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Search players..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
                </button>
            </form>

            {/* Search Results (if any) */}
            {results.length > 0 && (
                <div className="search-results">
                    {results.map((player) => (
                        <div key={player.id} className="result-item glass-card" onClick={() => setSelectedPlayerId(player.numericalId || player.id)}>
                            <div className="result-info">
                                <div className="result-img-wrapper">
                                    {player.image?.default ? (
                                        <img src={player.image.default} alt="" />
                                    ) : (
                                        <User size={24} color="var(--text-muted)" />
                                    )}
                                </div>
                                <div>
                                    <h3>{player.displayName}</h3>
                                    <p>{player.subtitle}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stat Leaders */}
            {leadersLoading ? (
                <div className="loading-state" style={{ height: '40vh' }}>
                    <Loader2 className="animate-spin" size={40} />
                    <p>Loading league leaders...</p>
                </div>
            ) : (
                <div className="leaders-section">
                    <h2 className="section-heading"><Trophy size={20} /> League Leaders</h2>
                    <div className="leaders-grid">
                        {renderLeaderCard(getLeaderCategory('pointsPerGame'), <TrendingUp size={18} />, 'Points')}
                        {renderLeaderCard(getLeaderCategory('reboundsPerGame'), <TrendingUp size={18} />, 'Rebounds')}
                        {renderLeaderCard(getLeaderCategory('assistsPerGame'), <TrendingUp size={18} />, 'Assists')}
                        {renderLeaderCard(getLeaderCategory('stealsPerGame'), <TrendingUp size={18} />, 'Steals')}
                        {renderLeaderCard(getLeaderCategory('blocksPerGame'), <TrendingUp size={18} />, 'Blocks')}
                        {renderLeaderCard(getLeaderCategory('fieldGoalPercentage'), <TrendingUp size={18} />, 'FG%', true)}
                        {renderLeaderCard(getLeaderCategory('3PointPct'), <TrendingUp size={18} />, '3PT%', true)}
                        {renderLeaderCard(getLeaderCategory('3PointsMadePerGame'), <TrendingUp size={18} />, '3PM')}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerSearch;

