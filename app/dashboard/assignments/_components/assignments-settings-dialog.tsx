"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ButtonGroup } from "@/components/ui/button-group"

interface AssignmentSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AssignmentSettingsDialog({ open, onOpenChange }: AssignmentSettingsDialogProps) {
    const settings = useQuery(api.assignments.getAssignmentSettings)
    const updateSettings = useMutation(api.assignments.updateAssignmentSettings)

    const [autoAssignEnabled, setAutoAssignEnabled] = useState(false)
    const [maxConcurrentChats, setMaxConcurrentChats] = useState(5)
    const [excludeOfflineAgents, setExcludeOfflineAgents] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (settings) {
            setAutoAssignEnabled(settings.autoAssignEnabled ?? false)
            setMaxConcurrentChats(settings.maxConcurrentChats ?? 5)
            setExcludeOfflineAgents(settings.excludeOfflineAgents ?? true)
        }
    }, [settings])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateSettings({
                autoAssignEnabled,
                maxConcurrentChats: Number(maxConcurrentChats),
                excludeOfflineAgents
            })
            toast.success("Paramètres mis à jour")
            onOpenChange(false)
        } catch (error) {
            toast.error("Erreur lors de la mise à jour")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Paramètres d'assignation</DialogTitle>
                    <DialogDescription>
                        Configurez comment les conversations sont distribuées à votre équipe.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="auto-assign" className="flex flex-col space-y-1">
                            <span>Assignation automatique</span>
                            <span className="font-normal text-xs text-muted-foreground">Activé par défaut. Si désactivé, vous devrez assigner manuellement.</span>
                        </Label>
                        <Switch id="auto-assign" checked={autoAssignEnabled} onCheckedChange={setAutoAssignEnabled} />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="offline-agents" className="flex flex-col space-y-1">
                            <span>Exclure agents hors ligne</span>
                            <span className="font-normal text-xs text-muted-foreground">Ne pas assigner aux agents déconnectés</span>
                        </Label>
                        <Switch id="offline-agents" checked={excludeOfflineAgents} onCheckedChange={setExcludeOfflineAgents} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="max-chats">Conversations simultanées max (par défaut)</Label>
                        <Input
                            id="max-chats"
                            type="number"
                            min={1}
                            value={maxConcurrentChats}
                            onChange={(e) => setMaxConcurrentChats(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">Limite globale pour les nouveaux membres assignés.</p>
                    </div>
                </div>

                <DialogFooter>
                    <ButtonGroup className="justify-end w-full">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </ButtonGroup>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
