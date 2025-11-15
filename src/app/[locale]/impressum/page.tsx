// src/app/[locale]/impressum/page.tsx
import { Suspense } from 'react';
import {
  ImpressumClientContent,
  ImpressumSkeleton,
} from './ImpressumClientContent';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

export default async function ImpressumPage() {
  const t = await getTranslations('impressum');
  return (
    <>
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">{t('pageTitle')}</h1>
            <p className="text-muted-foreground">{t('pageSubtitle')}</p>
          </div>
          <Suspense fallback={<ImpressumSkeleton />}>
            <ImpressumClientContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
