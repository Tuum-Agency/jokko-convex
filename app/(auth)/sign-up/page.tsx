'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { FadeInView, StaggerContainer, StaggerItem, FloatingElement } from '@/components/animations'
import { Loader2, ArrowRight, Sparkles, Users, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { SocialButtons, AuthDivider } from '@/components/landing/layout'

import { useAuthActions } from "@convex-dev/auth/react";

import { useRouter } from 'next/navigation';

export default function SignUpPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signIn } = useAuthActions();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null);
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            setLoading(false);
            return;
        }

        formData.delete("confirmPassword"); // Remove confirmPassword before sending
        formData.set("flow", "signUp");
        await signIn("password", formData)
            .then(() => {
                setLoading(false);
                router.push("/dashboard");
            })
            .catch((err) => {
                console.error("Sign up error:", err);
                if (err instanceof Error) {
                    // Try to extract the error message from the Convex error
                    const message = err.message.includes("Le mot de passe doit contenir")
                        ? "Le mot de passe doit contenir au moins 8 caractères."
                        : "Une erreur est survenue lors de l'inscription.";
                    setError(message);
                } else {
                    setError("Une erreur inattendue est survenue.");
                }
                setLoading(false);
            });
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
                {/* Left Side - Form */}
                <FadeInView delay={0.1} trigger="mount">
                    <Card className="w-full max-w-md mx-auto lg:ml-auto lg:mr-0 bg-white/80 backdrop-blur-xl shadow-2xl shadow-gray-200/50 border-0 rounded-3xl overflow-hidden">
                        <CardContent className="p-8 space-y-6">

                            {/* Desktop Title */}
                            <div className="text-center space-y-2">
                                <FadeInView delay={0.2} trigger="mount">
                                    <h2 className="text-2xl font-bold text-gray-900">Créer un compte</h2>
                                    <p className="text-gray-500">Commencez votre essai gratuit de 14 jours</p>
                                    {error && (
                                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mt-4">
                                            {error}
                                        </div>
                                    )}
                                </FadeInView>
                            </div>

                            {/* Social Login */}
                            <FadeInView delay={0.3} trigger="mount">
                                <SocialButtons disabled={loading} action="sign-up" />
                            </FadeInView>

                            <AuthDivider />

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <StaggerContainer staggerDelay={0.1} delayChildren={0.4} trigger="mount">
                                    <div className="space-y-4">
                                        <StaggerItem>
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Nom complet</Label>
                                                <Input id="name" name="name" required placeholder="John Doe" className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all font-medium" />
                                            </div>
                                        </StaggerItem>
                                        <StaggerItem>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" name="email" type="email" required placeholder="john@example.com" className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all font-medium" />
                                            </div>
                                        </StaggerItem>
                                        <StaggerItem>
                                            <div className="space-y-2">
                                                <Label htmlFor="password">Mot de passe</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        name="password"
                                                        type={showPassword ? "text" : "password"}
                                                        required
                                                        placeholder="••••••••"
                                                        className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all font-medium pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-hidden"
                                                    >
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </StaggerItem>
                                        <StaggerItem>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="confirmPassword"
                                                        name="confirmPassword"
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        required
                                                        placeholder="••••••••"
                                                        className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all font-medium pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-hidden"
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </StaggerItem>
                                    </div>
                                </StaggerContainer>

                                <FadeInView delay={0.5} trigger="mount">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        size="lg"
                                        className="w-full h-12 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all duration-300 group mt-4"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Création...
                                            </>
                                        ) : (
                                            <>
                                                Créer mon compte
                                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </FadeInView>
                            </form>

                            {/* Terms */}
                            <FadeInView delay={0.6} trigger="mount">
                                <p className="text-xs text-gray-400 text-center">
                                    En créant un compte, vous acceptez nos{' '}
                                    <Link href="/terms" className="text-green-600 hover:underline">
                                        Conditions d&apos;utilisation
                                    </Link>{' '}
                                    et notre{' '}
                                    <Link href="/privacy" className="text-green-600 hover:underline">
                                        Politique de confidentialité
                                    </Link>
                                </p>
                            </FadeInView>

                            {/* Sign In Link */}
                            <FadeInView delay={0.7} trigger="mount">
                                <p className="text-center text-gray-600 pt-2">
                                    Déjà un compte ?{' '}
                                    <Link
                                        href="/sign-in"
                                        className="text-green-600 hover:text-green-700 font-semibold hover:underline underline-offset-4 transition-colors"
                                    >
                                        Se connecter
                                    </Link>
                                </p>
                            </FadeInView>
                        </CardContent>
                    </Card>
                </FadeInView>

                {/* Right Side - Branding & Benefits */}
                <div className="hidden lg:flex flex-col justify-center space-y-8 pl-8">
                    <FadeInView delay={0.2} trigger="mount">
                        <Logo width={160} height={53} />
                    </FadeInView>

                    <FadeInView delay={0.3} trigger="mount">
                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                Rejoignez des milliers
                                <span className="text-green-600 block">d&apos;entreprises</span>
                            </h1>
                            <p className="text-lg text-gray-600 max-w-md">
                                Transformez votre service client avec notre plateforme WhatsApp Business alimentée par l&apos;IA.
                            </p>
                        </div>
                    </FadeInView>

                    {/* Benefits list */}
                    <StaggerContainer staggerDelay={0.1} delayChildren={0.5} trigger="mount">
                        <div className="space-y-4">
                            <StaggerItem>
                                <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">14 jours gratuits</h3>
                                        <p className="text-sm text-gray-500">Essayez toutes les fonctionnalités</p>
                                    </div>
                                </div>
                            </StaggerItem>

                            <StaggerItem>
                                <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">+10 000 entreprises</h3>
                                        <p className="text-sm text-gray-500">Nous font déjà confiance</p>
                                    </div>
                                </div>
                            </StaggerItem>

                            <StaggerItem>
                                <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Sans engagement</h3>
                                        <p className="text-sm text-gray-500">Annulez à tout moment</p>
                                    </div>
                                </div>
                            </StaggerItem>
                        </div>
                    </StaggerContainer>

                    {/* Floating decorative elements */}
                    <div className="absolute right-10 top-20 opacity-60">
                        <FloatingElement intensity="subtle" direction="both">
                            <div className="w-16 h-16 bg-green-200/50 rounded-full blur-xl" />
                        </FloatingElement>
                    </div>
                    <div className="absolute right-40 bottom-32 opacity-40">
                        <FloatingElement intensity="medium" direction="vertical">
                            <div className="w-24 h-24 bg-green-300/30 rounded-full blur-2xl" />
                        </FloatingElement>
                    </div>
                </div>
            </div>
        </div>
    )
}

