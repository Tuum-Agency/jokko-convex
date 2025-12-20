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
    const role = useQuery(api.users.currentUserRole);
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
    useEffect(() => {
        if (!sessionData?.organization?.slug) return;

        const slug = sessionData.organization.slug;
        const hostname = window.location.hostname;
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'jokko.co';

        // 1. Cas Local (localhost)
        if (hostname.includes('localhost')) {
            // Si on est sur 'localhost' sans sous-domaine
            if (hostname === 'localhost') {
                const port = window.location.port ? `:${window.location.port}` : '';
                window.location.href = `${window.location.protocol}//${slug}.localhost${port}${window.location.pathname}`;
            }
        }
        // 2. Cas Production (jokko.co)
        else {
            // Si on est sur le domaine racine (ex: jokko.co ou www.jokko.co)
            // On veut rediriger vers slug.jokko.co
            if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
                window.location.href = `${window.location.protocol}//${slug}.${rootDomain}${window.location.pathname}`;
            }
        }
    }, [sessionData]);

    return (
        <DashboardLayoutClient
            user={user ? {
                name: user.name ?? 'User',
                email: user.email ?? '',
                avatar: user.image,
                role: role ?? 'Member'
            } : undefined}
            organizationName={sessionData?.organization?.name}
            organizationSlug={sessionData?.organization?.slug}
            organizationId={sessionData?.organization?._id}
        >
            {children}
        </DashboardLayoutClient>
    );
}
