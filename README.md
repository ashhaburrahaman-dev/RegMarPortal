# Marriage Registry Portal

A **production-ready, private marriage certificate management system** for a Muhammadan Marriage Registration Office. Staff-only portal with role-based access control, D1 database, PDF certificate generation, and KV-cached pincode lookups.

```
┌─────────────┐     push to main     ┌──────────────────┐
│   GitHub    │ ──────────────────►  │  GitHub Actions  │
│  (monorepo) │                      └────────┬─────────┘
└─────────────┘                               │
                                    ┌─────────┴─────────┐
                                    │                   │
                               deploy                deploy
                                    │                   │
                            ┌───────▼──────┐   ┌───────▼──────┐
                            │  CF Workers  │   │   CF Pages   │
                            │  (Hono API)  │   │ (React + Vite)│
                            └───────┬──────┘   └──────────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                  │
            ┌─────▼────┐    ┌──────▼─────┐   ┌──────▼─────┐
            │  CF D1   │    │   CF R2    │   │   CF KV    │
            │(SQLite)  │    │(Cert BG img)│   │(Pincode cache)│
            └──────────┘    └────────────┘   └────────────┘
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20.0.0 |
| pnpm | ≥ 9.0.0 |
| Wrangler CLI | ≥ 3.0.0 |
| Cloudflare account | Free tier works |
| GitHub account | For CI/CD |

```bash
npm install -g pnpm@latest
npm install -g wrangler@latest
```

---

## 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/RegMarPortal.git
cd RegMarPortal
pnpm install
pnpm --filter @regmar/shared build
```

---

## 2. Cloudflare Resource Setup

```bash
wrangler login

# Create D1 database — copy the database_id from output
wrangler d1 create marriage-registry

# Create R2 bucket
wrangler r2 bucket create marriage-assets

# Create KV namespace — copy the id from output
wrangler kv:namespace create PINCODE_CACHE

# Set JWT secret (generate a random 32+ char string)
wrangler secret put JWT_SECRET --name marriage-worker
```

> **Update `apps/worker/wrangler.toml`** with the `database_id` and KV `id` from the above commands.

---

## 3. Upload Certificate Background Image

Place your certificate background PNG at `apps/worker/assets/certificate-bg.png`, then:

```bash
wrangler r2 object put marriage-assets/certificate-bg.png \
  --file=apps/worker/assets/certificate-bg.png \
  --content-type=image/png
```

---

## 4. Database Setup

```bash
# Generate migration SQL (from drizzle schema)
pnpm --filter @regmar/worker db:generate

# Apply migrations locally (for dev)
wrangler d1 migrations apply marriage-registry --local

# Apply migrations remotely (production)
wrangler d1 migrations apply marriage-registry --remote

# Generate bcrypt password hashes
node apps/worker/scripts/generateHash.mjs
```

> Copy the output hashes into `apps/worker/scripts/seed.sql`, replacing the placeholder values.

```bash
# Seed the database with admin and operator users
wrangler d1 execute marriage-registry --remote \
  --file=apps/worker/scripts/seed.sql
```

---

## 5. Local Development

Create `apps/client/.env.local`:
```
VITE_API_BASE_URL=http://localhost:8787/api/v1
```

Run both services:
```bash
# Terminal 1 — Worker API
pnpm --filter @regmar/worker dev
# → http://localhost:8787

# Terminal 2 — React client
pnpm --filter @regmar/client dev
# → http://localhost:5173
```

---

## 6. GitHub Actions Setup

1. Push the repo to GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Add these secrets:

| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token (Workers, Pages, D1, R2, KV permissions) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `VITE_API_BASE_URL` | `https://marriage-worker.YOUR_ACCOUNT.workers.dev/api/v1` |

Every push to `main` automatically deploys:
- `apps/worker/**` changes → deploys Worker (runs D1 migrations first)
- `apps/client/**` changes → builds and deploys Pages

---

## 7. Default Credentials

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `Admin@1234` |
| Operator | `operator` | `Oper@1234` |

> ⚠️ **Change these immediately after first login using `wrangler d1 execute` with a new seed.**

---

## 8. Application Features

### Authentication
- HTTP-only JWT cookie (8h session)
- CSRF double-submit cookie protection
- Account lockout after 5 failed attempts (15 min)
- Login audit log in D1

### Marriage Records
- Create, view, edit marriage registrations
- Auto-generated memo numbers (`BookNo/PageNo/Year`)
- Memo uniqueness validation (server + client)
- Dower amount with CASH / DEFERRED payment tracking

### Party Details (5 persons per record)
- Groom, Bride, Wakil, Witness 1, Witness 2
- Pincode auto-lookup (KV-cached, 7-day TTL)
- Post Office dropdown from pincode API
- Auto-filled State & District

### Certificate PDF
- A4 PDF generated server-side with pdf-lib
- Background image from R2
- Coordinate-based field placement
- Downloads via blob with proper filename

### Search & List
- Paginated list with sort (date/memo)
- Live search by memo/groom/bride
- Advanced search: all fields simultaneously

### Roles
| Feature | ADMIN | OPERATOR |
|---|---|---|
| View | ✅ | ✅ |
| Create | ✅ | ✅ |
| Edit | ✅ | ✅ |
| Delete | ✅ | ❌ |
| Download PDF | ✅ | ✅ |

---

## 9. Project Structure

```
/
├── .github/workflows/          CI/CD pipelines
├── apps/
│   ├── worker/                 Cloudflare Worker (Hono.js API)
│   │   ├── src/
│   │   │   ├── index.ts        App entry point
│   │   │   ├── routes/         Auth, marriages, memo, pincode, pdf
│   │   │   ├── middleware/     requireAuth, requireRole, csrfProtect
│   │   │   ├── services/       Business logic layer
│   │   │   ├── db/             Drizzle schema + client
│   │   │   └── lib/            JWT, password, CSRF utilities
│   │   ├── migrations/         D1 SQL migrations
│   │   └── scripts/            Seed + hash generation
│   └── client/                 React 19 + Vite (Cloudflare Pages)
│       └── src/
│           ├── routes/         File-based routes (TanStack Router)
│           ├── components/     UI, layout, forms, dashboard
│           ├── hooks/          useAuth, usePincode, useMemoValidation
│           └── lib/            API client, QueryClient, utilities
└── packages/shared/            Zod schemas used by both apps
```

---

## 10. Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TanStack Router, TanStack Query v5 |
| Styling | Tailwind CSS v4, shadcn/ui (Radix primitives) |
| Backend | Cloudflare Workers, Hono.js v4 |
| ORM | drizzle-orm + drizzle-kit |
| Auth | jose (JWT), bcryptjs, HTTP-only cookies |
| PDF | pdf-lib (coordinate-based, pure JS) |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Cache | Cloudflare KV |
| Validation | Zod (shared schemas) |
| CI/CD | GitHub Actions + Wrangler |
| Monorepo | pnpm workspaces + Turborepo |
