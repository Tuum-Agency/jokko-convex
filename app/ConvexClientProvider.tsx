"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Custom storage that uses cookies to share tokens across subdomains
const cookieStorage = {
    getItem: (key: string) => {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.match(new RegExp('(^| )' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    },
    setItem: (key: string, value: string) => {
        if (typeof document === 'undefined') return;

        const isLocal = window.location.hostname.includes("localhost");
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "jokko.co";
        const domainProp = isLocal ? "" : `; domain=.${rootDomain}`;

        const expires = new Date();
        expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);

        const secureProp = isLocal ? "" : "; Secure";
        document.cookie = `${key}=${encodeURIComponent(value)}${domainProp}; path=/; expires=${expires.toUTCString()}; SameSite=Lax${secureProp}`;

        // Mirror auth token to HttpOnly cookie for defense-in-depth
        if (key.includes('AuthToken') || key.includes('authToken')) {
            fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: value }),
            }).catch(() => {});
        }
    },
    removeItem: (key: string) => {
        if (typeof document === 'undefined') return;

        const isLocal = window.location.hostname.includes("localhost");
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "jokko.co";
        const domainProp = isLocal ? "" : `; domain=.${rootDomain}`;

        const secureProp = isLocal ? "" : "; Secure";
        document.cookie = `${key}=${domainProp}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureProp}`;

        // Clear HttpOnly cookie
        if (key.includes('AuthToken') || key.includes('authToken')) {
            fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
        }
    }
};

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <ConvexAuthProvider client={convex} storage={cookieStorage}>
            {children}
        </ConvexAuthProvider>
    );
}
