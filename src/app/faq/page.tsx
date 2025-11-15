// src/app/faq/page.tsx
'use client';

import { FaqClientContent } from './FaqClientContent';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

export default function FaqPage() {
  const { t } = useTranslation('faq');

  return (
    <>
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">{t('pageTitle')}</h1>
            <p className="text-muted-foreground">{t('pageSubtitle')}</p>
          </div>
          <FaqClientContent />
        </div>
      </main>
      <Footer />
    </>
  );
}
