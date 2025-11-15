// src/app/[locale]/faq/page.tsx
import { Suspense } from 'react';
import { FaqClientContent, FaqPageSkeleton } from './FaqClientContent';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

export default async function FaqPage() {
  const t = await getTranslations('faq');

  return (
    <>
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">{t('pageTitle')}</h1>
            <p className="text-muted-foreground">{t('pageSubtitle')}</p>
          </div>
          <Suspense fallback={<FaqPageSkeleton />}>
            <FaqClientContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
