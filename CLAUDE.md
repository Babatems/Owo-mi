@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Owo-mi** ("my money" in Yoruba) — a Canadian-focused personal finance management platform. MIT-licensed, built for PIPEDA/Quebec Law 25 compliance with Canadian data residency.

## Commands

```bash
npm run dev          # Start dev server (Turbopack, port 3000)
npm run build        # Production build
npm run typecheck    # tsc --noEmit (run before committing)
npm run lint         # ESLint
npm run db:generate  # Generate Drizzle migrations from schema
npm run db:migrate   # Apply migrations to database
npm run db:studio    # Open Drizzle Studio (DB browser)
```

## Architecture

**Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Tremor charts, React Hook Form + Zod v4, TanStack Query v5, Zustand, Drizzle ORM, Better Auth v1, Supabase Postgres.

**Directory layout** (all paths relative to project root, `@/` alias maps to root):

- `app/` — Next.js App Router pages and API routes
- `components/` — UI components (`ui/` = shadcn primitives, others are app-specific)
- `lib/` — shared utilities, DB client, auth config, server actions, Zod schemas

**Key files:**

- `lib/db/schema.ts` — single source of truth for all Drizzle table definitions
- `lib/auth/server.ts` — Better Auth server config (passkey, TOTP, Organizations plugin)
- `lib/actions/utils.ts` — `withFamilyContext` wrapper; **every server action must use this**
- `lib/validations/schemas.ts` — all Zod schemas shared between forms and server actions
- `proxy.ts` — Next.js 16 route protection + RLS context injection (renamed from middleware)

**Money:** All monetary values are stored as integer cents (e.g., $12.34 → `1234`). Never use floats for amounts.

**Soft deletes:** Never hard-delete financial records. Set `deletedAt` timestamp instead.

**Multi-tenancy:** Every DB table has a `familyId` column. Row-Level Security enforces tenant isolation via the `app.current_family` Postgres session variable set by `withFamilyContext`.

**Better Auth / families:** Better Auth's Organizations plugin powers the family/household model. An "organization" = a family. Use `auth.api.*` for family management — do not create custom tables for users/sessions/organizations.

## Next.js 16 Notes

- **`proxy.ts`** (not `middleware.ts`) — the middleware file was renamed in Next.js 16. Export a function named `proxy`.
- **`revalidateTag`** now requires a second `cacheLife` argument — single-argument form produces a TypeScript error.
- **`refresh()`** from `next/cache` — use this to refresh the current page after mutations.
- **Turbopack** is default for both `dev` and `build`.

## Zod v4

Error messages use `{ error: '...' }` not `{ message: '...' }`:

```ts
z.string().min(2, { error: 'Too short' })
z.email({ error: 'Invalid email' })
```
