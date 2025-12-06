'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = useQuery(api.users.me);
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

    if (user === undefined) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {children}
        </div>
    );
}
