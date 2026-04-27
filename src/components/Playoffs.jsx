import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, Trophy } from 'lucide-react';
import { getStandings, getPlayoffBracket } from '../services/espnApi';

// Best-of-7
const MAX_WINS = 4;

// Canonical NBA bracket pairings within a conference.
// Top half of bracket: 1v8 → 4v5; Bottom half: 3v6 → 2v7.
const BRACKET_PAIRS = [[1, 8], [4, 5], [3, 6], [2, 7]];

// Build {seed: team} for a conference's top 8 from the standings payload.
function getConferenceSeeds(standingsData, confAbbr) {
    const conf = standingsData?.children?.find(c => c.abbreviation === confAbbr);
    const entries = conf?.standings?.entries || [];
    const teams = {};
    for (const entry of entries) {
        const seedStat = entry.stats?.find(s => s.name === 'playoffSeed');
        const seed = seedStat?.value;
        if (!seed || seed > 8) continue;
        const wins = entry.stats?.find(s => s.name === 'wins')?.displayValue;
        const losses = entry.stats?.find(s => s.name === 'losses')?.displayValue;
        const team = entry.team || {};
        teams[seed] = {
            id: team.id,
            name: team.shortDisplayName || team.name || team.displayName,
            abbr: team.abbreviation || (team.name || '').slice(0, 3).toUpperCase(),
            logo: team.logos?.[0]?.href || team.logo,
            seed,
            record: wins != null && losses != null ? `${wins}-${losses}` : null,
        };
    }
    return teams;
}

// Build a map of playoff series keyed by sorted-pair-of-team-ids.
// ESPN's playoff scoreboard returns one entry per game; we de-dup to one per series
// and keep the entry with the most cumulative wins (latest state).
function buildSeriesMap(playoffData) {
    const map = {};
    if (!playoffData?.events) return map;

    for (const event of playoffData.events) {
        const comp = event.competitions?.[0];
        if (!comp) continue;
        const competitors = comp.competitors || [];
        if (competitors.length !== 2) continue;
        const [c1, c2] = competitors;
        const id1 = c1.team?.id;
        const id2 = c2.team?.id;
        if (!id1 || !id2) continue;
        const key = [id1, id2].sort().join('_');

        let w1 = c1.series?.wins;
        let w2 = c2.series?.wins;

        // Fallback: parse series.summary like "BOS leads series 3-1" or "Series tied 2-2"
        const summary = comp.series?.summary || '';
        if ((w1 == null || w2 == null) && summary) {
            const m = summary.match(/(\d+)-(\d+)/);
            if (m) {
                const a = +m[1];
                const b = +m[2];
                if (/tied/i.test(summary)) {
                    w1 = a;
                    w2 = b;
                } else {
                    const c1Abbr = c1.team?.abbreviation || '';
                    const leadsC1 = c1Abbr && summary.includes(c1Abbr);
                    w1 = leadsC1 ? a : b;
                    w2 = leadsC1 ? b : a;
                }
            }
        }

        const safeW1 = Number.isFinite(w1) ? w1 : 0;
        const safeW2 = Number.isFinite(w2) ? w2 : 0;
        const total = safeW1 + safeW2;

        const existing = map[key];
        if (existing && total <= existing.totalWins) continue;

        const completed =
            comp.series?.completed === true ||
            safeW1 >= MAX_WINS ||
            safeW2 >= MAX_WINS;

        map[key] = {
            wins: { [id1]: safeW1, [id2]: safeW2 },
            totalWins: total,
            completed,
            isLive: comp.status?.type?.state === 'in',
            summary,
        };
    }

    return map;
}

function makeMatchup(top, bottom, seriesMap) {
    if (!top || !bottom) {
        return { top: top || null, bottom: bottom || null, topWins: 0, bottomWins: 0, completed: false, isLive: false };
    }
    const seriesKey = [top.id, bottom.id].sort().join('_');
    const series = seriesMap[seriesKey];
    return {
        top,
        bottom,
        topWins: series?.wins[top.id] || 0,
        bottomWins: series?.wins[bottom.id] || 0,
        completed: series?.completed || false,
        isLive: series?.isLive || false,
    };
}

function winnerOf(m) {
    if (!m || !m.completed) return null;
    if (m.topWins >= MAX_WINS) return m.top;
    if (m.bottomWins >= MAX_WINS) return m.bottom;
    return null;
}

// Build all rounds for one conference: 4 first-round, 2 semis, 1 conf final.
function buildConferenceBracket(seedsMap, seriesMap) {
    const firstRound = BRACKET_PAIRS.map(([sA, sB]) =>
        makeMatchup(seedsMap[sA], seedsMap[sB], seriesMap)
    );
    const semis = [
        makeMatchup(winnerOf(firstRound[0]), winnerOf(firstRound[1]), seriesMap),
        makeMatchup(winnerOf(firstRound[2]), winnerOf(firstRound[3]), seriesMap),
    ];
    const final = makeMatchup(winnerOf(semis[0]), winnerOf(semis[1]), seriesMap);
    return { firstRound, semis, final };
}

const rowVariants = {
    hidden: { opacity: 0, y: 4 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.02 } },
};

function TeamCell({ team, side, isWinner, isLoser, showRecord }) {
    if (!team) {
        return (
            <div className={`po-team po-team-${side} po-team-tbd`}>
                <span className="po-tbd-text">TBD</span>
            </div>
        );
    }
    return (
        <div
            className={`po-team po-team-${side}${isWinner ? ' po-team-win' : ''}${isLoser ? ' po-team-loss' : ''}`}
        >
            <span className="po-seed">{team.seed}</span>
            {team.logo && <img src={team.logo} alt="" className="po-logo" loading="lazy" />}
            <div className="po-team-meta">
                <span className="po-abbr">{team.abbr}</span>
                {showRecord && team.record && <span className="po-record">{team.record}</span>}
            </div>
        </div>
    );
}

function MatchupRow({ matchup, showRecord = false }) {
    const { top, bottom, topWins, bottomWins, completed, isLive } = matchup;
    const tbd = !top || !bottom;
    const topWin = completed && topWins >= MAX_WINS;
    const bottomWin = completed && bottomWins >= MAX_WINS;

    return (
        <motion.div
            className={`po-row${completed ? ' po-completed' : ''}${isLive ? ' po-live' : ''}${tbd ? ' po-tbd' : ''}`}
            variants={rowVariants}
        >
            <TeamCell team={top} side="left" isWinner={topWin} isLoser={bottomWin} showRecord={showRecord} />

            <div className="po-score">
                <span className={`po-w${topWin ? ' po-w-win' : ''}`}>{tbd ? '' : topWins}</span>
                {isLive ? (
                    <span className="po-live-dot" aria-label="live" />
                ) : (
                    <span className="po-dash">{tbd ? 'vs' : '–'}</span>
                )}
                <span className={`po-w${bottomWin ? ' po-w-win' : ''}`}>{tbd ? '' : bottomWins}</span>
            </div>

            <TeamCell team={bottom} side="right" isWinner={bottomWin} isLoser={topWin} showRecord={showRecord} />
        </motion.div>
    );
}

function RoundBlock({ label, matchups, showRecord }) {
    return (
        <div className="po-round-block">
            <div className="po-round-label">{label}</div>
            <div className="po-round-list">
                {matchups.map((m, idx) => (
                    <MatchupRow
                        key={idx + (m.top?.id || 'tbd-t') + (m.bottom?.id || 'tbd-b')}
                        matchup={m}
                        showRecord={showRecord}
                    />
                ))}
            </div>
        </div>
    );
}

function ConferenceColumn({ title, bracket }) {
    return (
        <section className="po-conf">
            <h2 className="po-conf-title">{title}</h2>
            <RoundBlock label="First Round" matchups={bracket.firstRound} showRecord />
            <RoundBlock label="Semifinals" matchups={bracket.semis} />
            <RoundBlock label="Conference Finals" matchups={[bracket.final]} />
        </section>
    );
}

const Playoffs = () => {
    const [data, setData] = useState({ standings: null, playoff: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = async (force = false) => {
        setLoading(true);
        setError(false);
        try {
            const [standings, playoff] = await Promise.all([
                getStandings(force),
                getPlayoffBracket(force),
            ]);
            if (!standings) {
                setError(true);
            } else {
                setData({ standings, playoff });
            }
        } catch {
            setError(true);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={40} />
                <p>Loading playoff bracket...</p>
            </div>
        );
    }

    const seasonYear =
        data.playoff?.season?.year || data.standings?.season?.year || null;
    const eastSeeds = getConferenceSeeds(data.standings, 'East');
    const westSeeds = getConferenceSeeds(data.standings, 'West');
    const seriesMap = buildSeriesMap(data.playoff);

    const eastBracket = buildConferenceBracket(eastSeeds, seriesMap);
    const westBracket = buildConferenceBracket(westSeeds, seriesMap);
    const finals = makeMatchup(
        winnerOf(eastBracket.final),
        winnerOf(westBracket.final),
        seriesMap
    );

    const noSeeds =
        Object.keys(eastSeeds).length === 0 && Object.keys(westSeeds).length === 0;

    return (
        <div className="playoffs-view">
            <div className="view-header">
                <div className="playoffs-header-content">
                    <Trophy size={26} className="playoffs-trophy-icon" />
                    <div>
                        <h1>Playoffs{seasonYear ? ` ${seasonYear}` : ''}</h1>
                        <p className="view-subtext">
                            All 16 teams · Bracket fills in as series complete
                        </p>
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

            {error || noSeeds ? (
                <div className="playoff-empty glass-card">
                    <Trophy size={48} style={{ opacity: 0.3 }} />
                    <h2>Playoff bracket unavailable</h2>
                    <p>The bracket will appear here once the postseason field is set.</p>
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
                    <div className="po-confs">
                        <ConferenceColumn title="Eastern Conference" bracket={eastBracket} />
                        <ConferenceColumn title="Western Conference" bracket={westBracket} />
                    </div>

                    <section className="po-finals">
                        <h2 className="po-finals-title">
                            <Trophy size={18} className="po-finals-icon" />
                            NBA Finals
                        </h2>
                        <div className="po-round-list po-finals-list">
                            <MatchupRow matchup={finals} />
                        </div>
                    </section>
                </motion.div>
            )}
        </div>
    );
};

export default Playoffs;
