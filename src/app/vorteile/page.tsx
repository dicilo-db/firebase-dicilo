// src/app/vorteile/page.tsx
'use client';

import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star } from 'lucide-react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircleIcon,
  RocketLaunchIcon,
  UsersIcon,
  WhatsAppIcon,
  TelegramIcon,
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
  LinkedInIcon,
  YouTubeIcon,
  XTwitterIcon,
  TwitchIcon,
  PinterestIcon,
} from '@/components/icons';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

const SocialLink = ({
  href,
  ariaLabel,
  children,
}: {
  href: string;
  ariaLabel: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    className="text-gray-500 transition-colors duration-300 hover:text-primary"
  >
    {children}
  </a>
);

const TestimonialCard = ({
  imgSrc,
  name,
  role,
  quote,
}: {
  imgSrc: string;
  name: string;
  role: string;
  quote: string;
}) => (
  <Card className="flex h-full flex-col bg-white text-center shadow-lg">
    <CardContent className="flex-grow p-8">
      <Image
        src={imgSrc}
        alt={`Avatar of ${name}`}
        width={80}
        height={80}
        className="mx-auto mb-4 rounded-full border-2 border-primary"
        data-ai-hint="person avatar"
      />
      <p className="italic text-muted-foreground">&ldquo;{quote}&rdquo;</p>
    </CardContent>
    <CardFooter className="flex-col bg-gray-50/50 p-4">
      <p className="text-lg font-bold text-gray-800">{name}</p>
      <p className="text-sm font-medium text-primary">{role}</p>
    </CardFooter>
  </Card>
);

const feedbackSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  country: z.string().min(2, 'Country is required'),
  customerType: z.enum(['private', 'donor', 'company', 'premium'], {
    required_error: 'Please select a customer type.',
  }),
  rating: z.coerce
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot be more than 5'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});
type FeedbackFormData = z.infer<typeof feedbackSchema>;

const FeedbackForm = () => {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 5,
      country: '',
      email: '',
      message: '',
      name: '',
      customerType: undefined,
    },
  });
  const rating = watch('rating');

  const customerTypeOptions = useMemo(
    () => [
      {
        value: 'private',
        label: t('benefits.feedback.customerTypeOptions.private'),
      },
      {
        value: 'donor',
        label: t('benefits.feedback.customerTypeOptions.donor'),
      },
      {
        value: 'company',
        label: t('benefits.feedback.customerTypeOptions.company'),
      },
      {
        value: 'premium',
        label: t('benefits.feedback.customerTypeOptions.premium'),
      },
    ],
    [t]
  );

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.errors && Array.isArray(responseData.errors)) {
          const errorMessage = responseData.errors
            .map((err: any) => `'${err.field}: ${err.message}'`)
            .join(', ');
          throw new Error(errorMessage);
        }
        if (responseData.message) {
          throw new Error(responseData.message);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      toast({
        title: t('benefits.feedback.successTitle'),
        description: t('benefits.feedback.successDesc'),
      });
      reset();
    } catch (error) {
      let errorMessage = t('benefits.feedback.errorDesc');
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else if (
          error.message.includes('JSON') ||
          error.message.includes('parse')
        ) {
          errorMessage = 'Invalid response from server. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: t('benefits.feedback.errorTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl bg-white shadow-lg">
      <CardHeader className="text-center">
        <CardTitle>{t('benefits.feedback.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('benefits.feedback.name')}</Label>
              <Input id="name" {...register('name')} disabled={isSubmitting} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('benefits.feedback.email')}</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country">{t('benefits.feedback.country')}</Label>
              <Input
                id="country"
                {...register('country')}
                disabled={isSubmitting}
              />
              {errors.country && (
                <p className="text-sm text-destructive">
                  {errors.country.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerType">
                {t('benefits.feedback.customerType')}
              </Label>
              <Controller
                name="customerType"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      className={
                        errors.customerType ? 'border-destructive' : ''
                      }
                    >
                      <SelectValue
                        placeholder={t(
                          'benefits.feedback.customerTypePlaceholder'
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {customerTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.customerType && (
                <p className="text-sm text-destructive">
                  {errors.customerType.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('benefits.feedback.rating')}</Label>
            <Controller
              name="rating"
              control={control}
              render={({ field: { onChange, value } }) => (
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 cursor-pointer transition-colors ${value >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      onClick={() => !isSubmitting && onChange(star)}
                    />
                  ))}
                </div>
              )}
            />
            {errors.rating && (
              <p className="text-center text-sm text-destructive">
                {errors.rating.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{t('benefits.feedback.message')}</Label>
            <Textarea
              id="message"
              {...register('message')}
              rows={4}
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="text-sm text-destructive">
                {errors.message.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              t('benefits.feedback.submit')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export const VorteilePageSkeleton = () => (
  <>
    <section className="mx-auto grid max-w-4xl gap-8 text-center md:grid-cols-2">
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <Skeleton className="mx-auto h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <Skeleton className="mx-auto h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </section>
    <section className="mx-auto max-w-5xl">
      <Card className="overflow-hidden bg-white shadow-lg">
        <CardHeader className="bg-primary/10 p-8 text-center">
          <Skeleton className="mx-auto h-8 w-1/2" />
          <Skeleton className="mx-auto mt-2 h-4 w-3/4" />
        </CardHeader>
        <CardContent className="grid gap-8 p-8 md:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </section>
    <section className="space-y-4 rounded-lg bg-white p-8 text-center shadow-md">
      <Skeleton className="mx-auto h-8 w-1/2" />
      <Skeleton className="mx-auto h-4 w-3/4" />
      <div className="flex justify-center gap-4 pt-4">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-32" />
      </div>
    </section>
  </>
);

function VorteileClientContent() {
  const { t } = useTranslation('common');

  return (
    <>
      <section className="mx-auto grid max-w-4xl gap-8 text-center md:grid-cols-2">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {t('benefits.size.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('benefits.size.description')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {t('benefits.experience.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('benefits.experience.description')}
            </p>
          </CardContent>
        </Card>
      </section>
      <section className="mx-auto max-w-5xl">
        <Card className="overflow-hidden bg-white shadow-lg">
          <CardHeader className="bg-primary p-8 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold">
              {t('benefits.two_reasons.title')}
            </h2>
            <p className="mx-auto mt-2 max-w-3xl text-primary-foreground/90">
              {t('benefits.two_reasons.description')}
            </p>
          </CardHeader>
          <CardContent className="grid gap-8 p-8 md:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
                <RocketLaunchIcon className="h-6 w-6 text-primary" />
                {t('benefits.for_companies.title')}
              </h3>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                  <div>
                    <strong>{t('benefits.for_companies.item1.title')}:</strong>{' '}
                    {t('benefits.for_companies.item1.description')}
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                  <div>
                    <strong>{t('benefits.for_companies.item2.title')}:</strong>{' '}
                    {t('benefits.for_companies.item2.description')}
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                  <div>
                    <strong>{t('benefits.for_companies.item3.title')}:</strong>{' '}
                    {t('benefits.for_companies.item3.description')}
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
                <UsersIcon className="h-6 w-6 text-primary" />
                {t('benefits.for_users.title')}
              </h3>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                  <div>
                    <strong>{t('benefits.for_users.item1.title')}:</strong>{' '}
                    {t('benefits.for_users.item1.description')}
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                  <div>
                    <strong>{t('benefits.for_users.item2.title')}:</strong>{' '}
                    {t('benefits.for_users.item2.description')}
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                  <div>
                    <strong>{t('benefits.for_users.item3.title')}:</strong>{' '}
                    {t('benefits.for_users.item3.description')}
                  </div>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="rounded-lg bg-white p-8 text-center shadow-md">
        <h2 className="text-3xl font-bold text-gray-800">
          {t('benefits.network.title')}
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">
          {t('benefits.network.description')}
        </p>
        <div className="mt-10">
          <p className="mb-6 text-lg font-medium">
            {t('benefits.network.cta_text')}
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/registrieren">
                {t('benefits.network.cta_button_company')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/registrieren">
                {t('benefits.network.cta_button_user')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold text-gray-800">
          {t('benefits.social.title')}
        </h2>
        <div
          className="mt-4 text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: t('benefits.social.description') }}
        />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <SocialLink
            href="https://chat.whatsapp.com/J3q1Jj9wQ4v8Z2Y2Z7K5Jq"
            ariaLabel="WhatsApp"
          >
            <WhatsAppIcon className="h-8 w-8" />
          </SocialLink>
          <SocialLink href="https://t.me/dicilo" ariaLabel="Telegram">
            <TelegramIcon className="h-8 w-8" />
          </SocialLink>
          <SocialLink
            href="https://www.instagram.com/dicilo.net_"
            ariaLabel="Instagram"
          >
            <InstagramIcon className="h-8 w-8" />
          </SocialLink>
          <SocialLink
            href="https://www.facebook.com/dicilo.net"
            ariaLabel="Facebook"
          >
            <FacebookIcon className="h-8 w-8" />
          </SocialLink>
          <SocialLink
            href="https://www.tiktok.com/@dicilo.net"
            ariaLabel="TikTok"
          >
            <TikTokIcon className="h-8 w-8" />
          </SocialLink>
          <SocialLink
            href="https://www.linkedin.com/company/dicilo-net"
            ariaLabel="LinkedIn"
          >
            <LinkedInIcon className="h-8 w-8" />
          </SocialLink>
          <SocialLink
            href="https://www.youtube.com/@dicilo"
            ariaLabel="YouTube"
          >
            <YouTubeIcon className="h-8 w-8" />
          </SocialLink>
          <SocialLink href="https://x.com/dicilonet" ariaLabel="X">
            <XTwitterIcon className="h-8 w-8" />
          </SocialLink>
          <SocialLink
            href="https://www.twitch.tv/dicilo_net"
            ariaLabel="Twitch"
          >
            <TwitchIcon className="h-8 w-8" />
          </SocialLink>
          <SocialLink
            href="https://www.pinterest.de/dicilo/"
            ariaLabel="Pinterest"
          >
            <PinterestIcon className="h-8 w-8" />
          </SocialLink>
        </div>
      </section>
      <section className="mx-auto max-w-5xl text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-800">
          {t('benefits.testimonials.title')}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          {t('benefits.testimonials.subtitle')}
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <TestimonialCard
            name={t('benefits.testimonials.carla.name')}
            role={t('benefits.testimonials.carla.role')}
            quote={t('benefits.testimonials.carla.quote')}
            imgSrc="https://picsum.photos/seed/carla/100/100"
          />
          <TestimonialCard
            name={t('benefits.testimonials.tomas.name')}
            role={t('benefits.testimonials.tomas.role')}
            quote={t('benefits.testimonials.tomas.quote')}
            imgSrc="https://picsum.photos/seed/tomas/100/100"
          />
          <TestimonialCard
            name={t('benefits.testimonials.lucia.name')}
            role={t('benefits.testimonials.lucia.role')}
            quote={t('benefits.testimonials.lucia.quote')}
            imgSrc="https://picsum.photos/seed/lucia/100/100"
          />
        </div>
      </section>
      <section className="mx-auto max-w-5xl py-12 text-center">
        <FeedbackForm />
      </section>
    </>
  );
}

export default function VorteilePage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Header />
      <main className="container mx-auto flex-grow space-y-16 px-4 py-12">
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-800">
            {t('benefits.page_title')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('benefits.page_subtitle')}
          </p>
        </section>
        <VorteileClientContent />
      </main>
      <Footer />
    </>
  );
}
