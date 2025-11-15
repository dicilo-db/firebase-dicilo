// src/components/PricingPlanCard.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// Define la estructura de un Plan para las props
interface Plan {
  id: string;
  title: string;
  price: string;
  period?: string;
  features: string[];
  buttonText: string;
  isPopular: boolean;
}

interface PricingPlanCardProps {
  plan: Plan;
}

export const PricingPlanCard = ({ plan }: PricingPlanCardProps) => {
  const { t } = useTranslation('common');

  return (
    <Card
      className={cn(
        'relative flex h-full transform flex-col overflow-hidden transition-transform hover:scale-105',
        plan.isPopular ? 'ring-2 ring-primary' : 'border'
      )}
    >
      {plan.isPopular && (
        <div className="absolute left-0 right-0 top-0 bg-primary py-2 text-center text-sm font-semibold text-white">
          {t('bestChoice')}
        </div>
      )}
      <CardHeader className={cn('text-center', plan.isPopular ? 'pt-12' : '')}>
        <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
        <p className="my-4 text-4xl font-extrabold text-primary">
          {plan.price}
          <span className="text-base font-medium text-muted-foreground">
            {plan.period}
          </span>
        </p>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {plan.features.map((feature: any, index: number) => (
            <li key={index} className="flex items-start">
              <Check className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              <span className="text-sm text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          className="w-full"
          variant={plan.isPopular ? 'default' : 'outline'}
        >
          <Link href="/registrieren">{plan.buttonText}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
