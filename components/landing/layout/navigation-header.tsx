'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Menu, Home, Zap, DollarSign, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { SquigglyUnderline } from '@/components/animations/squiggly-underline'

export function NavigationHeader() {
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const pathname = usePathname()

    const isActiveItem = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 20
            setScrolled(isScrolled)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navigationItems = [
        { name: 'Accueil', href: '/', icon: Home },
        { name: 'Fonctionnalités', href: '/fonctionnalites', icon: Zap },
        { name: 'Tarifs', href: '/tarifs', icon: DollarSign },
        { name: 'Contact', href: '/contact', icon: Mail },
    ]

    return (
        <motion.header
            className={cn(
                "fixed top-0 z-50 w-full transition-all duration-300",
                scrolled ? "pt-4" : "pt-0"
            )}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* Floating Container */}
                <motion.div
                    layout
                    className={cn(
                        "relative flex items-center justify-between transition-all duration-500",
                        scrolled
                            ? "bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/5 rounded-full px-6 py-3"
                            : "bg-transparent px-4 py-5"
                    )}
                >
                    {/* Logo Area */}
                    <div className="shrink-0">
                        <Link href="/" className="flex items-center gap-2">
                            {/* Simplified Logo for Navbar */}
                            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                                J
                            </div>
                            <span className={cn(
                                "font-bold text-xl tracking-tight transition-colors",
                                scrolled ? "text-slate-900" : "text-slate-900"
                            )}>
                                Jokko
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Utility Nav (Centered) */}
                    <nav className="hidden lg:flex items-center gap-1 bg-black/5 rounded-full p-1.5 backdrop-blur-sm border border-white/10">
                        {navigationItems.map((item) => {
                            const isActive = isActiveItem(item.href)
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                        isActive
                                            ? "text-slate-900 bg-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                    )}
                                >
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Button variant="ghost" asChild className="rounded-full hover:bg-black/5 text-slate-700 font-medium">
                            <Link href="/sign-in">Connexion</Link>
                        </Button>
                        <Button asChild className="rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg px-6">
                            <Link href="/sign-up">
                                Essai Gratuit
                            </Link>
                        </Button>
                    </div>


                    {/* Mobile Toggle */}
                    <div className="lg:hidden">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button size="icon" variant="ghost" className="rounded-full">
                                    <Menu className="w-6 h-6 text-slate-700" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="top" className="w-full h-auto rounded-b-4xl pt-16">
                                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                                <nav className="flex flex-col gap-4">
                                    {navigationItems.map((item) => {
                                        const isActive = isActiveItem(item.href)
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className={cn(
                                                    "relative text-2xl font-semibold transition-all flex items-center py-2",
                                                    isActive
                                                        ? "text-green-600"
                                                        : "text-slate-900 hover:text-green-600"
                                                )}
                                            >
                                                <span className="relative">
                                                    {item.name}
                                                    {isActive && <SquigglyUnderline className="-bottom-2" />}
                                                </span>
                                            </Link>
                                        )
                                    })}
                                    <hr className="border-slate-100 my-2" />
                                    <div className="flex flex-col gap-3">
                                        <Button variant="ghost" className="w-full rounded-full hover:bg-black/5 text-slate-700 font-medium" asChild>
                                            <Link href="/sign-in">Connexion</Link>
                                        </Button>
                                        <Button className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg" asChild>
                                            <Link href="/sign-up">Essai Gratuit</Link>
                                        </Button>
                                    </div>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </motion.div>
            </div>
        </motion.header>
    )
}
