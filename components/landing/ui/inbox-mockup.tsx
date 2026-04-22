"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Search,
  Sparkles,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2 | 3 | 4;

interface Thread {
  id: string;
  name: string;
  initials: string;
  number: string;
  preview: string;
  time: string;
  unread?: number;
  assignee?: string;
  color: string;
  active?: boolean;
}

const threads: Thread[] = [
  {
    id: "1",
    name: "Aïssatou Diop",
    initials: "AD",
    number: "+221 77",
    preview: "Bonjour, ma commande #4821 est-elle…",
    time: "10:24",
    unread: 2,
    assignee: "Moi",
    color: "from-rose-400 to-rose-600",
    active: true,
  },
  {
    id: "2",
    name: "Moussa Fall",
    initials: "MF",
    number: "+221 78",
    preview: "Merci beaucoup pour votre retour rapide 🙏",
    time: "10:21",
    assignee: "Fatou",
    color: "from-amber-400 to-amber-600",
  },
  {
    id: "3",
    name: "Coumba Sow",
    initials: "CS",
    number: "+221 76",
    preview: "Je voudrais changer la taille du produit",
    time: "10:18",
    unread: 1,
    assignee: "Jo · IA",
    color: "from-violet-400 to-violet-600",
  },
  {
    id: "4",
    name: "Ibrahima Ndiaye",
    initials: "IN",
    number: "+221 77",
    preview: "Parfait, j'attends le lien de paiement.",
    time: "10:05",
    assignee: "Khady",
    color: "from-emerald-400 to-emerald-600",
  },
  {
    id: "5",
    name: "Awa Sarr",
    initials: "AS",
    number: "+221 78",
    preview: "Bonjour, est-ce que vous livrez à Thiès ?",
    time: "09:52",
    assignee: "Moi",
    color: "from-sky-400 to-sky-600",
  },
];

const messages = [
  { role: "in" as const, text: "Bonjour, ma commande #4821 est-elle bien expédiée ?", time: "10:22" },
  { role: "in" as const, text: "J'attends depuis 3 jours 😕", time: "10:24" },
];

const draftText =
  "Bonjour Aïssatou 👋 Votre commande #4821 est partie hier soir. Suivi : AB123456 — livraison prévue demain matin. Désolés pour l'attente !";

export function InboxMockup() {
  const [step, setStep] = useState<Step>(0);
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    const cycle = () => {
      setStep(0);
      setTypedChars(0);
      const t1 = setTimeout(() => setStep(1), 1400);
      const t2 = setTimeout(() => setStep(2), 2600);
      const t3 = setTimeout(() => setStep(3), 4800);
      const t4 = setTimeout(() => setStep(4), 7200);
      const t5 = setTimeout(cycle, 9800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    };
    const cleanup = cycle();
    return cleanup;
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    setTypedChars(0);
    const total = draftText.length;
    const perChar = 20;
    const interval = setInterval(() => {
      setTypedChars((c) => {
        if (c >= total) {
          clearInterval(interval);
          return c;
        }
        return c + 2;
      });
    }, perChar);
    return () => clearInterval(interval);
  }, [step]);

  return (
    <div className="relative w-full">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, var(--accent-glow) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(37, 211, 102, 0.18) 0%, transparent 55%)",
        }}
      />

      <div className="relative grid grid-cols-[220px_1fr_200px] overflow-hidden rounded-3xl border border-border/80 bg-background/95 shadow-[0_40px_100px_-20px_rgba(20,20,26,0.35)] backdrop-blur-xl md:h-[520px]">
        <ThreadList activeId={threads.find((t) => t.active)?.id || "1"} />
        <ConversationPanel step={step} typedChars={typedChars} />
        <CustomerPanel />
      </div>

      <FloatingAssignBubble show={step === 0} />
      <FloatingAiBubble show={step >= 2 && step <= 3} />
      <FloatingSentToast show={step === 4} />
    </div>
  );
}

function ThreadList({ activeId }: { activeId: string }) {
  return (
    <aside className="hidden flex-col border-r border-border/60 bg-muted/30 md:flex">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Inbox partagée
          </p>
          <p className="mt-1 text-[15px] font-semibold">Tous · 5</p>
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-muted)] text-[10px] font-bold text-[var(--accent)]">
          +3
        </div>
      </div>

      <div className="mx-4 flex items-center gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs text-muted-foreground">
        <Search className="h-3.5 w-3.5" />
        <span>Rechercher…</span>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto px-4 pb-2 text-[11px]">
        <FilterPill active>Tous</FilterPill>
        <FilterPill>Moi</FilterPill>
        <FilterPill>Non assignés</FilterPill>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.map((t) => (
          <ThreadItem key={t.id} thread={t} active={t.id === activeId} />
        ))}
      </div>
    </aside>
  );
}

function FilterPill({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-1 font-medium transition-colors",
        active
          ? "border-foreground/20 bg-foreground text-background"
          : "border-border/60 bg-background text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ThreadItem({ thread, active }: { thread: Thread; active: boolean }) {
  return (
    <div
      className={cn(
        "flex cursor-pointer items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors",
        active
          ? "border-[var(--accent)] bg-background"
          : "border-transparent hover:bg-background/60"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold text-white",
          thread.color
        )}
      >
        {thread.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-[13px] font-semibold">{thread.name}</p>
          <span className="shrink-0 text-[10px] text-muted-foreground">{thread.time}</span>
        </div>
        <p className="truncate text-[11px] text-muted-foreground">{thread.preview}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
            {thread.number}
          </span>
          {thread.assignee && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                thread.assignee === "Jo · IA"
                  ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {thread.assignee}
            </span>
          )}
          {thread.unread ? (
            <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
              {thread.unread}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ConversationPanel({ step, typedChars }: { step: Step; typedChars: number }) {
  const shownDraft = draftText.slice(0, typedChars);
  return (
    <main className="flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-[11px] font-semibold text-white">
            AD
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>
          <div>
            <p className="text-[13px] font-semibold">Aïssatou Diop</p>
            <p className="text-[10px] text-muted-foreground">+221 77 834 12 48 · en ligne</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <IconBtn>
            <Phone className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn>
            <Video className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn>
            <MoreVertical className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>

      <div
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(20,20,26,0.04) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      >
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} time={m.time} />
        ))}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1.5 self-start rounded-full border border-border/60 bg-muted/50 px-3 py-2"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                  style={{ animation: `bounce 1s ${i * 0.15}s infinite` }}
                />
              ))}
              <span className="text-[10px] text-muted-foreground">Jo rédige un brouillon IA…</span>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[78%] self-end rounded-2xl rounded-br-sm bg-[var(--whatsapp)] px-3 py-2 text-[12px] text-white shadow-sm"
            >
              <p>{draftText}</p>
              <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-white/80">
                <span>10:25</span>
                <CheckCheck className="h-3 w-3" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-border/60 bg-muted/20 p-3">
        <AnimatePresence mode="wait">
          {step >= 2 && step <= 3 && (
            <motion.div
              key="ai-draft"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-2 flex items-start gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-muted)] px-3 py-2"
            >
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
              <div className="flex-1">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                  Brouillon IA · 92% de confiance
                </p>
                <p className="text-[11px] leading-relaxed text-foreground">
                  {shownDraft}
                  {step === 2 && typedChars < draftText.length && (
                    <span className="ml-0.5 inline-block h-2.5 w-0.5 animate-pulse bg-[var(--accent)] align-middle" />
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-2">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex-1 text-[11px] text-muted-foreground">
            {step === 3 ? "Envoi en cours…" : "Écrire un message…"}
          </span>
          <Smile className="h-3.5 w-3.5 text-muted-foreground" />
          <motion.button
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white"
            animate={step === 3 ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Send className="h-3 w-3" />
          </motion.button>
        </div>
      </div>
    </main>
  );
}

function MessageBubble({
  role,
  text,
  time,
}: {
  role: "in" | "out";
  text: string;
  time: string;
}) {
  return (
    <div
      className={cn(
        "max-w-[78%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed shadow-sm",
        role === "in"
          ? "self-start rounded-bl-sm bg-background text-foreground"
          : "self-end rounded-br-sm bg-[var(--whatsapp)] text-white"
      )}
    >
      <p>{text}</p>
      <div
        className={cn(
          "mt-1 flex items-center gap-1 text-[9px]",
          role === "in" ? "text-muted-foreground" : "justify-end text-white/80"
        )}
      >
        <span>{time}</span>
        {role === "out" && <CheckCheck className="h-3 w-3" />}
      </div>
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted">
      {children}
    </button>
  );
}

function CustomerPanel() {
  return (
    <aside className="hidden flex-col border-l border-border/60 bg-muted/30 p-4 lg:flex">
      <div className="flex flex-col items-center gap-2 pb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-base font-semibold text-white">
          AD
        </div>
        <p className="text-[13px] font-semibold">Aïssatou Diop</p>
        <p className="text-[10px] text-muted-foreground">Cliente VIP · 12 commandes</p>
      </div>

      <div className="space-y-3 border-t border-border/60 pt-3">
        <InfoRow label="Numéro" value="+221 77 834…" />
        <InfoRow label="Ville" value="Dakar" />
        <InfoRow label="Valeur à vie" value="284 000 F" />
        <InfoRow label="Dernière commande" value="il y a 2 j" />
      </div>

      <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tags
        </p>
        <div className="flex flex-wrap gap-1">
          <Tag color="bg-rose-500/10 text-rose-600">VIP</Tag>
          <Tag color="bg-emerald-500/10 text-emerald-600">Fidèle</Tag>
          <Tag color="bg-amber-500/10 text-amber-600">B2C</Tag>
        </div>
      </div>
    </aside>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="truncate text-[11px] font-medium">{value}</span>
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold", color)}>{children}</span>
  );
}

function FloatingAssignBubble({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="assign"
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -left-6 top-20 hidden flex-col gap-1 rounded-xl border border-border/60 bg-background px-3 py-2 shadow-xl md:flex"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Assigné à
          </p>
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-[8px] font-bold text-white">
              S
            </div>
            <span className="text-[11px] font-medium">Santiago</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FloatingAiBubble({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="ai"
          initial={{ opacity: 0, y: 12, x: 8 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -right-4 top-32 hidden items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-muted)] px-3 py-1.5 shadow-xl backdrop-blur md:flex"
        >
          <Sparkles className="h-3 w-3 text-[var(--accent)]" />
          <span className="text-[10px] font-semibold text-[var(--accent)]">Jo · IA copilot</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FloatingSentToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="sent-toast"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-6 right-6 hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 backdrop-blur md:flex"
        >
          <CheckCheck className="h-3 w-3 text-emerald-500" />
          <span className="text-[10px] font-semibold text-emerald-600">Envoyé en 8s</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
