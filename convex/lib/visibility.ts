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
    memberId: Id<'users'> // Adapted to 'users'
    organizationId: Id<'organizations'>
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT'
    agentId?: Id<'agents'>
    departmentIds?: Id<'departments'>[]
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
            return context.departmentIds?.includes(conversation.departmentId) ?? false

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
                departmentIds: context.departmentIds || [],
            }

        case 'ASSIGNED_ONLY':
            return {
                type: 'assigned' as const,
                organizationId: context.organizationId,
                agentId: context.agentId
            }

        default:
            return {
                type: 'none' as const
            }
    }
}
