'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    MessageSquare,
    UserCheck,
    Users,
    FileText,
    Send,
    TrendingUp,
    Workflow,
    UsersRound,
    CreditCard,
    Settings,
    ChevronLeft,
    HelpCircle,
    Plug,
    Lock,
} from 'lucide-react'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCurrentOrg } from '@/hooks/use-current-org'
import {
    planIncludesFeature,
    minPlanForFeature,
    type PlanFeature,
    type PlanKey,
} from '@/lib/planFeatures'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

// Navigation items. `feature` = clé de gating plan (optionnel). Non défini → pas de gating.
type NavItem = {
    name: string
    href: string
    icon: typeof LayoutDashboard
    feature?: PlanFeature
}

const mainNavigation: NavItem[] = [
    { name: 'Dashboard', href: '', icon: LayoutDashboard },
    { name: 'Conversations', href: '/conversations', icon: MessageSquare },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Team', href: '/team', icon: UsersRound },
    { name: 'Attribution', href: '/assignments', icon: UserCheck },
    { name: 'Modèles', href: '/modeles', icon: FileText },
    { name: 'Campagnes', href: '/campagnes', icon: Send, feature: 'broadcasts' },
    { name: 'Automatisation', href: '/automatisations', icon: Workflow, feature: 'flows' },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp, feature: 'analytics_advanced' },
]

const bottomNavigation: NavItem[] = [
    { name: 'Intégrations', href: '/integrations', icon: Plug, feature: 'integrations_crm' },
    { name: 'Facturation', href: '/billing', icon: CreditCard },
    { name: 'Paramètres', href: '/settings', icon: Settings },
]

const PLAN_LABELS: Record<string, string> = {
    FREE: 'Gratuit', STARTER: 'Starter', BUSINESS: 'Business', PRO: 'Pro', ENTERPRISE: 'Enterprise',
}
const PLAN_INITIALS: Record<string, string> = {
    FREE: 'F', STARTER: 'S', BUSINESS: 'B', PRO: 'P', ENTERPRISE: 'E',
}
const MAX_PLAN = 'ENTERPRISE'

interface SidebarProps {
    basePath?: string
    isCollapsed?: boolean
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

    const restrictedForAgents = ['Attribution', 'Modèles', 'Campagnes', 'Analytics', 'Automatisation', 'Team']

    const filteredNavigation = mainNavigation.filter(item => {
        if (role === 'AGENT') return !restrictedForAgents.includes(item.name)
        return true
    })

    const filteredBottomNavigation = bottomNavigation.filter(item => {
        if (role === 'AGENT') return item.name !== 'Facturation' && item.name !== 'Intégrations'
        return true
    })

    const currentPlan = (currentOrg?.plan as PlanKey | undefined) ?? null
    const computeLock = (item: NavItem) => {
        if (!item.feature || !currentPlan) return { locked: false, minPlan: null as PlanKey | null }
        const allowed = planIncludesFeature(currentPlan, item.feature)
        return { locked: !allowed, minPlan: allowed ? null : minPlanForFeature(item.feature) }
    }

    const navItems = filteredNavigation.map(item => {
        const { locked, minPlan } = computeLock(item)
        const itemWithBadge = { ...item, badge: undefined as number | undefined, locked, minPlan }
        if (item.name === 'Conversations') itemWithBadge.badge = stats?.unread || undefined
        if (item.name === 'Attribution') itemWithBadge.badge = stats?.unassigned || undefined
        return itemWithBadge
    })

    const isActive = (href: string) => {
        const fullPath = `${basePath}${href}`
        if (href === '') return pathname === basePath || pathname === `${basePath}/`
        return pathname.startsWith(fullPath)
    }

    return (
        <TooltipProvider delayDuration={0}>
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 260 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative flex h-screen flex-col bg-gradient-to-b from-[#1a5c35] via-[#14532d] to-[#0c3b20] overflow-hidden"
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
                                className="flex items-center gap-2.5"
                            >
                                <Image
                                    src="/logo.png"
                                    alt="Jokko"
                                    width={32}
                                    height={32}
                                    className="object-contain brightness-0 invert"
                                />
                                <span className="text-lg font-bold text-white tracking-tight">Jokko</span>
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
                                    width={32}
                                    height={32}
                                    className="object-contain brightness-0 invert"
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
                            className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
                        >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    )}
                </div>

                {/* Divider */}
                <div className="mx-4 h-px bg-white/10" />

                {/* Main Navigation */}
                <ScrollArea className="flex-1 px-3 py-4">
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const active = isActive(item.href)
                            const Icon = item.icon
                            // Item verrouillé (plan insuffisant) → redirige vers billing
                            // et affiche un cadenas. On ne masque pas : l'utilisateur
                            // voit ce qu'il débloque en upgradant.
                            const targetHref = item.locked
                                ? `${basePath}/billing`
                                : `${basePath}${item.href}`

                            const linkContent = (
                                <Link
                                    href={targetHref}
                                    className={cn(
                                        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                                        active
                                            ? 'text-white bg-white/15'
                                            : 'text-white/60 hover:text-white hover:bg-white/8',
                                        item.locked && 'opacity-70'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
                                            active ? 'text-white' : 'text-white/50 group-hover:text-white'
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

                                    {/* Lock icon (plan verrouillé) */}
                                    {item.locked && !isCollapsed && (
                                        <Lock className="ml-auto h-3.5 w-3.5 text-white/50" aria-label={`Plan ${item.minPlan} requis`} />
                                    )}
                                    {item.locked && isCollapsed && (
                                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-400" aria-label={`Plan ${item.minPlan} requis`} />
                                    )}

                                    {/* Badge */}
                                    {item.badge && !item.locked && !isCollapsed && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="ml-auto rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white"
                                        >
                                            {item.badge}
                                        </motion.span>
                                    )}

                                    {/* Badge dot when collapsed */}
                                    {item.badge && !item.locked && isCollapsed && (
                                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    )}
                                </Link>
                            )

                            return isCollapsed ? (
                                <Tooltip key={item.name}>
                                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                    <TooltipContent side="right" className="flex items-center gap-2">
                                        {item.name}
                                        {item.locked && item.minPlan && (
                                            <span className="rounded-full bg-amber-400/20 text-amber-300 px-1.5 py-0.5 text-[10px] font-semibold">
                                                {item.minPlan}+
                                            </span>
                                        )}
                                        {item.badge && !item.locked && (
                                            <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                                                {item.badge}
                                            </span>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                <div key={item.name}>{linkContent}</div>
                            )
                        })}
                    </nav>
                </ScrollArea>

                {/* Plan Badge */}
                {currentOrg && !isCollapsed && (() => {
                    const plan = currentOrg.plan || 'FREE'
                    const showUpgrade = plan !== MAX_PLAN

                    return (
                        <div className="px-3 pb-2">
                            <div className="flex items-center gap-2 rounded-lg bg-white/8 border border-white/10 px-3 py-2.5">
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Plan</span>
                                    <p className="text-sm font-bold text-white truncate">{PLAN_LABELS[plan] || plan}</p>
                                </div>
                                {showUpgrade && (
                                    <Link href={`${basePath}/billing`}>
                                        <Button
                                            size="sm"
                                            className="h-7 px-2.5 text-[11px] font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-md cursor-pointer"
                                        >
                                            Upgrade
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )
                })()}

                {currentOrg && isCollapsed && (
                    <div className="px-3 pb-2 flex justify-center">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href={`${basePath}/billing`}
                                    className="h-9 w-9 rounded-lg flex items-center justify-center text-[11px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/35 transition-colors"
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
                    <div className="mx-4 h-px bg-white/10" />

                    <div className="px-3 py-3 space-y-1">
                        {filteredBottomNavigation.map((item) => {
                            const active = isActive(item.href)
                            const Icon = item.icon
                            const { locked, minPlan } = computeLock(item)
                            const targetHref = locked
                                ? `${basePath}/billing`
                                : `${basePath}${item.href}`

                            const linkContent = (
                                <Link
                                    href={targetHref}
                                    className={cn(
                                        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                                        active
                                            ? 'text-white bg-white/15'
                                            : 'text-white/60 hover:text-white hover:bg-white/8',
                                        locked && 'opacity-70'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
                                            active ? 'text-white' : 'text-white/50 group-hover:text-white'
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

                                    {locked && !isCollapsed && (
                                        <Lock className="ml-auto h-3.5 w-3.5 text-white/50" aria-label={`Plan ${minPlan} requis`} />
                                    )}
                                    {locked && isCollapsed && (
                                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-400" aria-label={`Plan ${minPlan} requis`} />
                                    )}
                                </Link>
                            )

                            return isCollapsed ? (
                                <Tooltip key={item.name}>
                                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                    <TooltipContent side="right" className="flex items-center gap-2">
                                        {item.name}
                                        {locked && minPlan && (
                                            <span className="rounded-full bg-amber-400/20 text-amber-300 px-1.5 py-0.5 text-[10px] font-semibold">
                                                {minPlan}+
                                            </span>
                                        )}
                                    </TooltipContent>
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
                                            className={cn(
                                                "w-full justify-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                                                isActive('/help')
                                                    ? "text-white bg-white/15"
                                                    : "text-white/60 hover:text-white hover:bg-white/8"
                                            )}
                                        >
                                            <HelpCircle className={cn("h-[18px] w-[18px]", isActive('/help') ? "text-white" : "text-white/50")} aria-hidden="true" />
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
                                    className={cn(
                                        "w-full justify-start gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer",
                                        isActive('/help')
                                            ? "text-white bg-white/15"
                                            : "text-white/60 hover:text-white hover:bg-white/8"
                                    )}
                                >
                                    <HelpCircle className={cn("h-[18px] w-[18px]", isActive('/help') ? "text-white" : "text-white/50")} aria-hidden="true" />
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
