// src/app/[locale]/verzeichnis/page.tsx
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export default async function VerzeichnisPage() {
  const t = await getTranslations('directory');

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
