# Design : Multi-numéros WhatsApp par organisation

> Source of truth — validé le 2026-03-10

---

## Understanding Summary

- **Quoi** : Multi-numéros WhatsApp par organisation avec support multi-WABA
- **Pourquoi** : Séparation par département (support, ventes, marketing) + multi-marque (agences) dans un seul compte Jokko
- **Pour qui** : BUSINESS (3 numéros), PRO (10 numéros), ENTERPRISE (custom). FREE/STARTER restent à 1
- **Contacts** : Unifiés par org, conversations séparées par channel, historique cross-numéros
- **Templates** : Partagés par WABA (comportement Meta natif)
- **Flows** : Assignés par channel
- **Broadcasts** : Liés à l'équipe par défaut, override manuel possible (OWNER/ADMIN)
- **Non-goals** : Pas de sous-organisations complètes

---

## Limites par plan

| Plan | Prix | Numéros WhatsApp |
|------|------|-----------------|
| FREE | 0 F CFA | 1 |
| STARTER | 10 000 F CFA/mois | 1 |
| BUSINESS | 30 000 F CFA/mois | 3 |
| PRO | 70 000 F CFA/mois | 10 |
| ENTERPRISE | Custom | Sur mesure |

---

## Schéma de données

### Nouvelles tables

```typescript
// wabas — WhatsApp Business Accounts
wabas: defineTable({
  organizationId: v.id("organizations"),
  metaBusinessAccountId: v.string(),
  accessTokenRef: v.string(),           // référence chiffrée
  label: v.optional(v.string()),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_org", ["organizationId"])
  .index("by_meta_waba_id", ["metaBusinessAccountId"])

// whatsappChannels — chaque numéro WhatsApp connecté
whatsappChannels: defineTable({
  organizationId: v.id("organizations"),
  wabaId: v.id("wabas"),
  primaryTeamId: v.optional(v.id("teams")),
  label: v.string(),
  phoneNumberId: v.string(),
  displayPhoneNumber: v.string(),
  verifiedName: v.optional(v.string()),
  webhookVerifyTokenRef: v.string(),
  isOrgDefault: v.boolean(),
  status: v.union(
    v.literal("pending_setup"),
    v.literal("active"),
    v.literal("disconnected"),
    v.literal("error"),
    v.literal("disabled"),
    v.literal("banned"),
  ),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
  lastConnectedAt: v.optional(v.number()),
  lastWebhookAt: v.optional(v.number()),
})
  .index("by_org", ["organizationId"])
  .index("by_phone_id", ["phoneNumberId"])
  .index("by_org_default", ["organizationId", "isOrgDefault"])
  .index("by_team", ["primaryTeamId"])
  .index("by_waba", ["wabaId"])

// teams — départements/équipes formels
teams: defineTable({
  organizationId: v.id("organizations"),
  name: v.string(),
  description: v.optional(v.string()),
  color: v.optional(v.string()),
  isArchived: v.optional(v.boolean()),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_org", ["organizationId"])

// teamMembers — relation N:N entre users et teams
teamMembers: defineTable({
  teamId: v.id("teams"),
  userId: v.id("users"),
  role: v.union(v.literal("lead"), v.literal("member")),
  joinedAt: v.number(),
})
  .index("by_team", ["teamId"])
  .index("by_user", ["userId"])
  .index("by_team_user", ["teamId", "userId"])
  .index("by_user_team", ["userId", "teamId"])

// webhookEvents — idempotence des webhooks
webhookEvents: defineTable({
  metaEventId: v.string(),
  channelId: v.id("whatsappChannels"),
  eventType: v.union(v.literal("message"), v.literal("status")),
  processedAt: v.number(),
})
  .index("by_event", ["metaEventId", "channelId"])
```

### Tables modifiées

```typescript
// conversations — ajouts
+ channelId: v.optional(v.id("whatsappChannels"))
+ assignedTeamId: v.optional(v.id("teams"))
+ assignedUserId: v.optional(v.id("users"))
// Nouveaux index
.index("by_org_lastMessage", ["organizationId", "lastMessageAt"])
.index("by_assigned_team_lastMessage", ["assignedTeamId", "lastMessageAt"])
.index("by_org_channel_lastMessage", ["organizationId", "channelId", "lastMessageAt"])
.index("by_org_channel_unassigned", ["organizationId", "channelId", "assignedTeamId", "lastMessageAt"])

// flows — ajout
+ channelId: v.optional(v.id("whatsappChannels"))

// broadcasts — ajouts
+ channelId: v.optional(v.id("whatsappChannels"))
+ teamId: v.optional(v.id("teams"))
```

### Garde-fous applicatifs

1. **Un seul `isOrgDefault = true` par organisation** — enforced côté mutation
2. **Membership unique par couple `(teamId, userId)`** — vérification avant insert
3. **Cohérence d'organisation** — team, waba, channel liés doivent appartenir à la même org
4. **Nouvelles conversations = `channelId` obligatoire** — enforced en logique métier

### Champs futurs (non implémentés, gardés en tête)

- `lastErrorCode`, `lastErrorMessage`, `disabledReason` sur `whatsappChannels`

---

## Routage webhook

### Flux entrant

```
POST /api/whatsapp/webhook
  → Recevoir raw body
  → Vérifier HMAC-SHA256 (X-Hub-Signature-256 + App Secret)
    ├── invalide → 401 + log
  → ACK 200 OK
  → Pour chaque entry[].changes[]
      → Extraire phoneNumberId (value.metadata.phone_number_id)
      → Lookup whatsappChannels.by_phone_id(phoneNumberId)
        ├── introuvable ou pas "active" → log + stop
      → MAJ lastWebhookAt (tout événement valide)
      → Pour chaque messages[]
          → scheduler: processWebhookEvent(wamid, "message", payload)
      → Pour chaque statuses[]
          → scheduler: processWebhookEvent(status.id, "status", payload)
```

### Idempotence atomique

```typescript
// Une seule mutation Convex (transactionnelle)
processWebhookEvent = internalMutation({
  handler: async (ctx, { metaEventId, channelId, eventType, payload }) => {
    const existing = await ctx.db.query("webhookEvents")
      .withIndex("by_event", q =>
        q.eq("metaEventId", metaEventId).eq("channelId", channelId))
      .first();
    if (existing) return; // déjà traité
    await ctx.db.insert("webhookEvents", { metaEventId, channelId, eventType, processedAt: Date.now() });
    // ... traitement métier (message ou status)
  }
});
```

### Aiguillage par type

- **messages[]** → créer/MAJ conversation (avec channelId) + stocker message + déclencher flow engine (filtré par channelId)
- **statuses[]** → lookup message sortant par wamid + MAJ statut (sent → delivered → read → failed)
- **autre** → log pour monitoring

### Flux sortant

```
Conversation → channelId → whatsappChannels → wabaId → wabas.accessTokenRef
  → déchiffrer → POST graph.facebook.com/{phoneNumberId}/messages
```

---

## RBAC et visibilité

### Matrice

| Rôle org | Voit | Actions |
|----------|------|---------|
| OWNER | Tout | Tout |
| ADMIN | Tout | Tout sauf suppression org |
| AGENT + team lead | Conversations de ses teams | Répondre, assigner dans sa team, broadcast team |
| AGENT + member | Conversations de ses teams | Répondre uniquement |
| AGENT sans team | Rien | État d'attente |

### Règle de visibilité

```
OWNER / ADMIN → tout
AGENT :
  1. Si conversation.assignedTeamId existe → visible si membre de cette team
  2. Sinon → visible si membre de channel.primaryTeamId (fallback)
```

### Query patterns

**OWNER/ADMIN — inbox globale :**
```typescript
ctx.db.query("conversations")
  .withIndex("by_org_lastMessage", q => q.eq("organizationId", orgId))
  .order("desc").take(50);
```

**AGENT — union de 2 ensembles :**

Ensemble A (conversations assignées à mes teams) :
```typescript
// Par team, via by_assigned_team_lastMessage
.withIndex("by_assigned_team_lastMessage", q => q.eq("assignedTeamId", tid))
.order("desc").take(50)
```

Ensemble B (conversations non assignées des channels de mes teams) :
```typescript
// Par channel, via index dédié avec assignedTeamId = undefined
.withIndex("by_org_channel_unassigned", q =>
  q.eq("organizationId", orgId)
   .eq("channelId", ch._id)
   .eq("assignedTeamId", undefined))
.order("desc").take(50)
```

Puis : merge + dédup + tri par lastMessageAt + pagination.

### Permissions ajoutées

```
teams:create, teams:update, teams:delete, teams:manage_members
channels:create, channels:update, channels:delete, channels:assign_team
conversations:view, conversations:reply, conversations:assign
broadcasts:create, broadcasts:send, broadcasts:override_channel
```

Toutes les mutations sensibles sont validées côté backend (pas de confiance au client). Les workflows internes utilisent `internalMutation` / `internalAction`.

---

## Stratégie de migration

### Phase 1 — Ajout schéma (non-breaking)

- Déployer nouvelles tables + champs optionnels
- Aucun impact sur le code existant

### Phase 2 — Backfill des données

- Orchestration par `internalAction`, org par org
- Pour chaque org avec `whatsapp` configuré :
  1. Créer `wabas` (si pas déjà créé — idempotent)
  2. Créer `whatsappChannels` (si phoneNumberId pas déjà présent — idempotent)
  3. Backfill conversations par lots (`take(200)` + curseur)
  4. Backfill flows par lots
  5. Backfill broadcasts par lots
- État de migration par org : `not_started` → `backfilling` → `dual_read` → `migrated`
- Script ré-exécutable sans doublons

### Phase 3 — Bascule du code

- Webhook lookup : `whatsappChannels.by_phone_id` remplace `organizations.by_whatsapp_phone_id`
- Envoi messages : credentials depuis `whatsappChannels` + `wabas`
- Queries conversations : nouveaux index
- Fallback temporaire : si `channelId === undefined`, utiliser channel `isOrgDefault`
- Fallback observable : monitoring du nombre de docs sans channelId par org

### Phase 4 — Nettoyage

- Supprimer `organizations.whatsapp` et index `by_whatsapp_phone_id`
- Rendre `channelId` obligatoire en logique métier
- Retirer le fallback transitoire

---

## Assumptions

1. Convex garantit l'atomicité des mutations (transactionnelles, isolées)
2. Le chiffrement des tokens se fera en applicatif (pas de KMS natif Convex)
3. La purge de `webhookEvents` se fera par cron (TTL ~48h)
4. Les limites de channels par plan seront vérifiées côté mutation
5. Une même Meta App n'a qu'un seul endpoint webhook configuré, mais plusieurs WABA peuvent être abonnés à cette app ; on peut aussi utiliser des webhook overrides au niveau WABA / numéro si nécessaire

---

## Decision Log

| # | Décision | Alternatives considérées | Raison |
|---|----------|------------------------|--------|
| 1 | Table `whatsappChannels` séparée | Array dans orgs, tout dans teams | Extensible, indexable, découplé |
| 2 | Table `wabas` dédiée | businessAccountId inline dans channels | Templates par WABA, métadonnées séparées, multi-WABA propre |
| 3 | Table `teams` + `teamMembers` (N:N) | Réutiliser memberships existant | Concept formel, agents multi-teams, découplé des rôles org |
| 4 | `primaryTeamId` sur channel | `teamId` strict | Permet l'évolution vers multi-teams par channel |
| 5 | `assignedTeamId` sur conversations | Visibilité uniquement via channel.primaryTeamId | Transferts inter-équipes propres |
| 6 | `accessTokenRef` au niveau WABA | Token par channel | Un WABA = un token Meta, pas un par numéro |
| 7 | Index dédié `by_org_channel_unassigned` | Filtre applicatif post-index | Performance Convex, pas de scan inutile |
| 8 | ACK webhook après signature, avant traitement | ACK avant signature / traitement sync | Sécurité + Meta exige réponse rapide |
| 9 | Idempotence atomique (check+insert même mutation) | Check puis insert séparé | Pas de race condition (garantie Convex) |
| 10 | Migration 4 phases, chunked, idempotente | Big bang | Zero downtime, ré-exécutable, observable |

---

## Risques et mitigations

| Risque | Mitigation |
|--------|-----------|
| Migration lente sur grosses orgs | Backfill chunké, paginé, org par org |
| Fallback `channelId=undefined` permanent | Flag migration observable, monitoring, suppression planifiée |
| Complexité query agent (2 ensembles + merge) | Index dédiés, pagination Convex, merge léger en mémoire |
| Rotation de tokens WABA | `accessTokenRef` découplé, rotation sans toucher aux channels |
| Channel banni → impact utilisateur | Isolation par channel, statut indépendant, alertes |

---

## Plan d'implémentation

### Etape 1 — Schéma + tables de base (fondations)

- [ ] Ajouter les tables `wabas`, `whatsappChannels`, `teams`, `teamMembers`, `webhookEvents` dans `convex/schema.ts`
- [ ] Ajouter `channelId`, `assignedTeamId`, `assignedUserId` (optionnels) sur `conversations`, `flows`, `broadcasts`
- [ ] Ajouter les nouveaux index sur `conversations`
- [ ] Ajouter le helper `getMaxChannels(plan)` dans `convex/billing.ts`
- [ ] Déployer — aucun impact sur l'existant

### Etape 2 — Teams CRUD + UI

- [ ] Mutations : `createTeam`, `updateTeam`, `archiveTeam`, `addTeamMember`, `removeTeamMember`
- [ ] Garde-fous : membership unique, cohérence org, permissions RBAC
- [ ] UI : page Settings > Teams (liste, création, gestion membres)
- [ ] Hook `useTeams()` / `useMyTeams()`

### Etape 3 — Channels CRUD + onboarding multi-numéro

- [ ] Mutations : `createChannel`, `updateChannel`, `disableChannel`, `setOrgDefault`
- [ ] Garde-fou : `isOrgDefault` unique par org, limite par plan
- [ ] Adapter le flow Facebook Embedded Signup pour créer `wabas` + `whatsappChannels`
- [ ] UI : page Settings > WhatsApp Channels (liste, ajout, assignation team, statut)

### Etape 4 — Migration des données existantes

- [ ] Script `internalAction` : migration org par org, chunked, idempotent
- [ ] État de migration par org (`not_started` → `backfilling` → `dual_read` → `migrated`)
- [ ] Backfill conversations, flows, broadcasts par lots
- [ ] Monitoring : compteurs de docs sans `channelId`

### Etape 5 — Bascule webhook + envoi messages

- [ ] Refactorer `convex/http.ts` : lookup par `whatsappChannels.by_phone_id`
- [ ] Ajouter l'aiguillage messages/statuses + idempotence atomique
- [ ] Refactorer `convex/whatsapp_actions.ts` : credentials depuis channel + waba
- [ ] Refactorer `convex/engine.ts` : flows filtrés par `channelId`
- [ ] Fallback temporaire observable pour les conversations sans `channelId`

### Etape 6 — Inbox multi-channel + RBAC

- [ ] Refactorer les queries conversations avec les nouveaux index
- [ ] Query pattern OWNER/ADMIN (index `by_org_lastMessage`)
- [ ] Query pattern AGENT (ensembles A + B, merge, dédup)
- [ ] Sidebar : filtre par channel, badge équipe
- [ ] Assignation de conversation à une team / un agent
- [ ] Broadcasts : sélection du channel d'envoi

### Post-déploiement (Phase 4 migration)

- [ ] Supprimer `organizations.whatsapp` + ancien index
- [ ] Retirer le fallback transitoire
- [ ] Cron de purge `webhookEvents` (TTL 48h)
