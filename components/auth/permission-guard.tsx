/**
 *  ____                     _           _              ____                     _ 
 * |  _ \ ___ _ __ _ __ ___ (_)___ ___ (_) ___  _ __   / ___|_   _  __ _ _ __ | |
 * | |_) / _ \ '__| '_ ` _ \| / __/ __| |/ _ \| '_ \  | |  _| | | |/ _` | '__|| |
 * |  __/  __/ |  | | | | | | \__ \__ \ | (_) | | | | | |_| | |_| | (_| | |   | |
 * |_|   \___|_|  |_| |_| |_|_|___/___/_|\___/|_| |_|  \____|\__,_|\__,_|_|   |_|
 *
 * PERMISSION GUARD COMPONENT
 *
 * Renders children only if the user has the required permission.
 * Otherwise renders fallback content (or null).
 */

import { ReactNode } from "react";
import { Permission } from "@/convex/lib/permissions";
import { usePermission } from "@/hooks/use-permission";

export function PermissionGuard({
    permission,
    children,
    fallback = null
}: {
    permission: Permission;
    children: ReactNode;
    fallback?: ReactNode;
}) {
    const allowed = usePermission(permission);
    return allowed ? children : fallback;
}
