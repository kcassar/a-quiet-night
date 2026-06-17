# A Quiet Night

[aquietnight.com](https://www.aquietnight.com) — a free, educational sleep
apnoea + CPAP web app. Built to run on Replit.

> **Educational only.** This site does not diagnose, prescribe, or recommend
> pressure changes. Any therapy decision belongs with a qualified sleep
> clinician.

## What's in the box

- **React + TypeScript** frontend (Vite, React Router, Recharts).
- **Node.js + Express + TypeScript** backend.
- **SQLite** (via `better-sqlite3`) for night summaries and journal entries.
- **Modular CPAP parsers** under `server/src/parsers/`. The MVP ships a
  working OSCAR CSV parser plus detection-only stubs for ResMed, Philips and
  Fisher & Paykel.
- **Secure ZIP handling** with zip-slip protection, executable rejection,
  zip-bomb defence, and per-IP rate limiting.
- **PDF + CSV export** of the dashboard, designed to be printed for a clinician.
- **Affiliate products page** loaded from an editable JSON file.

## Running on Replit

Replit detects `.replit` and `replit.nix` automatically. The first run
installs dependencies for the root, server and client and then builds the
client. Press **Run** and you'll get a single Node process serving both the
API and the built React app on port 3000 (mapped to 80 externally).

If you'd rather run it manually:

```bash
npm run install:all
npm run build
npm run start
```

The server listens on `PORT` (default 3000).

## Running locally for development

In two terminals:

```bash
# terminal 1: API on :3000
npm install --prefix server
npm run dev --prefix server

# terminal 2: Vite dev server on :5173 (proxies /api -> :3000)
npm install --prefix client
npm run dev --prefix client
```

Then open `http://localhost:5173`.

## Configuration

Copy `.env.example` to `.env` and tweak as needed. The app boots with sane
defaults if you skip this.

| Var | Default | Purpose |
| --- | --- | --- |
| `PORT` | 3000 | HTTP port |
| `UPLOAD_TMP_DIR` | `./data/uploads` | Where multer writes uploaded ZIPs |
| `EXTRACT_TMP_DIR` | `./data/extracted` | Where ZIPs are extracted |
| `DB_PATH` | `./data/app.db` | SQLite file |
| `MAX_UPLOAD_BYTES` | 250 MB | Hard size limit on uploads |
| `MAX_DECOMPRESSED_BYTES` | 1 GB | Zip-bomb defence |
| `MAX_ZIP_ENTRIES` | 20,000 | Caps number of files in a ZIP |
| `UPLOAD_RATE_WINDOW_MS` | 15 min | Rate-limit window |
| `UPLOAD_RATE_MAX` | 10 | Uploads per IP per window |

Storage paths are not under the public web root and uploaded ZIPs are
deleted immediately after parsing (the extracted folder is only kept if
the user explicitly opts in on the upload form).

## Data the app stores

- **Per-night summary metrics** (date, AHI, usage, leak, pressure...) so
  the dashboard reloads on a return visit.
- **Journal entries** the user creates in the journal page.
- **Nothing else.** The original ZIP and extracted SD-card folder are
  deleted by default. We don't log filenames or any free-text health data.

## Adding a new CPAP parser

1. Create `server/src/parsers/myMachineParser.ts` exporting an object that
   matches the `CpapParser` interface in `parsers/types.ts`.
2. Implement `detect(rootDir, allFiles)` (cheap structural check) and
   `parse(rootDir, allFiles)` returning `NightSummary[]`.
3. Add the parser to the array in `server/src/parsers/index.ts`. Order
   matters — the first parser whose `detect` returns true is used.

## Editing affiliate products

Edit `server/src/data/products.json`. Each entry has an `active` flag and
both `affiliate_url` and `fallback_url`. No DB migration is needed — the
products endpoint reads the file fresh on each request.

## API surface

| Route | Purpose |
| --- | --- |
| `POST /api/upload` | Accept a single `.zip` (multipart, field `file`). Requires `consent=true`. |
| `GET  /api/upload/:id/status` | Processing status. |
| `GET  /api/upload/:id/summary` | Therapy summary + flags. |
| `GET  /api/upload/:id/nights` | Raw per-night rows. |
| `GET  /api/upload/:id/export/csv` | CSV export. |
| `GET  /api/upload/:id/export/pdf` | Print-friendly PDF report. |
| `POST /api/journal` | Add a journal entry. |
| `GET  /api/journal` | List recent entries. |
| `GET  /api/products` | Affiliate products (filterable by `category`, `tag`). |
| `GET  /api/glossary` | Glossary used on the Resources page. |

## SEO and search engine notification

The site ships with strong baseline SEO:

- Per-page `<title>`, `<meta name="description">`, canonical link, Open
  Graph and Twitter Card tags — set via the `useDocumentMeta` hook in
  `client/src/lib/useDocumentMeta.ts`.
- JSON-LD structured data (`WebSite` + `Organization`) in `index.html`.
- `robots.txt` and `sitemap.xml` in `client/public/`.
- Server returns HTTP **404** for unknown SPA routes (so typos and link
  rot don't become indexable soft-200s) and the `NotFound` page sets
  `noindex, nofollow`.

### Notifying search engines after a deploy

Google deprecated their `/ping?sitemap=` endpoint in 2023, so the modern
path is the [IndexNow](https://www.indexnow.org/) protocol — used by Bing,
Yandex, Naver and Seznam. For Google, submit the sitemap once via Search
Console; it will recrawl from the link in `robots.txt`.

To submit:

```bash
npm run notify
```

That reads `client/public/sitemap.xml`, picks up the IndexNow key from
`client/public/<key>.txt` (already generated and committed), and POSTs the
URL list to `https://api.indexnow.org/indexnow`. Run it after every deploy
where you've changed page content or added new routes.

If you ever rotate the key, drop a new `<newkey>.txt` file in
`client/public/` containing exactly that key string and delete the old
file. The script auto-discovers any matching key file.

## Limits and intentional omissions

The MVP deliberately does **not** implement:

- Clinician messaging or live consultation.
- Automated medical recommendations.
- Pressure-change suggestions.
- Paid subscriptions.
- Full binary parsers for ResMed / Philips / F&P SD-card data — those
  formats are detected but require dedicated parsers.

The app may explain data, but it must not tell the user to change
pressure settings. All wording uses *“discuss with your clinician.”*
