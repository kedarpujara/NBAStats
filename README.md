# NBAStats

## Your one-stop shop for all NBA games, stats, news, and gossip.

A modern, mobile-first web app that aggregates real-time NBA data from multiple sources into a clean, unified experience. Check live scores, dive into box scores, explore player profiles, track standings, read the latest news, and see what r/nba is buzzing about — all in one place.

Vist now: https://nbastats-seven.vercel.app/

---

## Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Sources](#data-sources)
- [Caching Strategy](#caching-strategy)
- [Project Structure](#project-structure)


---

## Features

| Module | Description |
|--------|-------------|
| **Games** | Live scoreboard with date navigation, top performer stats, and auto-refresh for in-progress games |
| **Box Scores** | Full game breakdowns with starters, bench, DNP sections, and detailed player stats |
| **Player Profiles** | Search players, view career stats, season averages, and recent game logs |
| **Stat Leaders** | League leaders across points, rebounds, assists, steals, blocks, and shooting percentages |
| **Standings** | Eastern & Western Conference standings with records, streaks, and playoff positioning |
| **News** | Latest NBA news and injury reports from ESPN |
| **Reddit Feed** | Trending posts from r/nba to catch community buzz and discussions |

---


---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```


## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18 with Hooks |
| **Build** | Vite + SWC |
| **Styling** | CSS3 with glassmorphism design system |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **PWA** | Vite PWA Plugin (offline support, installable) |
| **Deployment** | Vercel |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React App                            │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐ │
│  │   Games   │ │  Players  │ │ Standings │ │ News/Reddit │ │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └──────┬──────┘ │
│        │             │             │              │         │
│        └─────────────┴─────────────┴──────────────┘         │
│                            │                                │
│                    ┌───────┴───────┐                        │
│                    │ Cache Service │                        │
│                    │ (localStorage)│                        │
│                    └───────┬───────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
        │  ESPN API │  │Reddit API │  │CORS Proxy │
        └───────────┘  └───────────┘  └───────────┘
```

**Component Flow:** Views → Services → Cache Layer → External APIs

The app follows a simple but effective pattern:
1. Components request data through service modules
2. Services check the cache layer first (localStorage with TTL)
3. On cache miss, services fetch from external APIs
4. Responses are cached and returned to components

---

## Data Sources

### ESPN API (Primary)
Free, public API providing:
- Live and historical game data
- Player profiles and statistics
- League standings
- News and injury reports

### Reddit API
Fetches trending posts from r/nba for community content and discussions.

---

## Caching Strategy

Smart TTL-based caching optimizes for data freshness vs. API efficiency:

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Live games | 1 min | Scores change frequently |
| News | 15 min | Updates periodically |
| Standings | 1 hour | Changes after games complete |
| Game summaries | 1 hour | Box scores finalize post-game |
| Player details | 24 hours | Rarely changes |
| Historical games | 24 hours | Static data |

---

## Project Structure

```
src/
├── components/        # React components
│   ├── App.jsx        # Router & layout
│   ├── GamesView.jsx  # Games list
│   ├── GameDetail.jsx # Game details & box score
│   ├── BoxScore.jsx   # Stats tables
│   ├── PlayerProfile.jsx
│   ├── PlayerSearch.jsx
│   ├── Standings.jsx
│   ├── News.jsx
│   └── RedditFeed.jsx
├── services/          # API integrations
│   ├── espnApi.js     # ESPN data fetching
│   ├── redditApi.js   # Reddit integration
│   └── cacheService.js
└── styles/            # CSS modules
```


---

Built with React + Vite. Deployed on Vercel.
