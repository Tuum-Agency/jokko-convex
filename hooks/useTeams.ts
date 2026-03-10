import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentOrg } from "./use-current-org";
import { Id } from "@/convex/_generated/dataModel";

export function useTeams() {
    const { currentOrg } = useCurrentOrg();

    const teams = useQuery(
        api.teams.list,
        currentOrg ? { organizationId: currentOrg._id as Id<"organizations"> } : "skip"
    );

    const myTeams = useQuery(
        api.teams.listMyTeams,
        currentOrg ? { organizationId: currentOrg._id as Id<"organizations"> } : "skip"
    );

    const createTeam = useMutation(api.teams.create);
    const updateTeam = useMutation(api.teams.update);
    const archiveTeam = useMutation(api.teams.archive);
    const addMember = useMutation(api.teams.addMember);
    const removeMember = useMutation(api.teams.removeMember);
    const updateMemberRole = useMutation(api.teams.updateMemberRole);

    return {
        teams: teams ?? [],
        myTeams: myTeams ?? [],
        isLoading: teams === undefined,
        createTeam,
        updateTeam,
        archiveTeam,
        addMember,
        removeMember,
        updateMemberRole,
    };
}
