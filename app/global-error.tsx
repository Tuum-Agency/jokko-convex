'use client'

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import "./globals.css"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        Sentry.captureException(error)
    }, [error])

    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center text-black dark:bg-black dark:text-white">
                    <h1 className="text-4xl font-bold">Oups ! Une erreur critique est survenue.</h1>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        Nous avons été notifiés et nous travaillons à la résolution du problème.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="mt-6 rounded-md bg-black px-6 py-3 text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                        Recharger la page
                    </button>
                </div>
            </body>
        </html>
    )
}
