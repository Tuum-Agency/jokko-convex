'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';
const FB_SDK_VERSION = 'v19.0';
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'jokko.co';

function getTargetOrigin(): string {
    const isLocalhost = window.location.hostname.includes('localhost');
    if (isLocalhost) {
        // En dev, le popup est sur localhost:PORT mais l'opener peut être
        // sur un sous-domaine (ex: be-in-digital-21.localhost:PORT).
        // On utilise "*" car les sous-domaines localhost ont des origines différentes.
        return "*";
    }
    return `${window.location.protocol}//${ROOT_DOMAIN}`;
}

declare global {
    interface Window {
        FB: any;
        fbAsyncInit: () => void;
    }
}

export default function FacebookConnectPage() {
    const [status, setStatus] = useState<'loading' | 'ready' | 'logging-in' | 'done' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // 1. Define fbAsyncInit BEFORE injecting the script
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: FB_APP_ID,
                cookie: true,
                xfbml: true,
                version: FB_SDK_VERSION,
            });
            setStatus('ready');
        };

        // 2. Inject Facebook SDK using the official IIFE pattern
        (function (d: Document, s: string, id: string) {
            const fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {
                if (window.FB) {
                    window.FB.init({
                        appId: FB_APP_ID,
                        cookie: true,
                        xfbml: true,
                        version: FB_SDK_VERSION,
                    });
                    setStatus('ready');
                }
                return;
            }
            const js = d.createElement(s) as HTMLScriptElement;
            js.id = id;
            js.src = 'https://connect.facebook.net/en_US/sdk.js';
            js.async = true;
            js.defer = true;
            fjs.parentNode?.insertBefore(js, fjs);
        })(document, 'script', 'facebook-jssdk');
    }, []);

    const handleLogin = () => {
        if (!window.FB) {
            setErrorMsg("Le SDK Facebook n'est pas chargé.");
            setStatus('error');
            return;
        }

        setStatus('logging-in');

        // Always call FB.init() right before FB.login() as safety net
        window.FB.init({
            appId: FB_APP_ID,
            cookie: true,
            xfbml: true,
            version: FB_SDK_VERSION,
        });

        window.FB.login(
            (response: any) => {
                if (response.authResponse?.accessToken) {
                    // Send token back to the opener window (subdomain)
                    if (window.opener) {
                        const targetOrigin = getTargetOrigin();
                        window.opener.postMessage(
                            {
                                type: 'FB_LOGIN_SUCCESS',
                                accessToken: response.authResponse.accessToken,
                            },
                            targetOrigin
                        );
                    }
                    setStatus('done');
                    // Close popup after a short delay
                    setTimeout(() => window.close(), 1000);
                } else {
                    if (window.opener) {
                        const targetOrigin = getTargetOrigin();
                        window.opener.postMessage(
                            { type: 'FB_LOGIN_ERROR', message: 'Connexion annulée ou non autorisée.' },
                            targetOrigin
                        );
                    }
                    setErrorMsg('Connexion annulée ou non autorisée.');
                    setStatus('error');
                }
            },
            {
                scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management',
            }
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Connexion Facebook</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Connectez votre compte WhatsApp Business via Facebook
                    </p>
                </div>

                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-2 py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-sm text-gray-500">Chargement du SDK Facebook...</p>
                    </div>
                )}

                {status === 'ready' && (
                    <button
                        onClick={handleLogin}
                        className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Se connecter avec Facebook
                    </button>
                )}

                {status === 'logging-in' && (
                    <div className="flex flex-col items-center gap-2 py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-sm text-gray-500">Connexion en cours...</p>
                    </div>
                )}

                {status === 'done' && (
                    <div className="py-8">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-green-700 font-medium">Connexion réussie !</p>
                        <p className="text-sm text-gray-500 mt-1">Cette fenêtre va se fermer automatiquement.</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-4 space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-700 text-sm">{errorMsg}</p>
                        </div>
                        <button
                            onClick={() => { setStatus('ready'); setErrorMsg(''); }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Réessayer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
