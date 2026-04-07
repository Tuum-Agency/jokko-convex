'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

    // 1. Auth & Onboarding Redirect
    useEffect(() => {
        console.log(`[DashboardLayout] Auth check: user=${user !== undefined ? (user ? 'present' : 'null') : 'loading'}`);
        if (user === null) {
            console.log(`[DashboardLayout] Redirecting to /sign-in (user is null)`);
            router.push('/sign-in');
            return;
        }
        if (user && user.onboardingCompleted !== true) {
            console.log(`[DashboardLayout] Redirecting to /onboarding (onboarding not completed)`);
            router.push('/onboarding');
            return;
        }
    }, [user, router]);

    // 2. Session Init (only after onboarding is complete)
    useEffect(() => {
        if (sessionData === null && user && user.onboardingCompleted === true) {
            console.log(`[DashboardLayout] Initializing session...`);
            ensureSession();
        }
    }, [sessionData, user, ensureSession]);

    // 3. Subdomain Redirect
    useEffect(() => {
        if (!sessionData?.organization?.slug) return;

        const slug = sessionData.organization.slug;
        const hostname = window.location.hostname;
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'jokko.co';

        console.log(`[DashboardLayout] Subdomain Check: host=${hostname}, targetSlug=${slug}, root=${rootDomain}`);

        // Preserve query params (critical for payment redirects like ?session=...&status=...)
        const fullPath = window.location.pathname + window.location.search;

        if (hostname.includes('localhost')) {
            if (hostname === 'localhost') {
                const port = window.location.port ? `:${window.location.port}` : '';
                const newUrl = `${window.location.protocol}//${slug}.localhost${port}${fullPath}`;
                console.log(`[DashboardLayout] Redirecting to localhost subdomain: ${newUrl}`);
                window.location.href = newUrl;
            }
        } else {
            if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
                const newUrl = `${window.location.protocol}//${slug}.${rootDomain}${fullPath}`;
                console.log(`[DashboardLayout] Redirecting to production subdomain: ${newUrl}`);
                window.location.href = newUrl;
            }
        }
    }, [sessionData]);

    // -----------------------------------------------------
    // RENDERING STATES
    // -----------------------------------------------------

    // A. Initial Loading (Skeleton)
    // Avoids flashing dashboard before we know user status
    if (user === undefined || sessionData === undefined) {
        return (
            <div className="flex h-screen bg-gray-50/50">
                <div className="hidden lg:block w-72 border-r border-gray-200/80 bg-white h-full p-4 space-y-6">
                    <div className="px-2 mb-6">
                        <Skeleton className="h-8 w-32" />
                    </div>
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-16 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl px-6 flex items-center justify-between">
                        <Skeleton className="h-6 w-48" />
                        <div className="flex gap-3">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <Skeleton className="h-9 w-9 rounded-full" />
                        </div>
                    </header>
                    <main className="flex-1 p-6 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-32 rounded-xl" />
                            ))}
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Skeleton className="h-96 rounded-xl" />
                            <Skeleton className="h-96 rounded-xl" />
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // B. Not Logged In
    if (user === null) {
        return null;
    }

    // C. Needs Onboarding
    if (user.onboardingCompleted !== true) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-2 bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-gray-500">Redirection vers l'onboarding...</span>
            </div>
        );
    }

    // D. Missing/Creating Organization
    if (!sessionData?.organization) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-2 bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-gray-500">Connexion à votre espace...</span>
            </div>
        );
    }

    // E. Ready
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
