// src/app/datenschutz/page.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { useTranslation } from 'react-i18next';

const InfoBox = ({
  titleKey,
  valueKey,
}: {
  titleKey: string;
  valueKey: string;
}) => {
  const { t } = useTranslation('privacy');
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-secondary p-4">
      <p className="text-sm text-muted-foreground">{t(titleKey)}</p>
      <p className="text-lg font-bold text-primary">{t(valueKey)}</p>
    </div>
  );
};

interface SectionContent {
  type: 'h3' | 'p' | 'li' | 'a';
  key: string;
  href?: string;
  items?: string[];
}

const Section = ({
  titleKey,
  contentKeys,
}: {
  titleKey: string;
  contentKeys: SectionContent[];
}) => {
  const { t } = useTranslation('privacy');
  return (
    <div className="space-y-3">
      <h2 className="pt-4 text-2xl font-semibold text-foreground">
        {t(titleKey)}
      </h2>
      {contentKeys.map(({ type, key, href, items }, index) => {
        const text = t(key);
        if (text === key && !items) return null; // Don't render untranslated keys unless it's a list container

        switch (type) {
          case 'h3':
            return (
              <h3
                key={index}
                className="pt-2 text-xl font-semibold text-foreground"
              >
                {text}
              </h3>
            );
          case 'a':
            return (
              <p key={index}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  dangerouslySetInnerHTML={{ __html: text }}
                ></a>
              </p>
            );
          case 'li':
            return (
              <ul key={index} className="list-inside list-disc space-y-2">
                {items?.map((itemKey, itemIndex) => {
                  const itemText = t(itemKey);
                  if (itemText === itemKey) return null;
                  return (
                    <li
                      key={itemIndex}
                      dangerouslySetInnerHTML={{ __html: itemText }}
                    />
                  );
                })}
              </ul>
            );
          default:
            return <p key={index} dangerouslySetInnerHTML={{ __html: text }} />;
        }
      })}
    </div>
  );
};

export default function DatenschutzPage() {
  const { t } = useTranslation('privacy');

  // Simplified structure mapping directly to translation keys
  const sections = [
    {
      titleKey: 'section1.title',
      content: [
        { type: 'p', key: 'section1.p1' },
        { type: 'h3', key: 'section1.subtitle1' },
        { type: 'p', key: 'section1.p2' },
        { type: 'h3', key: 'section1.subtitle2' },
        { type: 'p', key: 'section1.p3' },
        { type: 'p', key: 'section1.p4' },
        { type: 'h3', key: 'section1.subtitle3' },
        { type: 'p', key: 'section1.p5' },
        { type: 'h3', key: 'section1.subtitle4' },
        { type: 'p', key: 'section1.p6' },
        { type: 'p', key: 'section1.p7' },
        { type: 'h3', key: 'section1.subtitle5' },
        { type: 'p', key: 'section1.p8' },
        { type: 'p', key: 'section1.p9' },
      ],
    },
    {
      titleKey: 'section2.title',
      content: [
        { type: 'p', key: 'section2.p1' },
        { type: 'h3', key: 'section2.subtitle1' },
        { type: 'p', key: 'section2.p2' },
        {
          type: 'a',
          key: 'section2.p3_link',
          href: 'https://www.google.com/policies/privacy/',
        },
        { type: 'p', key: 'section2.p4' },
        { type: 'h3', key: 'section2.subtitle2' },
        { type: 'p', key: 'section2.p5' },
      ],
    },
    {
      titleKey: 'section3.title',
      content: [
        { type: 'h3', key: 'section3.subtitle1' },
        { type: 'p', key: 'section3.p1' },
        { type: 'p', key: 'section3.p2' },
        { type: 'p', key: 'section3.p3' },
        { type: 'h3', key: 'section3.subtitle2' },
        { type: 'p', key: 'section3.p4' },
        { type: 'p', key: 'section3.p5' },
        { type: 'h3', key: 'section3.subtitle3' },
        { type: 'p', key: 'section3.p6' },
        { type: 'h3', key: 'section3.subtitle4' },
        { type: 'p', key: 'section3.p7' },
        { type: 'h3', key: 'section3.subtitle5' },
        { type: 'p', key: 'section3.p8' },
        { type: 'p', key: 'section3.p9' },
        { type: 'h3', key: 'section3.subtitle6' },
        { type: 'p', key: 'section3.p10' },
        { type: 'p', key: 'section3.p11' },
        { type: 'h3', key: 'section3.subtitle7' },
        { type: 'p', key: 'section3.p12' },
        { type: 'p', key: 'section3.p13' },
        { type: 'p', key: 'section3.p14' },
        { type: 'p', key: 'section3.p15' },
        { type: 'h3', key: 'section3.subtitle8' },
        { type: 'p', key: 'section3.p16' },
        { type: 'h3', key: 'section3.subtitle9' },
        { type: 'p', key: 'section3.p17' },
        { type: 'h3', key: 'section3.subtitle10' },
        { type: 'p', key: 'section3.p18' },
        { type: 'h3', key: 'section3.subtitle11' },
        { type: 'p', key: 'section3.p19' },
        {
          type: 'li',
          key: 'section3.list1_title',
          items: [
            'section3.li1',
            'section3.li2',
            'section3.li3',
            'section3.li4',
          ],
        },
        { type: 'p', key: 'section3.p20' },
        { type: 'h3', key: 'section3.subtitle12' },
        { type: 'p', key: 'section3.p21' },
        { type: 'p', key: 'section3.p22' },
        { type: 'h3', key: 'section3.subtitle13' },
        { type: 'p', key: 'section3.p23' },
        { type: 'p', key: 'section3.p24' },
      ],
    },
    // Add other sections in the same simplified manner
  ];

  return (
    <>
      <Header />
      <main className="container mx-auto flex-grow px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-800">
              {t('pageTitle')}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('pageSubtitle')}
            </p>
          </div>

          <div className="mb-12 grid gap-4 md:grid-cols-3">
            <InfoBox titleKey="infoBox1.title" valueKey="infoBox1.value" />
            <InfoBox titleKey="infoBox2.title" valueKey="infoBox2.value" />
            <InfoBox titleKey="infoBox3.title" valueKey="infoBox3.value" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('cardTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground">
              {sections.map(({ titleKey, content }, index) => (
                <React.Fragment key={index}>
                  <Section titleKey={titleKey} contentKeys={content} />
                  {index < sections.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}