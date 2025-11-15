// src/app/[locale]/registrieren/NewBusinessRecommendationForm.tsx
'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from 'next-intl';

const sourceOptions = [
  { value: 'customer', labelKey: 'form.source.customer' },
  { value: 'facebook', labelKey: 'form.source.facebook' },
  { value: 'instagram', labelKey: 'form.source.instagram' },
  { value: 'telegram', labelKey: 'form.source.telegram' },
  { value: 'youtube', labelKey: 'form.source.youtube' },
  { value: 'twitter', labelKey: 'form.source.twitter' },
  { value: 'linkedin', labelKey: 'form.source.linkedin' },
  { value: 'tiktok', labelKey: 'form.source.tiktok' },
  { value: 'recommendation', labelKey: 'form.source.recommendation' },
  { value: 'googleads', labelKey: 'form.source.googleads' },
  { value: 'dicilo', labelKey: 'form.source.dicilo' },
  { value: 'mhc', labelKey: 'form.source.mhc' },
  { value: 'other', labelKey: 'form.source.other' },
];

const recommendationSchema = z.object({
  recommenderName: z.string().min(1, 'errors.required'),
  recommenderContact: z.string().min(1, 'errors.required'),
  companyName: z.string().min(1, 'errors.required'),
  companyContact: z.string().optional(),
  companyWebsite: z
    .string()
    .url('errors.invalid_url')
    .optional()
    .or(z.literal('')),
  companyCity: z.string().min(1, 'errors.required'),
  businessArea: z.string().min(1, 'errors.required'),
  diciloCode: z.string().optional(),
  source: z.string().min(1, 'errors.required'),
  notes: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, 'errors.consent_required'),
  captcha: z.string().refine((val) => val === '23', 'errors.captcha_invalid'),
});

type RecommendationFormData = z.infer<typeof recommendationSchema>;

export function NewBusinessRecommendationForm() {
  const t = useTranslations('register');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RecommendationFormData>({
    resolver: zodResolver(recommendationSchema),
  });

  const onSubmit = async (data: RecommendationFormData) => {
    console.log(data);
    toast({
      title: t('register.form.successTitle'),
      description: t('register.form.successDescription'),
    });
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {t('register.form.title')}
        </CardTitle>
        <CardDescription>{t('register.form.description')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <h3 className="pt-2 text-lg font-semibold">
            {t('register.form.recommenderSection')}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recommenderName">
                {t('register.form.recommenderName')}
              </Label>
              <Input id="recommenderName" {...register('recommenderName')} />
              {errors.recommenderName && (
                <p className="text-sm text-destructive">
                  {t(errors.recommenderName.message)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommenderContact">
                {t('register.form.recommenderContact')}
              </Label>
              <Input
                id="recommenderContact"
                {...register('recommenderContact')}
              />
              {errors.recommenderContact && (
                <p className="text-sm text-destructive">
                  {t(errors.recommenderContact.message)}
                </p>
              )}
            </div>
          </div>

          <h3 className="pt-4 text-lg font-semibold">
            {t('register.form.companySection')}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                {t('register.form.companyName')}
              </Label>
              <Input id="companyName" {...register('companyName')} />
              {errors.companyName && (
                <p className="text-sm text-destructive">
                  {t(errors.companyName.message)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyContact">
                {t('register.form.companyContact')}
              </Label>
              <Input id="companyContact" {...register('companyContact')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyWebsite">
                {t('register.form.companyWebsite')}
              </Label>
              <Input id="companyWebsite" {...register('companyWebsite')} />
              {errors.companyWebsite && (
                <p className="text-sm text-destructive">
                  {t(errors.companyWebsite.message)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyCity">
                {t('register.form.companyCity')}
              </Label>
              <Input id="companyCity" {...register('companyCity')} />
              {errors.companyCity && (
                <p className="text-sm text-destructive">
                  {t(errors.companyCity.message)}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessArea">
              {t('register.form.businessArea')}
            </Label>
            <Input id="businessArea" {...register('businessArea')} />
            {errors.businessArea && (
              <p className="text-sm text-destructive">
                {t(errors.businessArea.message)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="diciloCode">
                {t('register.form.diciloCode')}
              </Label>
              <Input id="diciloCode" {...register('diciloCode')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">{t('register.form.source')}</Label>
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('register.form.sourcePlaceholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.source && (
                <p className="text-sm text-destructive">
                  {t(errors.source.message)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('register.form.notes')}</Label>
            <Textarea id="notes" {...register('notes')} />
          </div>

          <div className="space-y-2 pt-4">
            <div className="flex items-start space-x-2">
              <Controller
                name="consent"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="consent"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                )}
              />
              <Label
                htmlFor="consent"
                className={cn(
                  'text-xs text-muted-foreground',
                  errors.consent && 'text-destructive'
                )}
              >
                {t('register.form.consent')}
              </Label>
            </div>
            {errors.consent && (
              <p className="text-sm text-destructive">
                {t(errors.consent.message)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Label htmlFor="captcha" className="flex-shrink-0">
                {t('register.form.captchaLabel')} 14 + 9 = ?
              </Label>
              <Input id="captcha" {...register('captcha')} className="w-24" />
            </div>
            {errors.captcha && (
              <p className="mt-2 text-sm text-destructive">
                {t(errors.captcha.message)}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              t('register.form.submitButton')
            )}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t('register.form.laughingRegister')}
          </p>
        </CardFooter>
      </form>
    </>
  );
}

export const RecommendationFormSkeleton = () => (
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
