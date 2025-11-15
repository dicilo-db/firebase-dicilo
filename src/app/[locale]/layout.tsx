// src/app/[locale]/layout.tsx
import 'leaflet/dist/leaflet.css';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { ptSans } from '../fonts';
import { cn } from '@/lib/utils';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';

export const metadata: Metadata = {
  title: 'Dicilo.net',
  description: 'A functional landing page with a map search feature.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

// Lista de locales soportados
const locales = ['de', 'en', 'es'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          'font-sans',
          ptSans.className,
          'flex min-h-screen flex-col'
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex-grow">{children}</div>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
