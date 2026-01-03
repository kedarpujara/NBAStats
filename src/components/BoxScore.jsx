import React from 'react';
import { extractNumericalId } from '../services/espnApi';

const BoxScore = ({ players = [], teamInfo = {}, onPlayerClick }) => {
    const STAT_MAP = {
        MIN: 0, PTS: 1, FG: 2, '3PT': 3, FT: 4, REB: 5, AST: 6,
        TO: 7, STL: 8, BLK: 9, OREB: 10, DREB: 11, PF: 12, '+/-': 13
    };

    const starters = players.filter(p => p.athlete && p.starter && !p.didNotPlay);
    const bench = players.filter(p => p.athlete && !p.starter && !p.didNotPlay);
    const dnp = players.filter(p => p.athlete && p.didNotPlay);

    const renderPlayerRow = (p) => {
        const stats = p.stats || [];
        if (!p.athlete) return null;
        const safePlayerId = extractNumericalId(p.athlete.id);

        return (
            <tr key={p.athlete.id} onClick={() => onPlayerClick?.(safePlayerId)} className="clickable-row">
                <td className="player-cell-v2">
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
                <td>{stats[STAT_MAP.MIN] || '-'}</td>
                <td className="highlight-pts">{stats[STAT_MAP.PTS] || '0'}</td>
                <td>{stats[STAT_MAP.FG] || '-'}</td>
                <td>{stats[STAT_MAP['3PT']] || '-'}</td>
                <td>{stats[STAT_MAP.REB] || '-'}</td>
                <td>{stats[STAT_MAP.AST] || '-'}</td>
                <td>{stats[STAT_MAP.TO] || '-'}</td>
                <td>{stats[STAT_MAP.STL] || '-'}</td>
                <td>{stats[STAT_MAP.BLK] || '-'}</td>
                <td>{stats[STAT_MAP['+/-']] || '-'}</td>
            </tr>
        );
    };

    const renderDnpRow = (p) => {
        if (!p.athlete) return null;
        const dnpPlayerId = extractNumericalId(p.athlete.id);
        return (
            <tr key={p.athlete.id} onClick={() => onPlayerClick?.(dnpPlayerId)} className="clickable-row dnp-row">
                <td className="player-cell-v2">
                    <div className="player-mini-info">
                        {p.athlete.headshot?.href ? (
                            <img src={p.athlete.headshot.href} alt="" className="player-tiny-headshot" />
                        ) : (
                            <div className="player-tiny-headshot placeholder" />
                        )}
                        <div className="player-name-wrap">
                            <span className="p-name">{p.athlete.shortName || 'Unknown'}</span>
                        </div>
                    </div>
                </td>
                <td colSpan="10" className="dnp-reason">{p.reason || 'DNP'}</td>
            </tr>
        );
    };

    const StatTableHeader = () => (
        <thead>
            <tr>
                <th className="player-cell-v2">Player</th>
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
    );

    const teamLogo = teamInfo.logo || teamInfo.logos?.[0]?.href;

    return (
        <div className="boxscore-v2">
            {/* Team Header */}
            <div className="boxscore-team-header">
                {teamLogo && <img src={teamLogo} alt="" className="team-logo-small" />}
                <h2>{teamInfo.displayName || 'Team'}</h2>
            </div>

            {/* STARTERS - Label outside scroll, table scrolls */}
            <div className="boxscore-group-v2">
                <div className="section-label-v2">Starters</div>
                <div className="table-scroll-wrapper">
                    <table className="boxscore-table-v2">
                        <StatTableHeader />
                        <tbody>
                            {starters.map(renderPlayerRow)}
                            {starters.length === 0 && <tr><td colSpan="11" className="empty-msg">No data</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BENCH - Label outside scroll, table scrolls */}
            <div className="boxscore-group-v2">
                <div className="section-label-v2">Bench</div>
                <div className="table-scroll-wrapper">
                    <table className="boxscore-table-v2">
                        <StatTableHeader />
                        <tbody>
                            {bench.map(renderPlayerRow)}
                            {bench.length === 0 && <tr><td colSpan="11" className="empty-msg">No data</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DNP - Label outside scroll, table scrolls */}
            {dnp.length > 0 && (
                <div className="boxscore-group-v2">
                    <div className="section-label-v2">Did Not Play</div>
                    <div className="table-scroll-wrapper">
                        <table className="boxscore-table-v2">
                            <StatTableHeader />
                            <tbody>
                                {dnp.map(renderDnpRow)}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoxScore;
