'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Menu, X, Home, Zap, DollarSign, Mail, Sparkles } from 'lucide-react'
import { SquigglyUnderline, FadeInView } from '@/components/animations'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'

export function NavigationHeader() {
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const pathname = usePathname()

    // Fonction pour déterminer si un item est actif
    const isActiveItem = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10
            setScrolled(isScrolled)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navigationItems = [
        {
            name: 'Accueil',
            href: '/',
            icon: Home
        },
        {
            name: 'Fonctionnalités',
            href: '/fonctionnalities',
            icon: Zap
        },
        {
            name: 'Tarifs',
            href: '/tarifs',
            icon: DollarSign
        },
        // { 
        //   name: 'À propos', 
        //   href: '/a-propos', 
        //   icon: Info
        // },
        {
            name: 'Contact',
            href: '/contact',
            icon: Mail
        },
    ]

    return (
        <header className={cn(
            "fixed top-0 z-50 w-full transition-all duration-500 ease-out",
            scrolled
                ? "bg-white/20 backdrop-blur-2xl border-b border-white/20 shadow-2xl shadow-black/10"
                : "bg-transparent"
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 sm:h-17 md:h-18 lg:h-20 items-center justify-between">
                    {/* Logo */}
                    <FadeInView delay={0.1}>
                        <Logo />
                    </FadeInView>

                    {/* Navigation Desktop */}
                    <nav className="hidden lg:flex items-center space-x-8 flex-1 justify-center" aria-label="Navigation principale">
                        {navigationItems.map((item) => {
                            const isActive = isActiveItem(item.href)
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "font-medium transition-colors duration-200 text-base lg:text-lg relative",
                                        isActive ? "text-green-600" : "text-gray-700 hover:text-green-600"
                                    )}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {item.name}
                                    {isActive && <SquigglyUnderline />}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Boutons d'authentification Desktop */}
                    <div className="hidden lg:flex items-center space-x-4 z-10 flex-shrink-0">
                        <Button variant="ghost" asChild className="text-gray-700 hover:text-green-600 text-base lg:text-lg px-4 lg:px-5">
                            <Link href="/sign-in">Connexion</Link>
                        </Button>
                        <Button asChild className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200 text-base lg:text-lg px-5 lg:px-6">
                            <Link href="/sign-up">Essai Gratuit</Link>
                        </Button>
                    </div>

                    {/* Menu Mobile */}
                    <div className="lg:hidden z-10 flex-shrink-0">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-700 h-9 w-9 md:h-10 md:w-10 hover:bg-green-50 hover:text-green-600 transition-all duration-300 relative overflow-hidden group"
                                >
                                    <div className="relative w-4 h-4 md:w-5 md:h-5">
                                        <Menu className={cn(
                                            "w-4 h-4 md:w-5 md:h-5 absolute transition-all duration-300 transform",
                                            isOpen ? "rotate-90 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100"
                                        )} />
                                        <X className={cn(
                                            "w-4 h-4 md:w-5 md:h-5 absolute transition-all duration-300 transform",
                                            isOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-0"
                                        )} />
                                    </div>
                                    <span className="sr-only">{isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
                                    {/* Effet de vague */}
                                    <div className="absolute inset-0 bg-green-100 rounded-full scale-0 group-active:scale-100 transition-transform duration-200" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="right"
                                className="w-full xs:w-[350px] sm:w-[400px] bg-white/95 backdrop-blur-2xl border-l border-gray-200/20 p-6"
                            >
                                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                                <div className="flex flex-col h-full">
                                    {/* En-tête avec logo et actions rapides */}
                                    <div className="pt-4 pb-6">
                                        <div className="pb-4" onClick={() => setIsOpen(false)}>
                                            <Logo width={100} height={33} />
                                        </div>
                                    </div>

                                    {/* Navigation principale */}
                                    <nav className="flex-1 py-2" aria-label="Navigation mobile">
                                        <div className="space-y-1">
                                            {navigationItems.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className={cn(
                                                        "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group/item relative",
                                                        isActiveItem(item.href)
                                                            ? "bg-green-50 border-l-2 border-green-600"
                                                            : "hover:bg-white/50"
                                                    )}
                                                    onClick={() => setIsOpen(false)}
                                                    aria-current={isActiveItem(item.href) ? 'page' : undefined}
                                                >
                                                    <div className={cn(
                                                        "p-2 rounded-lg transition-all duration-300",
                                                        isActiveItem(item.href)
                                                            ? "bg-linear-to-br from-green-100 to-green-200"
                                                            : "bg-linear-to-br from-gray-100 to-gray-50 group-hover/item:from-green-100 group-hover/item:to-green-50"
                                                    )}>
                                                        <item.icon className={cn(
                                                            "w-4 h-4 transition-all duration-300",
                                                            isActiveItem(item.href)
                                                                ? "text-green-600"
                                                                : "text-gray-600 group-hover/item:text-green-600"
                                                        )} />
                                                    </div>
                                                    <div>
                                                        <span className={cn(
                                                            "font-medium text-sm sm:text-base transition-all duration-300",
                                                            isActiveItem(item.href)
                                                                ? "text-green-700"
                                                                : "text-gray-900 group-hover/item:text-green-700"
                                                        )}>{item.name}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </nav>

                                    {/* Section d'appel à l'action */}
                                    <div className="pt-4 pb-6 border-t border-white/30">
                                        {/* Preuve sociale subtile */}
                                        <div className="bg-linear-to-r from-green-50 to-blue-50 rounded-xl p-3 mb-4 border border-white/50">
                                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                                                <div className="flex -space-x-1">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="w-6 h-6 rounded-full bg-linear-to-br from-green-400 to-green-600 border-2 border-white shadow-sm" />
                                                    ))}
                                                </div>
                                                <span className="text-xs sm:text-sm">+500 entreprises nous font confiance</span>
                                            </div>
                                        </div>

                                        {/* Boutons d'authentification */}
                                        <div className="space-y-3">
                                            <Button
                                                variant="outline"
                                                asChild
                                                className="w-full h-12 border-gray-200 text-gray-700 hover:bg-white hover:border-green-200 hover:text-green-700 transition-all duration-300"
                                            >
                                                <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                                                    Connexion
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                className="w-full h-12 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                                            >
                                                <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                                                    <span className="relative z-10 flex items-center justify-center">
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        Essai Gratuit
                                                    </span>
                                                    {/* Effet de brillance */}
                                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    )
}
