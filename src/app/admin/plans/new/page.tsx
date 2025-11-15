// src/app/admin/plans/new/page.tsx
'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Skeleton } from '@/components/ui/skeleton';

const planSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  price: z.string().min(1, 'Price is required'),
  period: z.string().optional(),
  features: z.string().min(1, 'Features are required'),
  buttonText: z.string().min(1, 'Button text is required'),
  isPopular: z.boolean().default(false),
  order: z.coerce.number().int().min(0, 'Order must be a positive number'),
  language: z.enum(['de', 'en', 'es'], {
    required_error: 'Language is required',
  }),
});

type PlanFormData = z.infer<typeof planSchema>;

const NewPlanSkeleton = () => (
  <div className="space-y-6 p-8">
    <Skeleton className="h-8 w-48" />
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="mt-6 flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function NewPlanPage() {
  useAuthGuard();
  const db = getFirestore(app);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      title: '',
      price: '',
      period: '',
      features: '',
      buttonText: '',
      isPopular: false,
      order: 0,
      language: 'de',
    },
  });

  const onSubmit = async (data: PlanFormData) => {
    setIsSubmitting(true);
    try {
      const planData = {
        ...data,
        features: data.features
          .split('\n')
          .filter((feature) => feature.trim() !== ''),
      };

      await addDoc(collection(db, 'pricing_plans'), planData);

      toast({ title: t('admin.plans.new.saveSuccess') });
      router.push('/admin/plans');
    } catch (error: any) {
      console.error('Error creating plan:', error);
      toast({
        title: t('admin.plans.new.saveError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('admin.plans.new.title')}</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/plans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('admin.plans.back')}
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.plans.new.cardTitle')}</CardTitle>
          <CardDescription>{t('admin.plans.new.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">{t('admin.plans.fields.title')}</Label>
                <Input
                  id="title"
                  {...register('title')}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">{t('admin.plans.fields.price')}</Label>
                <Input
                  id="price"
                  {...register('price')}
                  className={errors.price ? 'border-destructive' : ''}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">
                  {t('admin.plans.fields.language')}
                </Label>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger
                        className={errors.language ? 'border-destructive' : ''}
                      >
                        <SelectValue
                          placeholder={t(
                            'admin.plans.fields.languagePlaceholder'
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.language && (
                  <p className="text-sm text-destructive">
                    {errors.language.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">{t('admin.plans.fields.period')}</Label>
                <Input id="period" {...register('period')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buttonText">
                  {t('admin.plans.fields.buttonText')}
                </Label>
                <Input
                  id="buttonText"
                  {...register('buttonText')}
                  className={errors.buttonText ? 'border-destructive' : ''}
                />
                {errors.buttonText && (
                  <p className="text-sm text-destructive">
                    {errors.buttonText.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">{t('admin.plans.fields.order')}</Label>
                <Input
                  id="order"
                  type="number"
                  {...register('order')}
                  className={errors.order ? 'border-destructive' : ''}
                />
                {errors.order && (
                  <p className="text-sm text-destructive">
                    {errors.order.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">
                {t('admin.plans.fields.features')}
              </Label>
              <Textarea
                id="features"
                {...register('features')}
                rows={8}
                className={errors.features ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.plans.fields.featuresHelp')}
              </p>
              {errors.features && (
                <p className="text-sm text-destructive">
                  {errors.features.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="isPopular"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isPopular"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isPopular">
                {t('admin.plans.fields.isPopular')}
              </Label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('admin.plans.new.saveButton')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
