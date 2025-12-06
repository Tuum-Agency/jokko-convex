import type { Metadata, Viewport } from 'next'
import { Footer } from '@/components/landing/layout/footer'
import { NavigationHeader } from '@/components/landing/layout/navigation-header'

// SEO Metadata optimisé
export const metadata: Metadata = {
    title: {
        default: 'Jokko - Messagerie Sénégalaise Nouvelle Génération',
        template: '%s | Jokko'
    },
    description: 'Jokko est la plateforme de messagerie innovante qui connecte le Sénégal. Profitez d\'une expérience de communication rapide, sécurisée et adaptée aux besoins locaux.',
    keywords: [
        'messagerie',
        'Sénégal',
        'communication',
        'chat',
        'WhatsApp alternative',
        'messagerie sénégalaise',
        'Jokko',
        'application mobile',
        'communication instantanée',
        'sécurité',
        'chiffrement'
    ],
    authors: [{ name: 'Jokko Team' }],
    creator: 'Jokko',
    publisher: 'Jokko',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://jokko.app'),
    alternates: {
        canonical: '/',
        languages: {
            'fr-SN': '/fr-SN',
            'wo-SN': '/wo-SN',
        },
    },
    openGraph: {
        type: 'website',
        locale: 'fr_SN',
        url: '/',
        title: 'Jokko - Messagerie Sénégalaise Nouvelle Génération',
        description: 'La messagerie qui vous connecte avec ceux qui comptent. Rapide, sécurisée et adaptée au Sénégal.',
        siteName: 'Jokko',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Jokko - Messagerie Sénégalaise',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Jokko - Messagerie Sénégalaise Nouvelle Génération',
        description: 'La messagerie qui vous connecte avec ceux qui comptent. Rapide, sécurisée et adaptée au Sénégal.',
        images: ['/og-image.png'],
        creator: '@jokkoapp',
    },
    robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: 'your-google-verification-code',
        // yandex: 'your-yandex-verification-code',
    },
    category: 'technology',
}

// Viewport configuration optimisé
export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#25D366' },
        { media: '(prefers-color-scheme: dark)', color: '#128C7E' }
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    colorScheme: 'light dark',
}

interface WebsiteLayoutProps {
    children: React.ReactNode
}

export default function WebsiteLayout({ children }: WebsiteLayoutProps) {
    return (
        <div className='min-h-screen bg-white'>
            {/* Skip to main content link for accessibility */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-green-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
                Aller au contenu principal
            </a>

            {/* Header avec navigation */}
            <NavigationHeader />

            {/* Main content avec landmarks ARIA */}
            <main
                id="main-content"
                role="main"
                tabIndex={-1}
            >
                {children}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    )
}
