# A Quiet Night — tech stack

A free, educational sleep apnoea + CPAP web app at
[www.aquietnight.com](https://www.aquietnight.com). Single-process Express
backend serving a React + TypeScript SPA, with a modular CPAP-data parser
pipeline behind it and SQLite for storage. Runs on Replit out of the box.

## Frontend (`client/`)

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | **React 18.3** | SPA |
| Language | **TypeScript 5.6** (strict) | |
| Bundler / dev server | **Vite 5.4** | HMR on `:5173`, proxies `/api/*` → `:3000` |
| Routing | **React Router 6.26** | Client-side; per-page meta via a custom `useDocumentMeta` hook (no react-helmet) |
| Charts | **Recharts 2.13** | Lines, bars, reference areas/lines for the beginner shaded band |
| Type fonts | **Fraunces + Inter** | Google Fonts; allowed by the server CSP |

## Backend (`server/`)

| Layer | Choice | Notes |
| --- | --- | --- |
| Runtime | **Node.js 22** (≥ 20 fine) | |
| Language | **TypeScript 5.6** | Compiled with `tsc`; dev runs via `tsx watch` |
| HTTP framework | **Express 4.21** | Single process serves API and the built React app |
| Storage | **SQLite via `better-sqlite3` 11.3** | WAL mode, file at `data/app.db`. Schema created on boot. |
| File uploads | **`multer` 1.4** | Disk storage, 250 MB cap, `.zip` only, MIME-checked |
| ZIP extraction | **`yauzl` 3.1** | Hand-written safe extractor: zip-slip protection, exec rejection, nested-archive rejection, decompressed-size cap, entry-count cap |
| CSV parsing | **`csv-parse` 5.5** | Used by the OSCAR CSV parser |
| PDF generation | **`pdfkit` 0.15** | Therapy report export |
| Security | **`helmet` 8** + **`express-rate-limit` 7.4** | CSP locks down everything except Google Fonts; upload endpoint rate-limited |
| Env | **`dotenv` 16.4** | `.env.example` checked in |

## Data flow

- **Parsers** are plug-in modules under `server/src/parsers/` implementing a
  tiny `CpapParser` interface (`detect()` + `parse()`). The runner picks the
  first parser whose `detect()` returns true. Currently active:
  - OSCAR CSV (full)
  - OSCAR HTML report (full)
  - ResMed / Philips / Fisher & Paykel (detection-only stubs that return a
    friendly "not yet supported" message)
- **Analysis** is centralised in `server/src/lib/analysis.ts`. The `/summary`
  endpoint recomputes from the per-night rows on every request, so existing
  uploads get new metrics for free when the analytics layer changes.
- **Products + glossary** load from JSON files in `server/src/data/`.
  Editing the JSON is the deployment for new products.
- **Journal** entries store directly in SQLite (anonymous-friendly:
  `user_id` is nullable in the schema).

## Deployment / infra

| | |
| --- | --- |
| Replit | `.replit` + `replit.nix` configured for Node 20, port 3000 → 80 |
| Domain | `www.aquietnight.com` |
| SEO | `robots.txt`, `sitemap.xml`, Open Graph, Twitter cards, JSON-LD (`WebSite` + `Organization`), per-page canonical URLs |
| Search engine pings | IndexNow notifier (`scripts/notify-search-engines.mjs`), zero-dependency Node ESM, run via `npm run notify` |

## Project layout

```
sleep-apnea-site/
├── server/                Express + TypeScript API
│   ├── src/
│   │   ├── index.ts          server bootstrap (Helmet, CSP, routes, SPA fallback with 200/404 status)
│   │   ├── config.ts         env-driven config
│   │   ├── db.ts             SQLite schema (uploads, night_summaries, journal_entries, users)
│   │   ├── routes/           upload / journal / products / glossary
│   │   ├── parsers/          plug-in CPAP parsers + runner
│   │   ├── lib/              zipExtractor, analysis, exporters (PDF + CSV)
│   │   └── data/             products.json, glossary.json
├── client/                React + Vite + TypeScript
│   ├── public/               static assets (logo, robots.txt, sitemap.xml, IndexNow key, checklists)
│   └── src/
│       ├── main.tsx, App.tsx
│       ├── pages/            Home, Learn, CpapGuide, Upload, Dashboard, Journal,
│       │                     Products, Resources, About, Privacy, NotFound
│       ├── components/       Layout, MetricCard, AlertFlag, TherapyTrendChart,
│       │                     AhiDistributionChart, DayOfWeekChart, HeatCalendar,
│       │                     MilestonesCard, TrajectoryCard, DisclaimerBanner
│       ├── lib/              useDocumentMeta hook
│       ├── api.ts            typed fetch wrapper
│       └── styles/           single global.css with the design tokens
├── scripts/notify-search-engines.mjs
├── package.json              orchestrates both packages
├── BRAND_BRIEF.md
└── README.md
```

## What we deliberately don't depend on

- No CSS framework (Tailwind, etc.) — one hand-written `global.css` with
  CSS variables.
- No state library (Redux / Zustand) — local component state is enough.
- No data-fetching library (TanStack Query, SWR) — `fetch` with a tiny
  wrapper is enough at this scale.
- No SSR / Next.js — keeps deployment simple; per-page meta is handled by
  the `useDocumentMeta` hook.
- No PII logging anywhere — uploaded ZIPs and extracted folders are
  deleted by default after parsing; we only persist derived per-night
  summary numbers.

## Local development

Two-server setup with hot-reload on both:

```bash
npm run dev          # from project root — runs server (:3000) + Vite (:5173) together
```

Open **http://localhost:5173** for the dev experience.
**http://localhost:3000** runs the production-style build (rebuild with
`npm run build --prefix client` to refresh).

---

*Document up to date as of the post-Tier 1 dashboard refresh (May 2026).*
