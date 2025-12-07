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
        if (user === null) {
            router.push('/sign-in');
            return;
        }
        if (user && user.onboardingCompleted === false) {
            router.push('/onboarding');
        }
    }, [user, router]);

    useEffect(() => {
        if (sessionData === null && user) {
            ensureSession();
        }
    }, [sessionData, user, ensureSession]);

    if (user === undefined || sessionData === undefined) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Redirect logic
    if (user === null) {
        return null;
    }

    // If ensure is running, sessionData might still be null briefly
    // We can show loading until organization is confirmed, or let it flow if we handled it.
    // If sessionData is null after ensure logic, implies we are waiting for update.
    if (!sessionData?.organization) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Configuration de l'organisation...</span>
            </div>
        );
    }

    return (
        <DashboardLayoutClient
            user={{
                name: user.name ?? 'User',
                email: user.email ?? '',
                avatar: user.image
            }}
            organizationName={sessionData.organization.name}
            organizationSlug={sessionData.organization.slug}
        >
            {children}
        </DashboardLayoutClient>
    );
}
