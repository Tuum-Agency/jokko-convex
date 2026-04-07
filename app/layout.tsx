import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                FB.init({
                  appId: '${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''}',
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
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          {children}
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
