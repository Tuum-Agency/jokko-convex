'use client'

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to Sentry
        Sentry.captureException(error)
    }, [error])

    return (
        <div className="flex w-full flex-col items-center justify-center py-20 text-center">
            <h2 className="text-2xl font-bold">Une erreur est survenue</h2>

            {process.env.NODE_ENV === 'development' ? (
                <div className="mt-4 max-w-lg overflow-auto rounded-md bg-red-50 p-4 text-left text-sm text-red-900 border border-red-200">
                    <p className="font-bold mb-2">Détails (Visible en Dev uniquement) :</p>
                    <p className="font-mono mb-2">{error.message}</p>
                    {error.digest && <p className="font-mono text-xs text-red-700">Digest: {error.digest}</p>}
                </div>
            ) : (
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                    Pas de panique, notre équipe a été notifiée. Vous pouvez essayer de réactualiser la page.
                </p>
            )}

            <button
                onClick={() => reset()}
                className="mt-6 rounded-md bg-black px-6 py-2 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
                Réessayer
            </button>
        </div>
    )
}
