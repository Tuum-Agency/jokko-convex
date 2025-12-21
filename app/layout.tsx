import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jokko - Plateforme CRM WhatsApp Business et Automatisation Marketing",
    template: "%s | Jokko"
  },
  description: "Boostez vos ventes et fidélisez vos clients avec Jokko. La solution complète de communication WhatsApp Business, automatisation marketing et CRM pour les entreprises modernes en Afrique.",
  keywords: ["WhatsApp Business API", "CRM", "Marketing Automation", "Service Client", "Afrique", "Sénégal", "Jokko"],
  authors: [{ name: "Jokko Team" }],
  creator: "Jokko",
  publisher: "Jokko",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.jokko.co",
    title: "Jokko - CRM WhatsApp Business & Marketing Automation",
    description: "Transformez votre service client et augmentez vos revenus grâce à la puissance de WhatsApp Business API et l'automatisation intelligente.",
    siteName: "Jokko",
    images: [
      {
        url: "/og-image.png", // Ensure this image exists in public folder or use a remote URL
        width: 1200,
        height: 630,
        alt: "Jokko Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jokko - CRM WhatsApp Business",
    description: "La plateforme tout-en-un pour gérer votre relation client sur WhatsApp.",
    images: ["/og-image.png"],
    creator: "@jokko_co", // Update with actual handle if available
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          {children}
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
