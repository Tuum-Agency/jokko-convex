/**
 *  ____                                 _     _     _   
 * |  _ \ _ __ ___  ___  ___ _ __   ___ | |   (_)___| |_ 
 * | |_) | '__/ _ \/ __|/ _ \ '_ \ / __|| |   | / __| __|
 * |  __/| | |  __/\__ \  __/ | | | (__ | |___| \__ \ |_ 
 * |_|   |_|  \___||___/\___|_| |_|\___||_____|_|___/\__|
 *
 * PRESENCE LIST COMPONENT
 *
 * Displays a list of team members grouped by their status.
 * (Online, Busy, Away, Offline)
 */

import { Id } from "@/convex/_generated/dataModel";
import { usePresence } from "@/hooks/use-presence";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatusIndicator } from "./status-indicator";

export function PresenceList({ organizationId }: { organizationId: Id<"organizations"> }) {
    const { online, busy, away, offline } = usePresence(organizationId);

    return (
        <div className="space-y-6">
            {online.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">En ligne ({online.length})</h4>
                    <div className="space-y-1">
                        {online.map((m) => (
                            <MemberRow key={m._id} member={m} />
                        ))}
                    </div>
                </div>
            )}

            {busy.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Occupés ({busy.length})</h4>
                    <div className="space-y-1">
                        {busy.map((m) => (
                            <MemberRow key={m._id} member={m} />
                        ))}
                    </div>
                </div>
            )}

            {away.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Absents ({away.length})</h4>
                    <div className="space-y-1">
                        {away.map((m) => (
                            <MemberRow key={m._id} member={m} />
                        ))}
                    </div>
                </div>
            )}

            {offline.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hors ligne ({offline.length})</h4>
                    <div className="space-y-1">
                        {offline.map((m) => (
                            <MemberRow key={m._id} member={m} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper component for individual member row
function MemberRow({ member }: { member: any }) {
    // member structure comes from usePresence -> listWithPresence
    // it has { user: { name, email, image }, status, statusMessage, activeConversations, maxConversations }

    return (
        <div className="flex items-center gap-3 py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors group cursor-default">
            <div className="relative shrink-0">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user?.image} />
                    <AvatarFallback>{member.user?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <StatusIndicator
                    status={member.status}
                    className="absolute -bottom-0.5 -right-0.5 ring-2 ring-background"
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-none mb-1">{member.user?.name || "Utilisateur"}</p>

                {member.statusMessage ? (
                    <p className="text-xs text-muted-foreground truncate">{member.statusMessage}</p>
                ) : member.status === "BUSY" ? (
                    <p className="text-xs text-amber-600 font-medium">
                        {member.activeConversations}/{member.maxConversations} conversations
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
                        {member.status === 'ONLINE' ? 'Disponible' : member.status === 'OFFLINE' ? 'Hors ligne' : 'Absent'}
                    </p>
                )}
            </div>
        </div>
    );
}
