'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!;
const FB_SDK_VERSION = 'v19.0';

declare global {
    interface Window {
        FB: any;
        fbAsyncInit: () => void;
    }
}

export function useFacebookSDK() {
    const [isReady, setIsReady] = useState(false);
    const sdkInitialized = useRef(false);

    useEffect(() => {
        // 1. Define fbAsyncInit BEFORE injecting the script
        window.fbAsyncInit = function () {
            console.log('[FB SDK] fbAsyncInit fired, calling FB.init()');
            window.FB.init({
                appId: FB_APP_ID,
                cookie: true,
                xfbml: true,
                version: FB_SDK_VERSION,
            });
            sdkInitialized.current = true;
            setIsReady(true);
            console.log('[FB SDK] FB.init() done, SDK ready');
        };

        // 2. Inject the SDK script using Facebook's recommended IIFE pattern
        (function (d: Document, s: string, id: string) {
            const fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {
                // Script already exists — if FB is loaded, re-init
                if (window.FB) {
                    console.log('[FB SDK] Script exists, FB present, calling init');
                    window.FB.init({
                        appId: FB_APP_ID,
                        cookie: true,
                        xfbml: true,
                        version: FB_SDK_VERSION,
                    });
                    sdkInitialized.current = true;
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
            console.log('[FB SDK] Script injected');
        })(document, 'script', 'facebook-jssdk');
    }, []);

    const login = useCallback(() => {
        return new Promise<{ accessToken: string }>((resolve, reject) => {
            // Retry mechanism if SDK not yet loaded
            if (!window.FB) {
                console.log('[FB SDK] FB not available, retrying in 500ms...');
                setTimeout(() => {
                    if (!window.FB) {
                        reject(new Error("Le SDK Facebook n'est pas chargé. Rechargez la page."));
                        return;
                    }
                    // Retry login
                    doLogin(resolve, reject);
                }, 500);
                return;
            }

            doLogin(resolve, reject);
        });
    }, []);

    function doLogin(
        resolve: (value: { accessToken: string }) => void,
        reject: (reason: Error) => void
    ) {
        // Ensure FB.init() has been called
        if (!sdkInitialized.current) {
            console.log('[FB SDK] Re-initializing before login...');
            window.FB.init({
                appId: FB_APP_ID,
                cookie: true,
                xfbml: true,
                version: FB_SDK_VERSION,
            });
            sdkInitialized.current = true;
        }

        console.log('[FB SDK] Calling FB.login()...');
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

    return { isReady, login };
}
