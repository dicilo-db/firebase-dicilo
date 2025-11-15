// src/app/[locale]/impressum/ImpressumClientContent.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ImpressumSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-7 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </CardContent>
  </Card>
);

export function ImpressumClientContent() {
  const t = useTranslations('impressum');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cardTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t('legal.title')}
          </h2>
          <div className="space-y-1">
            <p>{t('legal.brand_of')}</p>
            <p className="font-medium">{t('legal.company_name')}</p>
            <p>{t('legal.address_line1')}</p>
            <p>{t('legal.address_line2')}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t('representedBy.title')}
          </h2>
          <p>{t('representedBy.name')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t('contact.title')}
          </h2>
          <div className="space-y-1">
            <p>
              <span className="font-medium">{t('contact.phone_label')}:</span>{' '}
              {t('contact.phone_number')}
            </p>
            <p>
              <span className="font-medium">{t('contact.email_label')}:</span>{' '}
              <a
                href={`mailto:${t('contact.email_address')}`}
                className="text-primary hover:underline"
              >
                {t('contact.email_address')}
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t('vat.title')}
          </h2>
          <p className="mb-1">{t('vat.description')}</p>
          <p className="font-medium">{t('vat.id')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t('responsible.title')}
          </h2>
          <p>{t('responsible.name')}</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t('dispute.title')}
          </h2>
          <p
            dangerouslySetInnerHTML={{
              __html: t('dispute.description'),
            }}
          />
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t('consumerDispute.title')}
          </h2>
          <p>{t('consumerDispute.description')}</p>
        </section>
      </CardContent>
    </Card>
  );
}
