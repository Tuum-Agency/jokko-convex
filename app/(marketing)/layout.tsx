import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/landing/layout/footer";
import { NavigationHeader } from "@/components/landing/layout/navigation-header";
import { LenisProvider } from "@/components/landing/providers/lenis-provider";

export const metadata: Metadata = {
  title: {
    default: "Jokko — L'inbox WhatsApp partagée pour les équipes",
    template: "%s | Jokko",
  },
  description:
    "La plateforme qui centralise vos numéros WhatsApp Business dans une seule inbox partagée. Assignation d'équipe, IA co-pilot, flows automatiques.",
  keywords: [
    "inbox WhatsApp",
    "shared inbox WhatsApp",
    "WhatsApp Business équipe",
    "service client WhatsApp",
    "multi-numéros WhatsApp",
    "assignation WhatsApp",
    "IA WhatsApp",
    "Jokko",
  ],
  authors: [{ name: "Jokko Team" }],
  creator: "Jokko",
  publisher: "Jokko",
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.jokko.co"),
  alternates: {
    canonical: "/",
    languages: { "fr-FR": "/" },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    title: "Jokko — L'inbox WhatsApp partagée pour les équipes",
    description:
      "Centralisez vos WhatsApp Business. Répondez à plusieurs. Laissez l'IA faire le premier brouillon.",
    siteName: "Jokko",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Jokko — L'inbox WhatsApp partagée pour les équipes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jokko — L'inbox WhatsApp partagée pour les équipes",
    description:
      "Centralisez vos WhatsApp Business. Répondez à plusieurs. Laissez l'IA faire le premier brouillon.",
    images: ["/og-image.png"],
    creator: "@jokko_co",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#14141A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light dark",
};

interface WebsiteLayoutProps {
  children: React.ReactNode;
}

export default function WebsiteLayout({ children }: WebsiteLayoutProps) {
  return (
    <LenisProvider>
      <div className="relative min-h-screen bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-accent/60"
        >
          Aller au contenu principal
        </a>

        <NavigationHeader />

        <main id="main-content" role="main" tabIndex={-1}>
          {children}
        </main>

        <Footer />
      </div>
    </LenisProvider>
  );
}
