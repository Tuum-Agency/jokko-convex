"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";

const samples = {
    curl: `curl -X POST https://api.jokko.com/v2/messages \\
  -H "Authorization: Bearer jkk_live_••••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+221771234567",
    "type": "template",
    "template": {
      "name": "order_confirmation",
      "language": "fr",
      "variables": {
        "1": "Aminata",
        "2": "CMD-8421"
      }
    }
  }'`,
    node: `import { Jokko } from "@jokko/sdk";

const jokko = new Jokko({
    apiKey: process.env.JOKKO_API_KEY,
});

const message = await jokko.messages.send({
    to: "+221771234567",
    type: "template",
    template: {
        name: "order_confirmation",
        language: "fr",
        variables: { "1": "Aminata", "2": "CMD-8421" },
    },
});

console.log(message.id); // msg_01HVXZ9KQ...`,
    python: `from jokko import Jokko

client = Jokko(api_key=os.environ["JOKKO_API_KEY"])

message = client.messages.send(
    to="+221771234567",
    type="template",
    template={
        "name": "order_confirmation",
        "language": "fr",
        "variables": {"1": "Aminata", "2": "CMD-8421"},
    },
)

print(message.id)  # msg_01HVXZ9KQ...`,
};

type Lang = keyof typeof samples;

export function DocsCodeSample() {
    const [lang, setLang] = useState<Lang>("node");
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(samples[lang]);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <section className="relative py-20 md:py-24">
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1fr_1.3fr]">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                >
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                        Hello world
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                        Envoyez votre premier message en 30 secondes.
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                        Pas de SDK propriétaire imposé. REST pur, OpenAPI 3.1,
                        retours JSON prévisibles. SDK optionnels pour les
                        langages courants — typés à 100 %.
                    </p>
                    <div className="mt-8 space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[10px] font-bold text-[var(--accent)]">
                                1
                            </div>
                            <span>Créez une clé API depuis votre tableau de bord</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[10px] font-bold text-[var(--accent)]">
                                2
                            </div>
                            <span>Copiez l&apos;exemple ci-contre dans votre terminal</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[10px] font-bold text-[var(--accent)]">
                                3
                            </div>
                            <span>Recevez la réponse et suivez le statut via webhook</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-[var(--surface-dark)] shadow-2xl"
                >
                    <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
                        <div className="flex items-center gap-3">
                            <Terminal className="h-4 w-4 text-[var(--surface-dark-muted-foreground)]" />
                            <div className="flex gap-1">
                                {(Object.keys(samples) as Lang[]).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setLang(key)}
                                        className={`rounded-md px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                                            lang === key
                                                ? "bg-white/10 text-white"
                                                : "text-[var(--surface-dark-muted-foreground)] hover:text-white"
                                        }`}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] text-[var(--surface-dark-muted-foreground)] transition-colors hover:text-white"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-3 w-3" /> Copié
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3 w-3" /> Copier
                                </>
                            )}
                        </button>
                    </div>
                    <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
                        <code className="font-mono text-white/90">
                            {samples[lang]}
                        </code>
                    </pre>
                </motion.div>
            </div>
        </section>
    );
}
