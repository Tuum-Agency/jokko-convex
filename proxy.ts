import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
    '/',
    '/sign-in',
    '/sign-up',
    '/pricing',
    '/about',
    '/contact',
    '/legal',
    '/privacy',
    '/terms',
    '/api',
    '/invite',
]

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
    )
}

function hasAuthToken(request: NextRequest): boolean {
    const cookies = request.cookies.getAll()
    return cookies.some(
        (c) => c.name === '__jokko_auth' ||
               c.name === '__Secure-jokko-session' ||
               c.name === 'jokko-session' ||
               c.name.startsWith('__convexAuth')
    )
}

export default function proxy(request: NextRequest) {
    const url = request.nextUrl
    const { pathname } = url
    const hostname = request.headers.get('host') || ''

    // --- Auth gate for protected routes ---
    if (!isPublicRoute(pathname) && !hasAuthToken(request)) {
        const signInUrl = new URL('/sign-in', request.url)
        signInUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(signInUrl)
    }

    // --- Subdomain routing ---
    const currentHost = hostname.replace(/:\d+$/, '')
    const mainDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'jokko.co'

    const isMainDomain =
        currentHost === mainDomain ||
        currentHost === `www.${mainDomain}` ||
        currentHost === 'localhost'

    if (!isMainDomain) {
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
