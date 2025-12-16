// src/app/planes/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { PricingPlanCard } from '@/components/PricingPlanCard';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

export interface Plan {
  id: string;
  title: string;
  price: string;
  period?: string;
  features: string[];
  buttonText: string;
  isPopular: boolean;
  order: number;
  language: 'de' | 'en' | 'es';
}

export const PlansPageSkeleton = () => (
  <div className="flex min-h-screen flex-col bg-gray-50">
    <main className="flex-grow">
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-4xl text-center">
            <Skeleton className="mx-auto h-10 w-2/3" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mx-auto h-4 w-5/6" />
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="flex h-full flex-col">
                <CardHeader className="text-center">
                  <Skeleton className="mx-auto h-6 w-1/2" />
                  <Skeleton className="mx-auto my-4 h-12 w-1/3" />
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  </div>
);

function PlansClientContent() {
  const { t, i18n } = useTranslation(['pricing_page', 'common']);
  const locale = i18n.language;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      const db = getFirestore(app);
      try {
        const plansCol = collection(db, 'pricing_plans');
        const q = query(plansCol, orderBy('order'));
        const planSnapshot = await getDocs(q);
        const planList = planSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Plan
        );
        setPlans(planList);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const filteredPlans = useMemo(() => {
    const localePlans = plans.filter((plan) => plan.language === locale);
    if (localePlans.length > 0) {
      return localePlans;
    }
    // Fallback to German if no plans for the current locale are found
    return plans.filter((plan) => plan.language === 'de');
  }, [plans, locale]);

  if (isLoading) {
    return <PlansPageSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-grow">
        <section className="bg-white py-16 sm:py-24">
          <div className="container mx-auto px-4">

            {/* Header Section with Split Layout */}
            <div className="mx-auto mb-12 max-w-6xl">
              <div className="flex flex-col md:flex-row gap-8 items-start">

                {/* Text Content (60%) */}
                <div className="w-full md:w-3/5 text-left">
                  <h2 className="text-3xl font-extrabold text-foreground md:text-4xl text-center md:text-left">
                    {t('plans_title')}
                  </h2>
                  <div className="mt-4 space-y-4 text-muted-foreground text-center md:text-left">
                    <p>{t('plans_desc_1')}</p>
                    <p>{t('plans_desc_2')}</p>
                    <p>{t('plans_desc_3')}</p>
                  </div>
                </div>

                {/* Currency Converter Widget (40%) */}
                <div className="w-full md:w-2/5">
                  <CurrencyConverter />
                </div>

              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                  <PricingPlanCard key={plan.id} plan={plan} />
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground">
                  {t('common:noPlansAvailable')}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PlansPage() {
  return (
    <>
      <Header />
      <PlansClientContent />
      <Footer />
    </>
  );
}
