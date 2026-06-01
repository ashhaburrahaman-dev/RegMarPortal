# Marriage Certificate Management System — RegMar Portal

A **private, login-gated, localhost** office portal for a Muhammadan Marriage Registration Office.

Stores marriage registration records in MySQL, generates printable PDF certificates, and provides role-based access (ADMIN / OPERATOR).

---

## Prerequisites

- **Node.js** 20+ LTS
- **pnpm** 9+  →  `npm install -g pnpm`
- **MySQL 8** or **MariaDB 11** (local install)

---

## 1. MySQL Setup

```sql
CREATE DATABASE marriage_registry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'marriageapp'@'localhost' IDENTIFIED BY 'strongpassword';
GRANT ALL PRIVILEGES ON marriage_registry.* TO 'marriageapp'@'localhost';
FLUSH PRIVILEGES;
```

---

## 2. Installation

```bash
# Install all workspace dependencies
pnpm install

# Build shared schemas package
pnpm --filter shared build
```

---

## 3. Server Setup

```bash
cd apps/server
cp .env.example .env
# Edit .env with your MySQL credentials (DATABASE_URL, JWT_SECRET, etc.)

# Run Prisma migrations
pnpm prisma migrate dev --name init

# Seed default users
pnpm prisma db seed
```

---

## 4. Client Setup

```bash
cd apps/client
cp .env.example .env
# Verify VITE_API_BASE_URL=http://localhost:3001/api/v1
```

---

## 5. Running (Development)

Open **two terminals**:

```bash
# Terminal 1 — API server (port 3001)
pnpm --filter server dev

# Terminal 2 — React client (port 5173)
pnpm --filter client dev
```

Or run both concurrently from root:

```bash
pnpm dev
```

---

## 6. Running (Production with PM2)

```bash
# Build server
pnpm --filter server build

# Build client
pnpm --filter client build

# Start server via PM2
pm2 start apps/server/dist/index.js --name marriage-server

# Serve client build (e.g. with serve or nginx)
npx serve apps/client/dist -p 5173
```

---

## 7. Default Credentials

| Role     | Username   | Password     |
|----------|------------|--------------|
| ADMIN    | `admin`    | `Admin@1234` |
| OPERATOR | `operator` | `Oper@1234`  |

> ⚠️ **Change these immediately after first login** by updating the DB directly or via an admin panel.

---

## 8. Project Structure

```
/
├── apps/
│   ├── server/          ← Fastify v5 API (Node.js 20, TypeScript, ESM)
│   └── client/          ← React 19 + Vite 6 frontend
├── packages/
│   └── shared/          ← Shared Zod schemas + TypeScript types
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## 9. Certificate Background Image

Place your official certificate template at:

```
apps/server/assets/certificate-bg.png
```

A placeholder PNG is auto-generated on first run. PDF field coordinates are configured in:

```
apps/server/src/config/pdfCoordinates.ts
```

---

## 10. Environment Variables

### `apps/server/.env`

| Variable            | Description                                  |
|---------------------|----------------------------------------------|
| `DATABASE_URL`      | MySQL connection string                       |
| `JWT_SECRET`        | ≥32 char secret for JWT signing              |
| `COOKIE_SECRET`     | ≥32 char secret for signed cookies           |
| `ALLOWED_ORIGIN`    | Frontend URL (default: http://localhost:5173) |
| `BCRYPT_SALT_ROUNDS`| Password hashing rounds (default: 12)        |
| `ASSETS_PATH`       | Path to certificate background image folder  |

### `apps/client/.env`

| Variable              | Description                |
|-----------------------|----------------------------|
| `VITE_API_BASE_URL`   | Backend API base URL       |

---

## 11. Security Notes

- JWT stored in **HTTP-only cookie** (not localStorage)
- **CSRF double-submit cookie** pattern for all mutations
- **Brute-force lockout** after 5 failed logins (15 min)
- All routes are **authenticated** — no public endpoints
- Role-based access: OPERATOR cannot delete; only ADMIN can
