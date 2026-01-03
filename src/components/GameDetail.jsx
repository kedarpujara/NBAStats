import React, { useEffect, useState } from 'react';
import { getGameSummary } from '../services/espnApi';
import { Loader2, ArrowLeft } from 'lucide-react';
import BoxScore from './BoxScore';
import PlayerProfile from './PlayerProfile';

const GameDetail = ({ eventId, onBack }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [activeTeamTab, setActiveTeamTab] = useState('away');

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
                <p>Loading game...</p>
            </div>
        );
    }

    if (!summary) return <div>Failed to load game details.</div>;

    const { boxscore, header } = summary;
    const competition = header.competitions[0];
    const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

    const getLogo = (team) => team.logo || team.logos?.[0]?.href || 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/nba.png';
    const getTeamName = (team) => team.displayName || team.name || 'Team';

    const awayBox = boxscore?.players?.find(p => p.team.id === awayTeam.team.id);
    const homeBox = boxscore?.players?.find(p => p.team.id === homeTeam.team.id);

    // Reusable team row component with CONSISTENT ordering: Badge → Logo → Name → Record
    const TeamRow = ({ team, type }) => (
        <div className="team-row-v2">
            <span className={`team-badge-v2 ${type}-badge`}>{type.toUpperCase()}</span>
            <img src={getLogo(team.team)} alt="" className="team-logo-v2" />
            <div className="team-info-v2">
                <span className="team-name-v2">{getTeamName(team.team)}</span>
                <span className="team-record-v2">{team.record?.[0]?.displayValue || '0-0'}</span>
            </div>
            <span className={`team-score-v2 ${team.winner ? 'winner' : ''}`}>{team.score}</span>
        </div>
    );

    return (
        <div className="game-detail-v2">
            <button className="back-btn" onClick={onBack}>
                <ArrowLeft size={18} /> Back to Games
            </button>

            {/* Game Header - Stacked for mobile */}
            <div className="game-header-v2 glass-card">
                <TeamRow team={awayTeam} type="away" />
                <TeamRow team={homeTeam} type="home" />

                <div className="game-status-v2">
                    {header.competitions[0].status.type.detail}
                </div>

                {/* Linescore */}
                <div className="linescore-v2">
                    <table className="linescore-table-v2">
                        <thead>
                            <tr>
                                <th>Team</th>
                                {awayTeam.linescores?.map((_, i) => <th key={i}>{i + 1}</th>)}
                                <th>T</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{awayTeam.team.abbreviation}</td>
                                {awayTeam.linescores?.map((ls, i) => <td key={i}>{ls.displayValue}</td>)}
                                <td className="total-cell">{awayTeam.score}</td>
                            </tr>
                            <tr>
                                <td>{homeTeam.team.abbreviation}</td>
                                {homeTeam.linescores?.map((ls, i) => <td key={i}>{ls.displayValue}</td>)}
                                <td className="total-cell">{homeTeam.score}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Team Switcher Tabs */}
            <div className="team-tabs-v2">
                <button
                    className={`team-tab-v2 ${activeTeamTab === 'away' ? 'active' : ''}`}
                    onClick={() => setActiveTeamTab('away')}
                >
                    {awayTeam.team.abbreviation}
                </button>
                <button
                    className={`team-tab-v2 ${activeTeamTab === 'home' ? 'active' : ''}`}
                    onClick={() => setActiveTeamTab('home')}
                >
                    {homeTeam.team.abbreviation}
                </button>
            </div>

            {/* Box Scores */}
            <div className="boxscore-container-v2">
                {activeTeamTab === 'away' && awayBox && (
                    <BoxScore
                        players={awayBox.statistics[0].athletes}
                        teamInfo={awayTeam.team}
                        onPlayerClick={setSelectedPlayerId}
                    />
                )}
                {activeTeamTab === 'home' && homeBox && (
                    <BoxScore
                        players={homeBox.statistics[0].athletes}
                        teamInfo={homeTeam.team}
                        onPlayerClick={setSelectedPlayerId}
                    />
                )}
            </div>
        </div>
    );
};

export default GameDetail;
