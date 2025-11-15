// src/app/[locale]/ueber-uns/page.tsx
import { Suspense } from 'react';
import {
  UeberUnsClientContent,
  UeberUnsSkeleton,
} from './UeberUnsClientContent';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

export default async function UeberUnsPage() {
  const t = await getTranslations('about');

  return (
    <>
      <Header />
      <main className="container mx-auto flex-grow px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-800">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-12">
          <Suspense fallback={<UeberUnsSkeleton />}>
            <UeberUnsClientContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
