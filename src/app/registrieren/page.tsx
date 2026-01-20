// src/app/registrieren/page.tsx
'use client';

import { Suspense } from 'react';
import { RegistrationForm, RegistrationFormSkeleton } from './RegistrationForm';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RecommendationFormContent } from '@/components/RecommendationForm';

const RecommendationFormSkeleton = () => (
  <>
    <CardHeader>
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </CardHeader>
    <CardContent className="space-y-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </>
);


export default function RegistrierenPage() {
  const { t } = useTranslation('register');

  return (
    <>
      <Header />
      <main className="container mx-auto flex-grow px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recommend">
                {t('register.form.title')}
              </TabsTrigger>
              <TabsTrigger value="register">{t('register.form.registerButton')}</TabsTrigger>
            </TabsList>

            <TabsContent value="recommend">
              <Card className="bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    {t('register.form.title')}
                  </CardTitle>
                  <CardDescription>{t('register.form.description')}</CardDescription>
                </CardHeader>
                <div className="px-6 pb-6">
                  <Suspense fallback={<RecommendationFormSkeleton />}>
                    <RecommendationFormContent />
                  </Suspense>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="bg-white shadow-xl">
                <CardHeader>
                  <CardTitle>{t('register.form.registerButton')}</CardTitle>
                  <CardDescription>{t('register.form.registerDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<RegistrationFormSkeleton />}>
                    <RegistrationForm />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
