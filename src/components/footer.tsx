// src/components/footer.tsx
'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from './ui/skeleton';
import Link from 'next/link';

// Definimos la estructura de los enlaces para que sea fácil de mantener
const footerLinks = [
  { href: '/impressum', labelKey: 'footer.imprint' },
  { href: '/datenschutz', labelKey: 'footer.privacy' },
  { href: '/ueber-uns', labelKey: 'footer.about' },
  { href: '/faq', labelKey: 'footer.faq' },
  { href: '/registrieren', labelKey: 'footer.register' },
];

const Footer = () => {
  const { t, i18n } = useTranslation('common');
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <footer className="bg-[#2a2a2a] text-sm text-gray-300">
        <div className="container mx-auto px-4 py-4">
          <nav className="mb-4 flex h-5 flex-wrap justify-center gap-x-6 gap-y-2">
            <Skeleton className="h-5 w-96 bg-gray-700" />
          </nav>
          <div className="border-t border-gray-600 pt-4 text-center text-gray-400">
            <Skeleton className="mx-auto h-4 w-1/2 bg-gray-700" />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-[#2a2a2a] text-sm text-gray-300">
      <div className="container mx-auto px-4 py-4">
        <nav className="mb-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className="transition-colors hover:text-white"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-600 pt-4 text-center text-gray-400">
          <p>
            Designed by DICILO | Powered by{' '}
            <a
              href="https://mhc-int.com/medien/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-white"
            >
              MHC-MEDIEN&SOLUTIONS
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
