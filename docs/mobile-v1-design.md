# Jokko Mobile — V1 Design Document

> **Status** : Brainstorming lock ✅ · Design validé section par section ✅
> **Dernière mise à jour** : 2026-04-23
> **Auteur** : admin@tuumagency.com (session brainstorming Claude Code)
> **Scope** : V1 application mobile iOS + Android (Expo managed workflow)

Ce document est la référence unique pour la construction de Jokko Mobile V1. Toute décision qui contredit ce doc doit être discutée et versionnée ici avant exécution.

---

## 1. Understanding Summary

### Ce qu'on construit

Application mobile native iOS + Android (Expo SDK 54+, RN 0.76+, New Architecture, Hermes, TypeScript strict, Expo Router v4), candidate sérieuse Awwwards / Apple Design Awards / Google Play Best of.

**V1 = Messagerie pure** :
- Auth (Email + Google + Apple Sign In)
- Onboarding 3 écrans max
- Inbox virtualisée
- Chat plein écran (hero de l'app)
- Médias (photo, vidéo, doc, vocal avec waveform Skia)
- Réactions (long-press → plateau Glass Reply)
- Reply par swipe droit
- Templates WhatsApp via bottom sheet recherchable
- Présence temps réel
- Notifications push riches (APNs + FCM natifs, actions lockscreen)
- Outbox offline avec retry exponentiel

**Hors V1** : contacts/CRM, campagnes/broadcasts, intégrations OAuth externes, appels WebRTC, handoff iOS web↔mobile, scan carte visite. Tout repoussé V1.1+.

**3 signatures gestuelles** (Glass Reply, Inbox Breathing, Compose Morph) validées via spike isolé Day 1, avec option de reforger la #1 si prototype tiède.

### Pour qui

- Équipes PME/mid-market utilisant Jokko sur desktop, qui ont besoin d'agir depuis le mobile entre deux réunions / en déplacement.
- Géographie : France + Afrique FR-west (fr-FR), en-US en fallback.
- Persona dominant : agent commercial ou support recevant 20–100 conversations/jour.

### Pourquoi

- Produit signé, pas une webview, pas un clone du dashboard.
- La mobilité est le cas d'usage premier WhatsApp → Jokko mobile doit se sentir **plus à l'aise** que le web sur ce cas.
- Positionnement marketing award-grade : case study + teaser vidéo + Dribbble shots pour acquisition organique B2B premium.

### Contraintes dures

1. Solo dev (upgrade designer freelance possible si budget 5–8 k€).
2. Monorepo big-bang d'abord (`apps/web` + `apps/mobile` + `packages/core` + `convex/` à la racine) — ~3–5 jours bloquants.
3. Région Convex à vérifier. Si US, migration EU bloquante (2–5 jours) pour RGPD Data residency.
4. Budgets perf durs : cold start < 1.5 s iPhone 12, FPS 60/120 inbox, RAM < 120 MB, bundle < 2 MB, crash-free ≥ 99.5 %.
5. Deadline J+45 production indicative (award-grade > date).
6. Stack imposée : NativeWind v5, Reanimated 4, Skia, Legend List, Moti, MMKV, expo-secure-store, expo-image. Pas de Lottie, lodash, moment, Detox.
7. Apple Sign In obligatoire dès que Google auth est présent (App Review).

### Non-goals explicites

- Traduction écran par écran du web.
- Offline DB locale complète (SQLite/WatermelonDB) — on vise l'illusion d'offline.
- Tests exhaustifs / 100 % coverage.
- IA, marketplace, admin webhooks.
- CI gate perf (`react-native-performance`) — mesures manuelles Flipper aux milestones.
- Lien facturation/upgrade Stripe dans l'app (lecture seule + lien web, conformité IAP Apple).
- 20 écrans Figma polish pré-code (remplacé par 3 wireframes bas-fi + Storybook RN vivant).
- WebRTC / appels / CallKit / ConnectionService.

---

## 2. Assumptions

| #   | Assumption | Risque si faux |
|-----|---|---|
| A1  | `convex/_generated` consommable par `apps/web` et `apps/mobile` après déplacement à la racine du monorepo (chemin d'import + TS paths). | Migration monorepo bloquée, refonte build. |
| A2  | AppleID Developer ($99/an) + Google Play Console ($25) + comptes Sentry + EAS disponibles ou créés avant Day 1. | Blocage publication TestFlight/Play Internal semaine 2. |
| A3  | Zéro code mobile RN hérité à récupérer. Greenfield complet sur `apps/mobile`. | Scope design monorepo change si code existe. |
| A4  | Facebook App Review WhatsApp Cloud API déjà approuvé sur org existant — mobile réutilise credentials via Convex, pas de nouvelle review. | Délai Meta 2–6 semaines imprévu. |
| A5  | Les 3 signatures gestuelles, si le spike les valide, sont suffisantes pour la candidature award. Pas de 4e signature en cours de route. | Scope creep créatif, date glisse. |
| A6  | Budget designer freelance (option D du workflow design) décidé avant fin semaine 1, après spike Day 1. | Double décisionnel tardif, blocages. |
| A7  | Handoff iOS web↔mobile (brief §10) retiré de V1. | Cut volontaire acté. |
| A8  | `react-native-webrtc` absent V1 (appels coupés). Expo managed workflow reste possible sans prebuild natif custom. | Simplification pipeline EAS. |
| A9  | Magic Link repoussé V1.1. V1 : Email + Google + Apple Sign In uniquement. | Set auth minimal mais App Review friendly. |
| A10 | Domaine deep link = `jokko.app` (à confirmer avant setup EAS — AASA + Asset Links). | Blocage configuration universal links. |

---

## 3. Decision Log

| #    | Décision | Alternatives rejetées | Raison |
|------|---|---|---|
| D1   | Brief traité comme starting point challengeable | Bible figée ; tout repenser | Brief excellent mais 3–4 décisions risquées à valider. |
| D2   | Big-bang monorepo (`apps/web` + `apps/mobile` + `packages/core`, `convex/` racine) | Sibling progressif ; duplication ; repo séparé | Propreté structurelle > dette temporaire ; fenêtre web stable. |
| D3   | Solo dev, award-grade prioritaire sur J+45 | Équipe ; date fixée | Réalisme des ressources. |
| D4   | V1 = Messagerie pure | Messagerie + contacts ; +campagnes ; brief complet | Awwwards récompense la sensation, pas l'étendue ; les 3 signatures vivent dans le chat. |
| D5   | Offline hybride minimal (MMKV : inbox top 20 + outbox + drafts) | Online-first ; cache Convex full ; DB locale | Illusion offline > offline mal exécuté. |
| D6   | Spike Day 1 (3–4 j) sur les 3 signatures en repo isolé, option reforge #1 | Signatures figées + fallback ; direct code | 4 jours investis, zéro mauvaise surprise, validation award avant scale. |
| D7   | Design C (tokens + Excalidraw + Storybook RN + vidéos ref), D en upgrade si budget 5–8 k€ | Figma first ; IA design ; designer obligatoire | Contraintes solo, chaque heure sur Figma = heure pas sur les signatures. |
| D8   | Vérifier région Convex d'abord, migration EU bloquante si US (plan 1) | US + SCC ; retirer promesse UE | RGPD non-négociable pour B2B FR/Afrique FR-west. |
| D9   | Push APNs + FCM natifs + actions riches lockscreen | Expo Push ; hybride V1/V1.1 ; tap-only | Latence + polish = critère award ; 3 jours amortis sur 12 mois. |
| D10  | Testing essentiel : Sentry Day 1 + Jest modules critiques + 1 flow Maestro + Flipper manuel + crash-free 99.5 % | Full stack brief ; minimum Sentry seul ; Maestro-only | Filet de sécurité sans bouffer le temps des signatures. |
| D11  | Approche 1 « Risk-first linear » (10 étapes, ~60 jours) | Parallel streams ; thin slice vertical | Solo + award-grade = un seul front de risque par semaine. |

---

## 4. Architecture monorepo

### Layout du repo (fin étape S3)

```
jokko-convex/
├── apps/
│   ├── web/                           # Next.js actuel, déplacé tel quel
│   │   ├── app/ · components/ · hooks/ · lib/ · public/
│   │   ├── next.config.ts · tailwind.config.ts
│   │   └── package.json               # "jokko-web"
│   └── mobile/
│       ├── app/                       # Expo Router v4 file-based
│       ├── components/ · hooks/ · lib/ · design/
│       ├── app.config.ts · eas.json
│       └── package.json               # "jokko-mobile"
├── packages/
│   ├── core/                          # Code partagé web ↔ mobile
│   │   ├── feature-manifest/          # planFeatures, planLimits, gate logic
│   │   ├── types/                     # Types domaine
│   │   ├── validation/                # Zod schemas
│   │   └── hooks/                     # useFeatureAccess, useTrialStatus
│   └── tokens/                        # Design tokens JSON + TS exports
├── convex/                            # Backend — racine, partagé par les 2 apps
│   ├── _generated/
│   ├── schema.ts · http.ts · calls.ts · engine.ts
│   └── ...
├── pnpm-workspace.yaml
├── turbo.json                         # optionnel (cache typecheck)
├── tsconfig.base.json
└── package.json
```

### Règles de frontière

1. `convex/` reste à la racine. Les deux apps importent via path alias `@/convex/_generated/api` (tsconfig + metro/webpack resolvers).
2. `packages/core` ne contient que du code **100 % isomorphe** — aucun `react-dom`, aucun `react-native`.
3. `packages/tokens` — JSON plat, zéro logique. Consommé par NativeWind (mobile) et Tailwind config (web).
4. Hooks spécifiques à un environnement restent dans `apps/*/hooks/`. Ex : `useCurrentOrg` a 2 impls (`next/navigation` vs `expo-router`), même signature.
5. **Pas de `packages/ui`** en V1. Composants RN dans `apps/mobile/components/primitives/`. Partage UI = V2.

### Scripts racine

```json
{
  "dev:web":    "pnpm --filter jokko-web dev",
  "dev:mobile": "pnpm --filter jokko-mobile dev",
  "dev:convex": "pnpx convex dev",
  "build:web":  "pnpm --filter jokko-web build",
  "typecheck":  "pnpm -r typecheck && pnpx convex typecheck"
}
```

---

## 5. Navigation & arborescence écrans

```
apps/mobile/app/
├── _layout.tsx                        # Root · auth guard · ThemeProvider
├── index.tsx                          # Redirect splash → auth OU (main)
│
├── (auth)/
│   ├── _layout.tsx
│   ├── sign-in.tsx                    # Email + Google + Apple
│   ├── sign-up.tsx
│   └── verify.tsx                     # Universal link handler
│
├── (onboarding)/
│   ├── _layout.tsx
│   ├── welcome.tsx                    # 1 écran (pas 4)
│   ├── org-select.tsx                 # Si multi-orgs
│   └── biometry.tsx                   # Face ID opt-in · skip autorisé
│
├── (main)/                            # Stack principal — PAS de tabs en V1
│   ├── _layout.tsx
│   ├── index.tsx                      # Inbox (liste virtualisée)
│   ├── chat/[id].tsx                  # Chat plein écran (hero)
│   └── settings.tsx                   # Minimal : switch org · logout · trial
│
└── modals/
    ├── templates.tsx                  # Bottom sheet templates WhatsApp
    ├── org-switcher.tsx               # Bottom sheet switch org
    └── media-viewer.tsx               # Photo/vidéo plein écran
```

### Décisions non évidentes

- **Pas de tabs en V1** — Contacts + Campaigns coupés, rester sur 2 tabs serait absurde. Migration `(tabs)/` = V1.1.
- **Settings derrière l'avatar en haut-gauche** (pattern Linear). Long-press = org switcher.
- **Pas de compose outbound** V1 — nouvelle conv uniquement depuis message entrant (95 % cas d'usage).
- **Modals = bottom sheets** via `@gorhom/bottom-sheet`. Presets : `snap-30`, `snap-60`, `snap-90`.

### Deep linking V1

```
https://jokko.app/c/{conversationId}  →  (main)/chat/[id]
https://jokko.app/auth/verify?token=  →  (auth)/verify
```

AASA + Asset Links **uniquement sur ces deux routes** en V1.

---

## 6. State management & data flow

### Stores Zustand

```
lib/stores/
├── session.store.ts       # user · currentOrgId · role · isAuth
├── compose.store.ts       # draft par conversationId (persist MMKV)
├── outbox.store.ts        # queue messages sortants (persist MMKV)
├── ui.store.ts            # keyboard, bottomSheet, modals (éphémère)
└── presence.store.ts      # heartbeat local (éphémère)
```

**Règles dures** :
- Zustand persist **uniquement** sur `compose` + `outbox` via adapter MMKV custom.
- Aucun store ne duplique des données Convex. Convex = source de vérité.

### Data flow — envoi d'un message

```
User tap "send"
  ↓
1. compose.store.clearDraft(convId)
2. outbox.store.enqueue({ id: nanoid(), convId, body, status: 'queued' })
3. UI : bulle optimiste rendue immédiatement (<16ms)
4. Convex mutation sendMessage (non-await, fire & forget côté UI)
5. MMKV persist outbox (atomique)
   ↓
Succès
  ├─ Convex query messages se rafraîchit → bulle "server" remplace l'optimiste
  ├─ outbox.store.ack(id) → MMKV sync
  └─ (Si conv top inbox) trigger Signature #2 "Inbox Breathing"

Échec
  ├─ outbox.store.markFailed(id, reason)
  ├─ Bulle en état "failed" (icône + tap pour retry)
  └─ Retry exp. auto : 2s, 8s, 30s, puis manuel
```

### Cache MMKV — 3 zones, jamais plus

| Zone | Clé | Contenu | TTL |
|---|---|---|---|
| Inbox snapshot | `jokko:inbox:${orgId}` | 20 conv top (id, last msg preview, unread) | rehydrate au cold start, revalidate Convex en ~300 ms |
| Outbox | `jokko:outbox` | Messages `queued` + `failed` | jusqu'à ack Convex |
| Drafts | `jokko:draft:${convId}` | Texte + media pending | jusqu'à send ou discard |

Pas de cache pour messages historiques non-top. Ouverture conv non-top = skeleton + fetch Convex.

### Hooks partagés (`packages/core/hooks`)

```
useFeatureAccess(feature)  → { allowed, reason, upgradeUrl }
useTrialStatus()           → { inTrial, daysLeft, plan }
useCurrentOrg()            → 2 impls : apps/web + apps/mobile (même signature)
```

### Présence & typing

- `usePresence()` heartbeat toutes les 30 s en foreground.
- `useTypingIndicator(convId)` broadcast via Convex mutation debounced 800 ms.
- Typing dots : Reanimated worklet, 3 dots spring out-of-phase, cadence 600 ms.

---

## 7. Rendu, performance & les 3 signatures

### Liste Inbox — 60/120 fps garantis

- **Legend List** uniquement. Config : `estimatedItemSize: 72`, `recycleItems: true`, `maintainVisibleContentPosition`, `drawDistance: 500`.
- Row = `React.memo` + comparateur custom sur `(id, lastMessageId, unreadCount)`.
- Avatars : `expo-image` + transition 200 ms + blurhash fallback.
- Aucune fonction inline dans `renderItem`.
- Swipe archive/épingle : `Gesture Handler` + `Reanimated`, jamais `Swipeable`.

### Écran Chat — architecture de rendu

```
<ScreenHost>
  <ChatHeader shared-element-tag />
  <MessageList
    ref={listRef}
    inverted
    data={messages}
    renderItem={MessageBubble}   # mémoïsé, reçoit messageId uniquement
  />
  <Composer />                   # voir Signature #3
  <ScrollToBottomFab />          # émerge si offset > 400 px
</ScreenHost>
```

`MessageBubble` reçoit un `messageId`, résout le message via selector Zustand sur snapshot de `useQuery`. Évite re-renders cascade.

### Les 3 signatures

**#1 Glass Reply (long-press réactions)**
- `Gesture.LongPress().minDuration(320)`.
- `scale` 1 → 1.04 spring soft, `elevation` fake Skia shadow.
- Blur behind : `expo-blur intensity: 35` d'abord. Skia `BlurMask` si spike Day 1 prouve ≥ 55 fps iPhone 12.
- Plateau réactions 6 emojis (👍 ❤️ 😂 😮 😢 🙏). Haptic `selection` sur survol.

**#2 Inbox Breathing**
- Subscription diff `useQuery(listConversations)` via `useRef` comparator.
- Si premier item nouveau `lastMessageId` + app foreground + inbox au top :
  - Row `translateY(2)` → spring bouncy → `translateY(0)` (~500 ms).
  - Haptic `light` une seule fois (debounce 1.5 s).
- Amplificateur : `border-left` couleur accent.primary, pulse 2 cycles (opacity 0 → 0.8 → 0).

**#3 Compose Morph**
- Composer 2 états : `idle` (pill compact) / `active` (field étendu + send né du bord).
- `Reanimated LayoutAnimation` + `entering: FadeIn.springify()`.
- Bouton send : `scale 0 → 1` + `borderRadius 24 → 999` depuis bord droit.
- Fallback Android mid-range : `withTiming(240)` si FPS < 45.

### Budgets perf — vérifications aux milestones

| Milestone | Mesure | Outil |
|---|---|---|
| Fin spike Day 1 | 3 signatures ≥ 55 fps iPhone 12 | Flipper |
| Fin S5 (setup) | Cold start < 1.8 s iPhone 12 | Xcode Instruments |
| Fin S7 (chat built) | Inbox 200 conv scroll 60 fps | Flipper |
| Avant TestFlight | Bundle < 2 MB · RAM < 120 MB | Metro analyzer · Xcode |

Tout dépassement → investigation immédiate, pas de « on verra au polish ».

---

## 8. Error handling & edge cases

### Taxonomie et réponses UI

| Catégorie | Exemple | UX réponse |
|---|---|---|
| Réseau offline | Pas de connexion au cold start | Inbox rehydrate MMKV + pill « hors ligne » qui glisse en haut |
| Timeout Convex | `sendMessage` > 15 s | Bulle `failed` + tap pour retry |
| Auth expirée | Token refresh failed | Redirect silencieux sign-in avec `?reason=expired` |
| Permission refusée | User refuse notifs onboarding | Skip sans bloquer, re-propose dans Settings |
| WhatsApp provider error | Meta 429/5xx | Bulle `failed` + message inline + retry auto |
| Upload media échec | Photo 20 MB sur 3G | Progress bar + pause + retry exp. |
| App tuée pendant envoi | OS kill, 3 msg en outbox | Cold start → outbox MMKV rehydrate → retry auto |

### Règles d'or

- **Aucune modal système** d'erreur. Toujours inline ou pill glass.
- **Aucun toast sonner stock**. Pills glass qui descendent du notch, max 2.4 s.
- **Aucun écran blanc** sur erreur → skeletons animés + bouton retry subtil.
- **Jamais de double-send** → `clientMessageId` stable (nanoid) dédupe Convex.
- **Jamais de spinner centré plein écran**. Skeletons shimmer < 400 ms.

### Edge cases spécifiques

- **Outbox rehydrate** au cold start : retry `queued` < 5 min auto ; `failed` > 24 h = CTA résolution dans inbox.
- **Outbox scopé par orgId** en clé MMKV. Switch org n'interrompt pas les retries en background.
- **Biométrie** : `expo-local-authentication` détecte absence hardware → skip auto.
- **Notif tap app killed** : deep link `jokko://c/:id` → cold start → auth guard → route directe. TTI cible < 2.5 s.
- **Keyboard** : `KeyboardAvoidingView` exclu. Hook `useKeyboard` + `Reanimated translateY`. Test iPhone SE + Pixel 4a Day 1.
- **Dark mode switch** : tokens réactifs + Zustand slice theme. Transition Reanimated `interpolateColor` 240 ms.
- **WhatsApp 24 h expirée** : `conversation.canReply: false` → composer readonly + CTA « Envoyer un template ».

### Error boundaries & Sentry

- 1 error boundary par segment (`(auth)`, `(onboarding)`, `(main)`, `modals/`).
- Sentry contextes auto : `orgId`, `userId`, `role`, `route`, `lastConvexMutation`.
- Breadcrumbs : navigation, mutations Convex, outbox events, keyboard. Jamais `console.log`.
- **PII scrubbing** : bodies messages jamais envoyés (métadonnées only : convId hash, timestamp, status).

### États vides

- **Inbox vide** : « Vous n'avez pas encore de conversations » + CTA « Scanner QR WhatsApp Business » (lie dashboard web V1, intégré V1.1).
- **Chat vide** : skeleton bulle → « Écrivez le premier message ».
- SVG minimal (1–2 traits Skia). Jamais Undraw, jamais Lottie.

---

## 9. Testing strategy

### Jest + RNTL — modules critiques uniquement

```
__tests__/
├── outbox.store.test.ts
├── compose.store.test.ts
├── mmkv-cache.test.ts
├── hooks/
│   ├── useCurrentOrg.test.ts
│   └── useFeatureAccess.test.ts
└── engine/
    └── formatters.test.ts
```

Pas de tests UI individuels. Tooling : `jest-expo` + `@testing-library/react-native` + Convex mock.

### Maestro — 1 flow E2E canonique

`e2e/canonical.yaml` : sign-in → inbox → ouvrir conv → envoyer message.
Exécution **manuelle** avant chaque release TestFlight. iPhone 15 sim + Pixel 7 émul. < 90 s.

### Flipper — diagnostic ciblé

| Milestone | Session |
|---|---|
| Fin spike Day 1 | FPS + RAM des 3 signatures |
| Fin S5 | Cold start profile |
| Fin S7 | Scroll inbox 200 conv |
| Avant TestFlight | Réseau Convex |

Résultats consignés dans `docs/perf-log.md`.

### Sentry — Day 1 non négociable

- `sentry-expo` configuré dès setup.
- Source maps auto via EAS Build hook.
- Release health : crash-free sessions + users.
- Alerting Slack : new issue + spike > 5 events/10 min.

### Gate avant release

```
[ ] pnpm typecheck           → 0 erreur
[ ] pnpm lint                → 0 warning
[ ] pnpm test                → all green
[ ] maestro test canonical   → iPhone + Pixel
[ ] Flipper check milestone  → budget perf OK
[ ] Sentry issues < 3        → TestFlight précédent
[ ] Changelog manuel         → docs/releases.md
```

Script `scripts/pre-release.sh` orchestre localement.

### Ce qu'on ne teste PAS

- Composants UI isolés, Convex functions backend, deep links réels, performance en CI, accessibility automatique.

---

## 10. Séquence d'exécution (approche Risk-first linear)

| # | Étape | Jours | Livrable |
|---|---|---|---|
| S1 | **Spike 3 signatures** en repo Expo jetable | J+1 → J+4 | Vidéo démo + rapport perf Flipper. Reforge Glass Reply possible ici. |
| S2 | **Vérif région Convex + migration EU** si US | J+5 → J+9 | Deploy Convex EU opérationnel, web redeployé. |
| S3 | **Big-bang monorepo** (web + mobile + packages) | J+10 → J+13 | Monorepo propre, web toujours en prod, CI verte. |
| S4 | **Design tokens + 3 wireframes Excalidraw** | J+14 → J+15 | `packages/tokens` + wireframes sign-in/inbox/chat. |
| S5 | **Setup app/mobile** (Expo, EAS, Sentry, APNs, FCM) | J+16 → J+19 | Build dev qui tourne iOS + Android, Sentry connecté. |
| S6 | **Build Auth + Onboarding** | J+20 → J+24 | Sign-in Email/Google/Apple + onboarding 3 écrans. |
| S7 | **Build Inbox + Chat** (parcours central) | J+25 → J+38 | Inbox virtualisée, chat avec médias + vocal + templates. |
| S8 | **Intégration 3 signatures + polish perf** | J+39 → J+45 | 3 signatures vivantes, budgets perf respectés. |
| S9 | **TestFlight closed + Maestro + hotfix** | J+46 → J+52 | Build TestFlight + Play Internal, flow Maestro passe. |
| S10 | **Case study + teaser vidéo + submission** | J+53 → J+60 | Case study Medium, vidéo 90 s, Dribbble shots, soumissions Awwwards/Apple/Mobbin. |

---

## 11. Open questions (à trancher en cours de route)

1. **Région Convex actuelle** : vérif à lancer avant S2. Si US, la fenêtre S2 se remplit, sinon gain de 4 jours.
2. **Budget designer freelance** (upgrade D7) : décision fin semaine 1, après spike Day 1.
3. **Set auth final** : Magic Link confirmé V1.1, pas V1 (A9).
4. **Livrables §12 du brief d'origine** (case study, teaser vidéo, Dribbble shots, micro-site) : traités en chantier parallèle post-TestFlight closed (S10). Pas dans les 45 jours initiaux.
5. **Domaine deep link** : assume `jokko.app` (A10). À confirmer avant S5 (setup AASA + Asset Links).

---

## 12. Prochaines étapes immédiates (avant S1)

- [ ] Confirmer A10 (domaine `jokko.app`)
- [ ] Vérifier région Convex prod (`pnpx convex dashboard` → Settings)
- [ ] Vérifier accès AppleID Developer + Google Play Console (A2)
- [ ] Vérifier statut Facebook App Review WhatsApp Cloud API sur org prod (A4)
- [ ] Préparer un repo Expo jetable pour le spike (séparé du monorepo principal)
- [ ] Décider budget designer (A6) : fixer seuil budgétaire avant J+4

---

*Fin du document. Toute modification de scope, architecture ou décision doit être versionnée ici.*
