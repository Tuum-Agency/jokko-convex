/**
 *  _   _                 _         _   _     
 * | | | |___  ___       / \  _   _| |_| |__  
 * | | | / __|/ _ \     / _ \| | | | __| '_ \ 
 * | |_| \__ \  __/    / ___ \ |_| | |_| | | |
 *  \___/|___/\___|   /_/   \_\__,_|\__|_| |_|
 *
 * AUTH HOOK
 *
 * Custom hook to handle authentication state.
 * Wraps Convex functions to provide easy access to user data.
 */

import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";

export function useAuth() {
    const { signIn, signOut } = useAuthActions();
    const user = useQuery(api.users.me);

    return {
        user,
        isAuthenticated: !!user,
        isLoading: user === undefined,
        signIn,
        signOut,
    };
}
