'use client';

import { useState, useEffect, useCallback } from 'react';

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

    useEffect(() => {
        // Si déjà chargé (navigation client-side)
        if (window.FB) {
            console.log('[FB SDK] Already loaded, marking ready');
            setIsReady(true);
            return;
        }

        // Définir le callback AVANT de charger le script
        window.fbAsyncInit = function () {
            console.log('[FB SDK] fbAsyncInit fired, calling FB.init()');
            window.FB.init({
                appId: FB_APP_ID,
                autoLogAppEvents: true,
                xfbml: false,
                version: FB_SDK_VERSION,
            });
            console.log('[FB SDK] FB.init() done, SDK ready');
            setIsReady(true);
        };

        // Vérifier que le script n'est pas déjà injecté (React 19 strict mode)
        if (document.getElementById('facebook-jssdk')) {
            console.log('[FB SDK] Script tag already exists, skipping injection');
            return;
        }

        console.log('[FB SDK] Injecting SDK script...');
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/fr_FR/sdk.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';

        // Insérer avant le premier script existant (recommandé par Meta)
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode?.insertBefore(script, firstScript);
    }, []);

    const login = useCallback(() => {
        return new Promise<{ accessToken: string }>((resolve, reject) => {
            if (!window.FB) {
                reject(new Error("Le SDK Facebook n'est pas chargé. Rechargez la page."));
                return;
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
                    scope: 'whatsapp_business_management, whatsapp_business_messaging, business_management',
                }
            );
        });
    }, []);

    return { isReady, login };
}
