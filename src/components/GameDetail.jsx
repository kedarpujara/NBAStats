import React, { useEffect, useState } from 'react';
import { getGameSummary } from '../services/espnApi';
import { Loader2, ArrowLeft, Info } from 'lucide-react';
import BoxScore from './BoxScore';
import PlayerProfile from './PlayerProfile';

const GameDetail = ({ eventId, onBack }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [activeTeamTab, setActiveTeamTab] = useState('away'); // 'away' or 'home'

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            const data = await getGameSummary(eventId);
            if (data) setSummary(data);
            setLoading(false);
        };
        fetchDetail();
    }, [eventId]);

    if (selectedPlayerId) {
        return <PlayerProfile playerId={selectedPlayerId} onBack={() => setSelectedPlayerId(null)} />;
    }

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={40} />
                <p>Analyzing game data...</p>
            </div>
        );
    }

    if (!summary) return <div>Failed to load game details.</div>;

    const { boxscore, header } = summary;
    const competition = header.competitions[0];
    const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

    // Robust logo resolution
    const getLogo = (team) => team.logo || team.logos?.[0]?.href || 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/nba.png';
    const getTeamName = (team) => team.displayName || team.name || 'Team';

    // Find full team box scores
    const awayBox = boxscore?.players?.find(p => p.team.id === awayTeam.team.id);
    const homeBox = boxscore?.players?.find(p => p.team.id === homeTeam.team.id);

    return (
        <div className="game-detail">
            <button className="back-btn" onClick={onBack}>
                <ArrowLeft size={18} /> Back to Games
            </button>

            <div className="game-header-large glass-card">
                <div className="detail-teams horizontal-teams">
                    <div className="detail-team-block side-block">
                        <img src={getLogo(awayTeam.team)} alt="" className="medium-logo" />
                        <div className="team-text-meta">
                            <span className="detail-team-name">{getTeamName(awayTeam.team)}</span>
                            <span className="detail-team-record">{awayTeam.record?.[0]?.displayValue || '0-0'}</span>
                        </div>
                    </div>

                    <div className="detail-score-block compact">
                        <div className="score-row-medium">
                            <span className={`detail-score-m ${awayTeam.winner ? 'winner' : ''}`}>{awayTeam.score}</span>
                            <span className="score-divider-m">-</span>
                            <span className={`detail-score-m ${homeTeam.winner ? 'winner' : ''}`}>{homeTeam.score}</span>
                        </div>
                        <span className="detail-status-small">{header.competitions[0].status.type.detail}</span>
                    </div>

                    <div className="detail-team-block side-block text-right">
                        <div className="team-text-meta align-right">
                            <span className="detail-team-name">{getTeamName(homeTeam.team)}</span>
                            <span className="detail-team-record">{homeTeam.record?.[0]?.displayValue || '0-0'}</span>
                        </div>
                        <img src={getLogo(homeTeam.team)} alt="" className="medium-logo" />
                    </div>
                </div>

                {/* Linescore */}
                <div className="linescore-container">
                    <table className="linescore-table">
                        <thead>
                            <tr>
                                <th>Team</th>
                                {awayTeam.linescores?.map((_, i) => <th key={i}>{i + 1}</th>)}
                                <th>T</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="text-left">{awayTeam.team.abbreviation}</td>
                                {awayTeam.linescores?.map((ls, i) => <td key={i}>{ls.displayValue}</td>)}
                                <td className="total-cell">{awayTeam.score}</td>
                            </tr>
                            <tr>
                                <td className="text-left">{homeTeam.team.abbreviation}</td>
                                {homeTeam.linescores?.map((ls, i) => <td key={i}>{ls.displayValue}</td>)}
                                <td className="total-cell">{homeTeam.score}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Team Switcher Tabs (Mobile Only) */}
            <div className="team-tabs mobile-only">
                <button
                    className={`team-tab-btn ${activeTeamTab === 'away' ? 'active' : ''}`}
                    onClick={() => setActiveTeamTab('away')}
                >
                    {awayTeam.team.abbreviation}
                </button>
                <button
                    className={`team-tab-btn ${activeTeamTab === 'home' ? 'active' : ''}`}
                    onClick={() => setActiveTeamTab('home')}
                >
                    {homeTeam.team.abbreviation}
                </button>
            </div>

            {/* Box Scores */}
            <div className="boxscores-container">
                <div className={activeTeamTab === 'away' ? 'tab-content active' : 'tab-content mobile-hide'}>
                    {awayBox && (
                        <BoxScore
                            players={awayBox.statistics[0].athletes}
                            teamInfo={awayBox.team}
                            onPlayerClick={setSelectedPlayerId}
                        />
                    )}
                </div>

                <div className={activeTeamTab === 'home' ? 'tab-content active' : 'tab-content mobile-hide'}>
                    {homeBox && (
                        <BoxScore
                            players={homeBox.statistics[0].athletes}
                            teamInfo={homeBox.team}
                            onPlayerClick={setSelectedPlayerId}
                        />
                    )}
                </div>
            </div>

            {/* Game Info */}
            <div className="extra-info glass-card">
                <h3><Info size={18} /> Matchup Info</h3>
                <p><strong>Venue:</strong> {competition.venue?.fullName}, {competition.venue?.address?.city}</p>
                {competition.attendance && <p><strong>Attendance:</strong> {competition.attendance.toLocaleString()}</p>}
                {competition.headlines && <p className="headline">"{competition.headlines[0].shortLinkText}"</p>}
            </div>
        </div>
    );
};

export default GameDetail;
