// src/app/[locale]/ueber-uns/UeberUnsClientContent.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Users,
  User,
  Briefcase,
  Sparkles,
  Target,
  Lightbulb,
  TrendingUp,
  Cpu,
  HeartHandshake,
  Eye,
  Recycle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const UeberUnsSkeleton = () => (
  <>
    <Skeleton className="h-48 w-full" />
    <div className="grid gap-8 md:grid-cols-2">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </>
);

const InfoCard = ({
  icon,
  titleKey,
  descKey,
  link,
  ctaKey,
}: {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  link?: string;
  ctaKey?: string;
}) => {
  const t = useTranslations('about');
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-secondary p-3">{icon}</div>
        </div>
        <CardTitle className="text-center text-2xl font-bold">
          {t(titleKey)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-center text-muted-foreground">{t(descKey)}</p>
      </CardContent>
      {link && ctaKey && (
        <div className="p-6 pt-0">
          <Button asChild className="w-full">
            <Link href={link}>{t(ctaKey)}</Link>
          </Button>
        </div>
      )}
    </Card>
  );
};

const ClubCtaCard = () => {
  const t = useTranslations('about');
  return (
    <Card className="w-full bg-primary text-center text-primary-foreground shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">{t('club.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mx-auto mb-6 max-w-3xl text-primary-foreground/90">
          {t('club.description')}
        </p>
        <Button asChild variant="secondary" size="lg">
          <Link href="/registrieren">{t('club.cta')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export function UeberUnsClientContent() {
  const t = useTranslations('about');

  return (
    <>
      <ClubCtaCard />

      <div className="grid gap-8 md:grid-cols-2">
        <InfoCard
          icon={<User className="h-8 w-8 text-primary" />}
          titleKey="consumers.title"
          descKey="consumers.description"
          link="/registrieren"
          ctaKey="consumers.cta"
        />
        <InfoCard
          icon={<Briefcase className="h-8 w-8 text-primary" />}
          titleKey="entrepreneurs.title"
          descKey="entrepreneurs.description"
          link="/registrieren"
          ctaKey="entrepreneurs.cta"
        />
      </div>

      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {t('weAreDicilo.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('weAreDicilo.description')}
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          icon={<Target className="h-8 w-8 text-primary" />}
          titleKey="ourMission.title"
          descKey="ourMission.description"
        />
        <InfoCard
          icon={<Eye className="h-8 w-8 text-primary" />}
          titleKey="ourVision.title"
          descKey="ourVision.description"
        />
        <InfoCard
          icon={<HeartHandshake className="h-8 w-8 text-primary" />}
          titleKey="ourValues.title"
          descKey="ourValues.description"
        />
        <InfoCard
          icon={<Sparkles className="h-8 w-8 text-primary" />}
          titleKey="ourServices.title"
          descKey="ourServices.description"
        />
        <InfoCard
          icon={<TrendingUp className="h-8 w-8 text-primary" />}
          titleKey="businessModel.title"
          descKey="businessModel.description"
        />
        <InfoCard
          icon={<Lightbulb className="h-8 w-8 text-primary" />}
          titleKey="innovation.title"
          descKey="innovation.description"
        />
        <InfoCard
          icon={<Recycle className="h-8 w-8 text-primary" />}
          titleKey="sustainability.title"
          descKey="sustainability.description"
        />
        <InfoCard
          icon={<Users className="h-8 w-8 text-primary" />}
          titleKey="community.title"
          descKey="community.description"
        />
        <InfoCard
          icon={<Cpu className="h-8 w-8 text-primary" />}
          titleKey="data.title"
          descKey="data.description"
        />
      </div>
    </>
  );
}
