import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPlayoffBracket } from '../services/espnApi';
import { Loader2, RefreshCw, Trophy, Calendar, ChevronRight } from 'lucide-react';

// Map ESPN week/round numbers to display labels
const ROUND_LABELS = {
    1: 'First Round',
    2: 'Conference Semifinals',
    3: 'Conference Finals',
    4: 'NBA Finals',
};

// Parse the raw scoreboard data into a de-duplicated list of series
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

        // Use sorted team IDs as the series key so we only keep one entry per matchup
        const seriesKey = [home.team?.id, away.team?.id].sort().join('_');

        const homeWins = home.series?.wins ?? 0;
        const awayWins = away.series?.wins ?? 0;
        const seriesSummary = comp.series?.summary || '';
        const seriesCompleted = comp.series?.completed === true;

        // Prefer later game data (more wins means further along)
        const existing = seriesMap[seriesKey];
        const totalWins = homeWins + awayWins;
        const existingTotal = existing ? (existing.homeWins + existing.awayWins) : -1;

        if (!existing || totalWins > existingTotal) {
            const round = event.week?.number || comp.playoffRound || 1;
            const conferenceId = comp.conferenceCompetition?.id || null;

            seriesMap[seriesKey] = {
                key: seriesKey,
                round,
                conferenceId,
                home: {
                    id: home.team?.id,
                    name: home.team?.displayName || home.team?.name,
                    shortName: home.team?.abbreviation,
                    logo: home.team?.logos?.[0]?.href || home.team?.logo,
                    wins: homeWins,
                    seed: home.seed || home.curatedRank?.current || null,
                },
                away: {
                    id: away.team?.id,
                    name: away.team?.displayName || away.team?.name,
                    shortName: away.team?.abbreviation,
                    logo: away.team?.logos?.[0]?.href || away.team?.logo,
                    wins: awayWins,
                    seed: away.seed || away.curatedRank?.current || null,
                },
                summary: seriesSummary,
                completed: seriesCompleted,
                nextGame: {
                    date: comp.date,
                    status: comp.status?.type?.state,
                    statusDetail: comp.status?.type?.shortDetail || comp.status?.displayClock,
                },
                seasonYear: data.season?.year,
            };
        }
    }

    return Object.values(seriesMap).sort((a, b) => a.round - b.round);
}

function SeriesLeader({ summary }) {
    if (!summary) return null;
    const lower = summary.toLowerCase();
    const tied = lower.includes('tied') || lower.includes('series tied');
    if (tied) {
        return <span className="series-status tied">Series Tied</span>;
    }
    return <span className="series-status leading">{summary}</span>;
}

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

function MatchupCard({ series }) {
    const { home, away, summary, completed, nextGame, round } = series;
    const maxWins = 4;
    const isLive = nextGame?.status === 'in';

    const winnerSide = completed
        ? home.wins === maxWins ? 'home' : 'away'
        : null;

    return (
        <motion.div
            className={`playoff-card glass-card${completed ? ' completed' : ''}${isLive ? ' live' : ''}`}
            variants={cardVariants}
        >
            {isLive && (
                <div className="live-badge">
                    <span className="live-dot" />
                    LIVE
                </div>
            )}

            <div className="matchup-teams">
                {/* Away team (top seed shown first if seed data available) */}
                <div className={`matchup-team${winnerSide === 'away' ? ' winner' : ''}${winnerSide === 'home' ? ' loser' : ''}`}>
                    {away.logo && (
                        <img src={away.logo} alt={away.shortName} className="team-logo-playoff" />
                    )}
                    <div className="team-info-playoff">
                        {away.seed && <span className="seed-badge">{away.seed}</span>}
                        <span className="team-name-playoff">{away.name}</span>
                        <span className="team-abbr-playoff">{away.shortName}</span>
                    </div>
                    <div className="series-wins">
                        {Array.from({ length: maxWins }).map((_, i) => (
                            <div
                                key={i}
                                className={`win-pip${i < away.wins ? ' filled' : ''}`}
                            />
                        ))}
                        <span className="wins-count">{away.wins}</span>
                    </div>
                </div>

                <div className="versus-divider">
                    <ChevronRight size={14} className="vs-arrow" />
                </div>

                {/* Home team */}
                <div className={`matchup-team${winnerSide === 'home' ? ' winner' : ''}${winnerSide === 'away' ? ' loser' : ''}`}>
                    {home.logo && (
                        <img src={home.logo} alt={home.shortName} className="team-logo-playoff" />
                    )}
                    <div className="team-info-playoff">
                        {home.seed && <span className="seed-badge">{home.seed}</span>}
                        <span className="team-name-playoff">{home.name}</span>
                        <span className="team-abbr-playoff">{home.shortName}</span>
                    </div>
                    <div className="series-wins">
                        {Array.from({ length: maxWins }).map((_, i) => (
                            <div
                                key={i}
                                className={`win-pip${i < home.wins ? ' filled' : ''}`}
                            />
                        ))}
                        <span className="wins-count">{home.wins}</span>
                    </div>
                </div>
            </div>

            <div className="series-footer">
                <SeriesLeader home={home} away={away} summary={summary} />
                {completed && (
                    <span className="series-final-badge">Series Over</span>
                )}
                {!completed && !isLive && nextGame?.statusDetail && (
                    <span className="next-game-info">
                        <Calendar size={11} />
                        {nextGame.statusDetail}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
};

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
            const parsed = parseSeries(data);
            setSeriesList(parsed);
            setSeasonYear(data.season?.year || null);
        } else {
            setError(true);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    // Group series by round for display
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

    if (error || seriesList.length === 0) {
        return (
            <div className="playoffs-view">
                <div className="view-header">
                    <div className="playoffs-header-content">
                        <Trophy size={28} className="playoffs-trophy-icon" />
                        <div>
                            <h1>NBA Playoffs {seasonYear}</h1>
                            <p className="view-subtext">Bracket & Series Results</p>
                        </div>
                    </div>
                </div>
                <div className="playoff-empty glass-card">
                    <Trophy size={48} style={{ opacity: 0.3 }} />
                    <h2>Playoffs Not Yet Available</h2>
                    <p>
                        Playoff data will appear here once the NBA postseason begins.
                        Check back after the regular season ends.
                    </p>
                    <button className="refresh-btn" onClick={() => load(true)}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="playoffs-view">
            <div className="view-header">
                <div className="playoffs-header-content">
                    <Trophy size={28} className="playoffs-trophy-icon" />
                    <div>
                        <h1>NBA Playoffs {seasonYear}</h1>
                        <p className="view-subtext">Bracket &amp; Series Results</p>
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

            {sortedRoundNums.map(roundNum => (
                <section key={roundNum} className="playoff-round-section">
                    <h2 className="round-label">
                        {ROUND_LABELS[roundNum] || `Round ${roundNum}`}
                        <span className="round-count">{rounds[roundNum].length} series</span>
                    </h2>
                    <motion.div
                        className="playoff-grid"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {rounds[roundNum].map(series => (
                            <MatchupCard key={series.key} series={series} />
                        ))}
                    </motion.div>
                </section>
            ))}
        </div>
    );
};

export default Playoffs;
