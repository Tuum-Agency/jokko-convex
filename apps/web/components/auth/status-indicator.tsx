/**
 *  ____  _        _               ___           _ _           _             
 * / ___|| |_ __ _| |_ _   _ ___  |_ _|_ __   __| (_) ___ __ _| |_ ___  _ __ 
 * \___ \| __/ _` | __| | | / __|  | || '_ \ / _` | |/ __/ _` | __/ _ \| '__|
 *  ___) | || (_| | |_| |_| \__ \  | || | | | (_| | | (_| (_| | || (_) | |   
 * |____/ \__\__,_|\__|\__,_|___/ |___|_| |_|\__,_|_|\___\__,_|\__\___/|_|   
 *
 * STATUS INDICATOR COMPONENT
 *
 * Visual indicator for user presence status.
 * - ONLINE: Green
 * - BUSY: Amber
 * - AWAY: Orange
 * - OFFLINE: Slate
 */

import { type Role } from "@/convex/lib/permissions";
// We need Status type. It is defined in schema but maybe good to export from a shared types file or just use string literal here.
// Let's use string literal matching schema.

type Status = "ONLINE" | "BUSY" | "AWAY" | "OFFLINE";

const statusConfig = {
    ONLINE: { color: "bg-emerald-500", label: "En ligne" },
    BUSY: { color: "bg-amber-500", label: "Occupé" },
    AWAY: { color: "bg-orange-500", label: "Absent" },
    OFFLINE: { color: "bg-slate-400", label: "Hors ligne" },
};

export function StatusIndicator({ status, size = "sm", className = "" }: { status: Status; size?: "sm" | "md", className?: string }) {
    // Fallback for undefined status (e.g. loading)
    const safeStatus = status || "OFFLINE";
    const config = statusConfig[safeStatus];
    const sizeClass = size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5";

    return (
        <span
            className={`inline-block rounded-full ${config.color} ${sizeClass} ${className}`}
            title={config.label}
        />
    );
}
