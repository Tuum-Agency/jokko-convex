"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Auth presence cookie name (lightweight flag for server-side proxy check)
const AUTH_PRESENCE_COOKIE = '__jokko_auth';

function getCookieProps() {
    if (typeof window === 'undefined') return { isLocal: false, domainProp: "", secureProp: "; Secure" };
    const hostname = window.location.hostname;
    const isLocal = hostname.includes("localhost");
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "jokko.co";
    const isRootDomainHost = hostname === rootDomain || hostname.endsWith(`.${rootDomain}`);
    const domainProp = isLocal || !isRootDomainHost ? "" : `; domain=.${rootDomain}`;
    const secureProp = isLocal ? "" : "; Secure";
    return { isLocal, domainProp, secureProp };
}

// Custom storage that uses cookies to share tokens across subdomains
const cookieStorage = {
    getItem: (key: string) => {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.match(new RegExp('(^| )' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    },
    setItem: (key: string, value: string) => {
        if (typeof document === 'undefined') return;
        const { domainProp, secureProp } = getCookieProps();

        const expires = new Date();
        expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expStr = expires.toUTCString();

        // Store the token (Convex client reads it back via getItem)
        document.cookie = `${key}=${encodeURIComponent(value)}${domainProp}; path=/; expires=${expStr}; SameSite=Lax${secureProp}`;

        // Set a lightweight presence cookie for the server-side proxy auth gate
        if (key.includes('convexAuth') || key.includes('AuthToken') || key.includes('authToken')) {
            document.cookie = `${AUTH_PRESENCE_COOKIE}=1${domainProp}; path=/; expires=${expStr}; SameSite=Lax${secureProp}`;

            // Mirror auth token to HttpOnly cookie for defense-in-depth
            fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: value }),
            }).catch(() => {});
        }
    },
    removeItem: (key: string) => {
        if (typeof document === 'undefined') return;
        const { domainProp, secureProp } = getCookieProps();

        document.cookie = `${key}=${domainProp}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureProp}`;

        // Clear presence and HttpOnly cookies
        if (key.includes('convexAuth') || key.includes('AuthToken') || key.includes('authToken')) {
            document.cookie = `${AUTH_PRESENCE_COOKIE}=${domainProp}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureProp}`;
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
