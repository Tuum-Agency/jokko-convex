'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    BarChart3,
    MessageSquare,
    Users,
    FileText,
    Send,
    TrendingUp,
    Workflow,
    Building,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    HelpCircle,
} from 'lucide-react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { StaggerContainer, StaggerItem, ActiveIndicator } from '@/components/animations'

// Navigation items
const mainNavigation = [
    {
        name: 'Overview',
        href: '',
        icon: BarChart3,
    },
    {
        name: 'Conversations',
        href: '/conversations',
        icon: MessageSquare,
        badge: 12,
    },
    {
        name: 'Contacts',
        href: '/contacts',
        icon: Users,
    },
    {
        name: 'Templates',
        href: '/templates',
        icon: FileText,
    },
    {
        name: 'Broadcast',
        href: '/broadcast',
        icon: Send,
    },
    {
        name: 'Analytics',
        href: '/analytics',
        icon: TrendingUp,
    },
    {
        name: 'Automatisation',
        href: '/flows',
        icon: Workflow,
    },
    {
        name: 'Team',
        href: '/team',
        icon: Building,
    },
]

const bottomNavigation = [
    {
        name: 'Facturation',
        href: '/billing',
        icon: CreditCard,
    },
    {
        name: 'Paramètres',
        href: '/settings',
        icon: Settings,
    },
]

interface MobileSidebarProps {
    /** Base path for the dashboard (e.g., /dashboard) */
    basePath?: string
    /** User information */
    user?: {
        name: string
        email: string
        avatar?: string
    }
    /** Organization name */
    organizationName?: string
}

export function MobileSidebar({
    basePath = '/dashboard',
    user,
    organizationName = 'My Organization',
}: MobileSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const { signOut } = useAuthActions()
    const [isMounted, setIsMounted] = useState(false)
    const role = useQuery(api.users.currentUserRole)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const restrictedForAgents = ['Assignments', 'Templates', 'Broadcast', 'Broadcasts', 'Analytics', 'Automatisation', 'Team'];

    const filteredNavigation = mainNavigation.filter(item => {
        if (role === 'AGENT') {
            return !restrictedForAgents.includes(item.name);
        }
        return true;
    });

    const filteredBottomNavigation = bottomNavigation.filter(item => {
        if (role === 'AGENT') {
            return item.name !== 'Facturation';
        }
        return true;
    });

    // Check if a nav item is active
    const isActive = (href: string) => {
        const fullPath = `${basePath}${href}`
        if (href === '') {
            return pathname === basePath || pathname === `${basePath}/`
        }
        return pathname.startsWith(fullPath)
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

    if (!isMounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                aria-label="Ouvrir le menu"
                className="lg:hidden h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Ouvrir le menu</span>
            </Button>
        )
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Ouvrir le menu"
                    className="lg:hidden h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Ouvrir le menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-[300px] p-0 bg-white/95 backdrop-blur-xl border-r border-gray-200/80"
            >
                <SheetHeader className="p-4 border-b border-gray-100">
                    <SheetTitle>
                        <Logo width={100} height={33} />
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
                    <nav className="p-3 space-y-1">
                        <StaggerContainer staggerDelay={0.05} delayChildren={0.1} trigger="mount">
                            {filteredNavigation.map((item) => {
                                const active = isActive(item.href)
                                const Icon = item.icon

                                return (
                                    <StaggerItem key={item.name}>
                                        <Link
                                            href={`${basePath}${item.href}`}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                                                active
                                                    ? 'text-green-700 bg-green-50'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            )}
                                        >
                                            {/* Active indicator */}
                                            {active && <ActiveIndicator position="left" layoutId="mobile-sidebar-indicator" />}

                                            <Icon
                                                className={cn(
                                                    'h-5 w-5 shrink-0 transition-colors duration-200',
                                                    active ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'
                                                )}
                                                aria-hidden="true"
                                            />

                                            <span className="flex-1">{item.name}</span>

                                            {/* Badge */}
                                            {item.badge && (
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
                                                >
                                                    {item.badge}
                                                </motion.span>
                                            )}
                                        </Link>
                                    </StaggerItem>
                                )
                            })}
                        </StaggerContainer>
                    </nav>

                    <Separator className="my-2 bg-gray-100" />

                    {/* Bottom Navigation */}
                    <div className="p-3 space-y-1">
                        {filteredBottomNavigation.map((item) => {
                            const active = isActive(item.href)
                            const Icon = item.icon

                            return (
                                <Link
                                    key={item.name}
                                    href={`${basePath}${item.href}`}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                                        active
                                            ? 'text-green-700 bg-green-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-5 w-5 shrink-0 transition-colors duration-200',
                                            active ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'
                                        )}
                                        aria-hidden="true"
                                    />
                                    <span>{item.name}</span>
                                </Link>
                            )
                        })}

                        <Link
                            href={`${basePath}/help`}
                            onClick={() => setIsOpen(false)}
                            className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                        >
                            <HelpCircle className="h-5 w-5 text-gray-400 group-hover:text-gray-600 shrink-0 transition-colors duration-200" aria-hidden="true" />
                            <span>Aide & Support</span>
                        </Link>
                    </div>
                </ScrollArea>

                {/* User Profile */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 bg-white">
                    <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 transition-colors">
                        {user ? (
                            <>
                                <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-sm font-semibold">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="truncate text-xs text-gray-500">{organizationName}</p>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Se déconnecter"
                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" aria-hidden="true" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
