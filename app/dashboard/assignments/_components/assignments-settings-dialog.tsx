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
            toast.success("Parametres mis a jour")
            onOpenChange(false)
        } catch (error) {
            toast.error("Erreur lors de la mise a jour")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Parametres d'attribution</DialogTitle>
                    <DialogDescription>
                        Configurez comment les conversations sont distribuees a votre equipe.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Auto-attribution */}
                    <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="auto-assign" className="text-sm font-medium text-gray-900">
                                Attribution automatique
                            </Label>
                            <p className="text-xs text-gray-500">
                                Activee par defaut. Si desactivee, vous devrez attribuer manuellement.
                            </p>
                        </div>
                        <Switch
                            id="auto-assign"
                            checked={autoAssignEnabled}
                            onCheckedChange={setAutoAssignEnabled}
                        />
                    </div>

                    {/* Exclure agents hors ligne */}
                    <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="offline-agents" className="text-sm font-medium text-gray-900">
                                Exclure agents hors ligne
                            </Label>
                            <p className="text-xs text-gray-500">
                                Ne pas attribuer aux agents deconnectes
                            </p>
                        </div>
                        <Switch
                            id="offline-agents"
                            checked={excludeOfflineAgents}
                            onCheckedChange={setExcludeOfflineAgents}
                        />
                    </div>

                    {/* Max chats */}
                    <div className="space-y-2">
                        <Label htmlFor="max-chats" className="text-sm font-medium text-gray-900">
                            Conversations simultanees max (par defaut)
                        </Label>
                        <Input
                            id="max-chats"
                            type="number"
                            min={1}
                            value={maxConcurrentChats}
                            onChange={(e) => setMaxConcurrentChats(Number(e.target.value))}
                            className="h-9"
                        />
                        <p className="text-xs text-gray-500">Limite globale pour les nouveaux membres.</p>
                    </div>
                </div>

                <DialogFooter>
                    <ButtonGroup className="justify-end w-full">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Enregistrer
                        </Button>
                    </ButtonGroup>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
