import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
  title: 'DiciWallet | Ecosistema Circular DiciCoin',
  description: 'La billetera digital oficial de DiciCoin. Gestiona tus puntos DP, DiciCoins digitales y el plan de pagos de tus monedas físicas coleccionables en un ecosistema seguro.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
