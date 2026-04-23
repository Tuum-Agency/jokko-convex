# Phase C — Instructions Vercel pour migration monorepo

Ce document accompagne la PR qui déplace le web dans `apps/web/`. **À lire AVANT de merger sur `main`**, sinon le déploiement prod casse.

## 1. Reconfigurer `rootDirectory` (critique)

Dashboard Vercel → projet Jokko → **Settings** → **Build & Development Settings** :

- **Root Directory** : `apps/web`
- Cocher "Include source files outside of the Root Directory in the Build Step" ✅ (indispensable : le build a besoin de `convex/`, `packages/`)
- **Framework Preset** : Next.js (auto-détecté)
- **Build Command** : laisser vide (auto = `next build`)
- **Install Command** : `pnpm install` (exécuté depuis la racine du monorepo — Vercel détecte `pnpm-workspace.yaml`)
- **Output Directory** : laisser vide (auto = `.next`)

## 2. Variables d'environnement

**Rien à changer** — les env vars sont stockées au niveau du projet Vercel, pas dépendantes du rootDirectory. Les `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOY_KEY`, `FACEBOOK_APP_SECRET`, etc. continuent de fonctionner.

## 3. Ordre de déploiement recommandé

1. **Push la PR sur une branche** (pas `main`)
2. Vercel crée un **preview deployment** avec l'ancienne config rootDirectory → va échouer
3. **AVANT de re-déployer** : modifier `rootDirectory` dans Settings (étape 1)
4. Relancer le build preview depuis le dashboard Vercel (bouton "Redeploy")
5. Vérifier que le preview est green
6. **Merge** la PR sur `main`
7. Vercel déploie prod automatiquement avec la bonne config

## 4. Rollback si ça casse

- Dashboard Vercel → **Deployments** → trouver le dernier déploiement green pré-Phase-C → **⋯** → "Promote to Production"
- Puis remettre `rootDirectory` à vide (racine)
- Investiguer sur la branche

## 5. CI GitHub Actions

Vérifier `.github/workflows/*.yml` si présent — ajouter `working-directory: apps/web` aux steps qui font `pnpm build` / `pnpm lint` / `pnpm test`. Pour Convex, rester à la racine.

## 6. Checklist avant merge

- [ ] `pnpm --filter @jokko/web build` OK localement
- [ ] `pnpx convex typecheck` OK
- [ ] `pnpm --filter @jokko/mobile typecheck` OK
- [ ] Preview Vercel green sur la PR avec `rootDirectory = apps/web`
- [ ] `.env.local` et `.env` symlinkés dans `apps/web/` (en local uniquement — en prod Vercel ignore ces fichiers)
- [ ] Confirmation que Convex déploie toujours depuis racine (`pnpx convex deploy`)

## 7. Notes techniques

- **Pourquoi `@jokko/core` ?** Les fichiers `lib/planFeatures.ts` et `lib/whatsapp-pricing.ts` étaient importés à la fois par Convex (backend) et par apps/web (frontend). Ils ont été déplacés dans `packages/core/src/` et exposés via `exports` pour éviter un coupling inversé (backend → frontend).
- **Pourquoi les env vars sont dupliquées dans root ET apps/web ?** `react`, `@react-email/components` sont utilisés par Convex pour render les emails (fichiers `convex/emails/*.tsx`). Ils doivent être résolvables depuis la racine via node_modules. pnpm dédup automatiquement → pas de double install réel sur disque.
- **Symlinks `.env` dans apps/web** : nécessaires en local pour que `next build` trouve les env. Inutiles en prod (Vercel injecte les env via son dashboard).
