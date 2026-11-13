import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/hooks/useLanguage';
import { Navigation } from '@/components/Navigation';
import { OfflineBanner } from '@/components/OfflineBanner';
import { LanguageModal } from '@/components/LanguageModal';

export const viewport: Viewport = {
  themeColor: '#FF671F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'जन एआई (AI for Bharat) - Voice-First Citizen Welfare & Legal Rights',
  description:
    'Empowering 1.4 billion Indian citizens with voice-first access to government schemes, zero-hallucination eligibility evaluations, document vision scanner with PII protection, and bilingual RTI grievance drafter.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-512.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" data-script="devanagari">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Jan AI" />
      </head>
      <body className="min-h-screen bg-[#FDFBF7] text-slate-800 flex flex-col font-indic">
        <LanguageProvider>
          <OfflineBanner />
          <Navigation />
          <main className="flex-1 pb-20 md:pb-8">{children}</main>
          <LanguageModal />

          {/* Service Worker Registration Script */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(registration) {
                        console.log('ServiceWorker registration successful:', registration.scope);
                      },
                      function(err) {
                        console.log('ServiceWorker registration failed:', err);
                      }
                    );
                  });
                }
              `,
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
