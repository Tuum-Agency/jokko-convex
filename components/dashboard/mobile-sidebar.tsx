'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
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
    LogOut,
    Menu,
    HelpCircle,
} from 'lucide-react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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

// Navigation items
const mainNavigation = [
    { name: 'Dashboard', href: '', icon: LayoutDashboard },
    { name: 'Conversations', href: '/conversations', icon: MessageSquare },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Team', href: '/team', icon: UsersRound },
    { name: 'Attribution', href: '/assignments', icon: UserCheck },
    { name: 'Modèles', href: '/modeles', icon: FileText },
    { name: 'Campagnes', href: '/campagnes', icon: Send },
    { name: 'Automatisation', href: '/automatisations', icon: Workflow },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp },
]

const bottomNavigation = [
    { name: 'Facturation', href: '/billing', icon: CreditCard },
    { name: 'Paramètres', href: '/settings', icon: Settings },
]

interface MobileSidebarProps {
    basePath?: string
    user?: {
        name: string
        email: string
        avatar?: string
    }
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

    const restrictedForAgents = ['Attribution', 'Modèles', 'Campagnes', 'Analytics', 'Automatisation', 'Team']

    const filteredNavigation = mainNavigation.filter(item => {
        if (role === 'AGENT') return !restrictedForAgents.includes(item.name)
        return true
    })

    const filteredBottomNavigation = bottomNavigation.filter(item => {
        if (role === 'AGENT') return item.name !== 'Facturation'
        return true
    })

    const isActive = (href: string) => {
        const fullPath = `${basePath}${href}`
        if (href === '') return pathname === basePath || pathname === `${basePath}/`
        return pathname.startsWith(fullPath)
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

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
                    className="lg:hidden h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Ouvrir le menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-[min(280px,85vw)] p-0 bg-gradient-to-b from-[#1a5c35] via-[#14532d] to-[#0c3b20] border-r-0"
            >
                <SheetHeader className="p-4 border-b border-white/10">
                    <SheetTitle className="flex items-center gap-2.5">
                        <Image
                            src="/logo.png"
                            alt="Jokko"
                            width={28}
                            height={28}
                            className="object-contain brightness-0 invert"
                        />
                        <span className="text-base font-bold text-white tracking-tight">Jokko</span>
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
                    <nav className="p-3 space-y-1">
                        {filteredNavigation.map((item) => {
                            const active = isActive(item.href)
                            const Icon = item.icon

                            return (
                                <Link
                                    key={item.name}
                                    href={`${basePath}${item.href}`}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        'group flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-medium transition-all duration-200',
                                        active
                                            ? 'text-white bg-white/15'
                                            : 'text-white/60 hover:text-white hover:bg-white/8'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
                                            active ? 'text-white' : 'text-white/50 group-hover:text-white'
                                        )}
                                        aria-hidden="true"
                                    />
                                    <span className="flex-1">{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="mx-4 h-px bg-white/10 my-2" />

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
                                        'group flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-medium transition-all duration-200',
                                        active
                                            ? 'text-white bg-white/15'
                                            : 'text-white/60 hover:text-white hover:bg-white/8'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
                                            active ? 'text-white' : 'text-white/50 group-hover:text-white'
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
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-medium transition-all duration-200",
                                isActive('/help')
                                    ? "text-white bg-white/15"
                                    : "text-white/60 hover:text-white hover:bg-white/8"
                            )}
                        >
                            <HelpCircle className={cn("h-[18px] w-[18px] shrink-0 transition-colors duration-200", isActive('/help') ? "text-white" : "text-white/50 group-hover:text-white")} aria-hidden="true" />
                            <span>Aide & Support</span>
                        </Link>
                    </div>
                </ScrollArea>

                {/* User Profile */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-gradient-to-b from-[#1a5c35] via-[#14532d] to-[#0c3b20]">
                    <div className="flex items-center gap-3 rounded-lg p-2">
                        {user ? (
                            <>
                                <Avatar className="h-9 w-9 ring-2 ring-white/20">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="bg-white/15 text-white text-xs font-semibold">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-medium text-white">{user.name}</p>
                                    <p className="truncate text-[11px] text-white/40">{organizationName}</p>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Se déconnecter"
                                    className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-white/8 cursor-pointer"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" aria-hidden="true" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-3 w-24 bg-white/10" />
                                    <Skeleton className="h-2.5 w-16 bg-white/10" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
