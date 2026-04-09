/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║          components/team/InvitationLinkDialog.tsx             ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     Dialog affichant le lien d'invitation avec options         ║
 * ║     de partage: copier, WhatsApp, email.                      ║
 * ║                                                               ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState } from 'react'
import {
    Copy,
    Check,
    Mail,
    Link2,
} from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ============================================
// TYPES
// ============================================

interface InvitationLinkDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invitationToken: string | null
    inviteeEmail: string
}

// ============================================
// COMPONENT
// ============================================

export function InvitationLinkDialog({
    open,
    onOpenChange,
    invitationToken,
    inviteeEmail,
}: InvitationLinkDialogProps) {
    const [copied, setCopied] = useState(false)

    if (!invitationToken) return null

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const inviteLink = `${origin}/invite/${invitationToken}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea')
            textarea.value = inviteLink
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleShareWhatsApp = () => {
        const text = `Vous etes invite a rejoindre notre organisation sur Jokko ! Cliquez sur ce lien pour accepter l'invitation: ${inviteLink}`
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(url, '_blank')
    }

    const handleShareEmail = () => {
        const subject = encodeURIComponent("Invitation a rejoindre l'equipe sur Jokko")
        const body = encodeURIComponent(
            `Bonjour,\n\nVous etes invite a rejoindre notre organisation sur Jokko.\n\nCliquez sur ce lien pour accepter l'invitation:\n${inviteLink}\n\nCordialement`
        )
        window.open(`mailto:${inviteeEmail}?subject=${subject}&body=${body}`, '_blank')
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!v) setCopied(false)
            onOpenChange(v)
        }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-green-600" />
                        Lien d&apos;invitation
                    </DialogTitle>
                    <DialogDescription>
                        Partagez ce lien avec <span className="font-medium text-gray-900">{inviteeEmail}</span> pour qu&apos;il rejoigne votre organisation.
                    </DialogDescription>
                </DialogHeader>

                {/* Link display with copy */}
                <div className="flex items-center gap-2 mt-2">
                    <Input
                        readOnly
                        value={inviteLink}
                        className="h-11 rounded-xl bg-gray-50 text-sm font-mono"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 shrink-0 rounded-xl"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Share buttons */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <Button
                        variant="outline"
                        className="h-11 rounded-xl gap-2"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                        <span className="text-xs">
                            {copied ? 'Copie !' : 'Copier le lien'}
                        </span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-11 rounded-xl gap-2 text-green-700 hover:bg-green-50 hover:text-green-800 border-green-200"
                        onClick={handleShareWhatsApp}
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="text-xs">WhatsApp</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-11 rounded-xl gap-2"
                        onClick={handleShareEmail}
                    >
                        <Mail className="h-4 w-4" />
                        <span className="text-xs">Email</span>
                    </Button>
                </div>

                <p className="text-xs text-gray-400 mt-2 text-center">
                    Ce lien est valide pendant 7 jours.
                </p>
            </DialogContent>
        </Dialog>
    )
}
