# CiNect (cinema-web-next)

Next.js frontend for the cinema booking platform. Part of the **CiNect** multi-repo setup:

- **cinect-frontend** - This frontend
- **cinect-spring-backend** - Spring Boot API (port 8081)
- **cinect-nest-backend** - NestJS API (port 3001)

The frontend is **backend-agnostic** and can auto-detect running backend (`3001` or `8081`) when `NEXT_PUBLIC_API_BASE_URL` is not set.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS, Radix UI, shadcn/ui
- **State/Data:** TanStack Query (React Query)
- **Forms:** React Hook Form, Zod
- **i18n:** next-intl
- **Icons:** Lucide React

## Prerequisites

- **Node.js** 20 or higher
- **pnpm** (recommended) or npm

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd cinect-frontend
pnpm install
```

### 2. Environment variables

Copy the example env and adjust if needed:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Optional: force Spring or Nest explicitly
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8081/api/v1
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

### 3. Development

```bash
pnpm dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable                   | Description                  | Default                        |
| -------------------------- | ---------------------------- | ------------------------------ |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for the backend API (optional) | Auto-detect (`3001` or `8081`) |

Example `.env.example`:

```env
# Optional backend API base URL (no trailing slash)
# Spring Boot: http://localhost:8081/api/v1
# NestJS:      http://localhost:3001/api/v1
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8081/api/v1
```

## Scripts

| Script            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `pnpm dev`        | Start dev server (uses `.env.local` or default API)           |
| `pnpm dev:spring` | Dev server with Spring Boot at `http://localhost:8081/api/v1` |
| `pnpm dev:node`   | Dev server with NestJS at `http://localhost:3001/api/v1`      |
| `pnpm build`      | Production build                                              |
| `pnpm start`      | Start production server                                       |
| `pnpm lint`       | Run ESLint                                                    |
| `pnpm typecheck`  | Run TypeScript check                                          |
| `pnpm format`     | Format code with Prettier                                     |

## Backend Context

- **Spring Boot** (port 8081): Uses `cinect_spring` database
- **NestJS** (port 3001): Uses `cinect_node` database

The frontend only depends on `NEXT_PUBLIC_API_BASE_URL` and does not assume a specific backend.

## Project Structure

```
cinect-frontend/
├── app/
│   ├── [locale]/           # Internationalized routes
│   │   ├── (public)/       # Public pages (movies, cinemas, etc.)
│   │   ├── (auth)/         # Login, register, reset password
│   │   ├── (account)/      # User account
│   │   └── (admin)/        # Admin panel
│   ├── layout.tsx
│   └── ...
├── components/
│   ├── layout/             # Header, Footer, etc.
│   ├── ui/                 # shadcn components
│   └── shared/             # Reusable components
├── hooks/                  # React hooks, TanStack Query
├── lib/                    # API client, schemas, utils
├── messages/               # i18n (en.json, vi.json)
├── types/                  # TypeScript types
└── ...
```
