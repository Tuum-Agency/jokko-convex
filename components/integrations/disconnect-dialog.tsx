"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DisconnectDialogProps {
    open: boolean;
    providerLabel: string;
    onCancel: () => void;
    onConfirm: () => Promise<void> | void;
    busy?: boolean;
}

export function DisconnectDialog({
    open,
    providerLabel,
    onCancel,
    onConfirm,
    busy,
}: DisconnectDialogProps) {
    const [acknowledged, setAcknowledged] = useState(false);

    async function handleConfirm() {
        if (!acknowledged || busy) return;
        await onConfirm();
        setAcknowledged(false);
    }

    function handleCancel() {
        setAcknowledged(false);
        onCancel();
    }

    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                if (!next && !busy) handleCancel();
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Déconnecter {providerLabel} ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est immédiate. Lisez les conséquences avant de confirmer.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <ul className="space-y-3 text-sm">
                    <li className="flex gap-3">
                        <span aria-hidden>✂️</span>
                        <span>
                            Les tokens seront effacés <strong>immédiatement</strong>. Se reconnecter
                            nécessitera une autorisation OAuth complète.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span aria-hidden>🔗</span>
                        <span>
                            Les liens contacts ↔ CRM sont conservés pour permettre une reconnexion
                            rapide pendant 7 jours.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span aria-hidden>⏸️</span>
                        <span>
                            Les événements de conversation en file d&apos;attente pour ce CRM seront
                            abandonnés au bout de 48h.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span aria-hidden>🔄</span>
                        <span>
                            Reconnexion sous 7 jours : resync incrémentale. Au-delà : import complet
                            requis.
                        </span>
                    </li>
                </ul>

                <div className="flex items-start gap-2 pt-2">
                    <Checkbox
                        id="disconnect-ack"
                        checked={acknowledged}
                        onCheckedChange={(v) => setAcknowledged(v === true)}
                        disabled={busy}
                    />
                    <Label htmlFor="disconnect-ack" className="text-sm leading-tight">
                        J&apos;ai compris les conséquences ci-dessus.
                    </Label>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel} disabled={busy}>
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={!acknowledged || busy}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {busy ? "Déconnexion…" : "Déconnecter"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
