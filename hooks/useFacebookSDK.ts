'use client';

import { useCallback } from 'react';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'jokko.co';

/**
 * Hook that opens a popup on the root domain (jokko.co) to handle
 * Facebook Login. This avoids the need to register every dynamic
 * subdomain (seck.jokko.co, jacques.jokko.co, etc.) in the
 * Facebook Developer Console.
 *
 * The popup loads /facebook-connect on the root domain, performs
 * FB.login(), and sends the accessToken back via postMessage.
 */
export function useFacebookSDK() {
    const login = useCallback(() => {
        return new Promise<{ accessToken: string }>((resolve, reject) => {
            // Build the popup URL on the root domain
            const protocol = window.location.protocol;
            const port = window.location.port ? `:${window.location.port}` : '';
            const isLocalhost = window.location.hostname.includes('localhost');

            let popupUrl: string;
            if (isLocalhost) {
                // In dev, just use localhost (no subdomain needed for the popup)
                popupUrl = `${protocol}//localhost${port}/facebook-connect`;
            } else {
                popupUrl = `${protocol}//${ROOT_DOMAIN}/facebook-connect`;
            }

            // Open popup
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const popup = window.open(
                popupUrl,
                'fb-login-popup',
                `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
            );

            if (!popup) {
                reject(new Error('Le popup a été bloqué. Désactivez votre bloqueur de popups.'));
                return;
            }

            // Listen for the postMessage from the popup
            const handleMessage = (event: MessageEvent) => {
                // Accept messages from the root domain or localhost
                if (event.data?.type === 'FB_LOGIN_SUCCESS' && event.data?.accessToken) {
                    window.removeEventListener('message', handleMessage);
                    clearInterval(pollTimer);
                    resolve({ accessToken: event.data.accessToken });
                }
                if (event.data?.type === 'FB_LOGIN_ERROR') {
                    window.removeEventListener('message', handleMessage);
                    clearInterval(pollTimer);
                    reject(new Error(event.data.message || 'Connexion annulée ou non autorisée.'));
                }
            };

            window.addEventListener('message', handleMessage);

            // Poll to detect if user closed the popup without completing login
            const pollTimer = setInterval(() => {
                if (popup.closed) {
                    clearInterval(pollTimer);
                    window.removeEventListener('message', handleMessage);
                    reject(new Error('Connexion annulée.'));
                }
            }, 500);
        });
    }, []);

    // isReady is always true since we don't load the SDK on this page
    return { isReady: true, login };
}
