/**
 *  ____                     _           _
 * |  _ \ ___ _ __ _ __ ___ (_)___ ___ (_) ___  _ __  ___
 * | |_) / _ \ '__| '_ ` _ \| / __/ __| |/ _ \| '_ \/ __|
 * |  __/  __/ |  | | | | | | \__ \__ \ | (_) | | | \__ \
 * |_|   \___|_|  |_| |_| |_|_|___/___/_|\___/|_| |_|___/
 *
 * PERMISSIONS SYSTEM
 *
 * Defines the roles and fine-grained permissions for the application.
 * - Roles: OWNER, ADMIN, AGENT
 * - Permissions: org:*, members:*, conversations:*, etc.
 *
 * Provides helper functions to check permissions.
 */

export type Role = "OWNER" | "ADMIN" | "AGENT";

export type Permission =
    | "org:read" | "org:update" | "org:delete" | "org:billing"
    | "members:read" | "members:invite" | "members:remove" | "members:update_role"
    | "conversations:read_all" | "conversations:read_assigned" | "conversations:assign" | "conversations:update"
    | "messages:read" | "messages:send"
    | "templates:read" | "templates:create" | "templates:update" | "templates:delete"
    | "contacts:read" | "contacts:create" | "contacts:update" | "contacts:delete" | "contacts:import" | "contacts:export"
    | "flows:read" | "flows:create" | "flows:update" | "flows:delete"
    | "settings:read" | "settings:update" | "settings:whatsapp"
    | "teams:create" | "teams:update" | "teams:delete" | "teams:manage_members"
    | "channels:create" | "channels:update" | "channels:delete" | "channels:assign_team"
    | "broadcasts:create" | "broadcasts:send" | "broadcasts:override_channel"
    | "integrations:read" | "integrations:manage"
    | "calls:answer" | "calls:initiate" | "calls:view_history";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    OWNER: [
        "org:read", "org:update", "org:delete", "org:billing",
        "members:read", "members:invite", "members:remove", "members:update_role",
        "conversations:read_all", "conversations:assign", "conversations:update",
        "messages:read", "messages:send",
        "templates:read", "templates:create", "templates:update", "templates:delete",
        "contacts:read", "contacts:create", "contacts:update", "contacts:delete", "contacts:import", "contacts:export",
        "flows:read", "flows:create", "flows:update", "flows:delete",
        "settings:read", "settings:update", "settings:whatsapp",
        "teams:create", "teams:update", "teams:delete", "teams:manage_members",
        "channels:create", "channels:update", "channels:delete", "channels:assign_team",
        "broadcasts:create", "broadcasts:send", "broadcasts:override_channel",
        "integrations:read", "integrations:manage",
        "calls:answer", "calls:initiate", "calls:view_history",
    ],
    ADMIN: [
        "org:read", "org:update",
        "members:read", "members:invite", "members:remove",
        "conversations:read_all", "conversations:assign", "conversations:update",
        "messages:read", "messages:send",
        "templates:read", "templates:create", "templates:update", "templates:delete",
        "contacts:read", "contacts:create", "contacts:update", "contacts:delete", "contacts:import", "contacts:export",
        "flows:read", "flows:create", "flows:update", "flows:delete",
        "settings:read", "settings:update",
        "teams:create", "teams:update", "teams:manage_members",
        "channels:create", "channels:update", "channels:assign_team",
        "broadcasts:create", "broadcasts:send",
        "integrations:read", "integrations:manage",
        "calls:answer", "calls:initiate", "calls:view_history",
    ],
    AGENT: [
        "org:read",
        "members:read",
        "conversations:read_assigned", "conversations:update",
        "messages:read", "messages:send",
        "templates:read",
        "contacts:read", "contacts:create", "contacts:update",
        "flows:read",
        "settings:read",
        "integrations:read",
        "calls:answer", "calls:initiate", "calls:view_history",
    ],
};

export const hasPermission = (role: Role, permission: Permission): boolean =>
    ROLE_PERMISSIONS[role].includes(permission);

export const canSeeAllConversations = (role: Role): boolean =>
    hasPermission(role, "conversations:read_all");
