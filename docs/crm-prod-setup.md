# CRM — Passage en production

## Contexte

- Domaine prod : `https://jokko.co`
- Convex : **on reste sur le deployment dev** (`dev:befitting-hornet-738`)
- Le code supporte déjà les deux environnements : le frontend détecte `window.location.hostname === "localhost"` et appelle `startLocal` (hardcoded `https://localhost:1000`) ou `start` (utilise `SITE_URL`).

## Checklist

### 1. Convex — env vars (fait)

```bash
CONVEX_DEPLOYMENT="dev:befitting-hornet-738" pnpx convex env set SITE_URL "https://jokko.co"
```

Vérifier : `pnpx convex env get SITE_URL` → `https://jokko.co`

### 2. Vercel — env vars prod

Sur `tuum-agency/jokko-convex` (Production environment) :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://jokko.co` |
| `NEXT_PUBLIC_CONVEX_URL` | URL du Convex dev actuel (inchangé) |

### 3. OAuth apps — ajouter le callback prod

Sur chaque portail développeur du CRM, **ajouter** (ne pas remplacer) le callback prod à la liste des Redirect URLs autorisées :

| CRM | Portail | Callback à ajouter |
|-----|---------|--------------------|
| HubSpot | app.hubspot.com → Developer → App → Auth | `https://jokko.co/api/crm/oauth/hubspot/callback` |
| Pipedrive | developers.pipedrive.com → App → Basic info | `https://jokko.co/api/crm/oauth/pipedrive/callback` |
| Salesforce | Setup → App Manager → Edit Connected App | `https://jokko.co/api/crm/oauth/salesforce/callback` |
| Sellsy | go.sellsy.com → Paramètres API → App | `https://jokko.co/api/crm/oauth/sellsy/callback` |

Les callbacks localhost existants (`https://localhost:1000/...`) doivent rester pour que le dev continue de fonctionner.

### 4. API key providers (rien à faire)

Axonaut et noCRM.io utilisent une API key saisie par l'utilisateur — aucun callback OAuth, aucune config à changer.

## Comment dev continue de marcher

Le frontend (`app/dashboard/integrations/page.tsx:318-320`) :

```ts
const isLocalhost = window.location.hostname === "localhost";
const action = isLocalhost ? startOAuthLocal : startOAuth;
```

- Dev (`localhost:1000`) → `startLocal` → `LOCALHOST_REDIRECT_BASE` hardcoded → ignore `SITE_URL` ✓
- Prod (`jokko.co`) → `start` → utilise `SITE_URL=https://jokko.co` ✓

## Validation

Après avoir fait les étapes 2 et 3, tester depuis `https://jokko.co/dashboard/integrations` :

1. Cliquer "Connecter" sur HubSpot → redirection vers HubSpot OAuth
2. Autoriser → retour sur `https://jokko.co/dashboard/integrations?connected=hubspot`
3. Vérifier dans le Convex dashboard : une ligne dans `crmConnections` avec `status: active`

Si l'étape 2 redirige vers localhost : l'env var `SITE_URL` n'est pas prise. Vérifier `pnpx convex env get SITE_URL`.

Si l'étape 1 échoue avec "redirect_uri_mismatch" : le callback prod n'est pas whitelisté chez le provider. Retour à l'étape 3.
