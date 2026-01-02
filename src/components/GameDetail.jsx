import React, { useEffect, useState } from 'react';
import { getGameSummary } from '../services/espnApi';
import { Loader2, ArrowLeft, Info } from 'lucide-react';
import BoxScore from './BoxScore';
import PlayerProfile from './PlayerProfile';

const GameDetail = ({ eventId, onBack }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);

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

    // Find full team box scores
    const awayBox = boxscore?.players?.find(p => p.team.id === awayTeam.team.id);
    const homeBox = boxscore?.players?.find(p => p.team.id === homeTeam.team.id);

    return (
        <div className="game-detail">
            <button className="back-btn" onClick={onBack}>
                <ArrowLeft size={18} /> Back to Games
            </button>

            <div className="game-header-large glass-card">
                <div className="detail-teams">
                    <div className="detail-team-block">
                        <img src={awayTeam.team.logo} alt="" className="large-logo" />
                        <span className="detail-team-name">{awayTeam.team.displayName}</span>
                        <span className="detail-team-record">{awayTeam.record?.[0]?.displayValue || '0-0'}</span>
                    </div>

                    <div className="detail-score-block">
                        <div className="score-row">
                            <span className={`detail-score ${awayTeam.winner ? 'winner' : ''}`}>{awayTeam.score}</span>
                            <span className="score-divider">-</span>
                            <span className={`detail-score ${homeTeam.winner ? 'winner' : ''}`}>{homeTeam.score}</span>
                        </div>
                        <span className="detail-status">{header.competitions[0].status.type.detail}</span>
                    </div>

                    <div className="detail-team-block">
                        <img src={homeTeam.team.logo} alt="" className="large-logo" />
                        <span className="detail-team-name">{homeTeam.team.displayName}</span>
                        <span className="detail-team-record">{homeTeam.record?.[0]?.displayValue || '0-0'}</span>
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

            {/* Box Scores */}
            <div className="boxscores-container">
                {awayBox && (
                    <BoxScore
                        players={awayBox.statistics[0].athletes}
                        teamInfo={awayBox.team}
                        onPlayerClick={setSelectedPlayerId}
                    />
                )}
                <div className="spacer-v"></div>
                {homeBox && (
                    <BoxScore
                        players={homeBox.statistics[0].athletes}
                        teamInfo={homeBox.team}
                        onPlayerClick={setSelectedPlayerId}
                    />
                )}
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
