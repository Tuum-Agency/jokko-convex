"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BlogNewsletter() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSubscribed(true);
        setTimeout(() => {
            setSubscribed(false);
            setEmail("");
        }, 3000);
    };

    return (
        <section className="relative overflow-hidden bg-[var(--surface-dark)] py-24 text-[var(--surface-dark-foreground)] md:py-32">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-40 blur-[140px]"
                style={{
                    background:
                        "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
                }}
            />

            <div className="relative mx-auto max-w-2xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                        <Mail className="h-6 w-6 text-white" />
                    </div>

                    <h2 className="mt-6 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
                        Un lundi sur deux.
                        <br />
                        <span className="text-white/60">Dans votre boîte.</span>
                    </h2>
                    <p className="mt-5 text-lg text-white/70">
                        Nos meilleures analyses, les features du moment, les retours
                        clients marquants. 4 minutes de lecture, 0 spam.
                    </p>

                    <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md gap-2">
                        <Input
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={subscribed}
                            className="h-12 flex-1 rounded-full border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent-ring)]"
                        />
                        <Button
                            type="submit"
                            size="lg"
                            disabled={subscribed}
                            className={cn(
                                "h-12 shrink-0 rounded-full px-6 font-medium transition-all",
                                subscribed
                                    ? "bg-emerald-500 text-white hover:bg-emerald-500"
                                    : "bg-white text-[var(--surface-dark)] hover:bg-white/90"
                            )}
                        >
                            {subscribed ? (
                                <>
                                    <Check className="h-4 w-4" />
                                    Inscrit
                                </>
                            ) : (
                                "S'abonner"
                            )}
                        </Button>
                    </form>

                    <p className="mt-4 text-xs text-white/50">
                        4 300+ professionnels reçoivent déjà le lundi matin.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
