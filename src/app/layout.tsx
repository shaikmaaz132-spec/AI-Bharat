import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/hooks/useLanguage';
import { Navigation } from '@/components/Navigation';
import { OfflineBanner } from '@/components/OfflineBanner';
import { LanguageModal } from '@/components/LanguageModal';
import { GoogleTranslateFix } from '@/components/GoogleTranslateFix';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

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
    <html
      lang="en"
      data-script="devanagari"
      translate="no"
      className="notranslate"
      suppressHydrationWarning
    >
      <head>
        <meta name="google" content="notranslate" />
        <meta name="googlebot" content="notranslate" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Jan AI" />
        {/* Bulletproof DOM protective patch against Google Translate removeChild/insertBefore crashes */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined' || typeof Node === 'undefined') return;
                
                var origRemove = Node.prototype.removeChild;
                Node.prototype.removeChild = function(child) {
                  if (!child) return child;
                  if (child.parentNode !== this) {
                    try {
                      if (child.parentNode) {
                        return child.parentNode.removeChild(child);
                      }
                    } catch (e) {}
                    return child;
                  }
                  try {
                    return origRemove.apply(this, arguments);
                  } catch (e) {
                    return child;
                  }
                };

                var origInsert = Node.prototype.insertBefore;
                Node.prototype.insertBefore = function(newNode, refNode) {
                  if (refNode && refNode.parentNode !== this) {
                    try {
                      if (refNode.parentNode) {
                        return refNode.parentNode.insertBefore(newNode, refNode);
                      }
                    } catch (e) {}
                    return newNode;
                  }
                  try {
                    return origInsert.apply(this, arguments);
                  } catch (e) {
                    return newNode;
                  }
                };

                var origReplace = Node.prototype.replaceChild;
                Node.prototype.replaceChild = function(newChild, oldChild) {
                  if (oldChild && oldChild.parentNode !== this) {
                    try {
                      if (oldChild.parentNode) {
                        return oldChild.parentNode.replaceChild(newChild, oldChild);
                      }
                    } catch (e) {}
                    return oldChild;
                  }
                  try {
                    return origReplace.apply(this, arguments);
                  } catch (e) {
                    return oldChild;
                  }
                };
              })();
            `,
          }}
        />
      </head>
      <body
        className="notranslate min-h-screen bg-[#FDFBF7] text-slate-800 flex flex-col font-indic"
        translate="no"
        suppressHydrationWarning
      >
        <GoogleTranslateFix />
        <ServiceWorkerRegister />
        <LanguageProvider>
          <OfflineBanner />
          <Navigation />
          <main className="flex-1 pb-20 md:pb-8">{children}</main>
          <LanguageModal />
        </LanguageProvider>
      </body>
    </html>
  );
}
