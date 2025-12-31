// src/app/layout.tsx
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { ptSans } from './fonts';
import { cn } from '@/lib/utils';
import { I18nProvider } from '@/context/i18n-provider';
import { AuthProvider } from '@/context/AuthContext';
// import { AiChatWidget } from '@/components/AiChatWidget';
import dynamic from 'next/dynamic';

const AiChatWidget = dynamic(
  () => import('@/components/AiChatWidget').then((mod) => mod.AiChatWidget),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Dicilo.net',
  description: 'A functional landing page with a map search feature.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

// import { detectLanguage, getGreeting } from '@/lib/detection';

import { Header } from '@/components/header';

export default function RootLayout({ children }: RootLayoutProps) {
  // const lang = detectLanguage();
  // const greeting = getGreeting(lang);
  // const lang = 'de';

  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={cn(
          'font-sans',
          ptSans.className,
          'flex min-h-screen flex-col'
        )}
      >
        <I18nProvider>
          <AuthProvider>
            <div className="flex-grow">{children}</div>
            <AiChatWidget />
            <Toaster />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

