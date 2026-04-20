"use client";

import { useEffect, useState } from "react";
import { Clock, Link2, Loader2, PlugZap, RefreshCw, Scissors } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DisconnectDialogProps {
    open: boolean;
    providerLabel: string;
    onCancel: () => void;
    onConfirm: () => Promise<void> | void;
    busy?: boolean;
    /**
     * When true, the adapter revokes OAuth tokens on the provider side
     * during disconnect. When false, tokens are only wiped locally and
     * the user must revoke access manually in the provider's UI.
     */
    supportsRemoteRevoke?: boolean;
}

function buildConsequences(providerLabel: string, supportsRemoteRevoke: boolean) {
    return [
        {
            icon: Scissors,
            title: supportsRemoteRevoke
                ? "Tokens révoqués des deux côtés"
                : `Tokens supprimés de Jokko`,
            description: supportsRemoteRevoke
                ? `Les tokens OAuth sont révoqués côté Jokko et côté ${providerLabel}.`
                : `Les tokens sont supprimés localement. Pour révoquer l'accès côté ${providerLabel}, rendez-vous dans ses paramètres d'applications connectées.`,
        },
        {
            icon: Link2,
            title: "Liens contacts ↔ CRM conservés",
            description: "Reconnexion rapide possible pendant 7 jours.",
        },
        {
            icon: Clock,
            title: "Événements en file d'attente",
            description: "Les événements non synchronisés seront abandonnés au bout de 48h.",
        },
        {
            icon: RefreshCw,
            title: "Reconnexion ultérieure",
            description: "Sous 7 jours : resync incrémentale. Au-delà : import complet requis.",
        },
    ];
}

export function DisconnectDialog({
    open,
    providerLabel,
    onCancel,
    onConfirm,
    busy,
    supportsRemoteRevoke = false,
}: DisconnectDialogProps) {
    const [acknowledged, setAcknowledged] = useState(false);
    const consequences = buildConsequences(providerLabel, supportsRemoteRevoke);

    useEffect(() => {
        if (!open) setAcknowledged(false);
    }, [open]);

    async function handleConfirm() {
        if (!acknowledged || busy) return;
        try {
            await onConfirm();
        } catch {
            // Parent owns error reporting; swallow to avoid unhandled rejection
            // leaving the dialog stuck in an inconsistent state.
        } finally {
            setAcknowledged(false);
        }
    }

    function handleCancel() {
        setAcknowledged(false);
        onCancel();
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next && !busy) handleCancel();
            }}
        >
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <PlugZap className="h-5 w-5" />
                        Déconnecter {providerLabel} ?
                    </DialogTitle>
                    <DialogDescription>
                        Cette action est immédiate. Prenez connaissance des conséquences avant de confirmer.
                    </DialogDescription>
                </DialogHeader>

                <ul className="space-y-2">
                    {consequences.map(({ icon: Icon, title, description }) => (
                        <li
                            key={title}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                        >
                            <Icon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                    <Checkbox
                        id="disconnect-ack"
                        checked={acknowledged}
                        onCheckedChange={(v) => setAcknowledged(v === true)}
                        disabled={busy}
                        className="mt-0.5"
                    />
                    <Label
                        htmlFor="disconnect-ack"
                        className="text-sm leading-tight text-red-700 cursor-pointer"
                    >
                        J&apos;ai compris les conséquences ci-dessus et je souhaite déconnecter{" "}
                        {providerLabel}.
                    </Label>
                </div>

                <DialogFooter>
                    <ButtonGroup>
                        <Button variant="outline" onClick={handleCancel} disabled={busy}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirm}
                            disabled={!acknowledged || busy}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {busy ? "Déconnexion…" : "Déconnecter"}
                        </Button>
                    </ButtonGroup>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
