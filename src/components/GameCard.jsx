import React from 'react';

const GameCard = ({ game }) => {
    const { status, competitions } = game;
    const comp = competitions[0];
    const homeTeam = comp.competitors.find(c => c.homeAway === 'home');
    const awayTeam = comp.competitors.find(c => c.homeAway === 'away');

    const statusDetail = status.type.shortDetail;
    const isLive = status.type.state === 'in';
    const isFinished = status.type.state === 'post';

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
