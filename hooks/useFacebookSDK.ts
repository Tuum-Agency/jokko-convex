'use client';

import { useState, useEffect, useCallback } from 'react';

const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';
const FB_SDK_VERSION = 'v19.0';

declare global {
    interface Window {
        FB: any;
        fbAsyncInit: () => void;
    }
}

function callFBInit() {
    // Log the actual appId value to debug production issues
    console.log('[FB SDK] FB.init() appId =', FB_APP_ID, '(length:', FB_APP_ID.length + ')');
    if (!FB_APP_ID) {
        console.error('[FB SDK] CRITICAL: NEXT_PUBLIC_FACEBOOK_APP_ID is empty/undefined!');
    }
    window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: true,
        version: FB_SDK_VERSION,
    });
}

export function useFacebookSDK() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // 1. Define fbAsyncInit BEFORE injecting the script
        window.fbAsyncInit = function () {
            console.log('[FB SDK] fbAsyncInit fired');
            callFBInit();
            setIsReady(true);
        };

        // 2. Inject the SDK script using Facebook's recommended IIFE pattern
        (function (d: Document, s: string, id: string) {
            const fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {
                // Script already injected — if FB object exists, re-init
                if (window.FB) {
                    console.log('[FB SDK] Script already exists + FB loaded, calling init');
                    callFBInit();
                    setIsReady(true);
                }
                return;
            }
            const js = d.createElement(s) as HTMLScriptElement;
            js.id = id;
            js.src = 'https://connect.facebook.net/en_US/sdk.js';
            js.async = true;
            js.defer = true;
            fjs.parentNode?.insertBefore(js, fjs);
            console.log('[FB SDK] Script tag injected into DOM');
        })(document, 'script', 'facebook-jssdk');
    }, []);

    const login = useCallback(() => {
        return new Promise<{ accessToken: string }>((resolve, reject) => {
            if (!window.FB) {
                // Retry once after 500ms
                console.log('[FB SDK] window.FB not found, retrying in 500ms...');
                setTimeout(() => {
                    if (!window.FB) {
                        reject(new Error("Le SDK Facebook n'est pas chargé. Rechargez la page."));
                        return;
                    }
                    performLogin(resolve, reject);
                }, 500);
                return;
            }
            performLogin(resolve, reject);
        });
    }, []);

    return { isReady, login };
}

function performLogin(
    resolve: (value: { accessToken: string }) => void,
    reject: (reason: Error) => void
) {
    // ALWAYS call FB.init() right before FB.login() — this is the only
    // way to guarantee init has been called, regardless of SDK state.
    console.log('[FB SDK] performLogin: calling FB.init() then FB.login()');
    callFBInit();

    window.FB.login(
        (response: any) => {
            console.log('[FB SDK] FB.login() response:', JSON.stringify(response));
            if (response.authResponse?.accessToken) {
                resolve({ accessToken: response.authResponse.accessToken });
            } else {
                reject(new Error('Connexion annulée ou non autorisée.'));
            }
        },
        {
            scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management',
        }
    );
}
