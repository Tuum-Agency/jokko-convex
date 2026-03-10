'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BarChart3,
    MessageSquare,
    ClipboardList,
    Users,
    FileText,
    Send,
    TrendingUp,
    Workflow,
    Building,
    CreditCard,
    Settings,
    ChevronLeft,
    HelpCircle,
} from 'lucide-react'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCurrentOrg } from '@/hooks/use-current-org'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { StaggerContainer, StaggerItem } from '@/components/animations'

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
    },
    {
        name: 'Assignments',
        href: '/assignments',
        icon: ClipboardList,
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
        name: 'Broadcasts',
        href: '/broadcasts',
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

const PLAN_LABELS: Record<string, string> = {
    FREE: 'Gratuit', STARTER: 'Starter', BUSINESS: 'Business', PRO: 'Pro', ENTERPRISE: 'Enterprise',
};
const PLAN_INITIALS: Record<string, string> = {
    FREE: 'F', STARTER: 'S', BUSINESS: 'B', PRO: 'P', ENTERPRISE: 'E',
};

interface SidebarProps {
    /** Base path for the dashboard (e.g., /dashboard) */
    basePath?: string
    /** Whether the sidebar is collapsed */
    isCollapsed?: boolean
    /** Callback when the collapse state should toggle */
    onToggleCollapse?: () => void
}

export function Sidebar({
    basePath = '/dashboard',
    isCollapsed = false,
    onToggleCollapse,
}: SidebarProps) {
    const pathname = usePathname()
    const stats = useQuery(api.conversations.getSidebarStats)
    const role = useQuery(api.users.currentUserRole)
    const { currentOrg } = useCurrentOrg()

    const restrictedForAgents = ['Assignments', 'Templates', 'Broadcasts', 'Analytics', 'Automatisation', 'Team'];

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

    const navItems = filteredNavigation.map(item => {
        const itemWithBadge = { ...item, badge: undefined as number | undefined }
        if (item.name === 'Conversations') {
            itemWithBadge.badge = stats?.unread || undefined
        }
        if (item.name === 'Assignments') {
            itemWithBadge.badge = stats?.unassigned || undefined
        }
        return itemWithBadge
    })

    // Check if a nav item is active
    const isActive = (href: string) => {
        const fullPath = `${basePath}${href}`
        if (href === '') {
            return pathname === basePath || pathname === `${basePath}/`
        }
        return pathname.startsWith(fullPath)
    }

    return (
        <TooltipProvider delayDuration={0}>
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 280 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className={cn(
                    'relative flex h-screen flex-col border-r border-gray-200/80 bg-white/80 backdrop-blur-xl',
                    'shadow-xl shadow-gray-200/20'
                )}
            >
                {/* Header */}
                <div className="flex h-16 items-center justify-between px-4">
                    <AnimatePresence mode="wait">
                        {!isCollapsed ? (
                            <motion.div
                                key="full-logo"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Logo width={120} height={33} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="icon-logo"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className="mx-auto"
                            >
                                <Image
                                    src="/logo.png"
                                    alt="Jokko"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isCollapsed && onToggleCollapse && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleCollapse}
                            aria-label="Réduire le menu"
                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    )}
                </div>

                <Separator className="bg-gray-100" />

                {/* Main Navigation */}
                <ScrollArea className="flex-1 px-3 py-4">
                    <nav className="space-y-1">
                        <StaggerContainer staggerDelay={0.05} delayChildren={0.1} trigger="mount">
                            {navItems.map((item) => {
                                const active = isActive(item.href)
                                const Icon = item.icon

                                const linkContent = (
                                    <Link
                                        href={`${basePath}${item.href}`}
                                        className={cn(
                                            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                            active
                                                ? 'text-green-700 bg-green-50'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        )}
                                    >

                                        <span className="relative z-10 flex items-center gap-3">
                                            <Icon
                                                className={cn(
                                                    'h-5 w-5 shrink-0 transition-colors duration-200',
                                                    active ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'
                                                )}
                                                aria-hidden="true"
                                            />

                                            <AnimatePresence>
                                                {!isCollapsed && (
                                                    <motion.span
                                                        initial={{ opacity: 0, width: 0 }}
                                                        animate={{ opacity: 1, width: 'auto' }}
                                                        exit={{ opacity: 0, width: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="whitespace-nowrap"
                                                    >
                                                        {item.name}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </span>

                                        {/* Badge */}
                                        {item.badge && !isCollapsed && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
                                            >
                                                {item.badge}
                                            </motion.span>
                                        )}

                                        {/* Badge dot when collapsed */}
                                        {item.badge && isCollapsed && (
                                            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-500" />
                                        )}
                                    </Link>
                                )

                                return (
                                    <StaggerItem key={item.name}>
                                        {isCollapsed ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                                <TooltipContent side="right" className="flex items-center gap-2">
                                                    {item.name}
                                                    {item.badge && (
                                                        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            linkContent
                                        )}
                                    </StaggerItem>
                                )
                            })}
                        </StaggerContainer>
                    </nav>
                </ScrollArea>

                {/* Subscription Info */}
                {currentOrg && !isCollapsed && (
                    <div className="px-3 pb-2">
                        <Link
                            href={`${basePath}/billing`}
                            className="block rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/80 border border-gray-200/60 p-3 hover:border-green-200 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500">Abonnement</span>
                                <Badge
                                    variant="secondary"
                                    className={cn("text-[10px] px-1.5 py-0", {
                                        'bg-gray-100 text-gray-600': currentOrg.plan === 'FREE',
                                        'bg-blue-100 text-blue-700': currentOrg.plan === 'STARTER',
                                        'bg-purple-100 text-purple-700': currentOrg.plan === 'BUSINESS',
                                        'bg-orange-100 text-orange-700': currentOrg.plan === 'PRO',
                                        'bg-amber-100 text-amber-700': currentOrg.plan === 'ENTERPRISE',
                                    })}
                                >
                                    {PLAN_LABELS[currentOrg.plan] || currentOrg.plan}
                                </Badge>
                            </div>
                            <p className="text-xs text-gray-900 font-semibold mt-1 truncate">{currentOrg.name}</p>
                            {currentOrg.plan === 'FREE' && (
                                <p className="text-[10px] text-green-600 mt-1 font-medium">Passer au plan supérieur →</p>
                            )}
                        </Link>
                    </div>
                )}

                {currentOrg && isCollapsed && (
                    <div className="px-3 pb-2 flex justify-center">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href={`${basePath}/billing`}
                                    className={cn(
                                        "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors",
                                        {
                                            'bg-gray-100 text-gray-600 border-gray-200': currentOrg.plan === 'FREE',
                                            'bg-blue-100 text-blue-700 border-blue-200': currentOrg.plan === 'STARTER',
                                            'bg-purple-100 text-purple-700 border-purple-200': currentOrg.plan === 'BUSINESS',
                                            'bg-orange-100 text-orange-700 border-orange-200': currentOrg.plan === 'PRO',
                                            'bg-amber-100 text-amber-700 border-amber-200': currentOrg.plan === 'ENTERPRISE',
                                        }
                                    )}
                                >
                                    {PLAN_INITIALS[currentOrg.plan] || '?'}
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {PLAN_LABELS[currentOrg.plan] || currentOrg.plan}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                )}

                {/* Bottom Section */}
                <div className="mt-auto">
                    <Separator className="bg-gray-100" />

                    {/* Bottom Navigation */}
                    <div className="px-3 py-3 space-y-1">
                        {filteredBottomNavigation.map((item) => {
                            const active = isActive(item.href)
                            const Icon = item.icon

                            const linkContent = (
                                <Link
                                    href={`${basePath}${item.href}`}
                                    className={cn(
                                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
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

                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="whitespace-nowrap"
                                            >
                                                {item.name}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Link>
                            )

                            return isCollapsed ? (
                                <Tooltip key={item.name}>
                                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                    <TooltipContent side="right">{item.name}</TooltipContent>
                                </Tooltip>
                            ) : (
                                <div key={item.name}>{linkContent}</div>
                            )
                        })}

                        {/* Help */}
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href={`${basePath}/help`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            aria-label="Aide et support"
                                            className="w-full justify-start gap-3 px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
                                        >
                                            <HelpCircle className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">Aide & Support</TooltipContent>
                            </Tooltip>
                        ) : (
                            <Link href={`${basePath}/help`}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-3 px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
                                >
                                    <HelpCircle className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    <span>Aide & Support</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </motion.aside>
        </TooltipProvider>
    )
}
