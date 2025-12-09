'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { DashboardLayoutClient } from "./_components/dashboard-layout-client";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = useQuery(api.users.me);
    const sessionData = useQuery(api.sessions.current);
    const ensureSession = useMutation(api.sessions.ensure);
    const router = useRouter();

    useEffect(() => {
        // Redirection si l'utilisateur n'est pas connecté
        if (user === null) {
            router.push('/sign-in');
            return;
        }
        // Redirection vers l'onboarding si nécessaire
        if (user && user.onboardingCompleted === false) {
            router.push('/onboarding');
        }
    }, [user, router]);

    useEffect(() => {
        // S'assurer que la session est initialisée si l'utilisateur est connecté mais pas de session active
        if (sessionData === null && user) {
            ensureSession();
        }
    }, [sessionData, user, ensureSession]);

    // Protection simple : si pas d'utilisateur, on ne rend rien (le useEffect redirige)
    if (user === null) {
        return null;
    }

    // En attente de l'organisation (seulement si chargé et pas d'org)
    if (sessionData !== undefined && !sessionData?.organization) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-gray-500">Connexion à votre espace...</span>
            </div>
        );
    }

    // Redirection vers le sous-domaine si nécessaire
    if (typeof window !== 'undefined' && sessionData?.organization?.slug) {
        const hostname = window.location.hostname;
        const slug = sessionData.organization.slug;

        // En local, on gère localhost
        if (hostname.includes('localhost')) {
            if (!hostname.startsWith(`${slug}.`)) {
                // Redirection vers le sous-domaine
                const port = window.location.port ? `:${window.location.port}` : '';
                const newUrl = `${window.location.protocol}//${slug}.localhost${port}${window.location.pathname}`;
                window.location.href = newUrl;
                return null; // Empêcher le rendu pendant la redirection
            }
        }
        // En prod (à adapter selon votre domaine)
        else if (hostname.endsWith('.jokko.com')) { // Remplacez jokko.com par votre vrai domaine
            if (!hostname.startsWith(`${slug}.`)) {
                const newUrl = `${window.location.protocol}//${slug}.jokko.com${window.location.pathname}`;
                window.location.href = newUrl;
                return null;
            }
        }
    }

    return (
        <DashboardLayoutClient
            user={user ? {
                name: user.name ?? 'User',
                email: user.email ?? '',
                avatar: user.image
            } : undefined}
            organizationName={sessionData?.organization?.name}
            organizationSlug={sessionData?.organization?.slug}
            organizationId={sessionData?.organization?._id}
        >
            {children}
        </DashboardLayoutClient>
    );
}
