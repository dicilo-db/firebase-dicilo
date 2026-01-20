'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-grow items-center justify-center bg-background">
      <div className="p-8 text-center">
        <div className="mb-4 flex justify-center">
          <TriangleAlert className="h-16 w-16 text-destructive" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {t('notFound.title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t('notFound.description')}
        </p>
        <Button asChild className="mt-8">
          <Link href="/">{t('notFound.backToHome')}</Link>
        </Button>
      </div>
    </div>
  );
}
