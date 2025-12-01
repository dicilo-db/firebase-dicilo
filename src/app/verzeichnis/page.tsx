// src/app/verzeichnis/page.tsx
'use client';

import { Header } from '@/components/header';
import Footer from '@/components/footer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

import { CategoryDirectory } from '@/components/CategoryDirectory';

export default function VerzeichnisPage() {
  const { t } = useTranslation('directory');

  return (
    <>
      <Header />
      <main className="container mx-auto flex-grow p-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('description')}</p>
        </div>
        <CategoryDirectory />
      </main>
      <Footer />
    </>
  );
}