'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, Check, Trash2, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const router = useRouter();
    // We might need a paginated list for history, but for now we reuse the 'list' query which fetched 20. 
    // Ideally we update 'list' to take pagination or limit, or make a new 'history' query.
    // For now let's assume 'list' returns enough or update 'list' to return more or use a new query.
    // The current 'list' returns 20. The user wanted "history". 20 might be enough for recent history. 
    // I'll update 'notifications.ts' to add a 'history' query if needed, but let's stick to 'list' for now or maybe 'listAll'?

    // Let's use `list` for now but it's limited to 20.
    const notifications = useQuery(api.notifications.list);
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);
    const clearAll = useMutation(api.notifications.clearAll);

    const formatTime = (date: number) => {
        return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Notifications</h1>
                    <p className="text-gray-500 mt-2">
                        Historique de vos alertes et messages.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => markAllAsRead()} title="Tout marquer comme lu">
                        <Check className="mr-2 h-4 w-4" />
                        Tout lire
                    </Button>
                    <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => clearAll()} title="Tout effacer">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Effacer
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-gray-500" />
                        Toutes les notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {!notifications ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center p-12 text-gray-500">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-gray-100 rounded-full">
                                    <Bell className="h-6 w-6 text-gray-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Aucune notification</h3>
                            <p className="mt-1">Vous êtes à jour !</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={cn(
                                        "flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                                        !notification.isRead && "bg-blue-50/50"
                                    )}
                                    onClick={() => {
                                        if (!notification.isRead) markAsRead({ notificationId: notification._id });
                                        if (notification.link) router.push(notification.link);
                                    }}
                                >
                                    <div className={cn(
                                        "mt-1 p-2 rounded-full shrink-0",
                                        !notification.isRead ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                                    )}>
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className={cn("text-sm font-medium text-gray-900", !notification.isRead && "font-bold")}>
                                                {notification.title}
                                            </p>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {formatTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {notification.message}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1 self-center">
                                        {!notification.isRead && (
                                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
