
// src/app/faq/page.tsx
'use client';
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

export default function FaqPage() {
  const { t } = useTranslation('faq');

  // Generate an array of keys from q1 to q22
  const faqItems = Array.from({ length: 22 }, (_, i) => ({
    key: `q${i + 1}`,
  }));

  return (
    <>
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">{t('pageTitle')}</h1>
            <p className="text-muted-foreground">{t('pageSubtitle')}</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t('generalQuestions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => {
                  const question = t(`${item.key}.question`);
                  const answer = t(`${item.key}.answer`);
                  // Do not render if translation is missing
                  if (question === `${item.key}.question`) return null;

                  return (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger className="text-left font-semibold">
                        {question}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 text-muted-foreground">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: answer,
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
