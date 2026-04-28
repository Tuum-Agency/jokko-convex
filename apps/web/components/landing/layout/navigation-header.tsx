"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { name: "Accueil", href: "/" },
  { name: "Produit", href: "/fonctionnalites" },
  { name: "Solutions", href: "/solutions/service-client" },
  { name: "Tarifs", href: "/tarifs" },
  { name: "Contact", href: "/contact" },
];

export function NavigationHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "pt-3" : "pt-5"
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        <nav
          className={cn(
            "flex items-center justify-between gap-4 transition-all duration-500",
            scrolled
              ? "rounded-full border border-black/5 bg-white/75 px-4 py-2 shadow-[0_8px_32px_-12px_rgba(20,20,26,0.18)] backdrop-blur-xl backdrop-saturate-150"
              : "rounded-full border border-transparent bg-transparent px-2 py-2"
          )}
          aria-label="Navigation principale"
        >
          <Link href="/" className="group flex items-center gap-2 pl-2">
            <LogoMark />
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              Jokko
            </span>
          </Link>

          <div className="hidden items-center gap-0.5 lg:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-foreground/5"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="ghost" size="sm" className="rounded-full font-medium">
              <Link href="/auth/sign-in">Connexion</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-foreground px-4 font-medium text-background hover:bg-foreground/90"
            >
              <Link href="/auth/sign-up" className="group">
                Démarrer
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="h-auto rounded-b-3xl border-0 pt-16">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex flex-col gap-2 px-2 pb-6">
                  {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center justify-between rounded-2xl px-4 py-4 text-lg font-medium transition-colors",
                          active
                            ? "bg-foreground/5 text-foreground"
                            : "text-foreground/80 hover:bg-foreground/5"
                        )}
                      >
                        {item.name}
                        <ArrowRight className="h-4 w-4 opacity-40" />
                      </Link>
                    );
                  })}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/auth/sign-in" onClick={() => setIsOpen(false)}>
                        Connexion
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="rounded-full bg-foreground text-background hover:bg-foreground/90"
                    >
                      <Link href="/auth/sign-up" onClick={() => setIsOpen(false)}>
                        Démarrer
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </motion.header>
  );
}

function LogoMark() {
  return (
    <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-hover text-[13px] font-bold text-white shadow-[0_6px_16px_-4px_var(--accent-glow)]">
      <span aria-hidden>J</span>
      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--whatsapp)] ring-2 ring-background" />
    </span>
  );
}
