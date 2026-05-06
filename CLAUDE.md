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
- `lib/auth/server.ts` — Better Auth server config (email+password, TOTP via `twoFactor`, magic-link, Organizations plugin; passkey is NOT available in Better Auth v1.6.x)
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

## Better Auth

- **Plugins in use:** `twoFactor` (TOTP), `magicLink`, `organization` — passkey is NOT available in v1.6.x
- **Organization API:** use `auth.api.createInvitation` (not `inviteMember`) to invite family members
- Better Auth owns and manages these tables automatically: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation` — never redefine or hard-delete from them
- An "organization" = a "family/household" throughout this app

## shadcn/ui

Uses `@base-ui/react` (not Radix UI) — the `asChild` prop does not exist. To render a shadcn button inside a Trigger element, import `buttonVariants` and apply the className directly:

```tsx
import { buttonVariants } from '@/components/ui/button'
<SheetTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
```

## React Hook Form + Zod v4

`zodResolver` has an input/output type mismatch when using `z.coerce.*` or `.default()`. Cast the resolver explicitly in every form:

```ts
resolver: zodResolver(mySchema) as Resolver<MyFormValues>
```

- **Turbopack** is default for both `dev` and `build`.

## Zod v4

Error messages use `{ error: '...' }` not `{ message: '...' }`:

````ts

## Supabase / RLS

The database is Postgres on Supabase `ca-central-1` (Montréal) for PIPEDA/Quebec Law 25 compliance.

**9 application tables** (all have `family_id` column): `financial_accounts`, `categories`, `tags`, `transactions`, `transaction_tags`, `budgets`, `savings_goals`, `categorization_rules`, `audit_log`.

**RLS pattern** — enable RLS on every application table, then create family-isolation policies:
```sql
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_isolation" ON financial_accounts
  USING (family_id::uuid = current_setting('app.current_family', true)::uuid);
````

`transaction_tags` has no `family_id` — join through `transactions`:

```sql
CREATE POLICY "family_isolation" ON transaction_tags
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_tags.transaction_id
        AND t.family_id::uuid = current_setting('app.current_family', true)::uuid
    )
  );
```

`audit_log` is **append-only** — SELECT + INSERT policies only, no UPDATE/DELETE.

**`withFamilyContext`** in `lib/actions/utils.ts` sets `SET LOCAL app.current_family = <familyId>` before every server action. All server actions must go through this wrapper.

**Verification:** querying any table without setting `app.current_family` should return 0 rows, confirming RLS is working.

**Connection string:** use the Direct connection (not pooler) from Supabase → Project Settings → Database. Set it as `DATABASE_URL` in `.env.local`. The `lib/db/index.ts` stub prevents build crashes if the URL still contains `[YOUR-` placeholder text.
z.string().min(2, { error: 'Too short' })
z.email({ error: 'Invalid email' })

```

```
