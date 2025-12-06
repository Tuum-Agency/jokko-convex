/**
 *  ____  _        _               ____       _           _             
 * / ___|| |_ __ _| |_ _   _ ___  / ___|  ___| | ___  ___| |_ ___  _ __ 
 * \___ \| __/ _` | __| | | / __| \___ \ / _ \ |/ _ \/ __| __/ _ \| '__|
 *  ___) | || (_| | |_| |_| \__ \  ___) |  __/ |  __/ (__| || (_) | |   
 * |____/ \__\__,_|\__|\__,_|___/ |____/ \___|_|\___|\___|\__\___/|_|   
 *
 * STATUS SELECTOR COMPONENT
 *
 * Dropdown to manually change user status (Online, Away, Offline).
 * Includes custom message input for Away status.
 */

import { useState } from "react";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { useMyStatus } from "@/hooks/use-presence";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { StatusIndicator } from "./status-indicator";

type Status = "ONLINE" | "BUSY" | "AWAY" | "OFFLINE";

const statusConfig = {
    ONLINE: { label: "En ligne" },
    BUSY: { label: "Occupé" },
    AWAY: { label: "Absent" },
    OFFLINE: { label: "Hors ligne" },
};

export function StatusSelector() {
    const { status, statusMessage, updateStatus } = useMyStatus();
    const { currentOrg } = useCurrentOrg();
    const [message, setMessage] = useState(statusMessage ?? "");

    // Safe status
    const safeStatus = status || "OFFLINE";

    const handleStatusChange = async (newStatus: "ONLINE" | "AWAY" | "OFFLINE") => {
        if (!currentOrg) return;

        await updateStatus({
            organizationId: currentOrg._id,
            status: newStatus,
            statusMessage: newStatus === "AWAY" ? message : undefined,
        });
    };

    if (!currentOrg) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                <StatusIndicator status={safeStatus} />
                <span className="text-sm font-medium">{statusConfig[safeStatus]?.label}</span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange("ONLINE")} className="gap-2 cursor-pointer">
                    <StatusIndicator status="ONLINE" /> En ligne
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleStatusChange("AWAY")} className="gap-2 cursor-pointer">
                    <StatusIndicator status="AWAY" /> Absent
                </DropdownMenuItem>

                {safeStatus === "AWAY" && (
                    <div className="px-2 py-1.5">
                        <Input
                            placeholder="Raison (optionnel)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="text-sm h-8"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleStatusChange("OFFLINE")} className="gap-2 text-red-500 cursor-pointer focus:text-red-500">
                    <StatusIndicator status="OFFLINE" /> Se déconnecter
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
