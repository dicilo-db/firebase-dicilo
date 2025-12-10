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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CardContent,
  CardFooter,
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

// Schema definition moved inside component for dynamic validation

type RecommendationFormData = z.infer<typeof recommendationSchema>;

function NewBusinessRecommendationForm() {
  const t = useTranslation('register').t;
  const { toast } = useToast();

  const [captchaNums, setCaptchaNums] = React.useState({ n1: 0, n2: 0 });

  React.useEffect(() => {
    setCaptchaNums({
      n1: Math.floor(Math.random() * 10) + 1,
      n2: Math.floor(Math.random() * 10) + 1,
    });
  }, []);

  const recommendationSchema = React.useMemo(() => z.object({
    recommenderName: z.string().min(1, 'register.errors.required'),
    recommenderContact: z.string().min(1, 'register.errors.required'),
    companyName: z.string().min(1, 'register.errors.required'),
    companyContact: z.string().optional(),
    companyWebsite: z
      .string()
      .url('register.errors.invalid_url')
      .optional()
      .or(z.literal('')),
    companyCity: z.string().min(1, 'register.errors.required'),
    businessArea: z.string().min(1, 'register.errors.required'),
    diciloCode: z.string().optional(),
    source: z.string().min(1, 'register.errors.required'),
    notes: z.string().optional(),
    consent: z.boolean().refine((val) => val === true, 'register.errors.consent_required'),
    captcha: z.string().refine((val) => parseInt(val) === captchaNums.n1 + captchaNums.n2, 'register.errors.captcha_invalid'),
  }), [captchaNums]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof recommendationSchema>>({
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
                  {t(errors.recommenderName.message as any)}
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
                  {t(errors.recommenderContact.message as any)}
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
                  {t(errors.companyName.message as any)}
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
                  {t(errors.companyWebsite.message as any)}
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
                  {t(errors.companyCity.message as any)}
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
                {t(errors.businessArea.message as any)}
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
                  {t(errors.source.message as any)}
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
                {t(errors.consent.message as any)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Label htmlFor="captcha" className="flex-shrink-0">
                {t('register.form.captchaLabel')} {captchaNums.n1} + {captchaNums.n2} = ?
              </Label>
              <Input id="captcha" {...register('captcha')} className="w-24" />
            </div>
            {errors.captcha && (
              <p className="mt-2 text-sm text-destructive">
                {t(errors.captcha.message as any)}
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

        </CardFooter>
      </form>
    </>
  );
}

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
                <Suspense fallback={<RecommendationFormSkeleton />}>
                  <NewBusinessRecommendationForm />
                </Suspense>
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
