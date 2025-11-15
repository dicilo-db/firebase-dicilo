// src/app/vorteile/page.tsx
'use client';

import { VorteileClientContent } from './VorteileClientContent';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

export default function VorteilePage() {
  const { t } = useTranslation('benefits');

  return (
    <>
      <Header />
      <main className="container mx-auto flex-grow space-y-16 px-4 py-12">
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-800">
            {t('page_title')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('page_subtitle')}
          </p>
        </section>

        <VorteileClientContent />
      </main>
      <Footer />
    </>
  );
}
