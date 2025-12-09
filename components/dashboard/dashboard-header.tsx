'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, X, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MobileSidebar } from './mobile-sidebar'
import { FadeInView } from '@/components/animations'

interface DashboardHeaderProps {
    /** Page title */
    title?: string
    /** Page description */
    description?: string
    /** User information */
    user?: {
        name: string
        email: string
        avatar?: string
    }
    /** Organization name */
    organizationName?: string
    /** Base path for dashboard */
    basePath?: string
    /** Show search */
    showSearch?: boolean
    /** Custom actions */
    actions?: React.ReactNode
    /** Whether the sidebar is collapsed (desktop only) */
    isSidebarCollapsed?: boolean
    /** Callback to expand the sidebar */
    onExpandSidebar?: () => void
}

export function DashboardHeader({
    title,
    description,
    user,
    organizationName = 'My Organization',
    basePath = '/dashboard',
    showSearch = true,
    actions,
    isSidebarCollapsed = false,
    onExpandSidebar,
}: DashboardHeaderProps) {
    const router = useRouter()
    const { signOut } = useAuthActions()
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Notifications
    const realNotifications = useQuery(api.notifications.list)
    const unreadCount = useQuery(api.notifications.unreadCount)
    const markAsRead = useMutation(api.notifications.markAsRead)
    const markAllAsRead = useMutation(api.notifications.markAllAsRead)

    const formatTimeAgo = (date: number) => {
        return formatDistanceToNow(date, { addSuffix: true, locale: fr })
    }

    // Get user initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    // Handle logout
    const handleLogout = async () => {
        try {
            await signOut()
            router.push('/sign-in')
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl px-4 lg:px-6">
            {/* Left side - Expand button + Mobile menu + Title */}
            <div className="flex items-center gap-2">
                {/* Expand sidebar button - Desktop only */}
                {isSidebarCollapsed && onExpandSidebar && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onExpandSidebar}
                        aria-label="Agrandir le menu"
                        className="hidden lg:flex h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    >
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </Button>
                )}

                <MobileSidebar
                    basePath={basePath}
                    user={user}
                    organizationName={organizationName}
                />

                {title && (
                    <FadeInView trigger="mount" delay={0.1}>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                            {description && (
                                <p className="text-sm text-gray-500">{description}</p>
                            )}
                        </div>
                    </FadeInView>
                )}
            </div>

            {/* Right side - Search, notifications, profile */}
            <div className="flex items-center gap-2">
                {/* Search - Desktop */}
                {showSearch && (
                    <div className="hidden md:block">
                        <AnimatePresence>
                            {searchOpen ? (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 250, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative"
                                >
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                                    <Input
                                        type="search"
                                        placeholder="Rechercher..."
                                        aria-label="Rechercher"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                        className="h-9 pl-9 pr-9 bg-gray-50 border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:bg-white focus:border-green-500 focus:ring-green-500/20"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setSearchOpen(false)
                                            setSearchQuery('')
                                        }}
                                        aria-label="Fermer la recherche"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </motion.div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSearchOpen(true)}
                                    aria-label="Ouvrir la recherche"
                                    className="h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                >
                                    <Search className="h-5 w-5" aria-hidden="true" />
                                </Button>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Search - Mobile */}
                {showSearch && (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Rechercher"
                        className="md:hidden h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    >
                        <Search className="h-5 w-5" aria-hidden="true" />
                    </Button>
                )}

                {/* Notifications */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Notifications"
                            className="relative h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        >
                            <Bell className="h-5 w-5" aria-hidden="true" />
                            {(unreadCount || 0) > 0 && (
                                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" aria-hidden="true" />
                            )}
                            <span className="sr-only">Nouvelles notifications</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-xl border-gray-200/80">
                        <DropdownMenuLabel className="flex items-center justify-between">
                            <span>Notifications</span>
                            {(unreadCount || 0) > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-green-600 hover:text-green-700"
                                    onClick={() => markAllAsRead()}
                                >
                                    Mark all as read
                                </Button>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {!realNotifications?.length && (
                            <div className="p-4 text-center text-sm text-gray-500">
                                Aucune notification
                            </div>
                        )}
                        {realNotifications?.map((notification) => (
                            <DropdownMenuItem
                                key={notification._id}
                                className={cn(
                                    "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                    !notification.isRead && "bg-green-50/50"
                                )}
                                onClick={() => {
                                    if (!notification.isRead) {
                                        markAsRead({ notificationId: notification._id })
                                    }
                                    if (notification.link) {
                                        router.push(notification.link)
                                    }
                                }}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    {!notification.isRead && (
                                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                                    )}
                                    <span className={cn(
                                        "font-medium text-gray-900 truncate",
                                        !notification.isRead && "font-semibold"
                                    )}>{notification.title}</span>
                                    <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
                                        {formatTimeAgo(notification.createdAt)}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-500 pl-4 break-words w-full line-clamp-2">
                                    {notification.message}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Custom actions */}
                {actions}

                {/* Profile - Desktop only (mobile shows in sidebar) */}
                <div className="hidden lg:block">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                aria-label={user ? `Menu utilisateur - ${user.name}` : "User loading"}
                                className="relative h-9 w-9 rounded-full p-0"
                                disabled={!user}
                            >
                                {user ? (
                                    <Avatar className="h-9 w-9 ring-2 ring-gray-100">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback className="bg-linear-to-br from-green-500 to-green-600 text-white text-xs font-semibold">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        {user && (
                            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-200/80">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">Help</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onClick={handleLogout}
                                >
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
