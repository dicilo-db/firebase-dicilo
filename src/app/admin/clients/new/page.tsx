// src/app/admin/clients/new/page.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Skeleton } from '@/components/ui/skeleton';

const clientSchema = z.object({
  clientName: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    ),
  clientLogoUrl: z.string().url().optional().or(z.literal('')),
  clientTitle: z.string().min(1, 'Title is required'),
  clientSubtitle: z.string().optional(),
  instagram: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  products: z.string().optional(),
  strengths: z.string().optional(),
  testimonials: z.string().optional(),
  translations: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

const NewClientSkeleton = () => (
  <div className="space-y-6 p-8">
    <div className="mb-6 flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-24" />
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="mt-6 flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function NewClientPage() {
  useAuthGuard();
  const db = getFirestore(app);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      const { instagram, facebook, linkedin, ...rest } = data;

      // Helper function to safely parse JSON
      const safeJsonParse = (
        jsonString: string | undefined,
        fieldName: string
      ) => {
        if (!jsonString) return fieldName === 'translations' ? {} : [];
        try {
          return JSON.parse(jsonString);
        } catch (e) {
          toast({
            title: `Error de formato en ${fieldName}`,
            description: `El contenido de ${fieldName} no es un JSON válido.`,
            variant: 'destructive',
          });
          throw new Error(`Invalid JSON in ${fieldName}`);
        }
      };

      const clientData = {
        ...rest,
        socialLinks: { instagram, facebook, linkedin },
        products: safeJsonParse(data.products, 'products'),
        strengths: safeJsonParse(data.strengths, 'strengths'),
        testimonials: safeJsonParse(data.testimonials, 'testimonials'),
        translations: safeJsonParse(data.translations, 'translations'),
      };

      await addDoc(collection(db, 'clients'), clientData);
      toast({
        title: t('clients.new.saveSuccessTitle'),
        description: t('clients.new.saveSuccessDesc'),
      });
      router.push('/admin/clients');
    } catch (error) {
      console.error('Error during submission:', error);
      if (
        !(error instanceof Error && error.message.startsWith('Invalid JSON'))
      ) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast({
          title: t('clients.new.saveErrorTitle'),
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('clients.new.title')}</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('clients.new.back')}
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('clients.new.cardTitle')}</CardTitle>
          <CardDescription>{t('clients.new.cardDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="clientName">
                  {t('clients.fields.clientName')}
                </Label>
                <Input
                  id="clientName"
                  {...register('clientName')}
                  className={errors.clientName ? 'border-destructive' : ''}
                />
                {errors.clientName && (
                  <p className="text-sm text-destructive">
                    {errors.clientName.message}
                  </p>
                )}
              </div>
              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">{t('clients.fields.slug')}</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  className={errors.slug ? 'border-destructive' : ''}
                />
                {errors.slug && (
                  <p className="text-sm text-destructive">
                    {errors.slug.message}
                  </p>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-2">
              <Label htmlFor="clientTitle">
                {t('clients.fields.clientTitle')}
              </Label>
              <Input
                id="clientTitle"
                {...register('clientTitle')}
                className={errors.clientTitle ? 'border-destructive' : ''}
              />
              {errors.clientTitle && (
                <p className="text-sm text-destructive">
                  {errors.clientTitle.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSubtitle">
                {t('clients.fields.clientSubtitle')}
              </Label>
              <Input id="clientSubtitle" {...register('clientSubtitle')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientLogoUrl">
                {t('clients.fields.clientLogoUrl')}
              </Label>
              <Input
                id="clientLogoUrl"
                {...register('clientLogoUrl')}
                className={errors.clientLogoUrl ? 'border-destructive' : ''}
              />
              {errors.clientLogoUrl && (
                <p className="text-sm text-destructive">
                  {errors.clientLogoUrl.message}
                </p>
              )}
            </div>

            {/* Social Links */}
            <fieldset className="rounded-md border p-4">
              <legend className="px-1 text-sm font-medium">
                {t('clients.fields.socialLinks')}
              </legend>
              <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    {...register('instagram')}
                    className={errors.instagram ? 'border-destructive' : ''}
                  />
                  {errors.instagram && (
                    <p className="text-sm text-destructive">
                      {errors.instagram.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    {...register('facebook')}
                    className={errors.facebook ? 'border-destructive' : ''}
                  />
                  {errors.facebook && (
                    <p className="text-sm text-destructive">
                      {errors.facebook.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    {...register('linkedin')}
                    className={errors.linkedin ? 'border-destructive' : ''}
                  />
                  {errors.linkedin && (
                    <p className="text-sm text-destructive">
                      {errors.linkedin.message}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* JSON Data */}
            <div className="space-y-2">
              <Label htmlFor="products">
                {t('clients.fields.products.title')}
              </Label>
              <Textarea
                id="products"
                {...register('products')}
                rows={5}
                placeholder={t('clients.fields.jsonPlaceholder') as string}
              />
              <p className="text-xs text-muted-foreground">
                {t('clients.fields.jsonHelp')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="strengths">{t('clients.fields.strengths')}</Label>
              <Textarea
                id="strengths"
                {...register('strengths')}
                rows={5}
                placeholder={t('clients.fields.jsonPlaceholder') as string}
              />
              <p className="text-xs text-muted-foreground">
                {t('clients.fields.jsonHelp')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="testimonials">
                {t('clients.fields.testimonials')}
              </Label>
              <Textarea
                id="testimonials"
                {...register('testimonials')}
                rows={5}
                placeholder={t('clients.fields.jsonPlaceholder') as string}
              />
              <p className="text-xs text-muted-foreground">
                {t('clients.fields.jsonHelp')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="translations">
                {t('clients.fields.translations')}
              </Label>
              <Textarea
                id="translations"
                {...register('translations')}
                rows={5}
                placeholder={
                  t('clients.fields.jsonPlaceholderObject') as string
                }
              />
              <p className="text-xs text-muted-foreground">
                {t('clients.fields.jsonHelpObject')}
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('clients.new.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
