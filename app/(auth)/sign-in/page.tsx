'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { FadeInView, StaggerContainer, StaggerItem, FloatingElement } from '@/components/animations'
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { SocialButtons, AuthDivider } from '@/components/landing/layout'

import { useRouter } from 'next/navigation';

export default function SignInPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const [error, setError] = useState<string | null>(null);

    const { signIn } = useAuthActions();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null);
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        formData.set("flow", "signIn");

        try {
            await signIn("password", formData);

            // Après connexion réussie, récupérer l'organisation par défaut
            // Nous devons importer fetchMutation depuis convex/nextjs ou utiliser un client direct
            // Pour simplifier ici, nous allons rediriger vers /dashboard et laisser le layout gérer,
            // ou mieux : tenter de récupérer le slug si possible.
            // Comme nous sommes côté client, nous ne pouvons pas facilement appeler une mutation sans hook.
            // Mais nous pouvons simplement rediriger vers /dashboard qui va gérer l'auth,
            // et ensuite le layout redirigera vers le sous-domaine si nécessaire.

            // Note: Pour faire une redirection propre vers le sous-domaine dès le login,
            // l'idéal serait d'avoir un composant intermédiaire ou d'utiliser useMutation,
            // mais useMutation ne peut pas être "await" de cette façon dans un event handler s'il n'est pas déjà monté.
            // Cependant, signIn est async. Une fois fini, le cookie est set.

            // On peut recharger la page pour trigger le middleware ou aller dashboard.
            // Le plus simple est d'aller sur /dashboard.
            // Si vous voulez FORCE le sous-domaine ici, il faudrait requêter l'API.

            // Pour l'instant, restons simple : redirection dashboard.
            // Le layout dashboard va s'occuper de la redirection sous-domaine (étape suivante).
            router.push("/dashboard");
        } catch (err) {
            console.error("Sign in error:", err);
            setError("Email ou mot de passe incorrect.");
            setLoading(false);
        }
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
                                    <h2 className="text-2xl font-bold text-gray-900">Bienvenue</h2>
                                    <p className="text-gray-500">Connectez-vous à votre espace</p>
                                    {error && (
                                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mt-4">
                                            {error}
                                        </div>
                                    )}
                                </FadeInView>
                            </div>

                            {/* Social Login */}
                            <FadeInView delay={0.3} trigger="mount">
                                <SocialButtons disabled={loading} action="sign-in" />
                            </FadeInView>

                            <AuthDivider />

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <StaggerContainer staggerDelay={0.1} delayChildren={0.4} trigger="mount">
                                    <div className="space-y-4">
                                        <StaggerItem>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" name="email" type="email" required placeholder="john@example.com" className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all font-medium" />
                                            </div>
                                        </StaggerItem>
                                        <StaggerItem>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="password">Mot de passe</Label>
                                                    <Link href="/forgot-password" className="text-xs text-green-600 hover:text-green-500">
                                                        Mot de passe oublié ?
                                                    </Link>
                                                </div>

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
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-5 w-5" />
                                                        ) : (
                                                            <Eye className="h-5 w-5" />
                                                        )}
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
                                                Connexion...
                                            </>
                                        ) : (
                                            <>
                                                Se connecter
                                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </FadeInView>
                            </form>

                            {/* Sign Up Link */}
                            <FadeInView delay={0.6} trigger="mount">
                                <p className="text-center text-gray-600 pt-2">
                                    Pas encore de compte ?{' '}
                                    <Link
                                        href="/sign-up"
                                        className="text-green-600 hover:text-green-700 font-semibold hover:underline underline-offset-4 transition-colors"
                                    >
                                        Créer un compte
                                    </Link>
                                </p>
                            </FadeInView>
                        </CardContent>
                    </Card>
                </FadeInView>

                {/* Right Side - Branding */}
                <div className="hidden lg:flex flex-col justify-center space-y-8 pl-8">
                    <FadeInView delay={0.2} trigger="mount">
                        <Logo width={160} height={53} />
                    </FadeInView>

                    <FadeInView delay={0.3} trigger="mount">
                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                Retrouvez votre
                                <span className="text-green-600 block">Espace de Travail</span>
                            </h1>
                            <p className="text-lg text-gray-600 max-w-md">
                                Gérez vos communications WhatsApp Business efficacement et suivez vos performances en temps réel.
                            </p>
                        </div>
                    </FadeInView>

                    {/* Floating decorative elements */}
                    <div className="absolute right-10 top-20 opacity-60">
                        <FloatingElement intensity="subtle" direction="both">
                            <div className="w-16 h-16 bg-blue-200/50 rounded-full blur-xl" />
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
