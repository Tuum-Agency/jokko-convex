'use client'

import { useState, useEffect } from 'react'
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
        role?: string
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
    // Search
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const searchResults = useQuery(api.search.searchGlobal, { query: debouncedQuery })

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleSearchResultClick = (link: string) => {
        router.push(link)
        setSearchOpen(false)
        setSearchQuery('')
    }

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
            {/* ... Left side ... */}
            <div className="flex items-center gap-2">
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
                    <div className="hidden md:block relative">
                        <AnimatePresence>
                            {searchOpen ? (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 300, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative"
                                >
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                                    <Input
                                        type="search"
                                        placeholder="Rechercher contact, page..."
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

                                    {/* Search Results Dropdown */}
                                    {searchQuery && (
                                        <div className="absolute top-10 left-0 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                            {!searchResults ? (
                                                <div className="p-4 text-center text-sm text-gray-500">
                                                    Recherche en cours...
                                                </div>
                                            ) : (searchResults.contacts.length === 0 && searchResults.pages.length === 0) ? (
                                                <div className="p-4 text-center text-sm text-gray-500">
                                                    Aucun résultat trouvé pour "{searchQuery}"
                                                </div>
                                            ) : (
                                                <div className="max-h-[300px] overflow-y-auto">
                                                    {searchResults.pages.length > 0 && (
                                                        <div className="p-2">
                                                            <div className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase">Pages</div>
                                                            {searchResults.pages.map((page) => (
                                                                <button
                                                                    key={page.id}
                                                                    className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-left"
                                                                    onClick={() => handleSearchResultClick(page.link)}
                                                                >
                                                                    <div className="p-1.5 bg-gray-100 rounded-md">
                                                                        {/* Icons are dynamic strings, ideally we map them but for now empty or simple dot */}
                                                                        <div className="h-3 w-3 bg-gray-400 rounded-full" />
                                                                    </div>
                                                                    {page.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {searchResults.contacts.length > 0 && (
                                                        <div className="p-2 border-t border-gray-100">
                                                            <div className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase">Contacts</div>
                                                            {searchResults.contacts.map((contact) => (
                                                                <button
                                                                    key={contact.id}
                                                                    className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-left"
                                                                    onClick={() => handleSearchResultClick(contact.link)}
                                                                >
                                                                    <Avatar className="h-7 w-7">
                                                                        <AvatarFallback className="text-xs">
                                                                            {getInitials(contact.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{contact.name}</span>
                                                                        <span className="text-xs text-gray-400">Contact</span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                    // Keeping mobile simple for now or need to tackle visibility on mobile
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Rechercher"
                        className="md:hidden h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                            // Mobile search could navigate to search page or open overlay
                            // For fast response, let's keep it desktop focused or open simple input if space
                        }}
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
                    <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-xl shadow-xl border-gray-200/80">
                        <DropdownMenuLabel className="flex items-center justify-between">
                            <span>Notifications</span>
                            {(unreadCount || 0) > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-green-600 hover:text-green-700"
                                    onClick={() => markAllAsRead()}
                                >
                                    Tout marquer lu
                                </Button>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="max-h-[300px] overflow-y-auto">
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
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-center text-blue-600 justify-center font-medium"
                            onClick={() => router.push('/dashboard/notifications')}
                        >
                            Voir toutes les notifications
                        </DropdownMenuItem>
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
                                        {user.role && (
                                            <p className="text-[10px] items-center text-green-600 font-medium uppercase tracking-wider bg-green-50 w-fit px-1.5 py-0.5 rounded-sm">
                                                {user.role}
                                            </p>
                                        )}
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/settings?tab=profile')}>
                                    Profil
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/settings')}>
                                    Paramètres
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onClick={handleLogout}
                                >
                                    Se déconnecter
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
