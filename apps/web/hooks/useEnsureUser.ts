import { useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * Hook to ensure the authenticated user exists in the database
 * Call this in your root layout or dashboard layout
 */
export function useEnsureUser() {
    const { isAuthenticated } = useConvexAuth();
    const ensureUser = useMutation(api.users.ensureUser);
    const hasRun = useRef(false);

    useEffect(() => {
        if (isAuthenticated && !hasRun.current) {
            hasRun.current = true;
            ensureUser()
                .then((result) => {
                    if (result.created) {
                        console.log('[USER] User created successfully');
                    } else {
                        console.log('[USER] User already exists');
                    }
                })
                .catch((error) => {
                    console.error('[USER] Failed to ensure user:', error);
                    hasRun.current = false; // Retry on next render
                });
        }

        // Reset flag when user logs out
        if (!isAuthenticated) {
            hasRun.current = false;
        }
    }, [isAuthenticated, ensureUser]);
}
