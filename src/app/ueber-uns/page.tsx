// src/app/ueber-uns/page.tsx
'use client';
import { UeberUnsClientContent } from './UeberUnsClientContent';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

export default function UeberUnsPage() {
  const { t } = useTranslation('about');

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
          <UeberUnsClientContent />
        </div>
      </main>
      <Footer />
    </>
  );
}
