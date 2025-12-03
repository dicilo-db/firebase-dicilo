// src/app/layout.tsx
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { ptSans } from './fonts';
import { cn } from '@/lib/utils';
import { I18nProvider } from '@/context/i18n-provider';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Dicilo.net',
  description: 'A functional landing page with a map search feature.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  // The 'lang' attribute is hardcoded to 'de' as we are now handling language on the client side.
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
            <Toaster />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
