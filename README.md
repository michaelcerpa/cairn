# Cairn AI — Sierra Backcountry Trip Planner

Multi-day trip planner for the Eastern Sierra with natural-language search, current-conditions beta, condition-tuned packing lists, and GPX export.

Cairn AI lets backpackers plan a Sierra trip by describing what they want in plain English — or by browsing a set of ready-to-go routes. Instead of stitching together permit portals, trip-report threads, snow forecasts, and packing checklists across a dozen tabs, you tell Cairn the kind of trip you're after and it surfaces matching routes — each with current beta, permit details, a condition-tuned packing list, and a downloadable GPX track.

Two ways to find a route:

- **Natural language** — Describe your ideal trip (e.g., "3 days in Mammoth in July") and Claude (Haiku) parses it against the route catalog — extracting constraints, ranking matches, and explaining near-misses honestly. If the AI is unreachable, a keyword parser takes over, and the UI labels which one answered.
- **Browse** — Scan eight curated Eastern Sierra routes as cards, each opening into a full trip brief.

When your search includes constraints, Cairn filters the route set and reflects back what it understood as removable pills. When a region isn't covered yet — say Yosemite or Kings Canyon — it says so honestly instead of faking results.

## Why Cairn AI

- Planning starts from trip intent, not tab-hopping between permit sites and forums
- Natural-language input lets you describe a trip the way you'd tell a friend
- Every route bundles the decisions that actually matter: permits, conditions, gear, and navigation
- Runs as a single static page — no account, no framework, instant GPX export — plus two small serverless functions for live conditions and live permit availability

## Features

- **Natural-language trip search** — Describe your trip and Cairn extracts region, nights, timeframe, difficulty, permit style, and snow preference
- **"Understood as" constraints** — See exactly how your search was parsed, and remove any constraint with a tap
- **Curated Sierra routes** — Eight hand-built Eastern Sierra trips, from easy lake basins to a 36-mile JMT leg
- **Live permit availability** — A 14-day bookable-now strip per trailhead from Recreation.gov, with honest fallbacks (never fabricated counts)
- **Recent beta** — A plain-language conditions summary plus real, linked excerpts from High Sierra Topix condition reports
- **Conditions readout** — Inline elevation profile, snow status, access-road status, fire restrictions, and live NOAA forecasts: overnight lows at trailhead-grid elevation, a multi-day outlook, and active NWS alerts for the Eastern Sierra zone
- **Live permit availability** — a 14-day strip of overnight spots bookable online right now, straight from Recreation.gov, with the permit type/agency/mechanic and a direct link to reserve
- **Condition-tuned packing list** — Regulation-required items, condition-driven add-ons (e.g., extra water in a dry year), and a standard base kit
- **Ask about this route** — A per-route question bar (chips + free text): Claude answers grounded in the route record and the page's live permit/forecast data; offline it points to official sources instead of canned advice
- **GPX export** — Download a valid GPX track for Garmin Connect, Strava, Gaia GPS, and other compatible tools
- **Honest empty states** — When nothing matches, or a region isn't covered, Cairn says so rather than guessing

## How It Works

1. Describe your trip in plain English, or browse the eight curated routes.
2. Cairn parses your input — region, nights, timeframe, difficulty, permit style, snow preference — and shows what it understood.
3. Matching routes are filtered from the set; unmatched constraints or uncovered regions surface an honest message instead of empty silence.
4. Open a route for its full brief: recent beta, conditions, permit, and safety & backup.
5. Generate a condition-tuned packing list, or export the route as a GPX track.

## Getting started

No build step — Cairn AI is a single self-contained static HTML file plus two serverless functions.

```bash
# Open it directly in a browser:
open index.html

# …or serve the folder with any static server:
python3 -m http.server 8000   # then visit http://localhost:8000
```

Opened locally, the page falls back to its curated conditions snapshot and an
honest "check Recreation.gov" permit panel — the live readouts come from
`api/conditions.js` (NOAA) and `api/permits.js` (Recreation.gov), which run when
deployed on Vercel (static site + serverless functions, 30-minute edge caching
so the upstream APIs see a handful of requests per half hour regardless of traffic).

## Tech Stack

- Vanilla HTML, CSS, and JavaScript — single self-contained file, no framework
- No build step, no dependencies; two Vercel serverless functions (`api/conditions.js`, `api/permits.js`)
- Live forecasts & alerts from NOAA/NWS (`api.weather.gov` — free public data, edge-cached 30 min)
- Natural-language search via the Anthropic API (Claude Haiku, structured outputs, no SDK — `api/search.js`), with client-side keyword fallback
- Live permit availability from Recreation.gov (unofficial availability API, edge-cached 30 min, honest fallback when unavailable)
- Inline SVG for the elevation profiles and logo
- Google Fonts (Fraunces, Spline Sans, Spline Sans Mono)
- Locally hosted trailhead photos (Wikimedia Commons, attributed in-app)
- Client-side GPX generation via `Blob` and `URL.createObjectURL`
- Natural-language parsing via lightweight client-side keyword/regex matching
- Hosted on Vercel; designed to be `iframe`-embedded in a portfolio site

## Current Scope

Cairn mixes live data with curated content, and labels which is which.

**Live:**

- Forecast lows, multi-day outlook, and active NWS alerts — pulled from NOAA per trailhead (per-trailhead forecast zones), refreshed on load (30-min edge cache)
- Overnight permit availability for the next 14 days per trailhead — from Recreation.gov's availability API (unofficial; when it's unreachable the UI says "check Recreation.gov" rather than showing numbers)

**Real, curated by hand:**

- Trails, trailhead elevations, and profiles (cross-referenced with AllTrails), Inyo National Forest permit mechanics, the record-low 2026 snow year, Stage I fire restrictions

**Real, quoted:**

- Trip-report excerpts are verbatim quotes from public High Sierra Topix condition reports, linked to the source post — harvested manually for now (live feeds are on the roadmap)

**Live when configured:**

- Natural-language search runs on Claude (Haiku) via `api/search.js` with a structured-output schema; without an `ANTHROPIC_API_KEY` it degrades to the client-side keyword parser, and the "Understood as" band labels which parser answered
- Per-route "Ask" (`api/ask.js`) answers grounded in the curated route record plus the live data already on the page; offline it degrades to links to Inyo NF and Recreation.gov

**Still simulated:**

- Snow, road, and fire status lines are a curated snapshot
- GPX tracks are synthesized from the real trailhead and elevation profile — anchored in the right valley, but not survey-grade

Geographic focus is the Eastern Sierra — the **Mammoth**, **Bishop**, and **Lone Pine** areas (Inyo National Forest, John Muir & Ansel Adams Wildernesses, plus a JMT leg ending in Yosemite) — across eight routes.
