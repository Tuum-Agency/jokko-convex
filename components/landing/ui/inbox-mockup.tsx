"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Search,
  CheckCheck,
  Check,
  Clock,
  Phone,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Mic,
  Info,
  Mail,
  Building2,
  Tag as TagIcon,
  Inbox,
  UserX,
  Archive,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2 | 3 | 4;

interface Thread {
  id: string;
  name: string;
  initials: string;
  preview: string;
  time: string;
  unread?: number;
  assignee?: string;
  window?: "ok" | "warn" | "danger";
  windowLabel?: string;
  active?: boolean;
  section: "mine" | "unassigned";
  pinned?: boolean;
}

const threads: Thread[] = [
  {
    id: "1",
    name: "Aïssatou Diop",
    initials: "AD",
    preview: "Bonjour, ma commande #4821 est-elle…",
    time: "10:24",
    unread: 2,
    assignee: "Moi",
    window: "ok",
    windowLabel: "23h45",
    active: true,
    section: "mine",
    pinned: true,
  },
  {
    id: "2",
    name: "Moussa Fall",
    initials: "MF",
    preview: "Merci beaucoup pour votre retour 🙏",
    time: "10:21",
    assignee: "Moi",
    window: "ok",
    windowLabel: "18h",
    section: "mine",
  },
  {
    id: "3",
    name: "Awa Sarr",
    initials: "AS",
    preview: "Bonjour, livrez-vous à Thiès ?",
    time: "09:52",
    unread: 1,
    window: "warn",
    windowLabel: "4h",
    section: "unassigned",
  },
  {
    id: "4",
    name: "Coumba Sow",
    initials: "CS",
    preview: "Je voudrais changer la taille du produit",
    time: "09:41",
    window: "ok",
    windowLabel: "21h",
    section: "unassigned",
  },
  {
    id: "5",
    name: "Ibrahima Ndiaye",
    initials: "IN",
    preview: "Parfait, j'attends le lien de paiement.",
    time: "Hier",
    assignee: "Moi",
    window: "danger",
    windowLabel: "Fermée",
    section: "mine",
  },
];

const messages = [
  {
    role: "in" as const,
    text: "Bonjour, ma commande #4821 est-elle bien expédiée ?",
    time: "10:22",
  },
  { role: "in" as const, text: "J'attends depuis 3 jours 😕", time: "10:24" },
];

const replyText =
  "Bonjour Aïssatou 👋 Votre commande #4821 est partie hier soir. Suivi : AB123456 — livraison prévue demain matin. Désolés pour l'attente !";

export function InboxMockup() {
  const [step, setStep] = useState<Step>(0);
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    const cycle = () => {
      setStep(0);
      setTypedChars(0);
      const t1 = setTimeout(() => setStep(1), 1800);
      const t2 = setTimeout(() => setStep(2), 3200);
      const t3 = setTimeout(() => setStep(3), 6400);
      const t4 = setTimeout(() => setStep(4), 7400);
      const t5 = setTimeout(cycle, 10200);
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
    const total = replyText.length;
    let current = 0;
    const interval = setInterval(() => {
      current += 3;
      setTypedChars(Math.min(current, total));
      if (current >= total) {
        clearInterval(interval);
      }
    }, 22);
    return () => clearInterval(interval);
  }, [step]);

  return (
    <div className="relative w-full">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, var(--accent-glow) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(5, 150, 105, 0.18) 0%, transparent 55%)",
        }}
      />

      <div className="relative grid grid-cols-[240px_1fr_210px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_40px_100px_-20px_rgba(20,20,26,0.35)] md:h-[540px]">
        <ThreadList activeId={threads.find((t) => t.active)?.id || "1"} />
        <ConversationPanel step={step} typedChars={typedChars} />
        <CustomerPanel />
      </div>

      <FloatingAssignToast show={step === 0} />
      <FloatingSentToast show={step === 4} />
    </div>
  );
}

// ============================================
// THREAD LIST (left sidebar — matches ContactList.tsx)
// ============================================

function ThreadList({ activeId }: { activeId: string }) {
  const totalUnread = threads.reduce((acc, t) => acc + (t.unread || 0), 0);
  const mine = threads.filter((t) => t.section === "mine");
  const unassigned = threads.filter((t) => t.section === "unassigned");

  return (
    <aside className="hidden flex-col border-r border-gray-200 bg-white md:flex">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold tracking-tight text-gray-900">
            Conversations
          </h2>
          {totalUnread > 0 && (
            <div className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-1.5 py-0.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              <span className="text-[9px] font-semibold text-green-700">
                {totalUnread} non lus
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scope toggle */}
      <div className="px-3 pt-2">
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          <button className="flex-1 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-gray-900 shadow-sm">
            Toutes
          </button>
          <button className="flex-1 rounded-md px-2 py-1 text-[10px] font-medium text-gray-500">
            Mes
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mx-3 mt-2 flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[10px] text-gray-400">
        <Search className="h-3 w-3" />
        <span>Rechercher…</span>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1 overflow-x-auto px-3 py-2">
        <FilterPill icon={Inbox} active>
          Tout
        </FilterPill>
        <FilterPill icon={Mail}>Non lus</FilterPill>
        <FilterPill icon={UserX}>Non assignées</FilterPill>
        <FilterPill icon={Archive}>Archivées</FilterPill>
      </div>

      {/* Thread sections */}
      <div className="flex-1 overflow-y-auto pb-2">
        <SectionDivider title="Mes conversations" count={mine.length} />
        {mine.map((t) => (
          <ContactListItem key={t.id} thread={t} active={t.id === activeId} />
        ))}

        <SectionDivider title="Non assignées" count={unassigned.length} />
        {unassigned.map((t) => (
          <ContactListItem key={t.id} thread={t} active={t.id === activeId} />
        ))}
      </div>
    </aside>
  );
}

function FilterPill({
  children,
  active,
  icon: Icon,
}: {
  children: React.ReactNode;
  active?: boolean;
  icon: React.ElementType;
}) {
  return (
    <button
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium transition-colors",
        active
          ? "bg-gradient-to-r from-[#14532d] to-[#059669] text-white shadow-sm"
          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {children}
    </button>
  );
}

function SectionDivider({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-3 pb-1.5 pt-3">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </span>
      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500">
        {count}
      </span>
    </div>
  );
}

function ContactListItem({ thread, active }: { thread: Thread; active: boolean }) {
  const hasUnread = (thread.unread || 0) > 0;
  return (
    <div
      className={cn(
        "flex cursor-pointer items-start gap-2.5 border-l-2 px-3 py-2.5 transition-colors",
        active
          ? "border-l-green-600 bg-green-50/70"
          : "border-transparent hover:bg-gray-50/70"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] text-[11px] font-semibold text-white shadow-sm">
          {thread.initials}
        </div>
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p
            className={cn(
              "truncate text-[12px]",
              hasUnread ? "font-semibold text-gray-900" : "font-medium text-gray-800"
            )}
          >
            {thread.name}
          </p>
          <span
            className={cn(
              "shrink-0 text-[9px]",
              hasUnread ? "font-semibold text-green-700" : "text-gray-400"
            )}
          >
            {thread.time}
          </span>
        </div>
        <p
          className={cn(
            "mt-0.5 truncate text-[10px]",
            hasUnread ? "text-gray-700" : "text-gray-500"
          )}
        >
          {thread.preview}
        </p>
        <div className="mt-1 flex items-center gap-1">
          {thread.window && thread.windowLabel && (
            <WindowPill variant={thread.window} label={thread.windowLabel} />
          )}
          {hasUnread && (
            <span className="ml-auto flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-green-500 px-1 text-[9px] font-semibold text-white">
              {thread.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function WindowPill({
  variant,
  label,
}: {
  variant: "ok" | "warn" | "danger";
  label: string;
}) {
  const styles = {
    ok: "bg-green-50 text-green-700 border-green-200",
    warn: "bg-orange-50 text-orange-700 border-orange-200",
    danger: "bg-red-50 text-red-700 border-red-200",
  }[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[8px] font-medium",
        styles
      )}
    >
      <Clock className="h-2 w-2" />
      {label}
    </span>
  );
}

// ============================================
// CONVERSATION PANEL (center — matches ConversationView.tsx)
// ============================================

function ConversationPanel({
  step,
  typedChars,
}: {
  step: Step;
  typedChars: number;
}) {
  const shownReply = replyText.slice(0, typedChars);
  return (
    <main className="flex flex-col bg-gray-50/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] text-[11px] font-semibold text-white shadow-sm">
            AD
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-gray-900">
                Aïssatou Diop
              </p>
              <AssignmentBadge />
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="text-[10px] text-gray-500">+221 77 834 12 48</p>
              <span className="inline-flex items-center gap-0.5 rounded-full border border-green-200 bg-green-50 px-1.5 py-0 text-[9px] font-medium text-green-700">
                <Clock className="h-2 w-2" />
                23h45 restantes
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 text-gray-500">
          <IconBtn>
            <Phone className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn>
            <Info className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn>
            <MoreVertical className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>

      {/* Messages area (WhatsApp beige background) */}
      <div
        className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-3"
        style={{
          backgroundColor: "#efeae2",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.35' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      >
        {/* Date separator */}
        <div className="mb-1 flex justify-center">
          <span className="rounded-md bg-white/80 px-2 py-0.5 text-[9px] font-medium text-gray-600 shadow-sm">
            Aujourd&apos;hui
          </span>
        </div>

        {messages.map((m, i) => (
          <WhatsAppBubble key={i} role={m.role} text={m.text} time={m.time} />
        ))}

        <AnimatePresence>
          {step === 1 && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1 self-start rounded-2xl rounded-bl-sm bg-white px-3 py-2 shadow-sm"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-gray-400"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent reply (step 2: typing in input, step 3: sending, step 4: sent bubble) */}
        <AnimatePresence>
          {step === 4 && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-[78%] self-end rounded-2xl rounded-br-sm bg-green-100 px-3 py-2 shadow-sm"
            >
              <p className="whitespace-pre-wrap text-[11.5px] leading-relaxed text-gray-900">
                {replyText}
              </p>
              <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-gray-500">
                <span>10:25</span>
                <CheckCheck className="h-3 w-3 text-blue-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
          <Smile className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          <div className="flex-1 text-[11px] text-gray-500">
            {step === 2 && typedChars > 0 ? (
              <span className="text-gray-900">
                {shownReply}
                <span className="ml-0.5 inline-block h-2.5 w-0.5 animate-pulse bg-green-600 align-middle" />
              </span>
            ) : step === 3 ? (
              <span className="italic text-gray-400">Envoi en cours…</span>
            ) : (
              <span className="text-gray-400">Écrire un message…</span>
            )}
          </div>
          <motion.button
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] text-white shadow-sm"
            animate={step === 3 ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {step === 2 && typedChars > 0 ? (
              <Send className="h-3 w-3" />
            ) : step === 3 ? (
              <Send className="h-3 w-3" />
            ) : (
              <Mic className="h-3 w-3" />
            )}
          </motion.button>
        </div>
      </div>
    </main>
  );
}

function AssignmentBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-1.5 py-0 text-[9px] font-semibold text-green-700">
      <div className="flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] text-[7px] font-bold text-white">
        S
      </div>
      Santiago
    </span>
  );
}

function WhatsAppBubble({
  role,
  text,
  time,
}: {
  role: "in" | "out";
  text: string;
  time: string;
}) {
  const isOut = role === "out";
  return (
    <div
      className={cn(
        "max-w-[78%] rounded-2xl px-3 py-1.5 shadow-sm",
        isOut
          ? "self-end rounded-br-sm bg-green-100"
          : "self-start rounded-bl-sm bg-white"
      )}
    >
      <p className="whitespace-pre-wrap text-[11.5px] leading-relaxed text-gray-900">
        {text}
      </p>
      <div
        className={cn(
          "mt-0.5 flex items-center gap-1 text-[9px] text-gray-500",
          isOut ? "justify-end" : "justify-start"
        )}
      >
        <span>{time}</span>
        {isOut && <CheckCheck className="h-3 w-3 text-blue-500" />}
      </div>
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
      {children}
    </button>
  );
}

// ============================================
// CUSTOMER PANEL (right — matches ContactInfo.tsx)
// ============================================

function CustomerPanel() {
  return (
    <aside className="hidden flex-col overflow-hidden border-l border-gray-200 bg-white lg:flex">
      {/* Header */}
      <div className="border-b border-gray-100 px-3 py-3">
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] text-sm font-semibold text-white shadow-sm">
            AD
          </div>
          <p className="text-[12px] font-semibold text-gray-900">Aïssatou Diop</p>
          <p className="text-[9px] text-gray-500">+221 77 834 12 48</p>
        </div>
      </div>

      {/* Details */}
      <div className="border-b border-gray-100 px-3 py-2">
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
          Détails
        </p>
        <InfoRow icon={Mail} label="Email" value="aissatou@gmail.com" />
        <InfoRow icon={Building2} label="Société" value="Aïssa Mode" />
      </div>

      {/* Tags */}
      <div className="border-b border-gray-100 px-3 py-2">
        <div className="mb-1.5 flex items-center gap-1">
          <TagIcon className="h-2.5 w-2.5 text-gray-400" />
          <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
            Tags
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <TagPill color="bg-rose-100 text-rose-700">VIP</TagPill>
          <TagPill color="bg-green-100 text-green-700">Fidèle</TagPill>
          <TagPill color="bg-amber-100 text-amber-700">B2C</TagPill>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 px-3 py-2">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
          Activité
        </p>
        <div className="space-y-1.5">
          <StatRow label="Commandes" value="12" />
          <StatRow label="Valeur à vie" value="284 000 F" />
          <StatRow label="Dernière cmd." value="il y a 2 j" />
        </div>
      </div>

      {/* Footer action */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-3 py-2">
        <button className="flex w-full items-center justify-between rounded-md px-2 py-1 text-[10px] font-medium text-gray-700 transition-colors hover:bg-white">
          <span>Voir historique</span>
          <ChevronDown className="h-3 w-3 -rotate-90" />
        </button>
      </div>
    </aside>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 py-1">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100">
        <Icon className="h-3 w-3 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] text-gray-400">{label}</p>
        <p className="truncate text-[10px] font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-gray-500">{label}</span>
      <span className="text-[10px] font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function TagPill({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[8px] font-semibold",
        color
      )}
    >
      {children}
    </span>
  );
}

// ============================================
// FLOATING TOASTS (real notifications)
// ============================================

function FloatingAssignToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="assign"
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -left-4 top-24 hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-xl md:flex"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#14532d] to-[#059669] text-[9px] font-bold text-white">
            S
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
              Assignée à
            </p>
            <p className="text-[11px] font-semibold text-gray-900">
              Santiago · Support
            </p>
          </div>
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
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="absolute -right-4 bottom-16 hidden items-center gap-2 rounded-full border border-green-200 bg-white px-3 py-1.5 shadow-xl md:flex"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </div>
          <span className="text-[10px] font-semibold text-gray-900">
            Répondu en 8s
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
