import React, { useEffect, useState } from 'react';
import { getStandings } from '../services/espnApi';
import { Loader2 } from 'lucide-react';

const Standings = () => {
    const [standings, setStandings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeConf, setActiveConf] = useState('East');

    useEffect(() => {
        const fetchStandings = async () => {
            setLoading(true);
            const data = await getStandings();
            if (data) setStandings(data);
            setLoading(false);
        };
        fetchStandings();
    }, []);

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={40} />
                <p>Loading standings...</p>
            </div>
        );
    }

    const conference = standings?.children?.find(c => c.abbreviation === activeConf);
    const rawEntries = conference?.standings?.entries || [];
    // Sort by playoffSeed (ascending) so best team appears first
    const entries = [...rawEntries].sort((a, b) => {
        const seedA = a.stats?.find(s => s.name === 'playoffSeed')?.value ?? 999;
        const seedB = b.stats?.find(s => s.name === 'playoffSeed')?.value ?? 999;
        return seedA - seedB;
    });

    return (
        <div className="standings-view">
            <div className="view-header">
                <h1>League Standings</h1>
                <div className="tab-group">
                    <button
                        className={`tab-btn ${activeConf === 'East' ? 'active' : ''}`}
                        onClick={() => setActiveConf('East')}
                    >
                        Eastern Conference
                    </button>
                    <button
                        className={`tab-btn ${activeConf === 'West' ? 'active' : ''}`}
                        onClick={() => setActiveConf('West')}
                    >
                        Western Conference
                    </button>
                </div>
            </div>

            <div className="standings-table-container glass-card">
                <table className="standings-table">
                    <thead>
                        <tr>
                            <th>RK</th>
                            <th className="text-left">Team</th>
                            <th>W</th>
                            <th>L</th>
                            <th>PCT</th>
                            <th>GB</th>
                            <th>STRK</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, idx) => {
                            const { team, stats } = entry;
                            const winPct = stats.find(s => s.name === 'winPercent')?.displayValue;
                            const wins = stats.find(s => s.name === 'wins')?.displayValue;
                            const losses = stats.find(s => s.name === 'losses')?.displayValue;
                            const gb = stats.find(s => s.name === 'gamesBehind')?.displayValue;
                            const streak = stats.find(s => s.name === 'streak')?.displayValue;

                            return (
                                <tr key={team.id}>
                                    <td className="rank">{idx + 1}</td>
                                    <td className="team-cell">
                                        <img src={team.logos[0].href} alt={team.abbreviation} className="mini-logo" />
                                        <span className="team-full-name">{team.displayName}</span>
                                        <span className="team-short-name">{team.abbreviation}</span>
                                    </td>
                                    <td className="stat">{wins}</td>
                                    <td className="stat">{losses}</td>
                                    <td className="stat">{winPct}</td>
                                    <td className="stat">{gb}</td>
                                    <td className="stat">{streak}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Standings;
