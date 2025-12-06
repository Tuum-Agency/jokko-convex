/**
 *  _   _                 ___            
 * | | | |___  ___       / _ \ _ __ __ _ 
 * | | | / __|/ _ \     | | | | '__/ _` |
 * | |_| \__ \  __/     | |_| | | | (_| |
 *  \___/|___/\___|      \___/|_|  \__, |
 *                                 |___/ 
 * CURRENT ORGANIZATION HOOK
 *
 * Manages the currently selected organization context.
 * allow switching organizations and listing available ones.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCurrentOrg() {
    const session = useQuery(api.sessions.current);
    const switchOrg = useMutation(api.sessions.switchOrganization);
    const orgs = useQuery(api.organizations.listMine);

    return {
        currentOrg: session?.organization,
        membership: session?.membership,
        allOrgs: orgs,
        switchOrg,
        isLoading: session === undefined || orgs === undefined,
    };
}
