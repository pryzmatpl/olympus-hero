# Cosmic Heroes (mythicalhero.me)

Web app for **AI-generated fantasy hero portraits and personalized backstories**, combining Western and Chinese zodiac influences from a birth date and hero name. Users sign in, create heroes, optionally upgrade with **Stripe**, and can share public links.

## Features

- Guided hero creation (birth date → name → generation)
- AI portrait angles and markdown-friendly backstory
- Premium unlock per hero (full assets, chapters, shared-story access where enabled)
- JWT auth, MongoDB persistence, Stripe payment intents + webhook path
- Public shared hero URLs (`/share/:shareId`)

## Tech Stack

- **Frontend**: React (TypeScript), Vite, Framer Motion, TailwindCSS
- **Backend**: Node.js + Express
- **Data**: MongoDB
- **Deploy**: Docker + Nginx (see repo root configs)

## Prerequisite

- Node.js 20+

## Scripts

```bash
npm install
npm run dev        # Vite on :9001 (see package.json)
npm run server     # API on :9002
npm run build
npm run lint
npm test           # server analytics allowlist tests
```

## Product analytics

Client events POST to `/api/analytics/event` and are stored in MongoDB collection `analytics_events` (see `server/analytics.js`). Attribution keys are captured once per session from query parameters when present (`src/utils/attribution.ts`).

## Crawl hints

- Public SEO surfaces include `/`, `/blog/*`, `/guides/*`, `/zodiac-guide`, `/faqs`, etc.
- Authenticated app routes use `noindex` meta where appropriate; `public/sitemap.xml` lists indexable URLs only.

## Docker & Make

Docker Compose and a `Makefile` are included for production-like workflows. Run `make help` for available commands.
