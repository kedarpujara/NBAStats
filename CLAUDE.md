# NBAStats — CLAUDE.md

Mobile-first NBA dashboard: live scores, standings, player stats, news, and a Reddit `/r/nba` feed. Aggregates public ESPN + Reddit data into one clean UI. Installable PWA.

_Prefix: `NB` · Repo: `~/projects/NBAStats` · Deploy: Vercel._

## Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 with hooks (no Redux / Context) |
| Build | Vite 5.2 + SWC |
| Language | JavaScript (ES modules) — **no TypeScript** |
| Styling | Vanilla CSS3 + CSS variables (glassmorphism). No Tailwind, no SCSS. |
| Animations | Framer Motion 11 |
| Icons | Lucide React 0.344 |
| Data | ESPN public APIs + Reddit RSS (via Vercel serverless proxy) |
| Deploy | Vercel (static + one serverless function) |
| PWA | `vite-plugin-pwa` — offline support + installable manifest |

## Repo layout

```
src/
  main.jsx                 App entry — registers PWA + mounts <App />
  App.jsx                  Tab-state router (no React Router). renderContent() switches views.
  components/              9 view components + layout (Sidebar, BottomNav, Scoreboard, PlayerDetails, …)
  services/
    espnApi.js             All ESPN endpoints (scoreboard, standings, player, game summary, PBP, leaders, news)
    redditApi.js           Calls /api/reddit on Vercel for the subreddit feed
    cacheService.js        localStorage TTL cache, per-category expiry
  index.css                Design tokens + glassmorphism primitives
  App.css                  Grid layout (sidebar + main)
api/
  reddit.js                Vercel serverless fn — fetches r/nba RSS and reshapes to JSON
public/                    PWA icons, manifest
dist/                      Vite build output (gitignored in practice)
vercel.json                Rewrites for /api/* + SPA fallback
```

## Run / dev / build

```bash
npm install
npm run dev      # Vite dev server on :5173
npm run build    # -> dist/
npm run preview  # serve dist/ locally
```

## Deploy

- **Target:** Vercel. Static build + one serverless function (`api/reddit.js`).
- **Live:** `https://nbastats-seven.vercel.app/`
- **Rewrites (`vercel.json`):** `/api/*` → serverless functions; everything else → SPA root.
- Serverless fn sets `Cache-Control: s-maxage=60` so Vercel edge caches the Reddit feed.

## Environment

**None.** All data sources are public + unauthenticated. No `.env` required.

## Data sources

- **ESPN:** `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/...` — scoreboard, standings, team/player details, game summaries, play-by-play, news, leaders.
- **Reddit:** `https://www.reddit.com/r/nba/hot.rss` fetched server-side by `/api/reddit` and reshaped to JSON. The JSON API returns 403 when hit server-side, so RSS is required.

## Cache strategy (`services/cacheService.js`)

TTLs tuned per category:

| Data | TTL |
|------|-----|
| Live games (in-progress) | 1 min |
| News | 15 min |
| Standings | 1 hour |
| Finished games, player details, historical | 24 hours |

The cache key is a composite of endpoint + params. Always call `cacheService.get()` before the fetch.

## Key patterns

- **Routing is tab state, not URL.** `App.jsx` holds `activeTab` in `useState`; `renderContent()` switches components. Deep links to a specific view are not a thing.
- **No global state.** Each component owns its own `useState` + calls the service layer. Keep it that way until pain demands otherwise.
- **Service modules are pure async functions** that delegate caching to `cacheService`. Never call `fetch` directly from components.
- **Styling via CSS variables.** Global tokens in `index.css`; don't introduce component-scoped CSS libraries.
- **Error handling is broad try/catch** with graceful fallbacks (null or `[]`).

## DO NOT casually change

- **`services/cacheService.js` TTLs** — stale data or API rate-limit issues will follow.
- **`api/reddit.js` XML parsing** — uses `[^<]*` inside the `<content>` tag extraction. The previous `[\s\S]*?` regex broke on large content (fixed in `49dadcd`). Don't "simplify" back.
- **CSS variables in `index.css`** — they cascade into every view.
- **`App.jsx` tab switching** — replacing with React Router means rewriting every component that currently relies on tab IDs.
- **ESPN endpoint URLs** — `v2` vs `v3`, `site.` vs `web.` subdomain, different paths per data type. Easy to break with a global find-replace.

## Known gotchas

- **Reddit feed went JSON → RSS.** Server-side calls to `reddit.com/r/nba.json` return 403. The proxy now parses RSS XML; if you see feed breakage, check `api/reddit.js` first.
- **Player search must filter to NBA.** ESPN's player search returns college/historical players otherwise.
- **Live-vs-finished game detection** relies on `status.type.state`. Don't swap to `status.type.completed` alone — it misses some intermediate states.
- **Mobile layout** enforces `--mobile-padding: 1.25rem` + `overflow-x: hidden`. Breaking these produces horizontal scroll on iOS Safari.
- **No TypeScript** — treat prop shapes defensively; changes in one service that add/remove fields silently break consumers.

## Common tasks

- **Add a new ESPN data view:** add an async function in `services/espnApi.js` (with cache), then a new component under `src/components/`, then wire into `App.jsx`'s tab switcher.
- **Change cache TTL for a category:** `cacheService.js` → `CATEGORY_TTL` map.
- **Tweak the Reddit feed shape:** edit `api/reddit.js` (server-side) — NOT the client service.
- **Add a mobile layout fix:** global tokens in `index.css`, component overrides sparingly.

## Current priorities

Recent work: switched Reddit proxy to RSS with correct XML parsing (`49dadcd`). No active milestones in the repo. Check git log before starting new work.
