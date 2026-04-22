'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import {
    MessageCircle,
    Bot,
    Users,
    BarChart3,
    Megaphone,
    Contact,
    ArrowRight,
    Zap,
    CheckCircle,
    Sparkles,
    Send,
    Search,
} from 'lucide-react'
import Link from 'next/link'
import { MagicCard } from '@/components/landing/ui/magic-card'
import { ShimmerButton } from '@/components/landing/ui/shimmer-button'
import { cn } from '@/lib/utils'

type Feature = {
    id: string
    icon: typeof MessageCircle
    title: string
    description: string
    tags: string[]
    visual: () => React.JSX.Element
    detailedDescription: string
    keyFeatures: { icon: typeof MessageCircle; title: string; description: string }[]
    stats: { value: string; label: string }[]
}

function InboxVisual() {
    return (
        <div className="absolute inset-3 flex flex-col gap-1.5 rounded-xl border border-border/60 bg-background/80 p-2.5 backdrop-blur">
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border/40 bg-card px-2 py-1.5"
                >
                    <div className={cn(
                        'h-6 w-6 rounded-full bg-gradient-to-br text-[9px] font-semibold text-white flex items-center justify-center',
                        ['from-rose-400 to-rose-600', 'from-sky-400 to-sky-600', 'from-amber-400 to-amber-600', 'from-violet-400 to-violet-600'][i]
                    )}>
                        {['AD', 'MS', 'CF', 'BL'][i]}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-semibold">
                            {['Aïssatou Diop', 'Moussa Sow', 'Coumba Fall', 'Bineta Ly'][i]}
                        </p>
                        <p className="truncate text-[9px] text-muted-foreground">
                            {['Ma commande #4821…', 'Merci beaucoup pour…', 'Changer de taille…', 'Remboursement svp'][i]}
                        </p>
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                </div>
            ))}
        </div>
    )
}

function BroadcastVisual() {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
                <motion.div
                    className="absolute inset-0 -m-6 rounded-full border border-[var(--accent)]/30"
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                    className="absolute inset-0 -m-6 rounded-full border border-[var(--accent)]/30"
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 1.25 }}
                />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] shadow-[0_20px_40px_-10px_var(--accent-glow)]">
                    <Megaphone className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    )
}

function AIVisual() {
    return (
        <div className="absolute inset-3 flex flex-col justify-end gap-1.5">
            <div className="self-start rounded-2xl rounded-bl-sm bg-muted px-2.5 py-1.5 text-[10px] max-w-[75%]">
                Bonjour, où en est ma commande ?
            </div>
            <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-muted)] p-2">
                <div className="mb-1 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5 text-[var(--accent)]" />
                    <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                        Suggéré · 94%
                    </span>
                </div>
                <p className="text-[10px] leading-snug">
                    Bonjour 👋 votre commande #4821 a été expédiée hier soir…
                </p>
            </div>
        </div>
    )
}

function TeamVisual() {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex -space-x-3">
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-gradient-to-br text-[11px] font-semibold text-white shadow-md',
                            ['from-rose-400 to-rose-600', 'from-sky-400 to-sky-600', 'from-amber-400 to-amber-600', 'from-violet-400 to-violet-600'][i]
                        )}
                    >
                        {['F', 'M', 'K', 'N'][i]}
                    </motion.div>
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-background text-[10px] font-semibold shadow-md">
                    +5
                </div>
            </div>
        </div>
    )
}

function StatsVisual() {
    return (
        <div className="absolute inset-x-6 bottom-6 flex items-end gap-1.5 h-24">
            {[35, 60, 45, 78, 55, 88, 70].map((h, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-[var(--accent)] to-[var(--accent-muted)]"
                />
            ))}
        </div>
    )
}

function CRMVisual() {
    return (
        <div className="absolute inset-3 rounded-xl border border-border/60 bg-background/80 p-2.5 backdrop-blur">
            <div className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-card px-2 py-1 mb-2">
                <Search className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground">Rechercher un contact…</span>
            </div>
            {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between border-b border-border/30 py-1.5 last:border-0">
                    <div className="flex items-center gap-1.5">
                        <div className={cn(
                            'h-5 w-5 rounded-full bg-gradient-to-br text-[8px] font-semibold text-white flex items-center justify-center',
                            ['from-rose-400 to-rose-600', 'from-sky-400 to-sky-600', 'from-emerald-400 to-emerald-600'][i]
                        )}>
                            {['A', 'M', 'K'][i]}
                        </div>
                        <span className="text-[9px] font-medium">{['Aïssatou', 'Moussa', 'Khadija'][i]}</span>
                    </div>
                    <span className={cn(
                        'rounded-full px-1.5 py-0.5 text-[7px] font-semibold uppercase',
                        ['bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-[var(--accent-muted)] text-[var(--accent)]'][i]
                    )}>
                        {['VIP', 'Lead', 'Actif'][i]}
                    </span>
                </div>
            ))}
        </div>
    )
}

const features: Feature[] = [
    {
        id: 'inbox',
        icon: MessageCircle,
        title: 'Inbox unifiée',
        description: 'Tous vos numéros WhatsApp Business dans une seule vue.',
        tags: ['Centralisation', 'Multi-numéros'],
        visual: InboxVisual,
        detailedDescription:
            'Fini le ping-pong entre 3 téléphones. Jokko agrège tous vos numéros WhatsApp Business dans une inbox unique avec filtres avancés, recherche full-text et assignation granulaire.',
        keyFeatures: [
            { icon: MessageCircle, title: 'Multi-numéros', description: 'Jusqu\'à 50 numéros dans une seule interface' },
            { icon: Users, title: 'Vue client 360°', description: 'Historique, notes, tags, commandes liées' },
            { icon: Search, title: 'Recherche full-text', description: 'Retrouvez n\'importe quel message en < 100ms' },
        ],
        stats: [
            { value: '100%', label: 'Messages centralisés' },
            { value: '< 100ms', label: 'Recherche' },
        ],
    },
    {
        id: 'broadcast',
        icon: Megaphone,
        title: 'Campagnes marketing',
        description: 'Envoyez des messages ciblés à des milliers de clients.',
        tags: ['Acquisition', 'Fidélisation'],
        visual: BroadcastVisual,
        detailedDescription:
            'Transformez WhatsApp en canal d\'acquisition. Créez des campagnes segmentées, planifiées ou récurrentes avec des taux d\'ouverture supérieurs à 90%.',
        keyFeatures: [
            { icon: Send, title: 'Envoi de masse', description: 'Sans risque de blocage, conforme politique Meta' },
            { icon: BarChart3, title: 'Tracking avancé', description: 'Taux d\'ouverture, clics, conversions' },
            { icon: Sparkles, title: 'Segmentation IA', description: 'Audiences auto selon comportement' },
        ],
        stats: [
            { value: '98%', label: 'Taux d\'ouverture' },
            { value: '12×', label: 'ROI vs email' },
        ],
    },
    {
        id: 'ai',
        icon: Bot,
        title: 'Jokko AI — Jo',
        description: 'Un copilot qui rédige vos réponses à votre place.',
        tags: ['Automatisation', 'Productivité'],
        visual: AIVisual,
        detailedDescription:
            'Jo lit le thread, comprend le ton de votre marque et propose un brouillon en 2 secondes. Vous validez ou ajustez — vous envoyez. Jamais d\'envoi automatique sans votre feu vert.',
        keyFeatures: [
            { icon: Sparkles, title: 'Brouillons intelligents', description: 'Adaptés au client et à votre marque' },
            { icon: Zap, title: 'Résumé de fil', description: 'Thread de 50 messages → 3 bullets' },
            { icon: CheckCircle, title: 'Détection d\'intention', description: 'Commande, réclamation, lead…' },
        ],
        stats: [
            { value: '10×', label: 'Plus rapide' },
            { value: '94%', label: 'Ton conservé' },
        ],
    },
    {
        id: 'crm',
        icon: Contact,
        title: 'CRM intégré',
        description: 'Segmentez, notez, personnalisez chaque interaction.',
        tags: ['Organisation', 'Données'],
        visual: CRMVisual,
        detailedDescription:
            'Un CRM pensé pour WhatsApp. Tags dynamiques, notes partagées, champs personnalisés, import CSV, sync Shopify/WooCommerce. Plus qu\'un carnet d\'adresses.',
        keyFeatures: [
            { icon: Users, title: 'Tags et segments', description: 'Listes dynamiques par comportement' },
            { icon: Search, title: 'Import/export', description: 'CSV, API, intégrations natives' },
            { icon: Sparkles, title: 'Champs custom', description: 'Adaptez à votre business' },
        ],
        stats: [
            { value: '∞', label: 'Contacts' },
            { value: '15+', label: 'Intégrations' },
        ],
    },
    {
        id: 'team',
        icon: Users,
        title: 'Travail d\'équipe',
        description: 'Un numéro, plusieurs agents, zéro conflit.',
        tags: ['Collaboration', 'Assignation'],
        visual: TeamVisual,
        detailedDescription:
            'Assignation manuelle ou automatique (round-robin, par langue, charge, tag). Chaque agent voit uniquement ce qui lui appartient. Les managers voient tout, partout.',
        keyFeatures: [
            { icon: CheckCircle, title: 'Assignation auto', description: 'Round-robin, règles, langues' },
            { icon: Users, title: 'Rôles granulaires', description: 'Owner, admin, agent — permissions fines' },
            { icon: Zap, title: 'Notes internes', description: 'Communiquez sans spammer le client' },
        ],
        stats: [
            { value: '+50%', label: 'Productivité' },
            { value: '0', label: 'Message perdu' },
        ],
    },
    {
        id: 'analytics',
        icon: BarChart3,
        title: 'Analytics temps réel',
        description: 'Pilotez votre activité avec des données précises.',
        tags: ['Performance', 'ROI'],
        visual: StatsVisual,
        detailedDescription:
            'Volume, temps de première réponse, taux de résolution, CSAT WhatsApp. Dashboards personnalisables, exports CSV, alertes Slack. Convex propulse tout en < 100ms.',
        keyFeatures: [
            { icon: BarChart3, title: 'Dashboards custom', description: 'Vues par équipe, par numéro, par campagne' },
            { icon: Zap, title: 'Temps réel', description: 'Données live, zéro refresh' },
            { icon: CheckCircle, title: 'Alertes Slack', description: 'Sur seuils ou anomalies' },
        ],
        stats: [
            { value: '360°', label: 'Vue complète' },
            { value: '< 100ms', label: 'Latence' },
        ],
    },
]

export function FeaturesOverviewSection() {
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

    return (
        <section className="relative py-28 md:py-36">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                        Fonctionnalités
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
                        Une suite complète. Pensée pour vos équipes.
                    </h2>
                    <p className="mt-5 text-lg text-muted-foreground">
                        De la première connexion au reporting, chaque outil est conçu pour vous faire gagner du temps.
                    </p>
                </div>

                <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        const Visual = feature.visual
                        return (
                            <motion.button
                                key={feature.id}
                                type="button"
                                onClick={() => setSelectedFeature(feature)}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                className="group relative text-left"
                            >
                                <MagicCard
                                    className="h-full transition-transform duration-300 group-hover:-translate-y-1"
                                    gradientColor="var(--accent-glow)"
                                >
                                    <div className="flex h-full flex-col p-6 md:p-7">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)] shadow-sm">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-wrap justify-end gap-1.5">
                                                {feature.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-full border border-border/60 bg-card px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                            {feature.description}
                                        </p>

                                        <div className="relative mt-6 h-44 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-muted/60 to-card">
                                            <Visual />
                                        </div>

                                        <div className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-[var(--accent)]">
                                            En savoir plus
                                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </MagicCard>
                            </motion.button>
                        )
                    })}
                </div>

                <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
                    <DialogContent
                        showCloseButton
                        className="max-w-[calc(100%-2rem)] overflow-hidden border-border/60 bg-background p-0 sm:max-w-3xl"
                    >
                        {selectedFeature && (
                            <div className="flex flex-col md:flex-row">
                                <div className="relative overflow-hidden bg-[var(--surface-dark)] p-8 text-white md:w-2/5">
                                    <div
                                        aria-hidden
                                        className="pointer-events-none absolute inset-0 opacity-[0.04]"
                                        style={{
                                            backgroundImage:
                                                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
                                            backgroundSize: '24px 24px',
                                        }}
                                    />
                                    <div
                                        aria-hidden
                                        className="pointer-events-none absolute inset-0"
                                        style={{
                                            background:
                                                'radial-gradient(ellipse at 30% 20%, var(--accent-glow) 0%, transparent 60%)',
                                            opacity: 0.5,
                                        }}
                                    />
                                    <div className="relative flex h-full flex-col justify-between gap-8">
                                        <div>
                                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                                                <selectedFeature.icon className="h-6 w-6 text-white" />
                                            </div>
                                            <DialogHeader className="mt-5">
                                                <DialogTitle className="font-display text-3xl font-bold tracking-tight text-white">
                                                    {selectedFeature.title}
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {selectedFeature.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-white/80"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedFeature.stats.map((stat, i) => (
                                                <div
                                                    key={i}
                                                    className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
                                                >
                                                    <div className="font-display text-2xl font-bold text-white">
                                                        {stat.value}
                                                    </div>
                                                    <div className="mt-1 text-[10px] uppercase tracking-wider text-white/60">
                                                        {stat.label}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col p-8 md:w-3/5 md:p-10">
                                    <DialogDescription className="text-base leading-relaxed text-foreground">
                                        {selectedFeature.detailedDescription}
                                    </DialogDescription>

                                    <div className="mt-8 space-y-5 flex-1">
                                        {selectedFeature.keyFeatures.map((kf, i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
                                                    <kf.icon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold">{kf.title}</h4>
                                                    <p className="mt-0.5 text-sm text-muted-foreground">{kf.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 flex items-center justify-end border-t border-border/60 pt-5">
                                        <ShimmerButton asChild size="default" variant="primary">
                                            <Link href="/auth/sign-up">
                                                Essayer gratuitement
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                            </Link>
                                        </ShimmerButton>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    )
}
