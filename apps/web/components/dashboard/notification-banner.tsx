"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBanner() {
    const [permission, setPermission] = useState<NotificationPermission>('granted'); // Default to granted to hide initial flash
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const enableNotifications = () => {
        Notification.requestPermission().then((p) => {
            setPermission(p);
        });
    };

    if (permission === 'granted' || !isVisible) return null;

    return (
        <div className="bg-gray-900 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 z-50">
            <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="bg-white/20 p-2 rounded-full hidden sm:block">
                    <Bell className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm font-medium">
                    Activez les notifications pour ne jamais manquer un message important de vos clients.
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Button
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap bg-white text-gray-900 hover:bg-gray-100 border-none shadow-none"
                    onClick={enableNotifications}
                >
                    Activer les notifications
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsVisible(false)}
                    className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
