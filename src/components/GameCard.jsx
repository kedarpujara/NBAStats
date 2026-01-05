import React from 'react';

const GameCard = ({ game }) => {
    const { status, competitions } = game;
    const comp = competitions[0];
    const homeTeam = comp.competitors.find(c => c.homeAway === 'home');
    const awayTeam = comp.competitors.find(c => c.homeAway === 'away');

    const statusDetail = status.type.shortDetail;
    const isLive = status.type.state === 'in';
    const isFinished = status.type.state === 'post';

    // Get top performers from each team (points leader)
    const getTopPerformer = (team) => {
        if (!team.leaders || team.leaders.length === 0) return null;

        const pointsLeader = team.leaders.find(l => l.name === 'points' || l.abbreviation === 'PTS');
        if (!pointsLeader?.leaders?.[0]) return null;

        const leader = pointsLeader.leaders[0];
        return {
            name: leader.athlete?.shortName || leader.athlete?.displayName || 'Unknown',
            points: leader.value || leader.displayValue || '0'
        };
    };

    const awayTopPerformer = getTopPerformer(awayTeam);
    const homeTopPerformer = getTopPerformer(homeTeam);
    const showPerformers = (isLive || isFinished) && (awayTopPerformer || homeTopPerformer);

    return (
        <div className="game-card glass-card">
            <div className="game-status">
                {isLive && <span className="live-indicator">LIVE</span>}
                <span className="status-text">{statusDetail}</span>
            </div>

            <div className="teams-container">
                <div className="team-row">
                    <div className="team-info">
                        <img src={awayTeam.team.logo} alt={awayTeam.team.name} className="team-logo" />
                        <span className="team-name">{awayTeam.team.abbreviation}</span>
                    </div>
                    <span className={`team-score ${isFinished && awayTeam.winner ? 'winner' : ''}`}>
                        {(isLive || isFinished) ? awayTeam.score : ''}
                    </span>
                </div>

                <div className="team-row">
                    <div className="team-info">
                        <img src={homeTeam.team.logo} alt={homeTeam.team.name} className="team-logo" />
                        <span className="team-name">{homeTeam.team.abbreviation}</span>
                    </div>
                    <span className={`team-score ${isFinished && homeTeam.winner ? 'winner' : ''}`}>
                        {(isLive || isFinished) ? homeTeam.score : ''}
                    </span>
                </div>
            </div>

            {/* Top Performers Section */}
            {showPerformers && (
                <div className="top-performers">
                    {awayTopPerformer && (
                        <div className="performer-row">
                            <span className="performer-name">{awayTopPerformer.name}</span>
                            <span className="performer-pts">{awayTopPerformer.points} PTS</span>
                        </div>
                    )}
                    {homeTopPerformer && (
                        <div className="performer-row">
                            <span className="performer-name">{homeTopPerformer.name}</span>
                            <span className="performer-pts">{homeTopPerformer.points} PTS</span>
                        </div>
                    )}
                </div>
            )}

            {isLive && (
                <div className="game-progress">
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: '65%' }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameCard;
