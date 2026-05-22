# JobScan
This project is licensed under the GNU Affero General Public License v3.0 or later. By using, modifying, or distributing this software, you agree to comply with the terms of the license, which is designed to ensure that the software remains free and open for all users. Please review the [LICENSE](LICENSE) file for full details on your rights and responsibilities under this license.

## Ownership

- Created by [Theyka](https://github.com/Theyka)
- Source code: [github.com/Theyka/JobScan](https://github.com/Theyka/JobScan)
- License: GNU Affero General Public License v3.0 or later ([LICENSE](LICENSE))

## Stack

- Backend: Python, `requests`, threaded scrapers and schedulers
- Frontend: Next.js App Router, TypeScript, React, Tailwind CSS
- Database/Auth: Supabase Postgres, Supabase Auth, Supabase REST API
- Integrations: Telegram Bot API, Google Translate web endpoint for generated translations

## Prerequisites

- Python 3.11+ recommended
- Node.js 20+ recommended
- npm
- A Supabase project
- Optional: a Telegram bot token from BotFather

## Supabase Setup

Create a Supabase project, then collect these values from Project Settings:

- Project URL, for example `https://PROJECT_REF.supabase.co`
- Publishable/anon key, used by the browser and SSR clients
- Service role key, used only on the server and backend

### 1. Apply Schema

Run the single schema file in the Supabase SQL editor:

```text
database/001_initial_schema.sql
```

This file contains the full database setup: scraper tables, profiles, analytics tables, favorites, notifications, translation tables, proxies, app settings, RLS policies, visit RPC, and Telegram user settings.

### 2. Configure Auth

In Supabase Auth:

1. Enable the Email provider.
2. For local development, either disable email confirmation or make sure you can receive confirmation emails.
3. Set Site URL to the frontend URL:
   - Local: `http://localhost:3000`
   - Production: `https://your-domain.com`
4. Add redirect URLs for each frontend environment, for example:
   - `http://localhost:3000/**`
   - `https://your-domain.com/**`

Registration creates a Supabase Auth user and then upserts a matching row into `public.profiles`. The frontend server action needs `SUPABASE_SERVICE_KEY` to create/update the profile row.

### 3. Give Admin Permission To The First User

Register the first account through `/auth/register`. If email confirmation is enabled, confirm the account before logging in.

Then run this SQL snippet in the Supabase SQL editor.

```sql
update public.profiles
set is_admin = true
where id = (
  select id
  from auth.users
  where email = 'admin@example.com'
  limit 1
);
```

After the first admin is promoted, log out and back in if the admin links do not appear. Admin users can manage other users from `/admin/user`. The UI prevents an admin from removing their own admin permission.

## Frontend Configuration

Create the env file:

```bash
cd frontend
cp .env.example .env
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

NEXT_PUBLIC_SITE_NAME=Vakanso
NEXT_PUBLIC_SITE_DESCRIPTION=Corporate-grade monitoring of the Azerbaijan technology hiring market with merged vacancy coverage, source overlap, and live demand signals.
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_GTAG_ID=
```

Notes:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the browser-safe Supabase publishable/anon key.
- `SUPABASE_SERVICE_KEY` is server-only. It is used by admin pages, profile writes, click tracking, visit tracking RPC calls, proxy management, and analytics.
- `NEXT_PUBLIC_SITE_URL` should be the public frontend URL in production.
- `NEXT_PUBLIC_GTAG_ID` is optional. Leave it empty to disable Google Analytics.

Run locally:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Backend Configuration

Create the local env file:

```bash
cd backend
cp .env.example .env
```

Fill in:

```env
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

SCRAPE_TIME_INTERVAL=600

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=
TELEGRAM_THREAD_ID=
TELEGRAM_BOT_USERNAME=
TELEGRAM_DIGEST_TIME=09:00
TELEGRAM_TIMEZONE=Asia/Baku
TELEGRAM_DIGEST_LIMIT=5

FRONTEND_BASE_URL=http://localhost:3000

TRANSLATION_INTERVAL=1800
TRANSLATION_BATCH_SIZE=50
```

Notes:

- `SUPABASE_SERVICE_KEY` is required for writing scraped data. `SUPABASE_KEY` is still accepted as a legacy fallback, but prefer `SUPABASE_SERVICE_KEY`.
- `FRONTEND_BASE_URL` is required. It is used in Telegram links and should not include a trailing slash.
- `SCRAPE_TIME_INTERVAL` is seconds between scrape cycles.
- `TRANSLATION_INTERVAL` is seconds between translation batches. The default is `1800`.
- `TRANSLATION_BATCH_SIZE` defaults to `50`.

Install and run:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

Useful one-off commands:

```bash
python3 main.py --preview-telegram-digest
python3 main.py --send-telegram-digest-now
```

The backend process starts:

- the JobSearch scraper
- the Glorri scraper
- duplicate detection
- notification generation
- translation batch scheduler
- Telegram channel digest scheduler, if configured
- Telegram bot polling and personalized digest scheduler, if configured

## Telegram Configuration

Telegram is optional.

1. Create a bot with BotFather and set `TELEGRAM_BOT_TOKEN`.
2. If using channel digests, add the bot to the channel and set `TELEGRAM_CHANNEL_ID`.
3. If the channel uses forum topics, set `TELEGRAM_THREAD_ID`.
4. Set `TELEGRAM_BOT_USERNAME` to the bot username, usually without `@`.
5. No extra SQL is required for interactive user preferences; `database/001_initial_schema.sql` already creates `telegram_user_settings`.

Channel and personalized digests use:

- `TELEGRAM_DIGEST_TIME`, default `09:00`
- `TELEGRAM_TIMEZONE`, default `Asia/Baku`
- `TELEGRAM_DIGEST_LIMIT`, default `5`

If `TELEGRAM_BOT_TOKEN` is missing, bot polling is disabled. If `TELEGRAM_CHANNEL_ID` is missing, channel digest sending is disabled.

## Translations And Proxies

Currently translations does not work.

## Technology Tracking

Tracked technologies live in:

```text
backend/app/models/technologies.py
```

To add or remove a tracked technology, edit only the `TECHNOLOGIES` dictionary. The extractor matches canonical names against keyword variants with regex word boundaries.

## Deployment Notes

Backend:

- `backend/nixpacks.toml` starts the worker with `python3 main.py`.
- Set backend env vars in Railway/Render or your worker platform.
- The backend is a long-running process, not an HTTP server.

Frontend:

- Deploy `frontend/` as the Next.js app.
- Set all frontend env vars in the hosting provider.
- Keep `SUPABASE_SERVICE_KEY` server-only.
- Set `NEXT_PUBLIC_SITE_URL` to the deployed frontend URL.
- Set backend `FRONTEND_BASE_URL` to the same deployed frontend URL.
