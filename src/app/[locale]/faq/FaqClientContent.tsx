// src/app/[locale]/faq/FaqClientContent.tsx
'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

export const FaqPageSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-7 w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </CardContent>
  </Card>
);

export function FaqClientContent() {
  const t = useTranslations('faq');

  const faqItems = [{ key: 'q1' }];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('generalQuestions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="text-left font-semibold">
                {t(`${item.key}.question`)}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-muted-foreground">
                <div
                  dangerouslySetInnerHTML={{ __html: t(`${item.key}.answer`) }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
