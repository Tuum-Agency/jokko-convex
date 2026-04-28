'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export function BrowserNotifications() {
    // 1. Fetch latest notifications (assuming list returns latest first)
    const notifications = useQuery(api.notifications.list);

    // Track the ID of the most recent notification we've seen to avoid re-notifying
    const lastSeenIdRef = useRef<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    // Check permission on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);



    // Monitor for new notifications
    useEffect(() => {
        if (!notifications || notifications.length === 0) return;

        const latest = notifications[0];

        // If we haven't tracked anything yet, just set the baseline
        if (lastSeenIdRef.current === null) {
            lastSeenIdRef.current = latest._id;
            return;
        }

        // Check if there is a NEW notification
        if (latest._id !== lastSeenIdRef.current) {
            const isRead = latest.isRead;
            const now = Date.now();
            const created = latest.createdAt;

            // Only notify if it's unread and relatively new
            if (!isRead && (now - created < 5 * 60 * 1000)) {
                if (permission === 'granted') {
                    new Notification(latest.title, {
                        body: latest.message,
                        icon: '/favicon.ico',
                        tag: latest._id
                    });
                } else {
                    // Fallback to toast if permission is missing or denied
                    toast(latest.title, {
                        description: latest.message,
                        action: permission === 'default' ? {
                            label: "Activer",
                            onClick: () => Notification.requestPermission().then(p => setPermission(p))
                        } : undefined
                    });
                }
            }

            // Update ref
            lastSeenIdRef.current = latest._id;
        }

    }, [notifications, permission]);

    return null; // This component is logic-only
}
