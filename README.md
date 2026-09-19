# C-SPEK MOTORS LTD — Dealership Website + Admin Dashboard

Full-stack website and management system for **C-SPEK MOTORS LTD**, an automobile
dealership in Lagos, Nigeria selling cars, SUVs, trucks, trailers, buses, vans and
other commercial vehicles.

- **Public website** — hero, featured vehicles, category browsing, vehicle gallery,
  vehicle details, about, contact, enquiry forms, WhatsApp integration, full SEO.
- **Admin dashboard** (`/admin`) — vehicles, categories, media library, enquiries,
  contact messages, settings, users and audit logs. Every field on the site is
  managed from the dashboard; nothing is hardcoded.

> **Current sales model** — prices and full specifications are **not** shown on the
> public website. Visitors see categories plus photos/videos and are invited to
> *Contact for Details* (phone, WhatsApp or enquiry form). Prices and specifications
> are still fully editable in the admin dashboard for when you decide to show them.

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Framework  | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling    | Tailwind CSS 4 + shadcn/ui + Lucide icons |
| Database   | SQLite (dev) via Prisma ORM — portable to PostgreSQL |
| Auth       | JWT (jose) in an HTTP-only cookie, bcrypt password hashing |
| Uploads    | Local `uploads/` folder served through `/api/files/*` |
| Validation | Zod on every API input |
| SEO        | Dynamic metadata, Schema.org JSON-LD, sitemap.xml, robots.txt |

---

## Quick Start (run on your local machine)

### 1. Requirements

- **Node.js 20+** (or [Bun](https://bun.sh))
- npm (comes with Node) — Bun is optional but faster

### 2. Install dependencies

```bash
npm install
# or: bun install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`:

```env
DATABASE_URL=file:./db/custom.db      # SQLite — works out of the box
JWT_SECRET=change-me-to-a-long-random-string
APP_URL=http://localhost:3000
COMPANY_WHATSAPP_NUMBER=2348039552546
```

> `JWT_SECRET` — generate one with `openssl rand -base64 48`.

### 4. Create the database (fresh install only)

The download already includes a ready database (`db/custom.db`) with demo data.
To start from scratch instead:

```bash
npm run db:push      # creates the SQLite database from prisma/schema.prisma
npm run db:seed      # seeds admin user, categories, demo vehicles, settings
# or with Bun: bun run scripts/seed.ts
```

### 5. Start the development server

```bash
npm run dev
# or: bun run dev
```

Open **http://localhost:3000** — the public website.

Open **http://localhost:3000/admin** — the admin dashboard.

### Default admin login

| Field    | Value                   |
|----------|-------------------------|
| URL      | `http://localhost:3000/admin/login` |
| Email    | `admin@cspekmotors.com` |
| Password | `Cspek@2026`            |

> Change this password in **Admin → Users** before going live.

---

## Production build

The production build does not modify the database. Apply schema changes and seed a new database explicitly before the first deployment:

```bash
npm run db:setup
npm run build
npm run start
```

Do not run `npm run db:push -- --accept-data-loss` against a populated production database. Review and migrate existing data before applying schema changes.

Set `NODE_ENV=production`, a strong `JWT_SECRET` and the real `APP_URL`
(e.g. `https://cspekmotors.com`) in the environment before starting.

---

## How uploads work (no cloud storage)

All media uploaded from the admin dashboard is written to the **`uploads/` folder
inside the project**:

```
uploads/
├── vehicles/     vehicle photos & videos
├── categories/   category media
├── enquiries/    customer enquiry attachments
├── site/         logos and site assets uploaded from Settings
├── seed/         demo images used by the seed script
└── README.txt
```

- Files are served back through `GET /api/files/<folder>/<filename>` with HTTP
  range support (video seeking works).
- Large images are automatically resized/compressed (max width 1920px).
- Uploads are served through the app and are not automatically committed to Git.
  Configure `UPLOAD_DIR` to point to persistent storage in production.
- Optional: set `UPLOAD_DIR=/absolute/path` in `.env` to store uploads elsewhere.
  This is required on serverless hosts because their local filesystem is ephemeral.

---

## Deploying / pushing to GitHub

1. Create a new repository on GitHub, then:

```bash
git init
git add .
git commit -m "C-SPEK MOTORS LTD website"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo>.git
git push -u origin main
```

2. `.gitignore` already excludes `node_modules`, `.next`, logs and your real
   `.env` (`.env.example` is the committed template).

3. **Hosting options**
   - **VPS (DigitalOcean, Contabo, Hostinger…)** — clone the repo, `npm install`,
     configure `.env`, `npm run build && npm run start` behind nginx/Caddy with
     HTTPS. Best option because the `uploads/` folder and SQLite file live on a
     persistent disk.
   - **Railway / Render / Fly.io** — attach a persistent volume mounted at
     `/app/uploads` (or set `UPLOAD_DIR` to the volume path) so uploads survive
     redeploys; use their PostgreSQL add-on by changing the Prisma datasource if
     you prefer a managed DB.
   - **Vercel** — serverless filesystems are read-only, so use it only together
     with a volume-backed storage or switch the storage module to a cloud bucket
     later (the storage layer is a single file: `src/lib/storage.ts`).

---

## Company contact details (single source of truth: Admin → Settings)

| Item      | Value |
|-----------|-------|
| Address   | 18, Oguntana Crescent, Gbagada - Lagos |
| Phone 1   | 08039552546 |
| Phone 2   | 09074884438 |
| WhatsApp  | 2348039552546 (deep links via `wa.me`) |

Everything (navbar, footer, contact page, about page, structured data, WhatsApp
links) reads from **Admin → Settings** — update it there, no code changes needed.

---

## Project structure

```
├── prisma/schema.prisma        database models (10 tables)
├── db/custom.db                SQLite database (dev)
├── uploads/                    all uploaded media (committed to the repo)
├── public/                     static assets: brand logos, favicon, og-image
├── scripts/                    seed + maintenance scripts
│   ├── seed.ts                 full database seed
│   ├── update-site-info.ts     one-off contact/admin password updater
│   └── update-settings.ts      quick settings updater
├── src/
│   ├── app/(site)/             public pages (home, vehicles, categories, about, contact, enquiry)
│   ├── app/admin/              dashboard (login + panel: vehicles, categories, media,
│   │                           enquiries, messages, users, audit-logs, settings)
│   ├── app/api/                REST API routes (public + admin + auth + files)
│   ├── components/site/        public website components
│   ├── components/admin/       dashboard components
│   └── lib/                    auth, storage, validation, WhatsApp, settings, audit…
└── .env.example                environment template
```

## Useful scripts

| Command                | What it does |
|------------------------|--------------|
| `npm run dev`          | Start development server on port 3000 |
| `npm run build` / `npm run start` | Production build / run |
| `npm run db:push`      | Sync `prisma/schema.prisma` to the database |
| `npm run db:seed`      | Seed demo data (idempotent — safe to re-run) |
| `npm run lint`         | ESLint |

## Security notes

- Passwords are bcrypt-hashed; sessions are JWTs in HTTP-only, SameSite cookies.
- All admin routes require authentication; `SUPER_ADMIN` is needed for user
  management.
- Mutating endpoints are protected by a CSRF origin check and in-memory rate
  limiting (e.g. login: 8 attempts / 10 min per IP).
- If the site runs behind a proxy with a different public domain, add it to
  `ALLOWED_ORIGINS` in `.env` (comma-separated).
- Never commit your real `.env` with a production `JWT_SECRET`.
