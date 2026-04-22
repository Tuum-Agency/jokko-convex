import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Jokko — L'inbox WhatsApp partagée pour les équipes",
    template: "%s | Jokko",
  },
  description:
    "Centralisez vos numéros WhatsApp Business, assignez les conversations à votre équipe, laissez l'IA rédiger les réponses. Un seul endroit pour toute votre relation client sur WhatsApp.",
  keywords: [
    "WhatsApp Business",
    "inbox partagée",
    "shared inbox",
    "service client",
    "support équipe",
    "multi-agents",
    "assignation",
    "IA WhatsApp",
    "Jokko",
  ],
  authors: [{ name: "Jokko Team" }],
  creator: "Jokko",
  publisher: "Jokko",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.jokko.co",
    title: "Jokko — L'inbox WhatsApp partagée pour les équipes",
    description:
      "Un seul outil pour gérer plusieurs numéros WhatsApp Business à plusieurs. Assignation, IA co-pilot, flows automatiques.",
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
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable}`}
      style={
        {
          "--font-display": "var(--font-geist-sans)",
          "--font-body": "var(--font-inter)",
          "--font-mono": "var(--font-geist-mono)",
        } as React.CSSProperties
      }
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                FB.init({
                  appId: ${JSON.stringify(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '')},
                  cookie: true,
                  xfbml: true,
                  version: 'v22.0'
                });
                window.__FB_INITIALIZED__ = true;
                console.log('[FB] SDK initialized globally');
              };
              (function(d, s, id) {
                var fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                var js = d.createElement(s); js.id = id;
                js.src = 'https://connect.facebook.net/en_US/sdk.js';
                js.async = true; js.defer = true;
                fjs.parentNode.insertBefore(js, fjs);
              }(document, 'script', 'facebook-jssdk'));
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ConvexClientProvider>
          {children}
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
