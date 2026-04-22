'use client'

import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    MessageCircle,
    ShoppingBag,
    Users,
    Building2,
    Store,
    ArrowRight,
    CheckCircle,
    Zap,
    ShieldCheck,
    Sparkles,
    BarChart3,
    Plug,
    Clock,
    Quote,
    type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShimmerButton } from '@/components/landing/ui/shimmer-button'
import { MagicCard } from '@/components/landing/ui/magic-card'
import { CountUp } from '@/components/animations/count-up'
import { SplitText } from '@/components/animations/split-text'
import { CtaSection } from '@/components/landing/sections/home/cta-section'
import { FaqSection } from '@/components/landing/sections/home/faq-section'
import { cn } from '@/lib/utils'

type SolutionData = {
    title: string
    description: string
    icon: LucideIcon
    eyebrow: string
    stats: { value: number; suffix?: string; prefix?: string; label: string }[]
    features: { title: string; desc: string; icon: LucideIcon }[]
    useCases: { title: string; desc: string }[]
    testimonial: { quote: string; name: string; role: string; company: string; initials: string; metric: string }
    timeline: { step: string; title: string; desc: string }[]
}

const solutionsData: Record<string, SolutionData> = {
    'e-commerce': {
        title: 'Boostez vos ventes e-commerce.',
        description:
            "Transformez chaque conversation WhatsApp en ventes. Récupérez les paniers abandonnés, confirmez les commandes, gérez les retours — tout depuis une inbox unifiée.",
        icon: ShoppingBag,
        eyebrow: 'Solution · E-commerce',
        stats: [
            { value: 45, suffix: '%', label: 'Panier récupéré' },
            { value: 3, suffix: '×', label: 'Plus de conversions' },
            { value: 24, suffix: '/7', label: 'Support auto' },
            { value: 98, suffix: '%', label: 'Taux d\'ouverture' },
        ],
        features: [
            { title: 'Relance panier abandonné', desc: 'Message WhatsApp automatique 1h après l\'abandon. Personnalisé, avec lien de paiement.', icon: MessageCircle },
            { title: 'Notifications de commande', desc: 'Confirmation, expédition, livraison. Chaque étape notifiée en temps réel.', icon: CheckCircle },
            { title: 'Catalogue natif WhatsApp', desc: 'Envoyez vos produits en un clic. Achat direct sans quitter la conversation.', icon: ShoppingBag },
            { title: 'Retours et réclamations', desc: 'Workflow guidé, scan du QR code, étiquette de retour envoyée automatiquement.', icon: Plug },
            { title: 'Cross-sell intelligent', desc: 'L\'IA suggère les produits complémentaires selon l\'historique d\'achat.', icon: Sparkles },
            { title: 'Reporting revenu', desc: 'Attribution précise du CA WhatsApp, ROI par campagne, cohortes clients.', icon: BarChart3 },
        ],
        useCases: [
            { title: 'Dakar Fashion — +48% de panier récupéré', desc: 'Relance automatique 1h puis 24h avec offre personnalisée. Retour sur investissement en moins d\'un mois.' },
            { title: 'Teranga Beauty — 12M FCFA via WhatsApp', desc: 'Campagnes promo segmentées par type de peau. Taux d\'ouverture 94%, taux de clic 38%.' },
            { title: 'Coura Market — Support 24/7 sans recruter', desc: 'Jokko IA répond à 82% des demandes. Les 18% complexes sont remontés aux humains.' },
        ],
        testimonial: {
            quote: 'On a remplacé 3 outils (Gorgias, Klaviyo, SMS) par Jokko. On récupère 48% de nos paniers abandonnés et on a divisé par 3 notre temps de réponse.',
            name: 'Fatou Diagne',
            role: 'Head of Customer Ops',
            company: 'Dakar Fashion',
            initials: 'FD',
            metric: '+48% CA',
        },
        timeline: [
            { step: '01', title: 'Connectez Shopify', desc: 'Sync catalogue, commandes et clients en 2 clics.' },
            { step: '02', title: 'Activez les flows', desc: 'Relance panier, confirmation, livraison — préconfigurés.' },
            { step: '03', title: 'Mesurez le ROI', desc: 'Dashboard revenu WhatsApp en temps réel.' },
        ],
    },
    'service-client': {
        title: 'Un service client 5 étoiles.',
        description:
            'Centralisez toutes vos demandes, répondez 10× plus vite grâce à l\'IA, et transformez votre support en avantage compétitif.',
        icon: Users,
        eyebrow: 'Solution · Service client',
        stats: [
            { value: 47, suffix: 's', label: 'Temps 1ère réponse' },
            { value: 98, suffix: '%', label: 'Satisfaction' },
            { value: 0, suffix: '', label: 'Message perdu' },
            { value: 10, suffix: '×', label: 'Plus rapide' },
        ],
        features: [
            { title: 'Boîte de réception partagée', desc: 'Un numéro, toute l\'équipe, zéro conflit. Voir qui répond en temps réel.', icon: Users },
            { title: 'Réponses IA contextuelles', desc: 'Jo lit le thread et propose un brouillon en 2 secondes, avec ton de marque.', icon: Zap },
            { title: 'Assignation automatique', desc: 'Round-robin, par langue, par charge. L\'équipe n\'y pense même plus.', icon: ArrowRight },
            { title: 'Escalade managériale', desc: 'Règles auto : si client VIP ou CSAT < 3, escalade immédiate.', icon: ShieldCheck },
            { title: 'Notes internes', desc: 'Collaborez sans spammer le client. Mentions @agent, threads privés.', icon: MessageCircle },
            { title: 'SLA et alertes', desc: 'Définissez vos SLA, Jokko alerte Slack avant dépassement.', icon: Clock },
        ],
        useCases: [
            { title: 'Orange Business — -70% temps de réponse', desc: '22 agents, 5 numéros, assignation par langue (wolof/fr/en). Jokko IA couvre 60% du volume.' },
            { title: 'Wave Senegal — CSAT 4.9/5', desc: 'Support bilingue avec escalade auto sur réclamations financières. 0 message perdu en 18 mois.' },
            { title: 'Sen\'Water — Dématérialisation 100%', desc: 'Fini l\'email. Tickets, factures, interventions — tout sur WhatsApp.' },
        ],
        testimonial: {
            quote: 'Avant Jokko, on avait 3 téléphones partagés et un tableur Excel pour routing. Aujourd\'hui notre temps de première réponse est passé de 4h à 47 secondes.',
            name: 'Mamadou Sow',
            role: 'Customer Success Lead',
            company: 'Orange Business',
            initials: 'MS',
            metric: '-70% TFRT',
        },
        timeline: [
            { step: '01', title: 'Invitez votre équipe', desc: 'Owner, admins, agents. Permissions fines par rôle.' },
            { step: '02', title: 'Définissez vos règles', desc: 'Assignation, SLA, escalade, alertes Slack.' },
            { step: '03', title: 'Pilotez les KPI', desc: 'TFRT, taux de résolution, CSAT en temps réel.' },
        ],
    },
    'agences': {
        title: 'L\'outil des agences marketing.',
        description:
            'Gérez plusieurs clients WhatsApp depuis une seule plateforme. Multi-workspace, reporting white-label, facturation centralisée.',
        icon: Building2,
        eyebrow: 'Solution · Agences',
        stats: [
            { value: 10, suffix: '+', label: 'Clients / agent' },
            { value: 90, suffix: '%', label: 'Taux d\'ouverture' },
            { value: 2, suffix: '×', label: 'Productivité' },
            { value: 50, suffix: '%', label: 'Marge préservée' },
        ],
        features: [
            { title: 'Multi-workspace', desc: 'Un espace par client, passage en 1 clic. Pas de confusion, pas de fuite de données.', icon: Users },
            { title: 'Reporting white-label', desc: 'Dashboards clients brandés à vos couleurs. PDF mensuel automatisé.', icon: ShieldCheck },
            { title: 'Broadcast ciblé', desc: 'Campagnes segmentées par audience, A/B test natif, preview avant envoi.', icon: MessageCircle },
            { title: 'Templates réutilisables', desc: 'Bibliothèque de templates validés Meta, partagés entre clients.', icon: Sparkles },
            { title: 'Facturation centralisée', desc: 'Un seul abonnement pour tous vos clients. Refacturez avec marge.', icon: BarChart3 },
            { title: 'API complète', desc: 'Intégrez à votre stack agency : Slack, Notion, Linear, HubSpot.', icon: Plug },
        ],
        useCases: [
            { title: 'SolidWave Agency — 14 clients, 3 agents', desc: 'Workspace par client, assignation transverse, ROI prouvé campagne par campagne.' },
            { title: 'Teranga Media — +2× la marge', desc: 'Jokko remplace Klaviyo + MailChimp + outil custom. Marge agence +50%.' },
            { title: 'Dakar Digital — Onboarding client en 1 jour', desc: 'Templates + flows préconfigurés. Mise en prod le jour même.' },
        ],
        testimonial: {
            quote: 'On gère 14 clients e-commerce avec 3 agents. Jokko nous a permis de doubler notre portefeuille sans recruter. Le reporting white-label fait économiser 6h par client chaque mois.',
            name: 'Khadija Sy',
            role: 'Agency Director',
            company: 'SolidWave',
            initials: 'KS',
            metric: '×2 clients',
        },
        timeline: [
            { step: '01', title: 'Créez vos workspaces', desc: 'Un espace par client, isolé, brandé.' },
            { step: '02', title: 'Importez templates et flows', desc: 'Bibliothèque agency réutilisable.' },
            { step: '03', title: 'Reportez en white-label', desc: 'PDF mensuel à vos couleurs, exports CSV.' },
        ],
    },
    'tpe-pme': {
        title: 'L\'outil idéal pour TPE & PME.',
        description:
            'Donnez une image pro à votre entreprise en 15 minutes. Gérez vos clients comme une grande boîte, sans la complexité ni le budget.',
        icon: Store,
        eyebrow: 'Solution · TPE / PME',
        stats: [
            { value: 15, suffix: ' min', label: 'Installation' },
            { value: 100, suffix: '%', label: 'Professionnel' },
            { value: 24, suffix: 'h', label: 'Disponible' },
            { value: 0, suffix: '', label: 'Formation requise' },
        ],
        features: [
            { title: 'Votre numéro pro en 15 min', desc: 'Validation Meta automatisée. Gardez votre numéro actuel si vous préférez.', icon: CheckCircle },
            { title: 'Message d\'accueil auto', desc: 'Accueillez chaque nouveau contact, même la nuit, avec un ton pro.', icon: MessageCircle },
            { title: 'Organisation simple', desc: 'Tags, notes, rappels. Ne jamais oublier un client ou un devis.', icon: Zap },
            { title: 'Multi-appareils', desc: 'Web, mobile, tablette. Vos conversations synchronisées partout.', icon: Plug },
            { title: 'Templates prêts à l\'emploi', desc: '50+ templates (devis, rappel paiement, relance, RDV) validés Meta.', icon: Sparkles },
            { title: 'Support FR/Wolof', desc: 'Équipe basée à Dakar. Support chat, visio, formation sur-mesure.', icon: Users },
        ],
        useCases: [
            { title: 'Boulangerie Thiossane — +30% de fidélité', desc: 'Campagnes promo hebdo, notifications précommande, anniversaires clients.' },
            { title: 'Garage Baba — Rappels d\'entretien auto', desc: 'Plus d\'oubli de révision. CA récurrent +40%.' },
            { title: 'Coiffure Mame — RDV par WhatsApp', desc: 'Calendrier intégré, rappels 24h avant. Réduction des no-shows de 80%.' },
        ],
        testimonial: {
            quote: 'Je pensais que WhatsApp Business c\'était que pour les grosses boîtes. Jokko m\'a prouvé le contraire — installation en 15 minutes, je gère mes 200 clients comme un pro.',
            name: 'Coumba Fall',
            role: 'Gérante',
            company: 'Boulangerie Thiossane',
            initials: 'CF',
            metric: '+30% fidélité',
        },
        timeline: [
            { step: '01', title: 'Connectez votre numéro', desc: 'Validation Meta en 15 minutes chrono.' },
            { step: '02', title: 'Importez vos contacts', desc: 'CSV, Google Contacts, ou manuel.' },
            { step: '03', title: 'Envoyez votre 1ère campagne', desc: 'Templates prêts, en un clic.' },
        ],
    },
}

export default function SolutionPage() {
    const params = useParams()
    const slug = params.slug as string
    const data = solutionsData[slug]

    if (!data) {
        notFound()
    }

    const Icon = data.icon

    return (
        <>
            {/* Hero */}
            <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, rgba(20,20,26,0.9) 1px, transparent 0)',
                        backgroundSize: '28px 28px',
                    }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
                    style={{
                        background:
                            'radial-gradient(ellipse at 50% 0%, var(--accent-glow) 0%, transparent 55%)',
                        opacity: 0.5,
                    }}
                />

                <div className="relative mx-auto max-w-4xl px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur"
                    >
                        <Icon className="h-3 w-3 text-[var(--accent)]" />
                        {data.eyebrow}
                    </motion.div>

                    <h1 className="mt-8 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
                        <SplitText as="span" className="block">
                            {data.title}
                        </SplitText>
                    </h1>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
                    >
                        {data.description}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="mt-10 flex flex-wrap items-center justify-center gap-3"
                    >
                        <ShimmerButton asChild size="lg" variant="primary">
                            <Link href="/auth/sign-up" className="group">
                                Démarrer gratuitement
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </ShimmerButton>
                        <ShimmerButton asChild size="lg" variant="ghost">
                            <Link href="/contact">Parler à un humain</Link>
                        </ShimmerButton>
                    </motion.div>
                </div>
            </section>

            {/* Stats */}
            <section className="relative border-y border-border/60 bg-muted/40 py-16 md:py-20">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        {data.stats.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                className="text-center"
                            >
                                <div className="font-display text-4xl font-bold tracking-tight tabular-nums md:text-5xl">
                                    <CountUp to={s.value} suffix={s.suffix} prefix={s.prefix} />
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="relative py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                            Fonctionnalités clés
                        </p>
                        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">
                            Tout ce qu&apos;il vous faut pour réussir.
                        </h2>
                    </div>

                    <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {data.features.map((f, i) => {
                            const FIcon = f.icon
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <MagicCard className="h-full" gradientColor="var(--accent-glow)">
                                        <div className="flex h-full flex-col gap-3 p-6">
                                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)] shadow-sm">
                                                <FIcon className="h-5 w-5" />
                                            </div>
                                            <h3 className="mt-1 font-display text-xl font-bold tracking-tight">
                                                {f.title}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-muted-foreground">
                                                {f.desc}
                                            </p>
                                        </div>
                                    </MagicCard>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="relative overflow-hidden bg-[var(--surface-dark)] py-24 text-white md:py-32">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
                        backgroundSize: '28px 28px',
                    }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse at 70% 50%, var(--accent-glow) 0%, transparent 60%)',
                        opacity: 0.35,
                    }}
                />
                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                            En 3 étapes
                        </p>
                        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
                            Opérationnel en quelques minutes.
                        </h2>
                    </div>

                    <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-10">
                        {data.timeline.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm md:p-8"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs text-[var(--accent)]">{t.step}</span>
                                    <span className="h-px flex-1 bg-white/10" />
                                </div>
                                <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">
                                    {t.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-white/70">{t.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Use cases */}
            <section className="relative py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                            Cas d&apos;usage réels
                        </p>
                        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">
                            Ils ont fait le pas.
                        </h2>
                    </div>

                    <div className="mt-14 grid gap-5 md:grid-cols-3">
                        {data.useCases.map((u, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                className={cn(
                                    'rounded-2xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-lg md:p-7'
                                )}
                            >
                                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                    <span>Cas {String(i + 1).padStart(2, '0')}</span>
                                    <span className="h-px flex-1 bg-border" />
                                </div>
                                <h3 className="mt-4 font-display text-lg font-bold leading-tight">
                                    {u.title}
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    {u.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial */}
            <section className="relative overflow-hidden border-y border-border/60 bg-muted/40 py-24 md:py-32">
                <div className="mx-auto max-w-5xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7 }}
                        className="grid gap-10 md:grid-cols-[2fr_1fr] md:items-center"
                    >
                        <div>
                            <Quote className="h-10 w-10 text-[var(--accent)]/40" />
                            <blockquote className="mt-4 font-display text-2xl font-medium leading-snug tracking-tight md:text-3xl">
                                « {data.testimonial.quote} »
                            </blockquote>
                            <div className="mt-8 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-sm font-bold text-white">
                                    {data.testimonial.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{data.testimonial.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {data.testimonial.role} · {data.testimonial.company}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-muted)] p-8 text-center">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
                                Résultat
                            </p>
                            <p className="mt-3 font-display text-5xl font-bold tracking-tight text-foreground md:text-6xl">
                                {data.testimonial.metric}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FAQ + CTA */}
            <FaqSection />
            <CtaSection />
        </>
    )
}
