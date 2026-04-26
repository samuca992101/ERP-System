# ERP Inteligente Simplificado

## Overview

A complete ERP (Enterprise Resource Planning) web system for small businesses with inventory control, sales management, and AI-powered demand forecasting.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Recharts + Wouter
- **Backend**: Express 5 + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (bcryptjs + jsonwebtoken)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Features

1. **Authentication** — Login/Register with JWT tokens, protected routes
2. **Dashboard** — Real-time summary cards + Recharts charts (weekly sales, top products, stock evolution)
3. **Products** — Full CRUD with name, category, price, current stock, minimum stock
4. **Sales** — Register sales (reduces stock), view sales history
5. **AI Forecast** — Moving average demand prediction with trend analysis and restock suggestions
6. **Smart Alerts** — Critical stock, high demand, idle products, restock needed alerts

## Seed Data

Default admin account: `admin@erp.com` / `admin123`

Sample products: Pao Frances, Cafe Expresso, Croissant, Refrigerante Lata, Chocolate Barra
With 7 days of historical sales data.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture

```
artifacts/
  api-server/           # Express backend
    src/
      routes/           # auth, products, sales, dashboard, forecast, alerts
      middlewares/      # auth.ts (JWT)
  erp-simplificado/     # React frontend
    src/
      pages/            # login, register, dashboard, products, sales, forecast, alerts
      components/       # layout.tsx, ui components
      lib/              # auth.tsx (AuthContext + JWT)
lib/
  api-spec/             # OpenAPI spec + Orval config
  api-client-react/     # Generated React Query hooks
  api-zod/              # Generated Zod schemas
  db/                   # Drizzle schema: users, products, sales
```
