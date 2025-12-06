/**
 *   ___            ____          _ _       _               
 *  / _ \ _ __ __ _/ ___|_      _(_) |_ ___| |__   ___ _ __ 
 * | | | | '__/ _` \___ \ \ /\ / / | __/ __| '_ \ / _ \ '__|
 * | |_| | | | (_| |___) \ V  V /| | || (__| | | |  __/ |   
 *  \___/|_|  \__, |____/ \_/\_/ |_|\__\___|_| |_|\___|_|   
 *            |___/                                         
 *
 * ORGANIZATION SWITCHER COMPONENT
 *
 * Dropdown menu to switch between organizations.
 * Displays current org name and list of available orgs.
 */

import Link from "next/link";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentOrg } from "@/hooks/use-current-org";

export function OrgSwitcher() {
    const { currentOrg, allOrgs, switchOrg } = useCurrentOrg();
    // Note: renamed allOrgs -> organizations in previous step? checked hook: it returns allOrgs. 
    // Let's use allOrgs.

    if (!currentOrg) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                <Avatar className="h-6 w-6 rounded-md">
                    {/* Simple fallback avatar logic since we don't have full Avatar implementation details handy, assuming standard shadcn */}
                    <div className="flex h-full w-full items-center justify-center rounded-md bg-primary text-[10px] text-primary-foreground font-bold">
                        {currentOrg.name[0].toUpperCase()}
                    </div>
                </Avatar>
                <span className="font-medium text-sm">{currentOrg.name}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-[200px]">
                {allOrgs?.map((org) => (
                    <DropdownMenuItem
                        key={org._id}
                        onClick={() => switchOrg({ organizationId: org._id })}
                        className="cursor-pointer"
                    >
                        {org.name}
                        {org._id === currentOrg._id && <Check className="ml-auto w-4 h-4" />}
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/onboarding">
                        <Plus className="mr-2 w-4 h-4" /> Nouvelle organisation
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
