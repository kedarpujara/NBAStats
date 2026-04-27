import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getPlayoffBracket } from '../services/espnApi';
import { Loader2, RefreshCw, Trophy } from 'lucide-react';

// Map ESPN week/round numbers to display labels
const ROUND_LABELS = {
    1: 'First Round',
    2: 'Conference Semifinals',
    3: 'Conference Finals',
    4: 'NBA Finals',
};

// De-duplicate the ESPN scoreboard's individual playoff games into one entry per series.
function parseSeries(data) {
    if (!data || !data.events) return [];

    const seriesMap = {};

    for (const event of data.events) {
        const comp = event.competitions?.[0];
        if (!comp) continue;

        const competitors = comp.competitors || [];
        const home = competitors.find(c => c.homeAway === 'home') || competitors[0];
        const away = competitors.find(c => c.homeAway === 'away') || competitors[1];
        if (!home || !away) continue;

        const seriesKey = [home.team?.id, away.team?.id].sort().join('_');

        const homeWins = home.series?.wins ?? 0;
        const awayWins = away.series?.wins ?? 0;
        const totalWins = homeWins + awayWins;

        const existing = seriesMap[seriesKey];
        const existingTotal = existing ? (existing.homeWins + existing.awayWins) : -1;
        if (existing && totalWins <= existingTotal) continue;

        const round = event.week?.number || comp.playoffRound || 1;

        const buildTeam = (c, wins) => ({
            id: c.team?.id,
            name: c.team?.shortDisplayName || c.team?.name || c.team?.displayName,
            abbr: c.team?.abbreviation || (c.team?.name || '').slice(0, 3).toUpperCase(),
            logo: c.team?.logos?.[0]?.href || c.team?.logo,
            wins,
            seed: c.seed || c.curatedRank?.current || null,
        });

        // Place lower-seed (better) team on the left for a consistent bracket read.
        const homeTeam = buildTeam(home, homeWins);
        const awayTeam = buildTeam(away, awayWins);
        const homeSeed = homeTeam.seed ?? 99;
        const awaySeed = awayTeam.seed ?? 99;
        const top = homeSeed <= awaySeed ? homeTeam : awayTeam;
        const bottom = homeSeed <= awaySeed ? awayTeam : homeTeam;

        seriesMap[seriesKey] = {
            key: seriesKey,
            round,
            homeWins,
            awayWins,
            top,
            bottom,
            summary: comp.series?.summary || '',
            completed: comp.series?.completed === true,
            isLive: comp.status?.type?.state === 'in',
        };
    }

    return Object.values(seriesMap).sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        return (a.top.seed ?? 99) - (b.top.seed ?? 99);
    });
}

const MAX_WINS = 4;

const rowVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
};

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.03 } },
};

function TeamSide({ team, isWinner, isLoser, align }) {
    return (
        <div className={`po-team po-team-${align}${isWinner ? ' po-winner' : ''}${isLoser ? ' po-loser' : ''}`}>
            {team.seed != null && <span className="po-seed">{team.seed}</span>}
            {team.logo && <img src={team.logo} alt="" className="po-logo" loading="lazy" />}
            <span className="po-abbr">{team.abbr}</span>
        </div>
    );
}

function SeriesRow({ series }) {
    const { top, bottom, completed, isLive } = series;
    const topWinner = completed && top.wins === MAX_WINS;
    const bottomWinner = completed && bottom.wins === MAX_WINS;

    return (
        <motion.div
            className={`po-series${completed ? ' po-completed' : ''}${isLive ? ' po-live' : ''}`}
            variants={rowVariants}
        >
            <TeamSide team={top} isWinner={topWinner} isLoser={bottomWinner} align="left" />

            <div className="po-score">
                <span className={`po-wins${topWinner ? ' po-wins-winner' : ''}`}>{top.wins}</span>
                <span className="po-dash">{isLive ? <span className="po-live-dot" /> : '–'}</span>
                <span className={`po-wins${bottomWinner ? ' po-wins-winner' : ''}`}>{bottom.wins}</span>
            </div>

            <TeamSide team={bottom} isWinner={bottomWinner} isLoser={topWinner} align="right" />
        </motion.div>
    );
}

const Playoffs = () => {
    const [seriesList, setSeriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [seasonYear, setSeasonYear] = useState(null);

    const load = async (force = false) => {
        setLoading(true);
        setError(false);
        const data = await getPlayoffBracket(force);
        if (data) {
            setSeriesList(parseSeries(data));
            setSeasonYear(data.season?.year || null);
        } else {
            setError(true);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const rounds = {};
    for (const s of seriesList) {
        if (!rounds[s.round]) rounds[s.round] = [];
        rounds[s.round].push(s);
    }
    const sortedRoundNums = Object.keys(rounds).map(Number).sort((a, b) => a - b);

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={40} />
                <p>Loading playoff bracket...</p>
            </div>
        );
    }

    return (
        <div className="playoffs-view">
            <div className="view-header">
                <div className="playoffs-header-content">
                    <Trophy size={26} className="playoffs-trophy-icon" />
                    <div>
                        <h1>Playoffs{seasonYear ? ` ${seasonYear}` : ''}</h1>
                        <p className="view-subtext">Full bracket at a glance</p>
                    </div>
                </div>
                <button
                    className="refresh-btn"
                    onClick={() => load(true)}
                    title="Refresh playoff data"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {(error || seriesList.length === 0) ? (
                <div className="playoff-empty glass-card">
                    <Trophy size={48} style={{ opacity: 0.3 }} />
                    <h2>Playoffs not yet available</h2>
                    <p>The bracket will appear here once the postseason begins.</p>
                    <button className="refresh-btn" onClick={() => load(true)}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            ) : (
                <motion.div
                    className="po-bracket"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {sortedRoundNums.map(roundNum => (
                        <section key={roundNum} className="po-round">
                            <div className="po-round-header">
                                <span className="po-round-label">{ROUND_LABELS[roundNum] || `Round ${roundNum}`}</span>
                                <span className="po-round-count">{rounds[roundNum].length}</span>
                            </div>
                            <div className="po-round-list">
                                {rounds[roundNum].map(series => (
                                    <SeriesRow key={series.key} series={series} />
                                ))}
                            </div>
                        </section>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default Playoffs;
