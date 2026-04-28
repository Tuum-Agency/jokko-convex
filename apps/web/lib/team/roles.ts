/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                    lib/team/roles.ts                          ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     SYSTEME DE ROLES ET PERMISSIONS                           ║
 * ║                                                               ║
 * ║     Roles :                                                   ║
 * ║       owner  -> Acces total                                   ║
 * ║       admin  -> Gestion equipe + settings                     ║
 * ║       agent  -> Conversations + contacts                      ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Definition des roles et permissions de l'equipe.            ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

// ============================================
// TYPES
// ============================================

export type Role = 'owner' | 'admin' | 'agent'

export type Permission =
    // Organisation
    | 'organization:delete'
    | 'organization:update'
    | 'organization:transfer'

    // Billing
    | 'billing:view'
    | 'billing:manage'

    // Team
    | 'team:view'
    | 'team:invite'
    | 'team:remove'
    | 'team:update-role'

    // Conversations
    | 'conversation:view'
    | 'conversation:reply'
    | 'conversation:assign'
    | 'conversation:close'
    | 'conversation:delete'

    // Contacts
    | 'contact:view'
    | 'contact:create'
    | 'contact:update'
    | 'contact:delete'

    // Flows
    | 'flow:view'
    | 'flow:create'
    | 'flow:update'
    | 'flow:delete'

    // Templates
    | 'template:view'
    | 'template:create'
    | 'template:update'
    | 'template:delete'
    | 'template:send'

    // Analytics
    | 'analytics:view'
    | 'analytics:export'

    // Settings
    | 'settings:view'
    | 'settings:update'

    // Integrations
    | 'integration:view'
    | 'integration:manage'

// ============================================
// ROLE DEFINITIONS
// ============================================

export const ROLE_DEFINITIONS: Record<Role, {
    label: string
    description: string
    icon: string
    color: string
    bgColor: string
    level: number // Pour comparer les niveaux
}> = {
    owner: {
        label: 'Proprietaire',
        description: 'Acces complet a l\'organisation',
        icon: 'Crown',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        level: 100,
    },
    admin: {
        label: 'Administrateur',
        description: 'Gestion de l\'equipe et des parametres',
        icon: 'Shield',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        level: 50,
    },
    agent: {
        label: 'Agent',
        description: 'Gestion des conversations et contacts',
        icon: 'MessageSquare',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        level: 10,
    },
}

// ============================================
// PERMISSIONS BY ROLE
// ============================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    owner: [
        // Tout
        'organization:delete',
        'organization:update',
        'organization:transfer',
        'billing:view',
        'billing:manage',
        'team:view',
        'team:invite',
        'team:remove',
        'team:update-role',
        'conversation:view',
        'conversation:reply',
        'conversation:assign',
        'conversation:close',
        'conversation:delete',
        'contact:view',
        'contact:create',
        'contact:update',
        'contact:delete',
        'flow:view',
        'flow:create',
        'flow:update',
        'flow:delete',
        'template:view',
        'template:create',
        'template:update',
        'template:delete',
        'template:send',
        'analytics:view',
        'analytics:export',
        'settings:view',
        'settings:update',
        'integration:view',
        'integration:manage',
    ],

    admin: [
        // Organisation (limite)
        'organization:update',

        // Team
        'team:view',
        'team:invite',
        'team:remove',
        'team:update-role',

        // Conversations
        'conversation:view',
        'conversation:reply',
        'conversation:assign',
        'conversation:close',
        'conversation:delete',

        // Contacts
        'contact:view',
        'contact:create',
        'contact:update',
        'contact:delete',

        // Flows
        'flow:view',
        'flow:create',
        'flow:update',
        'flow:delete',

        // Templates
        'template:view',
        'template:create',
        'template:update',
        'template:delete',
        'template:send',

        // Analytics
        'analytics:view',
        'analytics:export',

        // Settings
        'settings:view',
        'settings:update',

        // Integrations
        'integration:view',
        'integration:manage',
    ],

    agent: [
        // Conversations (limite)
        'conversation:view',
        'conversation:reply',
        'conversation:close',

        // Contacts (lecture seule)
        'contact:view',

        // Templates (utilisation seule)
        'template:view',
        'template:send',

        // Team (voir seulement)
        'team:view',
    ],
}

// ============================================
// HELPERS
// ============================================

/**
 * Verifie si un role a une permission specifique
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Recupere toutes les permissions d'un role
 */
export function getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] ?? []
}

/**
 * Verifie si un role peut gerer un autre role
 * (un role ne peut gerer que des roles de niveau inferieur)
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
    // Owner ne peut pas etre gere (sauf transfert)
    if (targetRole === 'owner') return false

    const managerLevel = ROLE_DEFINITIONS[managerRole]?.level ?? 0
    const targetLevel = ROLE_DEFINITIONS[targetRole]?.level ?? 0

    return managerLevel > targetLevel
}

/**
 * Recupere les roles qu'un utilisateur peut assigner
 */
export function getAssignableRoles(currentRole: Role): Role[] {
    const currentLevel = ROLE_DEFINITIONS[currentRole]?.level ?? 0

    return (Object.keys(ROLE_DEFINITIONS) as Role[]).filter((role) => {
        // On ne peut pas assigner owner
        if (role === 'owner') return false
        // On ne peut assigner que des roles de niveau inferieur
        return ROLE_DEFINITIONS[role].level < currentLevel
    })
}

/**
 * Verifie si le role peut inviter des membres
 */
export function canInviteMembers(role: Role): boolean {
    return roleHasPermission(role, 'team:invite')
}

/**
 * Verifie si le role peut supprimer des membres
 */
export function canRemoveMembers(role: Role): boolean {
    return roleHasPermission(role, 'team:remove')
}

/**
 * Formatte le role pour l'affichage
 */
export function formatRole(role: Role): string {
    return ROLE_DEFINITIONS[role]?.label ?? role
}

/**
 * Verifie si une chaine est un role valide
 */
export function isValidRole(role: string): role is Role {
    return ['owner', 'admin', 'agent'].includes(role)
}
