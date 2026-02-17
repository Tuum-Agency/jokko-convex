import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
    const url = request.nextUrl
    const hostname = request.headers.get('host') || ''

    // Configuration: Domaine principal
    // En local, on peut utiliser "localhost:3000" ou un domaine de test
    const currentHost = hostname.replace(/:\d+$/, '')
    // Récupérer le domaine racine depuis l'env ou par défaut
    const mainDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'jokko.co'

    // Vérifier si c'est le domaine principal (y compris www)
    const isMainDomain =
        currentHost === mainDomain ||
        currentHost === `www.${mainDomain}` ||
        currentHost === 'localhost'

    // Si c'est un sous-domaine
    if (!isMainDomain) {
        // Extraire le sous-domaine (ex: "client" de "client.jokko.co")
        const subdomain = currentHost.replace(`.${mainDomain}`, '')

        // Réécrire l'URL pour pointer vers un dossier dynamique interne
        // Par exemple: /_sites/[subdomain]/path
        // Cela permet de gérer le contenu spécifique au tenant sans changer l'URL du navigateur

        // Note: Assurez-vous d'avoir une structure de dossier comme `app/[domain]` ou `app/_sites/[site]`
        // Si vous n'avez pas encore cette structure, Next.js affichera la page par défaut de la racine,
        // mais l'URL restera correcte (pas de redirect vers www)

        console.log(`Rewriting subdomain ${subdomain} to internal path`)

        // Décommenter la ligne suivante si vous utilisez une structure `app/[domain]`
        // return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, request.url))

        return NextResponse.next()
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
