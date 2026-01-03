import React, { useEffect, useState, useRef } from 'react';
import { getPlayByPlay } from '../services/espnApi';
import { Loader2, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const PlayByPlay = ({ eventId, onBack, awayTeam, homeTeam }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedPeriods, setExpandedPeriods] = useState({});
    const containerRef = useRef(null);

    // Swipe gesture handling
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        const swipeDistance = touchEndX.current - touchStartX.current;
        const minSwipeDistance = 80;

        if (swipeDistance > minSwipeDistance) {
            onBack();
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await getPlayByPlay(eventId);
            if (result) {
                setData(result);
                // Expand the most recent period by default
                if (result.plays) {
                    const periods = [...new Set(result.plays.map(p => p.period?.number))].filter(Boolean);
                    if (periods.length > 0) {
                        setExpandedPeriods({ [Math.max(...periods)]: true });
                    }
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [eventId]);

    const togglePeriod = (periodNum) => {
        setExpandedPeriods(prev => ({
            ...prev,
            [periodNum]: !prev[periodNum]
        }));
    };

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={40} />
                <p>Loading play-by-play...</p>
            </div>
        );
    }

    if (!data || !data.plays || data.plays.length === 0) {
        return (
            <div
                className="play-by-play"
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={18} /> Back to Game
                </button>
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No play-by-play data available for this game.</p>
                </div>
            </div>
        );
    }

    // Group plays by period
    const playsByPeriod = data.plays.reduce((acc, play) => {
        const period = play.period?.number || 0;
        if (!acc[period]) acc[period] = [];
        acc[period].push(play);
        return acc;
    }, {});

    const periods = Object.keys(playsByPeriod).map(Number).sort((a, b) => b - a);

    const getPeriodName = (num) => {
        if (num <= 4) return `Quarter ${num}`;
        return `OT${num - 4}`;
    };

    const getTeamInfo = (play) => {
        if (!play.team) return null;
        const isHome = play.team.id === homeTeam?.id;
        const isAway = play.team.id === awayTeam?.id;
        return {
            isHome,
            isAway,
            abbreviation: play.team.abbreviation || (isHome ? homeTeam?.abbreviation : awayTeam?.abbreviation),
            logo: play.team.logo || (isHome ? homeTeam?.logo : awayTeam?.logo)
        };
    };

    const getPlayTypeClass = (play) => {
        const type = play.type?.text?.toLowerCase() || '';
        if (type.includes('three point') || type.includes('3pt')) return 'play-three';
        if (type.includes('dunk') || type.includes('slam')) return 'play-dunk';
        if (type.includes('block')) return 'play-block';
        if (type.includes('steal')) return 'play-steal';
        if (type.includes('turnover')) return 'play-turnover';
        if (type.includes('foul')) return 'play-foul';
        if (play.scoringPlay) return 'play-score';
        return '';
    };

    return (
        <div
            className="play-by-play"
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <button className="back-btn" onClick={onBack}>
                <ArrowLeft size={18} /> Back to Game
            </button>

            <div className="pbp-header glass-card">
                <h2>Play-by-Play</h2>
                <div className="pbp-teams">
                    <div className="pbp-team">
                        {awayTeam?.logo && <img src={awayTeam.logo} alt="" />}
                        <span>{awayTeam?.abbreviation}</span>
                    </div>
                    <span className="pbp-vs">vs</span>
                    <div className="pbp-team">
                        {homeTeam?.logo && <img src={homeTeam.logo} alt="" />}
                        <span>{homeTeam?.abbreviation}</span>
                    </div>
                </div>
            </div>

            <div className="pbp-periods">
                {periods.map(periodNum => (
                    <div key={periodNum} className="pbp-period">
                        <button
                            className="pbp-period-header glass-card"
                            onClick={() => togglePeriod(periodNum)}
                        >
                            <span>{getPeriodName(periodNum)}</span>
                            <span className="pbp-play-count">{playsByPeriod[periodNum].length} plays</span>
                            {expandedPeriods[periodNum] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>

                        {expandedPeriods[periodNum] && (
                            <div className="pbp-plays">
                                {playsByPeriod[periodNum].map((play, idx) => {
                                    const teamInfo = getTeamInfo(play);
                                    return (
                                        <div
                                            key={play.id || idx}
                                            className={`pbp-play ${getPlayTypeClass(play)} ${teamInfo?.isHome ? 'home-play' : teamInfo?.isAway ? 'away-play' : ''}`}
                                        >
                                            <div className="pbp-play-time">
                                                {play.clock?.displayValue || ''}
                                            </div>
                                            <div className="pbp-play-content">
                                                {teamInfo && (
                                                    <span className="pbp-play-team">
                                                        {teamInfo.abbreviation}
                                                    </span>
                                                )}
                                                <span className="pbp-play-text">{play.text}</span>
                                                {play.scoringPlay && play.awayScore !== undefined && (
                                                    <span className="pbp-score">
                                                        {play.awayScore} - {play.homeScore}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlayByPlay;
