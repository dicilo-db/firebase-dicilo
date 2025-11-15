// src/app/[locale]/registrieren/page.tsx
'use client';

import { Suspense } from 'react';
import {
  NewBusinessRecommendationForm,
  RecommendationFormSkeleton,
} from './NewBusinessRecommendationForm';
import { RegistrationForm, RegistrationFormSkeleton } from './RegistrationForm';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

export default function RegistrierenPage() {
  const t = useTranslations('register');

  return (
    <>
      <Header />
      <main className="container mx-auto flex-grow px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <Tabs defaultValue="recommend">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recommend">
                {t('register.form.title')}
              </TabsTrigger>
              <TabsTrigger value="register">{t('submitButton')}</TabsTrigger>
            </TabsList>

            <TabsContent value="recommend">
              <Card className="bg-white shadow-xl">
                <Suspense fallback={<RecommendationFormSkeleton />}>
                  <NewBusinessRecommendationForm />
                </Suspense>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="bg-white shadow-xl">
                <CardHeader>
                  <CardTitle>{t('submitButton')}</CardTitle>
                  <CardDescription>{t('successDescription')}</CardDescription>
                </CardHeader>
                <Suspense fallback={<RegistrationFormSkeleton />}>
                  <RegistrationForm />
                </Suspense>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
