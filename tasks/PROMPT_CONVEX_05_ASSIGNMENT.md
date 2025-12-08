# PROMPT CONVEX 05 - SYSTÈME D'ASSIGNATION

> **Module** : Assignment System (Départements, Agents, Routing)  
> **Stack** : Convex + Next.js 16 + TypeScript  
> **Dépendances** : Module 01 (Auth), Module 03 (Team), Module 04 (Conversations)  
> **Objectif** : Système intelligent d'assignation des conversations aux agents

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Schéma Convex](#schéma-convex)
4. [Règles de Visibilité](#règles-de-visibilité)
5. [Stratégies d'Assignation](#stratégies-dassignation)
6. [Routing Automatique](#routing-automatique)
7. [Queries et Mutations](#queries-et-mutations)
8. [Actions Temps Réel](#actions-temps-réel)
9. [Disponibilité des Agents](#disponibilité-des-agents)
10. [Transfert et Escalade](#transfert-et-escalade)
11. [Analytics](#analytics)
12. [Composants UI](#composants-ui)

---

## 🎯 Vue d'ensemble

### Objectifs du Système

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         SYSTÈME D'ASSIGNATION JOKKO                           ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  🎯 OBJECTIFS                                                                 ║
║  ─────────────                                                                ║
║  • Distribuer équitablement les conversations entre agents                    ║
║  • Router intelligemment selon compétences et disponibilité                   ║
║  • Garantir la confidentialité (agents voient SEULEMENT leurs conversations)  ║
║  • Permettre transferts et escalades fluides                                  ║
║  • Optimiser les temps de réponse                                             ║
║                                                                               ║
║  👥 RÔLES ET VISIBILITÉ                                                       ║
║  ─────────────────────────                                                    ║
║  • OWNER     → Voit TOUTES les conversations                                  ║
║  • ADMIN     → Voit TOUTES les conversations                                  ║
║  • MANAGER   → Voit les conversations de ses départements                     ║
║  • AGENT     → Voit SEULEMENT ses conversations assignées                     ║
║                                                                               ║
║  🔄 MODES D'ASSIGNATION                                                       ║
║  ──────────────────────                                                       ║
║  • MANUAL    → Assignation manuelle par admin/manager                         ║
║  • AUTO      → Round-robin ou load balancing automatique                      ║
║  • HYBRID    → Auto avec possibilité de réassignation manuelle                ║
║  • AI        → Routing intelligent basé sur le contenu du message             ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Flux d'Assignation

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  NOUVEAU MSG    │────▶│  ROUTING ENGINE │────▶│  ASSIGNATION    │
│  (WhatsApp)     │     │  (Convex)       │     │  (Agent)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                 ┌─────────────────────────┐
                 │   RÈGLES DE ROUTING     │
                 ├─────────────────────────┤
                 │ 1. Contact déjà assigné?│
                 │ 2. Département détecté? │
                 │ 3. Mots-clés match?     │
                 │ 4. Disponibilité agent? │
                 │ 5. Charge de travail?   │
                 └─────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │ ROUND ROBIN │      │LOAD BALANCE │      │  AI ROUTING │
   │ (Séquentiel)│      │(Moins chargé)│      │ (Intelligent)│
   └─────────────┘      └─────────────┘      └─────────────┘
```

---

## 🏗️ Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        ARCHITECTURE ASSIGNMENT SYSTEM                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                           CONVEX DATABASE                               │  ║
║  ├─────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                         │  ║
║  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  ║
║  │  │ departments │  │   agents    │  │   rules     │  │  queues     │    │  ║
║  │  │             │  │             │  │             │  │             │    │  ║
║  │  │ • name      │  │ • memberId  │  │ • priority  │  │ • deptId    │    │  ║
║  │  │ • schedule  │  │ • depts[]   │  │ • keywords  │  │ • pending[] │    │  ║
║  │  │ • routing   │  │ • status    │  │ • action    │  │ • stats     │    │  ║
║  │  │ • fallback  │  │ • capacity  │  │ • schedule  │  │             │    │  ║
║  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │  ║
║  │                                                                         │  ║
║  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │  ║
║  │  │ assignments │  │  transfers  │  │  analytics  │                     │  ║
║  │  │             │  │             │  │             │  ┌─────────────┐    │  ║
║  │  │ • convId    │  │ • from      │  │ • agentId   │  │conversations│    │  ║
║  │  │ • agentId   │  │ • to        │  │ • metrics   │  │             │    │  ║
║  │  │ • status    │  │ • reason    │  │ • date      │  │ • assignedTo│    │  ║
║  │  │ • history   │  │ • timestamp │  │             │  │ • deptId    │    │  ║
║  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │  ║
║  │                                                                         │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                         ROUTING ENGINE                                  │  ║
║  ├─────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                         │  ║
║  │  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐           │  ║
║  │  │ Rule Matcher  │───▶│ Agent Finder  │───▶│ Load Balancer │           │  ║
║  │  │               │    │               │    │               │           │  ║
║  │  │ • Keywords    │    │ • Available   │    │ • Round Robin │           │  ║
║  │  │ • Contact     │    │ • In Dept     │    │ • Least Busy  │           │  ║
║  │  │ • Schedule    │    │ • Has Skills  │    │ • Random      │           │  ║
║  │  └───────────────┘    └───────────────┘    └───────────────┘           │  ║
║  │                                                                         │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📊 Schéma Convex

### convex/schema.ts

```typescript
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// ============================================
// AGENT STATUS
// ============================================

const agentStatus = v.union(
  v.literal('ONLINE'),      // Disponible
  v.literal('BUSY'),        // En conversation
  v.literal('AWAY'),        // Absent temporaire
  v.literal('OFFLINE'),     // Hors ligne
  v.literal('DND')          // Ne pas déranger
)

// ============================================
// ASSIGNMENT STATUS
// ============================================

const assignmentStatus = v.union(
  v.literal('PENDING'),     // En attente d'acceptation
  v.literal('ACTIVE'),      // Assigné et actif
  v.literal('PAUSED'),      // Mis en pause
  v.literal('COMPLETED'),   // Terminé
  v.literal('TRANSFERRED'), // Transféré
  v.literal('ESCALATED')    // Escaladé
)

// ============================================
// ROUTING STRATEGY
// ============================================

const routingStrategy = v.union(
  v.literal('ROUND_ROBIN'),   // Séquentiel
  v.literal('LEAST_BUSY'),    // Moins chargé
  v.literal('RANDOM'),        // Aléatoire
  v.literal('SKILLS_BASED'),  // Basé sur compétences
  v.literal('PRIORITY'),      // Par priorité agent
  v.literal('STICKY')         // Même agent si possible
)

// ============================================
// RULE CONDITION TYPE
// ============================================

const conditionType = v.union(
  v.literal('KEYWORD'),       // Mot-clé dans message
  v.literal('CONTACT_TAG'),   // Tag du contact
  v.literal('CONTACT_FIELD'), // Champ du contact
  v.literal('TIME_RANGE'),    // Plage horaire
  v.literal('DAY_OF_WEEK'),   // Jour de semaine
  v.literal('CHANNEL'),       // Canal (WhatsApp, etc.)
  v.literal('LANGUAGE'),      // Langue détectée
  v.literal('SENTIMENT'),     // Sentiment du message
  v.literal('INTENT')         // Intent AI détecté
)

export default defineSchema({
  // ============================================
  // DEPARTMENTS TABLE
  // ============================================
  
  departments: defineTable({
    organizationId: v.id('organizations'),
    
    // Basic info
    name: v.string(),
    nameFr: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    
    // Routing configuration
    routingStrategy: routingStrategy,
    autoAssign: v.boolean(),
    maxQueueSize: v.optional(v.number()),
    maxWaitTimeMinutes: v.optional(v.number()),
    
    // Working hours
    schedule: v.optional(v.object({
      enabled: v.boolean(),
      timezone: v.string(),
      slots: v.array(v.object({
        dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
        startTime: v.string(), // "09:00"
        endTime: v.string(),   // "18:00"
      })),
    })),
    
    // Fallback when no agents available
    fallback: v.optional(v.object({
      type: v.union(
        v.literal('QUEUE'),       // Mettre en file d'attente
        v.literal('DEPARTMENT'),  // Rediriger vers autre dept
        v.literal('AUTO_REPLY'),  // Message automatique
        v.literal('ESCALATE')     // Escalader
      ),
      targetDepartmentId: v.optional(v.id('departments')),
      autoReplyMessage: v.optional(v.string()),
    })),
    
    // SLA settings
    sla: v.optional(v.object({
      firstResponseMinutes: v.number(),
      resolutionMinutes: v.number(),
      warningThresholdPercent: v.number(),
    })),
    
    // Priority
    priority: v.number(), // 1-10, higher = more important
    
    // Status
    isActive: v.boolean(),
    isDefault: v.boolean(), // Département par défaut
    
    // Stats cache
    activeConversations: v.number(),
    queuedConversations: v.number(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_org_and_active', ['organizationId', 'isActive'])
    .index('by_org_and_default', ['organizationId', 'isDefault']),

  // ============================================
  // AGENTS TABLE (Agent-specific settings)
  // ============================================
  
  agents: defineTable({
    organizationId: v.id('organizations'),
    memberId: v.id('members'),
    
    // Department assignments
    departmentIds: v.array(v.id('departments')),
    primaryDepartmentId: v.optional(v.id('departments')),
    
    // Skills/Tags for skills-based routing
    skills: v.optional(v.array(v.string())),
    languages: v.optional(v.array(v.string())),
    
    // Status
    status: agentStatus,
    statusMessage: v.optional(v.string()),
    statusUpdatedAt: v.number(),
    
    // Capacity
    maxConcurrentChats: v.number(),
    currentActiveChats: v.number(),
    
    // Priority in routing (higher = gets more chats)
    routingPriority: v.number(), // 1-10
    
    // Auto-assignment settings
    autoAccept: v.boolean(), // Accept assignments automatically
    acceptNewChats: v.boolean(), // Currently accepting new chats
    
    // Working hours override (if different from department)
    scheduleOverride: v.optional(v.object({
      enabled: v.boolean(),
      timezone: v.string(),
      slots: v.array(v.object({
        dayOfWeek: v.number(),
        startTime: v.string(),
        endTime: v.string(),
      })),
    })),
    
    // Performance metrics (cached)
    metrics: v.optional(v.object({
      averageResponseTime: v.number(), // seconds
      averageResolutionTime: v.number(),
      satisfactionScore: v.number(), // 0-100
      conversationsToday: v.number(),
      conversationsThisWeek: v.number(),
    })),
    
    // Last activity
    lastActivityAt: v.number(),
    lastAssignedAt: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_member', ['memberId'])
    .index('by_org_and_status', ['organizationId', 'status'])
    .index('by_department', ['departmentIds']),

  // ============================================
  // ROUTING RULES TABLE
  // ============================================
  
  routingRules: defineTable({
    organizationId: v.id('organizations'),
    
    // Basic info
    name: v.string(),
    description: v.optional(v.string()),
    
    // Priority (lower = checked first)
    priority: v.number(),
    
    // Conditions (AND logic between conditions)
    conditions: v.array(v.object({
      type: conditionType,
      field: v.optional(v.string()), // For CONTACT_FIELD
      operator: v.union(
        v.literal('EQUALS'),
        v.literal('NOT_EQUALS'),
        v.literal('CONTAINS'),
        v.literal('NOT_CONTAINS'),
        v.literal('STARTS_WITH'),
        v.literal('ENDS_WITH'),
        v.literal('GREATER_THAN'),
        v.literal('LESS_THAN'),
        v.literal('IN'),
        v.literal('NOT_IN'),
        v.literal('REGEX')
      ),
      value: v.union(v.string(), v.number(), v.array(v.string())),
      caseSensitive: v.optional(v.boolean()),
    })),
    
    // Action when rule matches
    action: v.object({
      type: v.union(
        v.literal('ASSIGN_DEPARTMENT'),
        v.literal('ASSIGN_AGENT'),
        v.literal('ADD_TAG'),
        v.literal('SET_PRIORITY'),
        v.literal('AUTO_REPLY'),
        v.literal('ESCALATE')
      ),
      departmentId: v.optional(v.id('departments')),
      agentId: v.optional(v.id('agents')),
      tagName: v.optional(v.string()),
      priority: v.optional(v.number()),
      autoReplyTemplateId: v.optional(v.id('templates')),
    }),
    
    // Schedule (when rule is active)
    schedule: v.optional(v.object({
      enabled: v.boolean(),
      timezone: v.string(),
      slots: v.array(v.object({
        dayOfWeek: v.number(),
        startTime: v.string(),
        endTime: v.string(),
      })),
    })),
    
    // Status
    isActive: v.boolean(),
    
    // Stats
    matchCount: v.number(),
    lastMatchedAt: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_org_and_active', ['organizationId', 'isActive'])
    .index('by_org_and_priority', ['organizationId', 'priority']),

  // ============================================
  // ASSIGNMENTS TABLE
  // ============================================
  
  assignments: defineTable({
    organizationId: v.id('organizations'),
    conversationId: v.id('conversations'),
    
    // Current assignment
    agentId: v.optional(v.id('agents')),
    departmentId: v.optional(v.id('departments')),
    
    // Status
    status: assignmentStatus,
    
    // Assignment metadata
    assignedBy: v.union(
      v.literal('SYSTEM'),      // Auto-assigned
      v.literal('MANUAL'),      // Manually by admin/manager
      v.literal('TRANSFER'),    // Via transfer
      v.literal('ESCALATION'),  // Via escalation
      v.literal('RULE')         // Via routing rule
    ),
    assignedByMemberId: v.optional(v.id('members')),
    ruleId: v.optional(v.id('routingRules')),
    
    // Timing
    assignedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    firstResponseAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    
    // SLA tracking
    slaBreached: v.boolean(),
    slaBreachType: v.optional(v.union(
      v.literal('FIRST_RESPONSE'),
      v.literal('RESOLUTION')
    )),
    
    // Notes
    internalNotes: v.optional(v.string()),
    
    // History of changes
    history: v.array(v.object({
      action: v.string(),
      fromAgentId: v.optional(v.id('agents')),
      toAgentId: v.optional(v.id('agents')),
      fromDepartmentId: v.optional(v.id('departments')),
      toDepartmentId: v.optional(v.id('departments')),
      reason: v.optional(v.string()),
      performedBy: v.optional(v.id('members')),
      timestamp: v.number(),
    })),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_conversation', ['conversationId'])
    .index('by_agent', ['agentId'])
    .index('by_department', ['departmentId'])
    .index('by_org_and_status', ['organizationId', 'status'])
    .index('by_agent_and_status', ['agentId', 'status']),

  // ============================================
  // ASSIGNMENT QUEUE TABLE
  // ============================================
  
  assignmentQueue: defineTable({
    organizationId: v.id('organizations'),
    departmentId: v.id('departments'),
    conversationId: v.id('conversations'),
    
    // Queue position
    position: v.number(),
    priority: v.number(), // Higher = more urgent
    
    // Timing
    queuedAt: v.number(),
    estimatedWaitMinutes: v.optional(v.number()),
    
    // Attempts
    assignmentAttempts: v.number(),
    lastAttemptAt: v.optional(v.number()),
    lastAttemptError: v.optional(v.string()),
    
    // Contact info for display
    contactName: v.optional(v.string()),
    contactPhone: v.string(),
    lastMessagePreview: v.optional(v.string()),
    
    // Status
    status: v.union(
      v.literal('WAITING'),
      v.literal('ASSIGNING'),
      v.literal('ASSIGNED'),
      v.literal('EXPIRED'),
      v.literal('CANCELLED')
    ),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_department', ['departmentId'])
    .index('by_organization', ['organizationId'])
    .index('by_dept_and_status', ['departmentId', 'status'])
    .index('by_dept_and_position', ['departmentId', 'position']),

  // ============================================
  // TRANSFERS TABLE
  // ============================================
  
  transfers: defineTable({
    organizationId: v.id('organizations'),
    conversationId: v.id('conversations'),
    assignmentId: v.id('assignments'),
    
    // From
    fromAgentId: v.optional(v.id('agents')),
    fromDepartmentId: v.optional(v.id('departments')),
    
    // To
    toAgentId: v.optional(v.id('agents')),
    toDepartmentId: v.optional(v.id('departments')),
    
    // Type
    type: v.union(
      v.literal('TRANSFER'),    // Simple transfer
      v.literal('ESCALATION'),  // Escalation to supervisor
      v.literal('HANDOFF')      // Shift handoff
    ),
    
    // Reason
    reason: v.string(),
    reasonCategory: v.optional(v.union(
      v.literal('SKILL_MISMATCH'),
      v.literal('WORKLOAD'),
      v.literal('CUSTOMER_REQUEST'),
      v.literal('SHIFT_END'),
      v.literal('ESCALATION'),
      v.literal('OTHER')
    )),
    
    // Status
    status: v.union(
      v.literal('PENDING'),
      v.literal('ACCEPTED'),
      v.literal('REJECTED'),
      v.literal('CANCELLED'),
      v.literal('EXPIRED')
    ),
    
    // Timing
    requestedAt: v.number(),
    respondedAt: v.optional(v.number()),
    expiresAt: v.number(),
    
    // Initiated by
    requestedByMemberId: v.id('members'),
    
    // Response
    responseNote: v.optional(v.string()),
    
    createdAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_conversation', ['conversationId'])
    .index('by_to_agent', ['toAgentId', 'status'])
    .index('by_from_agent', ['fromAgentId']),

  // ============================================
  // AGENT ANALYTICS TABLE
  // ============================================
  
  agentAnalytics: defineTable({
    agentId: v.id('agents'),
    organizationId: v.id('organizations'),
    date: v.string(), // 'YYYY-MM-DD'
    
    // Volume
    conversationsAssigned: v.number(),
    conversationsCompleted: v.number(),
    conversationsTransferred: v.number(),
    messagesReceived: v.number(),
    messagesSent: v.number(),
    
    // Time metrics (in seconds)
    totalHandleTime: v.number(),
    averageHandleTime: v.number(),
    totalResponseTime: v.number(),
    averageFirstResponseTime: v.number(),
    averageResponseTime: v.number(),
    
    // Online time
    onlineMinutes: v.number(),
    busyMinutes: v.number(),
    awayMinutes: v.number(),
    
    // Quality
    satisfactionResponses: v.number(),
    satisfactionTotal: v.number(), // Sum of scores
    satisfactionAverage: v.number(),
    
    // SLA
    slaBreaches: v.number(),
    slaCompliance: v.number(), // percentage
    
    // By hour breakdown
    hourlyBreakdown: v.optional(v.array(v.object({
      hour: v.number(), // 0-23
      conversations: v.number(),
      messages: v.number(),
      avgResponseTime: v.number(),
    }))),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_agent', ['agentId'])
    .index('by_agent_and_date', ['agentId', 'date'])
    .index('by_organization_and_date', ['organizationId', 'date']),

  // ============================================
  // DEPARTMENT ANALYTICS TABLE
  // ============================================
  
  departmentAnalytics: defineTable({
    departmentId: v.id('departments'),
    organizationId: v.id('organizations'),
    date: v.string(), // 'YYYY-MM-DD'
    
    // Volume
    conversationsReceived: v.number(),
    conversationsCompleted: v.number(),
    conversationsEscalated: v.number(),
    
    // Queue metrics
    averageQueueTime: v.number(), // seconds
    maxQueueTime: v.number(),
    queueAbandoned: v.number(),
    
    // Response metrics
    averageFirstResponseTime: v.number(),
    averageResolutionTime: v.number(),
    
    // SLA
    slaBreaches: v.number(),
    slaCompliance: v.number(),
    
    // Agent metrics
    activeAgents: v.number(),
    averageAgentUtilization: v.number(), // percentage
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_department', ['departmentId'])
    .index('by_department_and_date', ['departmentId', 'date'])
    .index('by_organization_and_date', ['organizationId', 'date']),
})
```

---

## 👁️ Règles de Visibilité

### convex/lib/visibility.ts

```typescript
import { Id } from '../_generated/dataModel'

// ============================================
// VISIBILITY MATRIX
// ============================================

/**
 * RÈGLES DE VISIBILITÉ DES CONVERSATIONS
 * 
 * OWNER/ADMIN:
 *   → Voient TOUTES les conversations de l'organisation
 *   → Peuvent assigner/réassigner n'importe quelle conversation
 * 
 * MANAGER:
 *   → Voient les conversations de LEURS départements
 *   → Voient les conversations non assignées (file d'attente)
 *   → Peuvent assigner aux agents de leurs départements
 * 
 * AGENT:
 *   → Voient UNIQUEMENT les conversations qui leur sont assignées
 *   → Voient les conversations en file d'attente de leurs départements (si autorisé)
 *   → NE PEUVENT PAS voir les conversations des autres agents
 */

export type VisibilityLevel = 'ALL' | 'DEPARTMENT' | 'ASSIGNED_ONLY' | 'NONE'

export interface VisibilityContext {
  memberId: Id<'members'>
  organizationId: Id<'organizations'>
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT'
  agentId?: Id<'agents'>
  departmentIds: Id<'departments'>[]
}

export function getVisibilityLevel(role: string): VisibilityLevel {
  switch (role) {
    case 'OWNER':
    case 'ADMIN':
      return 'ALL'
    case 'MANAGER':
      return 'DEPARTMENT'
    case 'AGENT':
      return 'ASSIGNED_ONLY'
    default:
      return 'NONE'
  }
}

// ============================================
// CONVERSATION VISIBILITY CHECK
// ============================================

export interface ConversationForVisibility {
  organizationId: Id<'organizations'>
  assignedToAgentId?: Id<'agents'>
  departmentId?: Id<'departments'>
  status: string
}

export function canViewConversation(
  context: VisibilityContext,
  conversation: ConversationForVisibility
): boolean {
  // Must be same organization
  if (conversation.organizationId !== context.organizationId) {
    return false
  }

  const level = getVisibilityLevel(context.role)

  switch (level) {
    case 'ALL':
      // Owner/Admin can see everything
      return true

    case 'DEPARTMENT':
      // Manager can see:
      // 1. Conversations in their departments
      // 2. Unassigned conversations in their departments
      if (!conversation.departmentId) {
        return false // Need department for managers
      }
      return context.departmentIds.includes(conversation.departmentId)

    case 'ASSIGNED_ONLY':
      // Agent can only see conversations assigned to them
      if (!context.agentId) {
        return false
      }
      return conversation.assignedToAgentId === context.agentId

    case 'NONE':
    default:
      return false
  }
}

// ============================================
// BUILD VISIBILITY FILTER
// ============================================

export function buildConversationFilter(context: VisibilityContext) {
  const level = getVisibilityLevel(context.role)

  switch (level) {
    case 'ALL':
      return {
        type: 'organization' as const,
        organizationId: context.organizationId,
      }

    case 'DEPARTMENT':
      return {
        type: 'departments' as const,
        organizationId: context.organizationId,
        departmentIds: context.departmentIds,
      }

    case 'ASSIGNED_ONLY':
      return {
        type: 'agent' as const,
        organizationId: context.organizationId,
        agentId: context.agentId!,
      }

    default:
      return {
        type: 'none' as const,
      }
  }
}

// ============================================
// CAN ASSIGN CHECK
// ============================================

export function canAssignConversation(
  context: VisibilityContext,
  conversation: ConversationForVisibility,
  targetAgentId?: Id<'agents'>,
  targetDepartmentId?: Id<'departments'>
): { allowed: boolean; reason?: string } {
  const level = getVisibilityLevel(context.role)

  switch (level) {
    case 'ALL':
      // Owner/Admin can assign anything to anyone
      return { allowed: true }

    case 'DEPARTMENT':
      // Manager can assign within their departments
      if (targetDepartmentId && !context.departmentIds.includes(targetDepartmentId)) {
        return {
          allowed: false,
          reason: 'Vous ne pouvez assigner que dans vos départements',
        }
      }
      // Check if conversation is in their department
      if (conversation.departmentId && !context.departmentIds.includes(conversation.departmentId)) {
        return {
          allowed: false,
          reason: 'Cette conversation n\'est pas dans vos départements',
        }
      }
      return { allowed: true }

    case 'ASSIGNED_ONLY':
      // Agent cannot assign (only transfer)
      return {
        allowed: false,
        reason: 'Les agents ne peuvent pas assigner de conversations',
      }

    default:
      return { allowed: false, reason: 'Permission refusée' }
  }
}

// ============================================
// CAN TRANSFER CHECK
// ============================================

export function canTransferConversation(
  context: VisibilityContext,
  conversation: ConversationForVisibility
): { allowed: boolean; reason?: string } {
  // Must be assigned to request transfer
  if (context.role === 'AGENT') {
    if (conversation.assignedToAgentId !== context.agentId) {
      return {
        allowed: false,
        reason: 'Vous ne pouvez transférer que vos propres conversations',
      }
    }
  }

  return { allowed: true }
}
```

### convex/conversations/queries.ts (avec visibilité)

```typescript
import { query } from '../_generated/server'
import { v } from 'convex/values'
import { buildConversationFilter, canViewConversation } from '../lib/visibility'

// ============================================
// LIST CONVERSATIONS (WITH VISIBILITY)
// ============================================

export const list = query({
  args: {
    organizationId: v.id('organizations'),
    status: v.optional(v.string()),
    departmentId: v.optional(v.id('departments')),
    agentId: v.optional(v.id('agents')),
    unassigned: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user context
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const member = await ctx.db
      .query('members')
      .withIndex('by_user_and_org', (q) =>
        q.eq('userId', identity.subject).eq('organizationId', args.organizationId)
      )
      .unique()

    if (!member) throw new Error('Not a member of this organization')

    // Get agent info if exists
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_member', (q) => q.eq('memberId', member._id))
      .unique()

    // Build visibility context
    const visibilityContext = {
      memberId: member._id,
      organizationId: args.organizationId,
      role: member.role as 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT',
      agentId: agent?._id,
      departmentIds: agent?.departmentIds || [],
    }

    // Get filter based on visibility
    const filter = buildConversationFilter(visibilityContext)

    // Query conversations based on filter type
    let conversations: any[] = []

    if (filter.type === 'organization') {
      conversations = await ctx.db
        .query('conversations')
        .withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
        .collect()
    } else if (filter.type === 'departments') {
      // Query for each department
      const deptConversations = await Promise.all(
        filter.departmentIds.map((deptId) =>
          ctx.db
            .query('conversations')
            .withIndex('by_department', (q) => q.eq('departmentId', deptId))
            .collect()
        )
      )
      conversations = deptConversations.flat()
    } else if (filter.type === 'agent') {
      conversations = await ctx.db
        .query('conversations')
        .withIndex('by_assigned_agent', (q) => q.eq('assignedToAgentId', filter.agentId))
        .collect()
    }

    // Apply additional filters
    if (args.status) {
      conversations = conversations.filter((c) => c.status === args.status)
    }

    if (args.departmentId) {
      conversations = conversations.filter((c) => c.departmentId === args.departmentId)
    }

    if (args.agentId) {
      conversations = conversations.filter((c) => c.assignedToAgentId === args.agentId)
    }

    if (args.unassigned) {
      conversations = conversations.filter((c) => !c.assignedToAgentId)
    }

    // Sort by last message time
    conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt)

    // Apply limit
    const limit = args.limit || 50
    conversations = conversations.slice(0, limit)

    // Enrich with agent and contact info
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const contact = conv.contactId ? await ctx.db.get(conv.contactId) : null
        const assignedAgent = conv.assignedToAgentId
          ? await ctx.db.get(conv.assignedToAgentId)
          : null
        const assignedMember = assignedAgent?.memberId
          ? await ctx.db.get(assignedAgent.memberId)
          : null

        return {
          ...conv,
          contact: contact
            ? { name: contact.name, phone: contact.phone, avatarUrl: contact.avatarUrl }
            : null,
          assignedAgent: assignedMember
            ? { name: assignedMember.name, avatarUrl: assignedMember.avatarUrl }
            : null,
        }
      })
    )

    return {
      conversations: enriched,
      visibility: filter.type,
    }
  },
})

// ============================================
// GET MY CONVERSATIONS (AGENT VIEW)
// ============================================

export const getMyConversations = query({
  args: {
    organizationId: v.id('organizations'),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const member = await ctx.db
      .query('members')
      .withIndex('by_user_and_org', (q) =>
        q.eq('userId', identity.subject).eq('organizationId', args.organizationId)
      )
      .unique()

    if (!member) throw new Error('Not a member')

    const agent = await ctx.db
      .query('agents')
      .withIndex('by_member', (q) => q.eq('memberId', member._id))
      .unique()

    if (!agent) throw new Error('Not an agent')

    // Get only MY assigned conversations
    let conversations = await ctx.db
      .query('conversations')
      .withIndex('by_assigned_agent', (q) => q.eq('assignedToAgentId', agent._id))
      .collect()

    if (args.status) {
      conversations = conversations.filter((c) => c.status === args.status)
    }

    // Group by status
    const active = conversations.filter((c) => c.status === 'ACTIVE')
    const pending = conversations.filter((c) => c.status === 'PENDING')
    const resolved = conversations.filter((c) => c.status === 'RESOLVED')

    return {
      active: active.sort((a, b) => b.lastMessageAt - a.lastMessageAt),
      pending: pending.sort((a, b) => b.lastMessageAt - a.lastMessageAt),
      resolved: resolved.sort((a, b) => b.lastMessageAt - a.lastMessageAt).slice(0, 20),
      counts: {
        active: active.length,
        pending: pending.length,
        total: conversations.length,
      },
    }
  },
})
```

---

## 🎯 Stratégies d'Assignation

### convex/lib/routing.ts

```typescript
import { Id, Doc } from '../_generated/dataModel'

// ============================================
// TYPES
// ============================================

export interface RoutingContext {
  organizationId: Id<'organizations'>
  conversationId: Id<'conversations'>
  contactId?: Id<'contacts'>
  departmentId?: Id<'departments'>
  messageContent?: string
  contactTags?: string[]
  currentTime: Date
}

export interface AvailableAgent {
  agentId: Id<'agents'>
  memberId: Id<'members'>
  name: string
  status: string
  currentActiveChats: number
  maxConcurrentChats: number
  routingPriority: number
  lastAssignedAt?: number
  skills: string[]
  languages: string[]
}

export interface RoutingResult {
  success: boolean
  agentId?: Id<'agents'>
  departmentId?: Id<'departments'>
  reason: string
  queuePosition?: number
}

// ============================================
// ROUTING STRATEGIES
// ============================================

export function selectAgentRoundRobin(
  agents: AvailableAgent[],
  departmentId: Id<'departments'>
): AvailableAgent | null {
  if (agents.length === 0) return null

  // Filter available agents
  const available = agents.filter(
    (a) => a.status === 'ONLINE' && a.currentActiveChats < a.maxConcurrentChats
  )

  if (available.length === 0) return null

  // Sort by lastAssignedAt (oldest first = most time since last assignment)
  available.sort((a, b) => (a.lastAssignedAt || 0) - (b.lastAssignedAt || 0))

  return available[0]
}

export function selectAgentLeastBusy(agents: AvailableAgent[]): AvailableAgent | null {
  if (agents.length === 0) return null

  // Filter available agents
  const available = agents.filter(
    (a) => a.status === 'ONLINE' && a.currentActiveChats < a.maxConcurrentChats
  )

  if (available.length === 0) return null

  // Sort by current load (ascending) and then by priority (descending)
  available.sort((a, b) => {
    const loadA = a.currentActiveChats / a.maxConcurrentChats
    const loadB = b.currentActiveChats / b.maxConcurrentChats

    if (loadA !== loadB) {
      return loadA - loadB // Less busy first
    }

    return b.routingPriority - a.routingPriority // Higher priority first
  })

  return available[0]
}

export function selectAgentRandom(agents: AvailableAgent[]): AvailableAgent | null {
  // Filter available agents
  const available = agents.filter(
    (a) => a.status === 'ONLINE' && a.currentActiveChats < a.maxConcurrentChats
  )

  if (available.length === 0) return null

  const randomIndex = Math.floor(Math.random() * available.length)
  return available[randomIndex]
}

export function selectAgentBySkills(
  agents: AvailableAgent[],
  requiredSkills: string[],
  preferredLanguage?: string
): AvailableAgent | null {
  // Filter available agents
  let available = agents.filter(
    (a) => a.status === 'ONLINE' && a.currentActiveChats < a.maxConcurrentChats
  )

  if (available.length === 0) return null

  // Score each agent
  const scored = available.map((agent) => {
    let score = 0

    // Skills match
    const skillsMatch = requiredSkills.filter((s) => agent.skills.includes(s))
    score += skillsMatch.length * 10

    // Language match
    if (preferredLanguage && agent.languages.includes(preferredLanguage)) {
      score += 20
    }

    // Routing priority
    score += agent.routingPriority

    // Penalize busy agents
    const loadPenalty = (agent.currentActiveChats / agent.maxConcurrentChats) * 5
    score -= loadPenalty

    return { agent, score }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  return scored[0]?.agent || null
}

export function selectAgentByPriority(agents: AvailableAgent[]): AvailableAgent | null {
  // Filter available agents
  const available = agents.filter(
    (a) => a.status === 'ONLINE' && a.currentActiveChats < a.maxConcurrentChats
  )

  if (available.length === 0) return null

  // Sort by priority descending
  available.sort((a, b) => b.routingPriority - a.routingPriority)

  return available[0]
}

export function selectAgentSticky(
  agents: AvailableAgent[],
  preferredAgentId?: Id<'agents'>
): AvailableAgent | null {
  // Try preferred agent first
  if (preferredAgentId) {
    const preferred = agents.find((a) => a.agentId === preferredAgentId)
    if (
      preferred &&
      preferred.status === 'ONLINE' &&
      preferred.currentActiveChats < preferred.maxConcurrentChats
    ) {
      return preferred
    }
  }

  // Fallback to least busy
  return selectAgentLeastBusy(agents)
}

// ============================================
// MAIN ROUTING FUNCTION
// ============================================

export function selectAgent(
  strategy: string,
  agents: AvailableAgent[],
  options: {
    departmentId?: Id<'departments'>
    preferredAgentId?: Id<'agents'>
    requiredSkills?: string[]
    preferredLanguage?: string
  } = {}
): AvailableAgent | null {
  switch (strategy) {
    case 'ROUND_ROBIN':
      return selectAgentRoundRobin(agents, options.departmentId!)

    case 'LEAST_BUSY':
      return selectAgentLeastBusy(agents)

    case 'RANDOM':
      return selectAgentRandom(agents)

    case 'SKILLS_BASED':
      return selectAgentBySkills(
        agents,
        options.requiredSkills || [],
        options.preferredLanguage
      )

    case 'PRIORITY':
      return selectAgentByPriority(agents)

    case 'STICKY':
      return selectAgentSticky(agents, options.preferredAgentId)

    default:
      return selectAgentLeastBusy(agents)
  }
}

// ============================================
// SCHEDULE CHECKING
// ============================================

export function isWithinSchedule(
  schedule: {
    enabled: boolean
    timezone: string
    slots: Array<{
      dayOfWeek: number
      startTime: string
      endTime: string
    }>
  } | undefined,
  currentTime: Date
): boolean {
  if (!schedule || !schedule.enabled) {
    return true // No schedule = always available
  }

  // Convert to timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: schedule.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }

  const timeStr = currentTime.toLocaleTimeString('en-US', options)
  const dayOfWeek = currentTime.getDay()

  // Find matching slot
  const matchingSlot = schedule.slots.find((slot) => {
    if (slot.dayOfWeek !== dayOfWeek) return false

    const currentMinutes = timeToMinutes(timeStr)
    const startMinutes = timeToMinutes(slot.startTime)
    const endMinutes = timeToMinutes(slot.endTime)

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  })

  return !!matchingSlot
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
```

---

## 🔄 Routing Automatique

### convex/assignment/routing.ts

```typescript
import { internalMutation, internalQuery, action } from '../_generated/server'
import { internal } from '../_generated/api'
import { v } from 'convex/values'
import { selectAgent, isWithinSchedule } from '../lib/routing'

// ============================================
// ROUTE NEW CONVERSATION
// ============================================

export const routeConversation = action({
  args: {
    conversationId: v.id('conversations'),
    messageContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get conversation
    const conversation = await ctx.runQuery(internal.conversations.getById, {
      conversationId: args.conversationId,
    })

    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Already assigned?
    if (conversation.assignedToAgentId) {
      return {
        success: true,
        alreadyAssigned: true,
        agentId: conversation.assignedToAgentId,
      }
    }

    const now = new Date()

    // Step 1: Check routing rules
    const matchedRule = await ctx.runQuery(internal.routingRules.findMatchingRule, {
      organizationId: conversation.organizationId,
      messageContent: args.messageContent,
      contactId: conversation.contactId,
      currentTime: now.toISOString(),
    })

    let targetDepartmentId = conversation.departmentId
    let targetAgentId: string | undefined

    if (matchedRule) {
      // Apply rule action
      if (matchedRule.action.type === 'ASSIGN_DEPARTMENT') {
        targetDepartmentId = matchedRule.action.departmentId
      } else if (matchedRule.action.type === 'ASSIGN_AGENT') {
        targetAgentId = matchedRule.action.agentId
      }

      // Update rule stats
      await ctx.runMutation(internal.routingRules.incrementMatchCount, {
        ruleId: matchedRule._id,
      })
    }

    // Step 2: Get department config
    let department = targetDepartmentId
      ? await ctx.runQuery(internal.departments.getById, {
          departmentId: targetDepartmentId,
        })
      : null

    // If no department, use default
    if (!department) {
      department = await ctx.runQuery(internal.departments.getDefault, {
        organizationId: conversation.organizationId,
      })
      targetDepartmentId = department?._id
    }

    if (!department) {
      // No department configured, add to general queue
      await ctx.runMutation(internal.assignmentQueue.addToQueue, {
        organizationId: conversation.organizationId,
        conversationId: args.conversationId,
        priority: 5,
      })

      return {
        success: false,
        queued: true,
        reason: 'No department configured',
      }
    }

    // Step 3: Check if department is within schedule
    if (!isWithinSchedule(department.schedule, now)) {
      // Outside working hours
      if (department.fallback?.type === 'AUTO_REPLY') {
        // Send auto-reply
        await ctx.runMutation(internal.messages.sendAutoReply, {
          conversationId: args.conversationId,
          message: department.fallback.autoReplyMessage!,
        })
      }

      // Add to queue
      await ctx.runMutation(internal.assignmentQueue.addToQueue, {
        organizationId: conversation.organizationId,
        departmentId: department._id,
        conversationId: args.conversationId,
        priority: 5,
      })

      return {
        success: false,
        queued: true,
        reason: 'Outside working hours',
      }
    }

    // Step 4: If specific agent targeted
    if (targetAgentId) {
      const agent = await ctx.runQuery(internal.agents.getById, {
        agentId: targetAgentId,
      })

      if (agent && agent.status === 'ONLINE' && agent.currentActiveChats < agent.maxConcurrentChats) {
        // Assign directly
        await ctx.runMutation(internal.assignment.assign, {
          conversationId: args.conversationId,
          agentId: targetAgentId,
          departmentId: targetDepartmentId,
          assignedBy: matchedRule ? 'RULE' : 'SYSTEM',
          ruleId: matchedRule?._id,
        })

        return {
          success: true,
          agentId: targetAgentId,
          departmentId: targetDepartmentId,
        }
      }
    }

    // Step 5: Auto-assign based on department strategy
    if (department.autoAssign) {
      // Get available agents in department
      const agents = await ctx.runQuery(internal.agents.getAvailableInDepartment, {
        departmentId: department._id,
      })

      const selectedAgent = selectAgent(department.routingStrategy, agents, {
        departmentId: department._id,
      })

      if (selectedAgent) {
        // Assign to agent
        await ctx.runMutation(internal.assignment.assign, {
          conversationId: args.conversationId,
          agentId: selectedAgent.agentId,
          departmentId: department._id,
          assignedBy: 'SYSTEM',
        })

        return {
          success: true,
          agentId: selectedAgent.agentId,
          departmentId: department._id,
        }
      }
    }

    // Step 6: No agent available, add to queue
    const position = await ctx.runMutation(internal.assignmentQueue.addToQueue, {
      organizationId: conversation.organizationId,
      departmentId: department._id,
      conversationId: args.conversationId,
      priority: department.priority,
    })

    // Handle fallback
    if (department.fallback?.type === 'DEPARTMENT' && department.fallback.targetDepartmentId) {
      // Try fallback department
      return ctx.runAction(internal.assignment.routing.routeConversation, {
        conversationId: args.conversationId,
        messageContent: args.messageContent,
        // Override to fallback department
      })
    }

    return {
      success: false,
      queued: true,
      queuePosition: position,
      departmentId: department._id,
      reason: 'No agents available',
    }
  },
})

// ============================================
// PROCESS QUEUE
// ============================================

export const processQueue = action({
  args: {
    departmentId: v.id('departments'),
  },
  handler: async (ctx, args) => {
    const department = await ctx.runQuery(internal.departments.getById, {
      departmentId: args.departmentId,
    })

    if (!department) return { processed: 0 }

    // Get available agents
    const agents = await ctx.runQuery(internal.agents.getAvailableInDepartment, {
      departmentId: args.departmentId,
    })

    if (agents.length === 0) return { processed: 0 }

    // Get queued items
    const queueItems = await ctx.runQuery(internal.assignmentQueue.getWaiting, {
      departmentId: args.departmentId,
      limit: 10,
    })

    let processed = 0

    for (const item of queueItems) {
      const selectedAgent = selectAgent(department.routingStrategy, agents, {
        departmentId: args.departmentId,
      })

      if (!selectedAgent) break

      // Assign conversation
      await ctx.runMutation(internal.assignment.assign, {
        conversationId: item.conversationId,
        agentId: selectedAgent.agentId,
        departmentId: args.departmentId,
        assignedBy: 'SYSTEM',
      })

      // Remove from queue
      await ctx.runMutation(internal.assignmentQueue.remove, {
        queueItemId: item._id,
      })

      // Update agent's active chats count in memory
      const agentIndex = agents.findIndex((a) => a.agentId === selectedAgent.agentId)
      if (agentIndex >= 0) {
        agents[agentIndex].currentActiveChats++
      }

      processed++
    }

    return { processed }
  },
})

// ============================================
// SCHEDULED QUEUE PROCESSING
// ============================================

// Run every minute via Convex cron
export const processAllQueues = action({
  args: {},
  handler: async (ctx) => {
    // Get all active departments
    const departments = await ctx.runQuery(internal.departments.getAllActive, {})

    const results = await Promise.all(
      departments.map((dept) =>
        ctx.runAction(internal.assignment.routing.processQueue, {
          departmentId: dept._id,
        })
      )
    )

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0)

    return { totalProcessed, departments: departments.length }
  },
})
```

---

## 📝 Queries et Mutations

### convex/assignment/mutations.ts

```typescript
import { mutation, internalMutation } from '../_generated/server'
import { v } from 'convex/values'

// ============================================
// ASSIGN CONVERSATION
// ============================================

export const assign = mutation({
  args: {
    conversationId: v.id('conversations'),
    agentId: v.id('agents'),
    departmentId: v.optional(v.id('departments')),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) throw new Error('Conversation not found')

    const agent = await ctx.db.get(args.agentId)
    if (!agent) throw new Error('Agent not found')

    // Get current member
    const member = await ctx.db
      .query('members')
      .withIndex('by_user_and_org', (q) =>
        q.eq('userId', identity.subject).eq('organizationId', conversation.organizationId)
      )
      .unique()

    if (!member) throw new Error('Not a member')

    // Check permission to assign
    if (member.role === 'AGENT') {
      throw new Error('Agents cannot assign conversations')
    }

    const now = Date.now()

    // Check if already assigned
    const existingAssignment = await ctx.db
      .query('assignments')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .filter((q) => q.eq(q.field('status'), 'ACTIVE'))
      .unique()

    if (existingAssignment) {
      // Update existing assignment
      await ctx.db.patch(existingAssignment._id, {
        agentId: args.agentId,
        departmentId: args.departmentId || existingAssignment.departmentId,
        updatedAt: now,
        history: [
          ...existingAssignment.history,
          {
            action: 'REASSIGNED',
            fromAgentId: existingAssignment.agentId,
            toAgentId: args.agentId,
            performedBy: member._id,
            timestamp: now,
          },
        ],
      })

      // Update old agent's count
      if (existingAssignment.agentId) {
        const oldAgent = await ctx.db.get(existingAssignment.agentId)
        if (oldAgent) {
          await ctx.db.patch(oldAgent._id, {
            currentActiveChats: Math.max(0, oldAgent.currentActiveChats - 1),
          })
        }
      }
    } else {
      // Create new assignment
      await ctx.db.insert('assignments', {
        organizationId: conversation.organizationId,
        conversationId: args.conversationId,
        agentId: args.agentId,
        departmentId: args.departmentId,
        status: 'ACTIVE',
        assignedBy: 'MANUAL',
        assignedByMemberId: member._id,
        assignedAt: now,
        slaBreached: false,
        internalNotes: args.note,
        history: [
          {
            action: 'ASSIGNED',
            toAgentId: args.agentId,
            toDepartmentId: args.departmentId,
            performedBy: member._id,
            timestamp: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      })
    }

    // Update conversation
    await ctx.db.patch(args.conversationId, {
      assignedToAgentId: args.agentId,
      departmentId: args.departmentId || conversation.departmentId,
      status: conversation.status === 'PENDING' ? 'ACTIVE' : conversation.status,
      updatedAt: now,
    })

    // Update agent's count
    await ctx.db.patch(args.agentId, {
      currentActiveChats: agent.currentActiveChats + 1,
      lastAssignedAt: now,
    })

    // Trigger real-time notification (Convex handles this automatically via subscriptions)
    await ctx.scheduler.runAfter(0, internal.notifications.notifyAssignment, {
      agentId: args.agentId,
      conversationId: args.conversationId,
    })

    return { success: true }
  },
})

// ============================================
// UNASSIGN CONVERSATION
// ============================================

export const unassign = mutation({
  args: {
    conversationId: v.id('conversations'),
    reason: v.optional(v.string()),
    returnToQueue: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) throw new Error('Conversation not found')

    const member = await ctx.db
      .query('members')
      .withIndex('by_user_and_org', (q) =>
        q.eq('userId', identity.subject).eq('organizationId', conversation.organizationId)
      )
      .unique()

    if (!member) throw new Error('Not a member')

    const now = Date.now()

    // Get current assignment
    const assignment = await ctx.db
      .query('assignments')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .filter((q) => q.eq(q.field('status'), 'ACTIVE'))
      .unique()

    if (!assignment) {
      throw new Error('No active assignment found')
    }

    // Update assignment
    await ctx.db.patch(assignment._id, {
      status: 'COMPLETED',
      resolvedAt: now,
      updatedAt: now,
      history: [
        ...assignment.history,
        {
          action: 'UNASSIGNED',
          fromAgentId: assignment.agentId,
          reason: args.reason,
          performedBy: member._id,
          timestamp: now,
        },
      ],
    })

    // Update agent's count
    if (assignment.agentId) {
      const agent = await ctx.db.get(assignment.agentId)
      if (agent) {
        await ctx.db.patch(agent._id, {
          currentActiveChats: Math.max(0, agent.currentActiveChats - 1),
        })
      }
    }

    // Update conversation
    await ctx.db.patch(args.conversationId, {
      assignedToAgentId: undefined,
      updatedAt: now,
    })

    // Return to queue if requested
    if (args.returnToQueue && conversation.departmentId) {
      await ctx.db.insert('assignmentQueue', {
        organizationId: conversation.organizationId,
        departmentId: conversation.departmentId,
        conversationId: args.conversationId,
        position: 0, // Will be recalculated
        priority: 5,
        queuedAt: now,
        assignmentAttempts: 0,
        status: 'WAITING',
        contactPhone: conversation.contactPhone || '',
        createdAt: now,
        updatedAt: now,
      })
    }

    return { success: true }
  },
})

// ============================================
// ACCEPT ASSIGNMENT (Agent)
// ============================================

export const acceptAssignment = mutation({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) throw new Error('Conversation not found')

    const member = await ctx.db
      .query('members')
      .withIndex('by_user_and_org', (q) =>
        q.eq('userId', identity.subject).eq('organizationId', conversation.organizationId)
      )
      .unique()

    if (!member) throw new Error('Not a member')

    const agent = await ctx.db
      .query('agents')
      .withIndex('by_member', (q) => q.eq('memberId', member._id))
      .unique()

    if (!agent) throw new Error('Not an agent')

    // Verify assignment is to this agent
    const assignment = await ctx.db
      .query('assignments')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .filter((q) =>
        q.and(q.eq(q.field('status'), 'PENDING'), q.eq(q.field('agentId'), agent._id))
      )
      .unique()

    if (!assignment) {
      throw new Error('No pending assignment found')
    }

    const now = Date.now()

    await ctx.db.patch(assignment._id, {
      status: 'ACTIVE',
      acceptedAt: now,
      updatedAt: now,
      history: [
        ...assignment.history,
        {
          action: 'ACCEPTED',
          performedBy: member._id,
          timestamp: now,
        },
      ],
    })

    return { success: true }
  },
})

// ============================================
// INTERNAL: ASSIGN (used by routing engine)
// ============================================

export const assignInternal = internalMutation({
  args: {
    conversationId: v.id('conversations'),
    agentId: v.id('agents'),
    departmentId: v.optional(v.id('departments')),
    assignedBy: v.string(),
    ruleId: v.optional(v.id('routingRules')),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) throw new Error('Conversation not found')

    const agent = await ctx.db.get(args.agentId)
    if (!agent) throw new Error('Agent not found')

    const now = Date.now()

    // Create assignment
    await ctx.db.insert('assignments', {
      organizationId: conversation.organizationId,
      conversationId: args.conversationId,
      agentId: args.agentId,
      departmentId: args.departmentId,
      status: agent.autoAccept ? 'ACTIVE' : 'PENDING',
      assignedBy: args.assignedBy as any,
      ruleId: args.ruleId,
      assignedAt: now,
      acceptedAt: agent.autoAccept ? now : undefined,
      slaBreached: false,
      history: [
        {
          action: 'ASSIGNED',
          toAgentId: args.agentId,
          toDepartmentId: args.departmentId,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    })

    // Update conversation
    await ctx.db.patch(args.conversationId, {
      assignedToAgentId: args.agentId,
      departmentId: args.departmentId || conversation.departmentId,
      status: 'ACTIVE',
      updatedAt: now,
    })

    // Update agent
    await ctx.db.patch(args.agentId, {
      currentActiveChats: agent.currentActiveChats + 1,
      lastAssignedAt: now,
    })

    // Notify agent
    await ctx.scheduler.runAfter(0, internal.notifications.notifyAssignment, {
      agentId: args.agentId,
      conversationId: args.conversationId,
    })

    return { success: true }
  },
})
```

### convex/assignment/transfers.ts

```typescript
import { mutation } from '../_generated/server'
import { v } from 'convex/values'

// ============================================
// REQUEST TRANSFER
// ============================================

export const requestTransfer = mutation({
  args: {
    conversationId: v.id('conversations'),
    toAgentId: v.optional(v.id('agents')),
    toDepartmentId: v.optional(v.id('departments')),
    reason: v.string(),
    reasonCategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) throw new Error('Conversation not found')

    const member = await ctx.db
      .query('members')
      .withIndex('by_user_and_org', (q) =>
        q.eq('userId', identity.subject).eq('organizationId', conversation.organizationId)
      )
      .unique()

    if (!member) throw new Error('Not a member')

    // Get current assignment
    const assignment = await ctx.db
      .query('assignments')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .filter((q) => q.eq(q.field('status'), 'ACTIVE'))
      .unique()

    if (!assignment) {
      throw new Error('No active assignment')
    }

    // Verify requester is the assigned agent or admin
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_member', (q) => q.eq('memberId', member._id))
      .unique()

    if (member.role === 'AGENT' && assignment.agentId !== agent?._id) {
      throw new Error('Only assigned agent can request transfer')
    }

    if (!args.toAgentId && !args.toDepartmentId) {
      throw new Error('Must specify target agent or department')
    }

    const now = Date.now()
    const expiresAt = now + 30 * 60 * 1000 // 30 minutes

    // Create transfer request
    const transferId = await ctx.db.insert('transfers', {
      organizationId: conversation.organizationId,
      conversationId: args.conversationId,
      assignmentId: assignment._id,
      fromAgentId: assignment.agentId,
      fromDepartmentId: assignment.departmentId,
      toAgentId: args.toAgentId,
      toDepartmentId: args.toDepartmentId,
      type: 'TRANSFER',
      reason: args.reason,
      reasonCategory: args.reasonCategory as any,
      status: args.toAgentId ? 'PENDING' : 'ACCEPTED', // Auto-accept dept transfers
      requestedAt: now,
      expiresAt,
      requestedByMemberId: member._id,
      createdAt: now,
    })

    // If department transfer (no specific agent), process immediately
    if (args.toDepartmentId && !args.toAgentId) {
      await processTransfer(ctx, transferId, 'ACCEPTED')
    } else {
      // Notify target agent
      await ctx.scheduler.runAfter(0, internal.notifications.notifyTransferRequest, {
        transferId,
        toAgentId: args.toAgentId!,
      })
    }

    return { transferId }
  },
})

// ============================================
// RESPOND TO TRANSFER
// ============================================

export const respondToTransfer = mutation({
  args: {
    transferId: v.id('transfers'),
    accept: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const transfer = await ctx.db.get(args.transferId)
    if (!transfer) throw new Error('Transfer not found')

    if (transfer.status !== 'PENDING') {
      throw new Error('Transfer already processed')
    }

    if (Date.now() > transfer.expiresAt) {
      await ctx.db.patch(args.transferId, { status: 'EXPIRED' })
      throw new Error('Transfer expired')
    }

    const member = await ctx.db
      .query('members')
      .withIndex('by_user_and_org', (q) =>
        q.eq('userId', identity.subject).eq('organizationId', transfer.organizationId)
      )
      .unique()

    if (!member) throw new Error('Not a member')

    // Verify responder is target agent
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_member', (q) => q.eq('memberId', member._id))
      .unique()

    if (!agent || agent._id !== transfer.toAgentId) {
      throw new Error('Not authorized to respond')
    }

    const newStatus = args.accept ? 'ACCEPTED' : 'REJECTED'

    await ctx.db.patch(args.transferId, {
      status: newStatus,
      respondedAt: Date.now(),
      responseNote: args.note,
    })

    if (args.accept) {
      await processTransfer(ctx, args.transferId, 'ACCEPTED')
    } else {
      // Notify requester of rejection
      await ctx.scheduler.runAfter(0, internal.notifications.notifyTransferRejected, {
        transferId: args.transferId,
      })
    }

    return { success: true }
  },
})

// ============================================
// PROCESS TRANSFER
// ============================================

async function processTransfer(
  ctx: any,
  transferId: Id<'transfers'>,
  status: string
) {
  const transfer = await ctx.db.get(transferId)
  if (!transfer) return

  const conversation = await ctx.db.get(transfer.conversationId)
  if (!conversation) return

  const now = Date.now()

  // Update current assignment
  await ctx.db.patch(transfer.assignmentId, {
    status: 'TRANSFERRED',
    updatedAt: now,
    history: [
      // ... existing history
      {
        action: 'TRANSFERRED',
        fromAgentId: transfer.fromAgentId,
        toAgentId: transfer.toAgentId,
        fromDepartmentId: transfer.fromDepartmentId,
        toDepartmentId: transfer.toDepartmentId,
        reason: transfer.reason,
        timestamp: now,
      },
    ],
  })

  // Update old agent's count
  if (transfer.fromAgentId) {
    const oldAgent = await ctx.db.get(transfer.fromAgentId)
    if (oldAgent) {
      await ctx.db.patch(oldAgent._id, {
        currentActiveChats: Math.max(0, oldAgent.currentActiveChats - 1),
      })
    }
  }

  // If transferring to specific agent
  if (transfer.toAgentId) {
    const newAgent = await ctx.db.get(transfer.toAgentId)
    if (newAgent) {
      // Create new assignment
      await ctx.db.insert('assignments', {
        organizationId: transfer.organizationId,
        conversationId: transfer.conversationId,
        agentId: transfer.toAgentId,
        departmentId: transfer.toDepartmentId || transfer.fromDepartmentId,
        status: 'ACTIVE',
        assignedBy: 'TRANSFER',
        assignedAt: now,
        acceptedAt: now,
        slaBreached: false,
        history: [
          {
            action: 'ASSIGNED_VIA_TRANSFER',
            fromAgentId: transfer.fromAgentId,
            toAgentId: transfer.toAgentId,
            timestamp: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      })

      // Update conversation
      await ctx.db.patch(transfer.conversationId, {
        assignedToAgentId: transfer.toAgentId,
        departmentId: transfer.toDepartmentId || conversation.departmentId,
        updatedAt: now,
      })

      // Update new agent's count
      await ctx.db.patch(transfer.toAgentId, {
        currentActiveChats: newAgent.currentActiveChats + 1,
        lastAssignedAt: now,
      })
    }
  } else if (transfer.toDepartmentId) {
    // Transfer to department (will go through routing)
    await ctx.db.patch(transfer.conversationId, {
      assignedToAgentId: undefined,
      departmentId: transfer.toDepartmentId,
      updatedAt: now,
    })

    // Trigger routing
    await ctx.scheduler.runAfter(0, internal.assignment.routing.routeConversation, {
      conversationId: transfer.conversationId,
    })
  }
}
```

---

## 👤 Disponibilité des Agents

### convex/agents/status.ts

```typescript
import { mutation, query } from '../_generated/server'
import { v } from 'convex/values'

// ============================================
// UPDATE AGENT STATUS
// ============================================

export const updateStatus = mutation({
  args: {
    status: v.union(
      v.literal('ONLINE'),
      v.literal('BUSY'),
      v.literal('AWAY'),
      v.literal('OFFLINE'),
      v.literal('DND')
    ),
    statusMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    // Get agent by current user
    const members = await ctx.db
      .query('members')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .collect()

    const memberIds = members.map((m) => m._id)

    const agent = await ctx.db
      .query('agents')
      .filter((q) =>
        q.or(...memberIds.map((id) => q.eq(q.field('memberId'), id)))
      )
      .first()

    if (!agent) throw new Error('Not an agent')

    const now = Date.now()

    // Record status change for analytics
    await ctx.db.insert('agentStatusHistory', {
      agentId: agent._id,
      organizationId: agent.organizationId,
      fromStatus: agent.status,
      toStatus: args.status,
      timestamp: now,
    })

    // Update agent status
    await ctx.db.patch(agent._id, {
      status: args.status,
      statusMessage: args.statusMessage,
      statusUpdatedAt: now,
      lastActivityAt: now,
      // If going offline, don't accept new chats
      acceptNewChats: args.status === 'ONLINE',
    })

    // If going offline with active conversations, offer to transfer
    if (args.status === 'OFFLINE' && agent.currentActiveChats > 0) {
      // Create notification for handoff
      await ctx.scheduler.runAfter(0, internal.notifications.suggestHandoff, {
        agentId: agent._id,
        activeChats: agent.currentActiveChats,
      })
    }

    // Real-time update via Convex subscriptions (automatic)
    // Clients subscribed to agent status will receive updates automatically

    return { success: true }
  },
})

// ============================================
// GET AGENT STATUS
// ============================================

export const getStatus = query({
  args: {
    agentId: v.optional(v.id('agents')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    let agent

    if (args.agentId) {
      agent = await ctx.db.get(args.agentId)
    } else {
      // Get current user's agent
      const members = await ctx.db
        .query('members')
        .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
        .collect()

      const memberIds = members.map((m) => m._id)

      agent = await ctx.db
        .query('agents')
        .filter((q) =>
          q.or(...memberIds.map((id) => q.eq(q.field('memberId'), id)))
        )
        .first()
    }

    if (!agent) return null

    return {
      status: agent.status,
      statusMessage: agent.statusMessage,
      statusUpdatedAt: agent.statusUpdatedAt,
      currentActiveChats: agent.currentActiveChats,
      maxConcurrentChats: agent.maxConcurrentChats,
      acceptNewChats: agent.acceptNewChats,
      utilization: agent.currentActiveChats / agent.maxConcurrentChats,
    }
  },
})

// ============================================
// GET DEPARTMENT AGENTS STATUS
// ============================================

export const getDepartmentAgentsStatus = query({
  args: {
    departmentId: v.id('departments'),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query('agents')
      .filter((q) =>
        q.eq(q.field('departmentIds'), args.departmentId) // Note: Need proper array contains
      )
      .collect()

    const enrichedAgents = await Promise.all(
      agents.map(async (agent) => {
        const member = await ctx.db.get(agent.memberId)
        return {
          agentId: agent._id,
          name: member?.name || 'Unknown',
          avatarUrl: member?.avatarUrl,
          status: agent.status,
          statusMessage: agent.statusMessage,
          currentActiveChats: agent.currentActiveChats,
          maxConcurrentChats: agent.maxConcurrentChats,
          utilization: agent.currentActiveChats / agent.maxConcurrentChats,
          isAvailable:
            agent.status === 'ONLINE' &&
            agent.acceptNewChats &&
            agent.currentActiveChats < agent.maxConcurrentChats,
        }
      })
    )

    // Group by status
    const online = enrichedAgents.filter((a) => a.status === 'ONLINE')
    const busy = enrichedAgents.filter((a) => a.status === 'BUSY')
    const away = enrichedAgents.filter((a) => a.status === 'AWAY')
    const offline = enrichedAgents.filter((a) => a.status === 'OFFLINE')

    return {
      agents: enrichedAgents,
      summary: {
        total: agents.length,
        online: online.length,
        busy: busy.length,
        away: away.length,
        offline: offline.length,
        available: online.filter((a) => a.isAvailable).length,
      },
    }
  },
})

// ============================================
// AUTO-SET BUSY/ONLINE
// ============================================

export const autoUpdateStatus = internalMutation({
  args: {
    agentId: v.id('agents'),
    action: v.union(v.literal('NEW_CHAT'), v.literal('CHAT_CLOSED')),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId)
    if (!agent) return

    const now = Date.now()

    if (args.action === 'NEW_CHAT') {
      // If at capacity, set to BUSY
      if (agent.currentActiveChats >= agent.maxConcurrentChats - 1) {
        await ctx.db.patch(args.agentId, {
          status: 'BUSY',
          statusUpdatedAt: now,
        })
      }
    } else if (args.action === 'CHAT_CLOSED') {
      // If was busy and now has capacity, set back to ONLINE
      if (agent.status === 'BUSY' && agent.currentActiveChats <= agent.maxConcurrentChats * 0.8) {
        await ctx.db.patch(args.agentId, {
          status: 'ONLINE',
          statusUpdatedAt: now,
        })
      }
    }
  },
})
```

---

## 📊 Analytics

### convex/assignment/analytics.ts

```typescript
import { query, internalMutation } from '../_generated/server'
import { v } from 'convex/values'

// ============================================
// GET AGENT PERFORMANCE
// ============================================

export const getAgentPerformance = query({
  args: {
    agentId: v.id('agents'),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query('agentAnalytics')
      .withIndex('by_agent_and_date', (q) =>
        q
          .eq('agentId', args.agentId)
          .gte('date', args.startDate)
          .lte('date', args.endDate)
      )
      .collect()

    if (analytics.length === 0) {
      return null
    }

    // Aggregate metrics
    const totals = analytics.reduce(
      (acc, day) => ({
        conversationsAssigned: acc.conversationsAssigned + day.conversationsAssigned,
        conversationsCompleted: acc.conversationsCompleted + day.conversationsCompleted,
        conversationsTransferred: acc.conversationsTransferred + day.conversationsTransferred,
        messagesReceived: acc.messagesReceived + day.messagesReceived,
        messagesSent: acc.messagesSent + day.messagesSent,
        totalHandleTime: acc.totalHandleTime + day.totalHandleTime,
        totalResponseTime: acc.totalResponseTime + day.totalResponseTime,
        onlineMinutes: acc.onlineMinutes + day.onlineMinutes,
        satisfactionTotal: acc.satisfactionTotal + day.satisfactionTotal,
        satisfactionResponses: acc.satisfactionResponses + day.satisfactionResponses,
        slaBreaches: acc.slaBreaches + day.slaBreaches,
      }),
      {
        conversationsAssigned: 0,
        conversationsCompleted: 0,
        conversationsTransferred: 0,
        messagesReceived: 0,
        messagesSent: 0,
        totalHandleTime: 0,
        totalResponseTime: 0,
        onlineMinutes: 0,
        satisfactionTotal: 0,
        satisfactionResponses: 0,
        slaBreaches: 0,
      }
    )

    return {
      period: { start: args.startDate, end: args.endDate },
      totals,
      averages: {
        handleTime:
          totals.conversationsCompleted > 0
            ? totals.totalHandleTime / totals.conversationsCompleted
            : 0,
        responseTime:
          totals.messagesReceived > 0
            ? totals.totalResponseTime / totals.messagesReceived
            : 0,
        satisfaction:
          totals.satisfactionResponses > 0
            ? totals.satisfactionTotal / totals.satisfactionResponses
            : 0,
        conversationsPerDay: totals.conversationsAssigned / analytics.length,
      },
      rates: {
        completionRate:
          totals.conversationsAssigned > 0
            ? (totals.conversationsCompleted / totals.conversationsAssigned) * 100
            : 0,
        transferRate:
          totals.conversationsAssigned > 0
            ? (totals.conversationsTransferred / totals.conversationsAssigned) * 100
            : 0,
        slaCompliance:
          totals.conversationsAssigned > 0
            ? ((totals.conversationsAssigned - totals.slaBreaches) /
                totals.conversationsAssigned) *
              100
            : 100,
      },
      dailyData: analytics,
    }
  },
})

// ============================================
// GET DEPARTMENT PERFORMANCE
// ============================================

export const getDepartmentPerformance = query({
  args: {
    departmentId: v.id('departments'),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query('departmentAnalytics')
      .withIndex('by_department_and_date', (q) =>
        q
          .eq('departmentId', args.departmentId)
          .gte('date', args.startDate)
          .lte('date', args.endDate)
      )
      .collect()

    if (analytics.length === 0) {
      return null
    }

    // Aggregate
    const totals = analytics.reduce(
      (acc, day) => ({
        conversationsReceived: acc.conversationsReceived + day.conversationsReceived,
        conversationsCompleted: acc.conversationsCompleted + day.conversationsCompleted,
        conversationsEscalated: acc.conversationsEscalated + day.conversationsEscalated,
        totalQueueTime: acc.totalQueueTime + day.averageQueueTime * day.conversationsReceived,
        slaBreaches: acc.slaBreaches + day.slaBreaches,
      }),
      {
        conversationsReceived: 0,
        conversationsCompleted: 0,
        conversationsEscalated: 0,
        totalQueueTime: 0,
        slaBreaches: 0,
      }
    )

    return {
      period: { start: args.startDate, end: args.endDate },
      totals,
      averages: {
        queueTime:
          totals.conversationsReceived > 0
            ? totals.totalQueueTime / totals.conversationsReceived
            : 0,
        conversationsPerDay: totals.conversationsReceived / analytics.length,
      },
      rates: {
        completionRate:
          totals.conversationsReceived > 0
            ? (totals.conversationsCompleted / totals.conversationsReceived) * 100
            : 0,
        escalationRate:
          totals.conversationsReceived > 0
            ? (totals.conversationsEscalated / totals.conversationsReceived) * 100
            : 0,
        slaCompliance:
          totals.conversationsReceived > 0
            ? ((totals.conversationsReceived - totals.slaBreaches) /
                totals.conversationsReceived) *
              100
            : 100,
      },
      dailyData: analytics,
    }
  },
})

// ============================================
// GET LIVE DASHBOARD METRICS
// ============================================

export const getLiveDashboard = query({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    // Active conversations by status
    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
      .collect()

    const activeConversations = conversations.filter((c) => c.status === 'ACTIVE')
    const pendingConversations = conversations.filter((c) => c.status === 'PENDING')

    // Queue metrics
    const queueItems = await ctx.db
      .query('assignmentQueue')
      .withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
      .filter((q) => q.eq(q.field('status'), 'WAITING'))
      .collect()

    // Agent status
    const agents = await ctx.db
      .query('agents')
      .withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
      .collect()

    const onlineAgents = agents.filter((a) => a.status === 'ONLINE')
    const busyAgents = agents.filter((a) => a.status === 'BUSY')

    // Calculate averages
    const totalCapacity = onlineAgents.reduce((sum, a) => sum + a.maxConcurrentChats, 0)
    const totalActive = onlineAgents.reduce((sum, a) => sum + a.currentActiveChats, 0)

    return {
      conversations: {
        active: activeConversations.length,
        pending: pendingConversations.length,
        unassigned: conversations.filter((c) => !c.assignedToAgentId).length,
      },
      queue: {
        waiting: queueItems.length,
        oldestWaitMinutes:
          queueItems.length > 0
            ? Math.floor((Date.now() - Math.min(...queueItems.map((q) => q.queuedAt))) / 60000)
            : 0,
      },
      agents: {
        online: onlineAgents.length,
        busy: busyAgents.length,
        offline: agents.filter((a) => a.status === 'OFFLINE').length,
        totalCapacity,
        currentLoad: totalActive,
        utilization: totalCapacity > 0 ? (totalActive / totalCapacity) * 100 : 0,
      },
    }
  },
})

// ============================================
// RECORD AGENT METRICS (Internal)
// ============================================

export const recordAgentMetrics = internalMutation({
  args: {
    agentId: v.id('agents'),
    date: v.string(),
    metrics: v.object({
      conversationsAssigned: v.optional(v.number()),
      conversationsCompleted: v.optional(v.number()),
      messagesReceived: v.optional(v.number()),
      messagesSent: v.optional(v.number()),
      responseTime: v.optional(v.number()),
      handleTime: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId)
    if (!agent) return

    // Find or create analytics record for this date
    const existing = await ctx.db
      .query('agentAnalytics')
      .withIndex('by_agent_and_date', (q) =>
        q.eq('agentId', args.agentId).eq('date', args.date)
      )
      .unique()

    const now = Date.now()

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        conversationsAssigned:
          existing.conversationsAssigned + (args.metrics.conversationsAssigned || 0),
        conversationsCompleted:
          existing.conversationsCompleted + (args.metrics.conversationsCompleted || 0),
        messagesReceived: existing.messagesReceived + (args.metrics.messagesReceived || 0),
        messagesSent: existing.messagesSent + (args.metrics.messagesSent || 0),
        totalResponseTime: existing.totalResponseTime + (args.metrics.responseTime || 0),
        totalHandleTime: existing.totalHandleTime + (args.metrics.handleTime || 0),
        updatedAt: now,
      })
    } else {
      // Create new
      await ctx.db.insert('agentAnalytics', {
        agentId: args.agentId,
        organizationId: agent.organizationId,
        date: args.date,
        conversationsAssigned: args.metrics.conversationsAssigned || 0,
        conversationsCompleted: args.metrics.conversationsCompleted || 0,
        conversationsTransferred: 0,
        messagesReceived: args.metrics.messagesReceived || 0,
        messagesSent: args.metrics.messagesSent || 0,
        totalHandleTime: args.metrics.handleTime || 0,
        averageHandleTime: args.metrics.handleTime || 0,
        totalResponseTime: args.metrics.responseTime || 0,
        averageFirstResponseTime: 0,
        averageResponseTime: args.metrics.responseTime || 0,
        onlineMinutes: 0,
        busyMinutes: 0,
        awayMinutes: 0,
        satisfactionResponses: 0,
        satisfactionTotal: 0,
        satisfactionAverage: 0,
        slaBreaches: 0,
        slaCompliance: 100,
        createdAt: now,
        updatedAt: now,
      })
    }
  },
})
```

---

## ✅ Checklist d'Implémentation

### Phase 1 : Base
- [ ] Schéma Convex (departments, agents, assignments, etc.)
- [ ] Types TypeScript
- [ ] Règles de visibilité
- [ ] Queries avec filtrage par rôle

### Phase 2 : Assignation
- [ ] Mutation assign/unassign
- [ ] Stratégies de routing (round-robin, least-busy, etc.)
- [ ] File d'attente (queue)
- [ ] Règles de routing automatique

### Phase 3 : Agents
- [ ] Gestion du statut (online/offline/busy)
- [ ] Capacité et charge
- [ ] Horaires de travail
- [ ] Skills et langues

### Phase 4 : Transferts
- [ ] Demande de transfert
- [ ] Acceptation/rejet
- [ ] Escalade
- [ ] Handoff de shift

### Phase 5 : Temps Réel
- [ ] Notifications d'assignation (Convex subscriptions)
- [ ] Update de statut temps réel
- [ ] Dashboard live

### Phase 6 : Analytics
- [ ] Métriques par agent
- [ ] Métriques par département
- [ ] SLA tracking
- [ ] Dashboard performance

---

**Version** : 1.0  
**Dernière mise à jour** : Décembre 2024  
**Auteur** : Claude pour Jokko
