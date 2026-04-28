"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Loader2,
    ArrowRight,
    Eye,
    EyeOff,
    ShieldCheck,
    Sparkles,
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    Plug,
    UsersRound,
    Bot,
} from "lucide-react";
import { SplitText } from "@/components/animations/split-text";

export default function SignUpContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signIn } = useAuthActions();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            setLoading(false);
            return;
        }

        formData.delete("confirmPassword");
        formData.set("flow", "signUp");

        try {
            await signIn("password", formData);
            router.push("/dashboard");
        } catch (err) {
            console.error("Sign up error:", err);
            if (err instanceof Error) {
                const message = err.message.includes(
                    "Le mot de passe doit contenir",
                )
                    ? "Le mot de passe doit contenir au moins 8 caractères."
                    : "Une erreur est survenue lors de l'inscription.";
                setError(message);
            } else {
                setError("Une erreur inattendue est survenue.");
            }
            setLoading(false);
        }
    }

    return (
        <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
            <main className="relative order-2 flex items-center justify-center px-6 py-12 sm:px-10 lg:order-1">
                <Link
                    href="/"
                    className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all hover:-translate-x-0.5 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] sm:left-10 sm:top-10"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Retour au site
                </Link>

                <div className="w-full max-w-md">
                    <div className="mb-10 lg:hidden">
                        <MobileLogo />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Nouvel espace · 14 jours offerts
                        </p>
                        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            <SplitText>Créons votre espace.</SplitText>
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            Sans carte bancaire. Sans engagement. Installation en
                            5 minutes chrono.
                        </p>
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3.5 text-sm text-rose-600 dark:text-rose-400"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>{error}</p>
                        </motion.div>
                    )}

                    <motion.form
                        onSubmit={handleSubmit}
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.06,
                                    delayChildren: 0.25,
                                },
                            },
                        }}
                        className="mt-8 space-y-4"
                    >
                        <AuthField
                            id="name"
                            name="name"
                            type="text"
                            label="Votre nom complet"
                            placeholder="Aminata Diouf"
                            autoComplete="name"
                            required
                        />

                        <AuthField
                            id="email"
                            name="email"
                            type="email"
                            label="E-mail professionnel"
                            placeholder="vous@entreprise.com"
                            autoComplete="email"
                            required
                        />

                        <AuthField
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            label="Mot de passe"
                            placeholder="8 caractères minimum"
                            autoComplete="new-password"
                            required
                            suffix={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={
                                        showPassword ? "Masquer" : "Afficher"
                                    }
                                    className="text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            }
                        />

                        <AuthField
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            label="Confirmez le mot de passe"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            required
                            suffix={
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((s) => !s)
                                    }
                                    aria-label={
                                        showConfirmPassword
                                            ? "Masquer"
                                            : "Afficher"
                                    }
                                    className="text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            }
                        />

                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 8 },
                                visible: { opacity: 1, y: 0 },
                            }}
                        >
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative mt-2 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[var(--accent)] text-sm font-semibold text-white shadow-[0_10px_30px_-8px_var(--accent-glow)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span
                                    aria-hidden
                                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
                                />
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Création…
                                    </>
                                ) : (
                                    <>
                                        Créer mon espace
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </button>
                        </motion.div>

                        <motion.p
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { opacity: 1 },
                            }}
                            className="text-center text-[11px] leading-relaxed text-muted-foreground"
                        >
                            En créant un compte, vous acceptez nos{" "}
                            <Link
                                href="/terms"
                                className="font-medium text-foreground underline-offset-4 hover:text-[var(--accent)] hover:underline"
                            >
                                CGU
                            </Link>{" "}
                            et notre{" "}
                            <Link
                                href="/privacy"
                                className="font-medium text-foreground underline-offset-4 hover:text-[var(--accent)] hover:underline"
                            >
                                politique de confidentialité
                            </Link>
                            .
                        </motion.p>
                    </motion.form>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="mt-8 text-center text-sm text-muted-foreground"
                    >
                        Vous avez déjà un espace ?{" "}
                        <Link
                            href="/auth/sign-in"
                            className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                        >
                            Se connecter →
                        </Link>
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1 }}
                        className="mt-10 flex items-center justify-center gap-3 border-t border-border/40 pt-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                    >
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="h-3 w-3" />
                            Sans CB
                        </span>
                        <span className="h-0.5 w-0.5 rounded-full bg-border" />
                        <span>Annulation 1 clic</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-border" />
                        <span>RGPD · UE</span>
                    </motion.div>
                </div>
            </main>

            <OnboardingPanel />
        </div>
    );
}

function AuthField({
    id,
    name,
    type,
    label,
    placeholder,
    autoComplete,
    required,
    topRight,
    suffix,
}: {
    id: string;
    name: string;
    type: string;
    label: string;
    placeholder: string;
    autoComplete?: string;
    required?: boolean;
    topRight?: React.ReactNode;
    suffix?: React.ReactNode;
}) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
            }}
        >
            <div className="mb-1.5 flex items-center justify-between">
                <label
                    htmlFor={id}
                    className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                    {label}
                </label>
                {topRight}
            </div>
            <div className="group relative">
                <input
                    id={id}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required={required}
                    className="peer h-12 w-full rounded-xl border border-border/60 bg-card px-4 pr-10 text-sm transition-all placeholder:text-muted-foreground/70 focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-muted)]"
                />
                {suffix && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {suffix}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function MobileLogo() {
    return (
        <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-sm font-bold text-white shadow-[0_8px_24px_-6px_var(--accent-glow)]">
                J
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">
                Jokko
            </span>
        </Link>
    );
}

function OnboardingPanel() {
    const steps = [
        {
            icon: Plug,
            index: "01",
            title: "Connectez vos numéros",
            desc: "WhatsApp Cloud API officielle. 3 minutes, sans dev.",
        },
        {
            icon: UsersRound,
            index: "02",
            title: "Invitez votre équipe",
            desc: "Rôles, scopes, assignation automatique.",
        },
        {
            icon: Bot,
            index: "03",
            title: "Activez Jo, votre copilote IA",
            desc: "Brouillons instantanés sur chaque conversation.",
        },
    ];

    const benefits = [
        "14 jours, toutes fonctionnalités",
        "Aucune carte bancaire requise",
        "Support humain en < 2 h ouvrées",
        "Migration Respond.io, Wati, HubSpot",
    ];

    return (
        <aside className="relative order-1 hidden overflow-hidden bg-[var(--surface-dark)] text-[var(--surface-dark-foreground)] lg:order-2 lg:flex lg:flex-col">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -right-40 top-20 h-[600px] w-[800px] opacity-40 blur-[140px]"
                style={{
                    background:
                        "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[600px] opacity-25 blur-[120px]"
                style={{
                    background:
                        "radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, transparent 70%)",
                }}
            />

            <div className="relative flex h-full flex-col p-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2.5 self-end"
                >
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-sm font-bold text-white shadow-[0_8px_24px_-6px_var(--accent-glow)]">
                        J
                    </span>
                    <span className="font-display text-xl font-semibold tracking-tight text-white">
                        Jokko
                    </span>
                </Link>

                <div className="flex flex-1 flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Onboarding · 5 minutes
                        </p>
                        <h2 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
                            <SplitText>Votre inbox équipe,</SplitText>
                            <br />
                            <span className="bg-gradient-to-br from-white via-white to-[var(--accent)] bg-clip-text text-transparent">
                                <SplitText delay={0.3}>prête à clôturer.</SplitText>
                            </span>
                        </h2>
                        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--surface-dark-muted-foreground)]">
                            Trois étapes. Pas de dev. Vos conversations WhatsApp
                            centralisées avant votre premier café.
                        </p>
                    </motion.div>

                    <motion.ol
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.12,
                                    delayChildren: 0.55,
                                },
                            },
                        }}
                        className="relative mt-12 max-w-md space-y-5"
                    >
                        <span
                            aria-hidden
                            className="absolute left-[22px] top-3 bottom-3 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent"
                        />
                        {steps.map((step) => (
                            <motion.li
                                key={step.index}
                                variants={{
                                    hidden: { opacity: 0, x: -12 },
                                    visible: { opacity: 1, x: 0 },
                                }}
                                className="relative flex items-start gap-4"
                            >
                                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] backdrop-blur-sm transition-colors group-hover:border-[var(--accent)]/40">
                                    <step.icon className="h-5 w-5 text-[var(--accent)]" />
                                </span>
                                <div className="flex-1 pt-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                                            {step.index}
                                        </span>
                                        <span className="h-px flex-1 bg-white/10" />
                                    </div>
                                    <p className="mt-1.5 font-display text-base font-semibold text-white">
                                        {step.title}
                                    </p>
                                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--surface-dark-muted-foreground)]">
                                        {step.desc}
                                    </p>
                                </div>
                            </motion.li>
                        ))}
                    </motion.ol>

                    <motion.ul
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="mt-10 grid max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2"
                    >
                        {benefits.map((b) => (
                            <li
                                key={b}
                                className="flex items-start gap-2 text-[13px] text-white/85"
                            >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                                <span>{b}</span>
                            </li>
                        ))}
                    </motion.ul>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                    className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8"
                >
                    <MiniStat value="1 250+" label="Équipes" />
                    <MiniStat value="42 M" label="Messages / mois" />
                    <MiniStat value="98.7 %" label="CSAT moyen" />
                </motion.div>

                <div className="mt-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--surface-dark-muted-foreground)]">
                    <Sparkles className="h-3 w-3 text-[var(--accent)]" />
                    Paris · Dakar · Remote-first
                </div>
            </div>
        </aside>
    );
}

function MiniStat({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <p className="font-display text-xl font-bold text-white">{value}</p>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--surface-dark-muted-foreground)]">
                {label}
            </p>
        </div>
    );
}
