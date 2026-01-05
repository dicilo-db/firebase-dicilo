// src/app/impressum/page.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

function ImpressumClientContent() {
  const { t } = useTranslation('impressum');

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
          {/* <p
            dangerouslySetInnerHTML={{
              __html: t('dispute.description'),
            }}
          /> */}
          <p>{t('dispute.description')}</p>
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

export default function ImpressumPage() {
  const { t } = useTranslation('impressum');
  return (
    <>
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">{t('pageTitle')}</h1>
            <p className="text-muted-foreground">{t('pageSubtitle')}</p>
          </div>
          <ImpressumClientContent />
        </div>
      </main>
      <Footer />
    </>
  );
}