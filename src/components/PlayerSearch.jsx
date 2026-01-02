import React, { useState } from 'react';
import { searchPlayers } from '../services/espnApi';
import { Search, Loader2, User } from 'lucide-react';
import PlayerProfile from './PlayerProfile';

const PlayerSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);

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

    return (
        <div className="player-search-view">
            <div className="view-header">
                <h1>Player Search</h1>
                <p>Search for any active or historical NBA player.</p>
            </div>

            <form className="search-bar" onSubmit={handleSearch}>
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Ex: LeBron James, Stephen Curry..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
                </button>
            </form>

            <div className="search-results">
                {results.map((player) => (
                    <div key={player.id} className="result-item glass-card" onClick={() => setSelectedPlayerId(player.id)}>
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
                {results.length === 0 && !loading && query && (
                    <div className="no-data">No players found matching your search.</div>
                )}
            </div>
        </div>
    );
};

export default PlayerSearch;
