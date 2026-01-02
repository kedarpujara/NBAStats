import React, { useEffect, useState } from 'react';
import { getPlayerDetails, getPlayerStats, getPlayerGameLog } from '../services/espnApi';
import { Loader2, ArrowLeft, Calendar, BarChart3, Clock } from 'lucide-react';

const PlayerProfile = ({ playerId, onBack }) => {
    const [details, setDetails] = useState(null);
    const [stats, setStats] = useState(null);
    const [gameLog, setGameLog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            const [d, s, g] = await Promise.all([
                getPlayerDetails(playerId),
                getPlayerStats(playerId),
                getPlayerGameLog(playerId)
            ]);
            setDetails(d?.athlete);
            setStats(s);
            setGameLog(g);
            setLoading(false);
        };
        fetchAll();
    }, [playerId]);

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={40} />
                <p>Retrieving player career data...</p>
            </div>
        );
    }

    if (!details) return <div>Player not found.</div>;

    // Helper to map stats rows
    const renderStatRow = (row, labels, isHeader = false) => {
        return (
            <tr className={isHeader ? 'header-row' : ''}>
                {labels.map((label, i) => (
                    <td key={i} className={label === 'PTS' ? 'highlight' : ''}>
                        {isHeader ? label : (row[i] || '-')}
                    </td>
                ))}
            </tr>
        );
    };

    return (
        <div className="player-profile">
            <button className="back-btn" onClick={onBack}>
                <ArrowLeft size={18} /> Back
            </button>

            <div className="profile-header-premium glass-card">
                <div className="profile-top">
                    <img
                        src={details.headshot?.href || 'https://a.espncdn.com/i/headshots/nba/players/full/0.png'}
                        alt={details.displayName}
                        className="profile-headshot-large"
                    />
                    <div className="profile-info-main">
                        <div className="p-number">#{details.jersey}</div>
                        <h1>{details.displayName}</h1>
                        <div className="p-meta-chips">
                            <span className="chip">{details.position?.displayName}</span>
                            <span className="chip">{details.displayHeight} / {details.displayWeight}</span>
                            <span className="chip">{details.age} Years Old</span>
                        </div>
                        <div className="p-team">
                            <img src={details.team?.logos?.[0]?.href} alt="" />
                            <span>{details.team?.displayName}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-content">
                {/* Career Stats Table */}
                <section className="profile-section">
                    <div className="section-title">
                        <BarChart3 size={20} />
                        <h2>Season Statistics</h2>
                    </div>
                    <div className="table-wrapper glass-card">
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>Team</th>
                                    {stats?.categories?.[0]?.labels?.map(l => <th key={l}>{l}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.categories?.[0]?.statistics?.slice().reverse().map((s, idx) => (
                                    <tr key={idx}>
                                        <td>{s.season.displayName}</td>
                                        <td>{s.teamAbbreviation || s.teamSlug || 'N/A'}</td>
                                        {s.stats.map((val, i) => (
                                            <td key={i} className={stats.categories[0].labels[i] === 'PTS' ? 'highlight-pts' : ''}>
                                                {val}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Recent Game Log */}
                <section className="profile-section">
                    <div className="section-title">
                        <Clock size={20} />
                        <h2>Recent Game Log</h2>
                    </div>
                    <div className="table-wrapper glass-card">
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>OPP</th>
                                    <th>Result</th>
                                    {gameLog?.labels?.map(l => <th key={l}>{l}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {gameLog?.entries?.map((entry, idx) => (
                                    <tr key={idx}>
                                        <td className="date-cell">{new Date(entry.game.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</td>
                                        <td>{entry.opponent.abbreviation}</td>
                                        <td className={entry.gameResult === 'W' ? 'win' : 'loss'}>{entry.gameResult} {entry.score}</td>
                                        {entry.stats.map((val, i) => (
                                            <td key={i}>{val}</td>
                                        ))}
                                    </tr>
                                ))}
                                {(!gameLog?.entries || gameLog.entries.length === 0) && (
                                    <tr><td colSpan="20" className="empty-msg">No recent games found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PlayerProfile;
