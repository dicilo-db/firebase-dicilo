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

export default function VerzeichnisPage() {
  const { t } = useTranslation('directory');

  return (
    <>
      <Header />
      <main className="container mx-auto flex-grow p-4">
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{t('content')}</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}