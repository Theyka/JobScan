# JobScan (Vakanso) — Project Reference

Azerbaijan IT job market intelligence platform. Aggregates vacancies from **JobSearch.az** and **Glorri.com**, deduplicates them, extracts tech stacks, and serves a web UI + Telegram bot.

---

## Monorepo Structure

```
/
├── backend/        Python scraper + scheduler + Telegram bot
├── frontend/       Next.js 15 web app (App Router)
├── database/       SQL migration files (Supabase)
└── AGENTS.md
```

---

## Backend (`backend/`)

**Entry point:** `main.py` — starts interval scraper, daily Telegram digest scheduler, and Telegram bot polling in background threads.

**Deployment:** nixpacks (`nixpacks.toml`) → `python3 main.py`. Targets Railway/Render.

### App structure

| Path | Role |
|------|------|
| `app/config.py` | Reads all env vars into a `Settings` dataclass. Fails fast if `FRONTEND_BASE_URL` is missing. |
| `app/controllers/scrape_controller.py` | `ScrapeController.run_cycle()` — orchestrates one full scrape: JobSearch → Glorri → deduplication. |
| `app/services/jobsearch_service.py` | Scrapes `jobsearch.az` (category 1076 = IT). 4 workers for listing, 40 for details. Strips dangerous HTML. |
| `app/services/glorri_service.py` | Scrapes `jobs.glorri.com`. Rate-limit: 429 → retry 6× with 30 s wait. 16 concurrent detail workers. |
| `app/services/duplicate_detection_service.py` | ML-style similarity scoring. Final threshold: ≥ 0.72. Writes matches to `duplicate_jobs` table. |
| `app/services/technology_service.py` | Regex word-boundary matching against 90+ tech keywords. See `app/models/technologies.py` for the dictionary. |
| `app/services/telegram_service.py` | Sends N latest jobs digest to a Telegram channel. |
| `app/services/telegram_bot_service.py` | Interactive user bot (multilingual: AZ/EN/RU). Users pick tech preferences; daily digest filtered by their stack. |
| `app/repositories/supabase_repository.py` | All Supabase REST calls. Batch inserts chunked in groups of 80–500 to avoid URL-length limits. Uses `SUPABASE_SERVICE_KEY`. |
| `app/scheduler/interval_scheduler.py` | Calls `task()` every N seconds (default 600). |
| `app/scheduler/daily_scheduler.py` | Calls `task()` once per day at a configured time with timezone awareness. |
| `app/models/technologies.py` | `TECHNOLOGIES` dict mapping canonical name → keyword variants. Edit here to add/remove tracked techs. |

### Backend env vars

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | — | Service-role key (write access) |
| `FRONTEND_BASE_URL` | ✅ | — | Used in vacancy links (e.g. Telegram messages) |
| `SCRAPE_TIME_INTERVAL` | | 600 | Seconds between scrape cycles |
| `TELEGRAM_BOT_TOKEN` | | — | Bot API token |
| `TELEGRAM_CHANNEL_ID` | | — | Channel for digest |
| `TELEGRAM_THREAD_ID` | | None | Message thread (optional) |
| `TELEGRAM_BOT_USERNAME` | | — | `@botname` |
| `TELEGRAM_DIGEST_TIME` | | 09:00 | HH:MM daily digest time |
| `TELEGRAM_TIMEZONE` | | Asia/Baku | Timezone for scheduling |
| `TELEGRAM_DIGEST_LIMIT` | | 5 | Max jobs per channel digest |

---

## Frontend (`frontend/`)

**Framework:** Next.js 15, App Router, TypeScript, React 19, Tailwind CSS v4.

**Fonts:** Manrope (primary), IBM Plex Mono (monospace).

**Image domains allowed** (next.config.ts): `jobsearch.az`, `jobs.glorri.com`, `glorri.s3.amazonaws.com`.

### Routes

| Route | File | Notes |
|-------|------|-------|
| `/` | `app/page.tsx` → `LandingPage.tsx` | Server fetches data, passes to client component |
| `/auth` | `app/auth/page.tsx` | Redirects to `/auth/login` |
| `/auth/login` | `app/auth/login/page.tsx` | Email + password, uses `loginAction` |
| `/auth/register` | `app/auth/register/page.tsx` | Collects first_name, last_name, username, email, password |
| `/profile` | `app/profile/page.tsx` | Protected. Shows `ProfileForm`. |
| `/admin` | `app/admin/page.tsx` | Protected (`is_admin` flag). Analytics dashboard. |
| `/admin/export` | `app/admin/export/page.tsx` | CSV export preview |
| `/admin/export/download` | `app/admin/export/download/route.ts` | Streams CSV download |
| `/admin/user` | `app/admin/user/page.tsx` | User management |
| `/vacancies/[source]/[slug]` | `app/vacancies/[source]/[slug]/page.tsx` | Vacancy detail. Increments visit counter. |
| `GET /track/click` | `app/track/click/route.ts` | Logs click, redirects to external URL |

### Key lib files

| File | Purpose |
|------|---------|
| `lib/landing-data.ts` | Server: fetches js_vacancies + glorri_vacancies + duplicate_jobs, merges, returns `LandingData` |
| `lib/vacancy-detail-data.ts` | Server: fetches single vacancy by source + slug |
| `lib/vacancy-visit-tracker.ts` | Server: calls Supabase RPC `increment_vacancy_visit()`. Deduplicates per IP per day. |
| `lib/site-config.ts` | Single source for branding (SITE_NAME, SITE_URL, CREATOR_NAME, etc.) from env |
| `lib/supabase/server.ts` | Cookie-based server client (SSR) |
| `lib/supabase/client.ts` | Browser client (public anon key) |
| `lib/supabase/admin.ts` | Admin client with service key (used for RPC, privileged writes) |
| `lib/admin/analytics.ts` | Builds `AdminAnalyticsData` from vacancy_visits + vacancy_clicks |
| `lib/admin/access.ts` | `getCurrentUserAccess()` → checks `profiles.is_admin` |
| `lib/admin/jobs-export.ts` | CSV generation |
| `lib/admin/user-management.ts` | User CRUD |

### Components

| Component | Purpose |
|-----------|---------|
| `components/landing/FiltersSidebar.tsx` | Tech/company/salary/source filters. Mobile-responsive sidebar. |
| `components/landing/JobsSection.tsx` | Job cards grid, pagination, sort, page-size selector |
| `components/landing/LandingTopBar.tsx` | Logo, theme toggle, auth links |
| `components/landing/Chart.tsx` | SVG line chart for admin trend data |
| `components/landing/SourceBreakdown.tsx` | JobSearch / Glorri / overlap stats |
| `components/landing/StatsCards.tsx` | Key metric cards |
| `components/admin/AdminSectionNav.tsx` | Admin section navigation |
| `components/admin/CSVPreviewTable.tsx` | Admin export table preview |
| `components/shared/SiteHeader.tsx` | App-wide header with auth state + theme toggle |
| `components/shared/Footer.tsx` | Links to repo, license, creator |
| `components/shared/CustomDatePicker.tsx` | Date input for analytics filters |

### Frontend env vars

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (browser-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service key (server-only, never expose to client) |
| `NEXT_PUBLIC_SITE_NAME` | Branding (e.g. "Vakanso") |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Meta description |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL |

---

## Database (`database/`)

Managed via Supabase. Migration files are numbered and applied manually.

| File | Creates |
|------|---------|
| `001_create_profiles.sql` | `profiles` table (extends auth.users: username, first_name, last_name, is_admin) |
| `003_unique_visits_per_ip_per_day.sql` | `vacancy_visits` table + `increment_vacancy_visit()` RPC. PK deduplicates per source/vacancy/day/IP. |
| `004_create_vacancy_clicks.sql` | `vacancy_clicks` table (source, vacancy_id, slug, visitor_hash, target_url) |

### Tables created by the scraper (not in migration files)

| Table | Key columns |
|-------|-------------|
| `js_vacancies` | id, title, slug, company_id, salary, deadline_at, text, tech_stack (JSONB) |
| `js_companies` | id, title, logo, logo_mini |
| `glorri_vacancies` | id, title, slug, postedDate, text, vacancy_about (JSONB), benefits (JSONB), tech_stack (JSONB), company_id |
| `glorri_companies` | id, slug, name, logo |
| `duplicate_jobs` | glorri_id (PK), jobsearch_id, score, matched_at |

All data tables use RLS: **public read, service_role write only**.

### IP hashing convention

- `vacancy_visits`: MD5 hash (via Supabase RPC)
- `vacancy_clicks`: SHA-256 hash (via Next.js route handler)

---

## Conventions & Rules

### General
- This is a monorepo. Backend and frontend are completely independent — do not mix their dependencies.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_KEY` in client-side code or `NEXT_PUBLIC_*` env vars.
- Branding name is **Vakanso**; the repo/platform name is **JobScan**.

### Backend
- All Supabase access goes through `SupabaseRepository`. Do not call the Supabase REST API directly elsewhere.
- When adding a new technology to track, add it only to `app/models/technologies.py` → `TECHNOLOGIES` dict.
- Scraper services must handle pagination fully — never assume a single page.
- Rate-limit handling pattern: catch HTTP 429, sleep 30 s, retry up to 6 times.
- HTML sanitization is required before storing job text (allowlist of safe tags only).

### Frontend
- Use `lib/supabase/server.ts` for any server component or server action Supabase access.
- Use `lib/supabase/admin.ts` only for privileged operations (RPC calls, service-role writes).
- Use `lib/supabase/client.ts` only in client components.
- Admin-only pages must call `getCurrentUserAccess()` and `redirect('/')` if not admin.
- Vacancy clicks must go through `/track/click?target=...` — never link directly to external vacancy URLs.
- Site-wide branding must come from `lib/site-config.ts`, not hardcoded.
- Theme (dark/light) is stored in `localStorage` and applied via inline script in `layout.tsx` to prevent FOUT.
- Do not add new image domains to `next.config.ts` without also handling potential misuse.

### Data flow
- Homepage data path: `lib/landing-data.ts` (server) → `app/page.tsx` (server component) → `LandingPage.tsx` (client component).
- Vacancy detail path: `lib/vacancy-detail-data.ts` → `app/vacancies/[source]/[slug]/page.tsx`.
- Analytics path: `lib/admin/analytics.ts` → `app/admin/page.tsx`.

---

## Build & Run

### Backend
```bash
cd backend
pip install -r requirements.txt
python3 main.py
# Optional flags:
# --send-telegram-digest-now   Send channel digest immediately and exit
# --preview-telegram-digest    Print digest without sending
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
```

### Linting
```bash
cd frontend
npm run lint
```
