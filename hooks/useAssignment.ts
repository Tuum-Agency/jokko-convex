import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface UseAssignmentOptions {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function useAssignment(options: UseAssignmentOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);

    const assignMutation = useMutation(api.assignments.assign);
    const unassignMutation = useMutation(api.assignments.unassign);

    // We could expose autoAssign if needed
    // const autoAssignMutation = useMutation(api.assignments.autoAssign);

    const assignTo = useCallback(async (conversationId: string, memberId: string, note?: string) => {
        setIsLoading(true);
        try {
            await assignMutation({
                conversationId: conversationId as Id<"conversations">,
                memberId: memberId as Id<"users">,
                note
            });
            options.onSuccess?.();
        } catch (error) {
            console.error("Failed to assign:", error);
            options.onError?.(error instanceof Error ? error.message : "Failed to assign");
        } finally {
            setIsLoading(false);
        }
    }, [assignMutation, options]);

    const unassign = useCallback(async (conversationId: string) => {
        setIsLoading(true);
        try {
            await unassignMutation({
                conversationId: conversationId as Id<"conversations">
            });
            options.onSuccess?.();
        } catch (error) {
            console.error("Failed to unassign:", error);
            options.onError?.(error instanceof Error ? error.message : "Failed to unassign");
        } finally {
            setIsLoading(false);
        }
    }, [unassignMutation, options]);

    return {
        assignTo,
        unassign,
        isLoading
    };
}
