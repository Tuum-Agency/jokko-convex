# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Jokko** is a multi-tenant WhatsApp Business CRM platform built with Next.js 16, Convex backend, React 19, and TypeScript. It enables businesses to manage WhatsApp conversations, contacts, broadcasts, templates, and automated flows.

## Commands

```bash
# Development
pnpm dev                 # Next.js dev server (port 3000)
pnpx convex dev          # Convex backend dev (run in separate terminal)

# Build & Typecheck
pnpm build               # Next.js production build
pnpx convex typecheck    # Convex-specific typecheck (tsc --noEmit on convex/)

# Lint
pnpm lint                # ESLint

# Tests
pnpx vitest              # Run all tests
pnpx vitest run contacts # Run a single test file

# Environment variables (Convex backend)
pnpx convex env set KEY "value"  # Set env var for Convex runtime
pnpx convex env list             # List all Convex env vars

# Seed data
# Run via Convex dashboard or: pnpx convex run seed:seed
```

## Architecture

### Multi-Tenant Model

Every data query is scoped to the user's **active organization** via `userSessions.currentOrganizationId`. The pattern to get the current org in Convex functions:

```typescript
const session = await ctx.db.query("userSessions")
    .withIndex("by_user", q => q.eq("userId", userId)).first();
const orgId = session.currentOrganizationId;
```

### Roles & Permissions

Defined in `convex/lib/permissions.ts`. Three roles: **OWNER > ADMIN > AGENT**. Fine-grained permissions (`flows:create`, `contacts:export`, etc.) are mapped per role. Backend mutations must call `hasPermission(role, permission)` to enforce access. Client-side: use `usePermission()` and `useCan()` hooks from `hooks/use-permission.ts`.

### Backend (Convex)

- **Runtime**: Convex functions run in an edge-like runtime (no Node.js APIs by default). Use `"use node"` directive only in files that need Node.js.
- **Schema**: `convex/schema.ts` — single large schema file with all tables. Uses `@convex-dev/auth` authTables.
- **HTTP endpoints**: `convex/http.ts` — WhatsApp webhook (GET verify + POST with HMAC-SHA256 signature validation).
- **Automation engine**: `convex/engine.ts` — processes incoming messages against active flows (React Flow nodes/edges stored as JSON strings).
- **Cron jobs**: `convex/crons.ts` — presence timeouts (1min), scheduled broadcasts (1min).
- **Key tables**: `organizations`, `memberships`, `users`, `conversations`, `messages`, `contacts`, `flows`, `broadcasts`, `templates`, `notifications`.

### Frontend (Next.js App Router)

- `app/(auth)/` — Sign-in/sign-up pages (Password + Google via `@convex-dev/auth`)
- `app/(marketing)/` — Landing pages, pricing, legal
- `app/(onboarding)/` — Organization setup wizard
- `app/dashboard/` — Main app: conversations, contacts, flows, broadcasts, templates, team, settings, analytics
- `app/api/facebook/` — Facebook data deletion callback

### Key Conventions

- **State management**: Use Zustand (NOT React Context API).
- **UI components**: shadcn/ui (Radix + Tailwind) in `components/ui/`.
- **Data fetching**: `useQuery` / `useMutation` from `convex/react`. No REST APIs — everything goes through Convex.
- **Auth hook**: `useCurrentOrg()` from `hooks/use-current-org.ts` for org context, membership, and org switching.
- **Path alias**: `@/*` maps to project root.
- **Styling**: Tailwind CSS v4 with `tailwindcss-animate`.

### WhatsApp Integration

- Webhook receives messages at `/api/whatsapp/webhook` (Convex HTTP route)
- Signature verification via `FACEBOOK_APP_SECRET` env var (Web Crypto API)
- Outbound messages sent via WhatsApp Cloud API using org-specific `accessToken` stored in `organizations.whatsapp`
- Templates synced with Meta's template API

### Flow Builder

- Uses `@xyflow/react` (React Flow) with custom node types: `start`, `message`, `interactive`, `action`
- Nodes and edges stored as JSON strings in the `flows` table
- `convex/engine.ts` processes inbound messages against active flows

## Commit Messages

Always use **Conventional Commits** format. Never mention Claude or AI in commit messages.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
