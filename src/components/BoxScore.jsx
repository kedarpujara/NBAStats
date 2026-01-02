import React from 'react';

const BoxScore = ({ players = [], teamInfo = {}, onPlayerClick }) => {
    // ESPN Stats mapping
    const STAT_MAP = {
        MIN: 0, PTS: 1, FG: 2, '3PT': 3, FT: 4, REB: 5, AST: 6,
        TO: 7, STL: 8, BLK: 9, OREB: 10, DREB: 11, PF: 12, '+/-': 13
    };

    // Filter players, ensuring athlete exists
    const starters = players.filter(p => p.athlete && p.starter && !p.didNotPlay);
    const bench = players.filter(p => p.athlete && !p.starter && !p.didNotPlay);
    const dnp = players.filter(p => p.athlete && p.didNotPlay);

    const renderRows = (playerList) => {
        if (!playerList.length) return null;

        return playerList.map((p) => {
            const stats = p.stats || [];
            if (!p.athlete) return null;

            return (
                <tr key={p.athlete.id} onClick={() => onPlayerClick?.(p.athlete.id)} className="clickable-row">
                    <td className="player-cell">
                        <div className="player-mini-info">
                            {p.athlete.headshot?.href ? (
                                <img src={p.athlete.headshot.href} alt="" className="player-tiny-headshot" />
                            ) : (
                                <div className="player-tiny-headshot placeholder" />
                            )}
                            <div className="player-name-wrap">
                                <span className="p-name">{p.athlete.shortName || 'Unknown'}</span>
                                <span className="p-pos">{p.athlete.position?.abbreviation || ''}</span>
                            </div>
                        </div>
                    </td>
                    <td className="stat-col">{stats[STAT_MAP.MIN] || '-'}</td>
                    <td className="stat-col highlight-pts">{stats[STAT_MAP.PTS] || '0'}</td>
                    <td className="stat-col">{stats[STAT_MAP.FG] || '-'}</td>
                    <td className="stat-col">{stats[STAT_MAP['3PT']] || '-'}</td>
                    <td className="stat-col">{stats[STAT_MAP.REB] || '-'}</td>
                    <td className="stat-col">{stats[STAT_MAP.AST] || '-'}</td>
                    <td className="stat-col">{stats[STAT_MAP.TO] || '-'}</td>
                    <td className="stat-col">{stats[STAT_MAP.STL] || '-'}</td>
                    <td className="stat-col">{stats[STAT_MAP.BLK] || '-'}</td>
                    <td className="stat-col">{stats[STAT_MAP['+/-']] || '-'}</td>
                </tr>
            );
        });
    };

    // Robust logo check
    const teamLogo = teamInfo.logo || teamInfo.logos?.[0]?.href;

    return (
        <div className="boxscore-section">
            <div className="boxscore-header">
                {teamLogo && <img src={teamLogo} alt="" className="team-logo-small" />}
                <h2>{teamInfo.displayName || 'Team'} Box Score</h2>
            </div>

            <div className="table-wrapper glass-card">
                <table className="boxscore-table">
                    <thead>
                        <tr>
                            <th className="text-left">Player</th>
                            <th>MIN</th>
                            <th>PTS</th>
                            <th>FG</th>
                            <th>3PT</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>TO</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>+/-</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="sub-header-row"><td colSpan="11">Starters</td></tr>
                        {renderRows(starters)}
                        {starters.length === 0 && <tr><td colSpan="11" className="empty-msg">No starter data available</td></tr>}

                        <tr className="sub-header-row"><td colSpan="11">Bench</td></tr>
                        {renderRows(bench)}
                        {bench.length === 0 && <tr><td colSpan="11" className="empty-msg">No bench data available</td></tr>}

                        {dnp.length > 0 && (
                            <>
                                <tr className="sub-header-row"><td colSpan="11">DNP</td></tr>
                                {dnp.map(p => (
                                    <tr key={p.athlete?.id || Math.random()} className="dnp-row clickable-row" onClick={() => onPlayerClick?.(p.athlete.id)}>
                                        <td className="player-cell">
                                            <div className="player-mini-info">
                                                {p.athlete.headshot?.href && <img src={p.athlete.headshot.href} alt="" className="player-tiny-headshot" />}
                                                <span className="p-name">{p.athlete?.shortName || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td colSpan="10" className="dnp-reason">{p.reason || 'DNP'}</td>
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BoxScore;
