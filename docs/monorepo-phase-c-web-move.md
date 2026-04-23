# S3 Phase C — Déplacement web → apps/web

**Statut** : à faire (non bloquant tant que mobile avance en parallèle)
**Risque** : HIGH — web en prod sur Vercel. Toute erreur casse le déploiement.
**Pré-requis** : accès dashboard Vercel pour reconfigurer `rootDirectory`.

## État actuel du monorepo (fin Phase B)

```
cape-town/
├── apps/
│   └── mobile/              ✅ créé (depuis spike)
├── packages/
│   ├── tokens/              ✅ @jokko/tokens (theme partagé)
│   └── core/                ✅ skeleton (@jokko/core — vide)
├── convex/                  (reste racine — partagé)
├── app/                     ⚠️  web Next.js, à déplacer
├── components/              ⚠️  à déplacer
├── hooks/                   ⚠️  à déplacer
├── lib/                     ⚠️  à déplacer
├── public/                  ⚠️  à déplacer
├── e2e/                     ⚠️  à déplacer (Playwright)
├── next.config.ts           ⚠️
├── tsconfig.json            ⚠️
├── tailwind (postcss.config.mjs) ⚠️
├── eslint.config.mjs        ⚠️
├── sentry.*.config.ts       ⚠️
├── proxy.ts                 ⚠️
├── components.json          ⚠️  (shadcn/ui)
├── playwright.config.ts     ⚠️
├── package.json             ⚠️  (racine devient workspace manager pur)
└── pnpm-workspace.yaml      ✅ déclaré
```

## Checklist de la migration (dans l'ordre)

### 1. Préparation (hors prod)

- [ ] Créer branche dédiée `chore/monorepo-phase-c-web-move`
- [ ] Vérifier build racine OK avant de commencer (`pnpm build`)
- [ ] Créer `apps/web/` vide

### 2. Déplacer les sources web

Avec `git mv` pour préserver l'historique :

- [ ] `git mv app apps/web/app`
- [ ] `git mv components apps/web/components`
- [ ] `git mv hooks apps/web/hooks`
- [ ] `git mv lib apps/web/lib`
- [ ] `git mv public apps/web/public`
- [ ] `git mv e2e apps/web/e2e`

### 3. Déplacer les configs

- [ ] `git mv next.config.ts apps/web/`
- [ ] `git mv postcss.config.mjs apps/web/`
- [ ] `git mv sentry.client.config.ts apps/web/`
- [ ] `git mv sentry.edge.config.ts apps/web/`
- [ ] `git mv sentry.server.config.ts apps/web/`
- [ ] `git mv proxy.ts apps/web/`
- [ ] `git mv components.json apps/web/`
- [ ] `git mv playwright.config.ts apps/web/`
- [ ] `git mv eslint.config.mjs apps/web/` (ou garder racine = workspace-aware)

### 4. Split package.json

**`package.json` racine** devient workspace manager :
```json
{
  "name": "jokko-monorepo",
  "private": true,
  "scripts": {
    "dev:web":    "pnpm --filter @jokko/web dev",
    "dev:mobile": "pnpm --filter @jokko/mobile dev",
    "build:web":  "pnpm --filter @jokko/web build",
    "lint":       "pnpm --filter @jokko/web lint",
    "typecheck":  "pnpm -r typecheck && pnpx convex typecheck",
    "test":       "pnpm --filter @jokko/web test"
  },
  "devDependencies": { "typescript": "^5" },
  "packageManager": "pnpm@10.28.1"
}
```

**`apps/web/package.json`** reçoit toutes les deps actuelles :
```json
{
  "name": "@jokko/web",
  "private": true,
  "scripts": {
    "dev": "next dev --experimental-https -p 1000",
    "build": "next build",
    "start": "next start -p 1000",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { /* copier toutes les deps actuelles */ },
  "devDependencies": { /* copier toutes les devDeps actuelles sauf typescript */ }
}
```

Ajouter `"@jokko/tokens": "workspace:*"` et `"@jokko/core": "workspace:*"` dans les deps.

### 5. Split tsconfig

- [ ] Créer `tsconfig.base.json` racine avec options partagées (strict, target, lib, etc.)
- [ ] `apps/web/tsconfig.json` extends base, garde `paths: { "@/*": ["./*"] }` — relatif à `apps/web` donc imports internes INTACTS
- [ ] Ajouter `paths: { "@jokko/convex": ["../../convex/_generated/api"] }` si besoin

### 6. Adapter Convex depuis web

Les imports actuels `from "convex/_generated/api"` utilisent le resolver Node. Depuis `apps/web`, le chemin relatif devient `../../convex/_generated/api`. Utiliser l'alias tsconfig pour ne rien modifier dans les fichiers.

### 7. Vercel — critique

- [ ] Dashboard Vercel → project → Settings → Build & Development → `Root Directory` = `apps/web`
- [ ] Vérifier build command (auto-detect `next build` depuis `apps/web/package.json`)
- [ ] Variables d'env restent au niveau projet Vercel (pas de modif)
- [ ] Tester preview deploy sur la branche avant merge

### 8. CI

- [ ] Adapter `.github/workflows/*.yml` si présent (paths, working-directory)

### 9. Validation finale

- [ ] `pnpm install` racine
- [ ] `pnpm --filter @jokko/web build` → OK
- [ ] `pnpm --filter @jokko/mobile typecheck` → OK
- [ ] `pnpx convex dev` → OK depuis racine
- [ ] Preview Vercel green → merge

## Risques identifiés

| Risque | Mitigation |
|---|---|
| Imports `@/*` cassés dans web | tsconfig paths reste relatif à `apps/web` — intact |
| Convex `_generated` introuvable depuis web | alias tsconfig `@jokko/convex` |
| Vercel déploie racine au lieu de `apps/web` | reconfig `rootDirectory` AVANT push |
| Sentry source maps pétées | vérifier `sentry-nextjs.config` pointe bons paths |
| Playwright e2e ne tourne plus | ajuster `playwright.config.ts` paths |
| Pre-existing erreur `MessageInput.tsx:330` (`Timeout` vs `number`) | fixer indépendamment, existe déjà sur main |

## Ce qui ne bouge PAS

- `/convex` — racine, partagé
- `/.env`, `/.env.local` — racine (Convex CLI les lit depuis racine)
- `/pnpm-workspace.yaml`, `/pnpm-lock.yaml`
- `/.github`
- `/README.md`, `/CLAUDE.md`
- `/docs`, `/scripts`, `/tasks`
- `/.context/spike-signatures` (peut être supprimé après validation apps/mobile)
