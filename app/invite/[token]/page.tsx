'use client'

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useConvexAuth } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useParams, useRouter } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight, Eye, EyeOff } from "lucide-react"

export default function AcceptInvitationPage() {
    const params = useParams()
    const router = useRouter()
    const { signIn, signOut } = useAuthActions()

    // We assume token is always string, but verify
    const token = typeof params.token === 'string' ? params.token : ""

    // 1. Fetch Invitation Details
    const invitationData = useQuery(api.invitations.getByToken, { token })
    const acceptLinkMutation = useMutation(api.invitations.acceptLink)

    const { isAuthenticated } = useConvexAuth()

    // Form State
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // State to coordinate auth flow and mutation
    const [pendingAcceptance, setPendingAcceptance] = useState(false)

    // Derived state
    const isLoading = invitationData === undefined
    const isInvalid = invitationData === null
    const isExpired = invitationData?.status === "EXPIRED"
    const isValid = invitationData?.status === "VALID" && invitationData.invitation
    const isAccepted = invitationData?.status === "ACCEPTED"

    // Effect to trigger mutation once authenticated
    useEffect(() => {
        const acceptInvitation = async () => {
            if (isAuthenticated && pendingAcceptance) {
                try {
                    console.log("User authenticated, calling acceptLinkMutation...");
                    await acceptLinkMutation({ token })
                    setSuccess(true)
                    setPendingAcceptance(false)
                    // Redirect is handled in the render phase when success is true
                    setTimeout(() => {
                        router.push("/dashboard")
                    }, 1000)
                } catch (err) {
                    console.error("Failed to accept invitation:", err)
                    setError(err instanceof Error ? err.message : "Erreur lors de l'acceptation de l'invitation.")
                    setIsSubmitting(false)
                    setPendingAcceptance(false)
                }
            }
        }

        acceptInvitation()
    }, [isAuthenticated, pendingAcceptance, acceptLinkMutation, token, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.")
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            // 0. Ensure user is logged out to prevent issues
            // (Optional, maybe we should check if already logged in is the SAME user?)
            // But for safety and avoiding email mismatch with old session, signOut is good.
            await signOut()

            // 1. Sign Up User (Create Account)
            // This sets the session cookie/storage but React state might update async
            await signIn("password", {
                email: invitationData?.invitation?.email || "",
                password,
                name: invitationData.invitation.name || "",
                flow: "signUp"
            })

            // 2. We don't call acceptLinkMutation here immediately.
            // We set the flag and let the useEffect handle it when isAuthenticated becomes true.
            setPendingAcceptance(true)

        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Une erreur est survenue lors de l'inscription.")
            setIsSubmitting(false)
        }
    }

    // --- RENDER STATES ---

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Success or Already Accepted -> Show success screen
    if (success || isAccepted) {
        const orgName = invitationData?.invitation?.orgName || "l'organisation"

        // If already accepted but we didn't just submit (e.g. refresh), redirect quickly
        if (isAccepted && !success) {
            setTimeout(() => {
                router.push("/dashboard")
            }, 1000)
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md shadow-lg border-green-200 bg-green-50">
                    <CardContent className="pt-8 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-800">
                            {isAccepted && !success ? "Invitation déjà acceptée" : "Compte créé !"}
                        </h2>
                        <p className="text-green-700">
                            Bienvenue dans l'équipe <strong>{orgName}</strong>.
                            <br />
                            Redirection vers le tableau de bord...
                        </p>
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-green-600 mt-4" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (isInvalid || !isValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle className="text-xl text-red-600">Invitation Invalide</CardTitle>
                        <CardDescription>
                            Ce lien d'invitation n'est pas valide ou n'existe pas.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button variant="outline" onClick={() => router.push("/")}>
                            Retour à l'accueil
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (isExpired) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                            <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <CardTitle className="text-xl text-amber-600">Invitation Expirée</CardTitle>
                        <CardDescription>
                            Ce lien d'invitation a expiré. Veuillez demander une nouvelle invitation à votre administrateur.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button variant="outline" onClick={() => router.push("/")}>
                            Retour à l'accueil
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // Removed original success block since it's moved up

    // Safety check for invitation data existence before destructuring
    if (!invitationData?.invitation) return null // Should be handled by isInvalid but typescript needs help

    const { invitation } = invitationData

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-6">

                {/* Branding / Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bienvenue sur Jokko</h1>
                    <p className="text-gray-500">
                        Acceptez l'invitation pour rejoindre votre équipe.
                    </p>
                </div>

                <Card className="shadow-xl border-gray-200">
                    <CardHeader className="space-y-1 pb-4 border-b bg-gray-50/50 rounded-t-xl">
                        <CardTitle className="text-lg font-medium text-gray-900">
                            Rejoindre {invitation.orgName}
                        </CardTitle>
                        <CardDescription>
                            Invité par {invitation.inviterName} • {invitation.name || invitation.email}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Erreur</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={invitation.email}
                                    disabled
                                    className="bg-gray-50 font-medium text-gray-900"
                                />
                                <p className="text-xs text-muted-foreground">
                                    L'invitation est liée à cet email unique.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Créer un mot de passe</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="********"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Minimum 8 caractères.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="********"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        className="pr-10"
                                    />
                                    {/* Optional: Add toggle here too, or just rely on the first one. 
                                        Usually one toggle controls both or each has its own. 
                                        Let's add it here too for consistency, sharing the same state?
                                        Or maybe better to just have one toggle state for both fields.
                                        I'll use the same `showPassword` state for both for simplicity and UX (usually you want to see both or neither).
                                     */}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all duration-300 mt-4"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Création du compte...
                                    </>
                                ) : (
                                    <>
                                        Créer mon compte et rejoindre
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="bg-gray-50/50 rounded-b-xl text-center text-xs text-gray-500 py-4 justify-center">
                        En créant un compte, vous acceptez nos conditions d'utilisation.
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

function Clock({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
