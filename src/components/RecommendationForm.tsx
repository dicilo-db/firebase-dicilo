'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect, useMemo } from 'react';
import { submitRecommendation } from '@/app/actions/recommendations';
import { useTranslation } from 'react-i18next';
import { Label } from './ui/label';
import { Country, City } from 'country-state-city';
import { useAuth } from '@/context/AuthContext';

// Schema
const formSchema = z.object({
  companyName: z.string().min(2, 'companyNameRequired'),
  contactName: z.string().min(2, 'required'),
  email: z.string().email('invalidEmail').optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().min(1, 'required'),
  city: z.string().min(1, 'required'),
  website: z.string().url('invalid_url').optional().or(z.literal('')),
  category: z.string().min(1, 'required'),
  comments: z.string().optional(),
  diciloCode: z.string().optional(), // New
  source: z.string().min(1, 'required'), // New
});

type RecommendationFormValues = z.infer<typeof formSchema>;

const CATEGORIES = [
  'consulting',
  'education',
  'finance',
  'gastronomy',
  'health',
  'hotels',
  'real_estate',
  'food',
  'lifestyle',
  'music',
  'travel',
  'beauty',
  'social',
  'sports',
  'technology',
  'textile',
  'animals',
  'transport',
  'environment',
  'entertainment',
];

const SOURCES = [
  'customer',
  'facebook',
  'instagram',
  'telegram',
  'youtube',
  'twitter',
  'linkedin',
  'tiktok',
  'recommendation',
  'googleads',
  'dicilo',
  'mhc',
  'other'
];

interface RecommendationFormContentProps {
  initialBusinessName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RecommendationFormContent({ initialBusinessName, onSuccess, onCancel }: RecommendationFormContentProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RecommendationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: initialBusinessName || '',
      contactName: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      website: '',
      category: '',
      comments: '',
      diciloCode: '',
      source: '',
    },
  });

  const selectedCountry = form.watch('country');

  const cities = useMemo(() => {
    if (!selectedCountry) return [];
    return City.getCitiesOfCountry(selectedCountry) || [];
  }, [selectedCountry]);

  // Reset city when country changes
  useEffect(() => {
    form.setValue('city', '');
  }, [selectedCountry, form]);

  useEffect(() => {
    if (initialBusinessName) {
      form.setValue('companyName', initialBusinessName);
    }
  }, [initialBusinessName, form]);

  const onSubmit = async (values: RecommendationFormValues) => {
    setIsSubmitting(true);
    try {
      // Get country name from ISO code
      const countryData = Country.getCountryByCode(values.country);
      const countryName = countryData ? countryData.name : values.country;

      const result = await submitRecommendation({
        ...values,
        country: countryName,
        countryCode: values.country,
        userId: user?.uid, // Link to freelancer
      });

      if (!result.success) throw new Error(result.error);
      toast({
        title: t('form.successTitle'),
        description: t('form.successDesc'),
      });
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error sending recommendation:', error);
      toast({
        title: t('form.errorTitle'),
        description: t('form.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const countries = Country.getAllCountries();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="companyName">{t('form.companyNamePlaceholder')}</Label>
        <Input
          id="companyName"
          {...form.register('companyName')}
          className={form.formState.errors.companyName ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {form.formState.errors.companyName && (
          <p className="text-sm text-destructive">{t(`form.${form.formState.errors.companyName.message}`)}</p>
        )}
      </div>

      {/* Contact Name */}
      <div className="space-y-2">
        <Label htmlFor="contactName">{t('form.contactNamePlaceholder')}</Label>
        <Input
          id="contactName"
          {...form.register('contactName')}
          className={form.formState.errors.contactName ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {form.formState.errors.contactName && (
          <p className="text-sm text-destructive">{t('form.errors.required')}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{t('form.emailPlaceholder')}</Label>
        <Input id="email" {...form.register('email')} type="email" disabled={isSubmitting} />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{t(`form.${form.formState.errors.email.message}`)}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">{t('form.phonePlaceholder')}</Label>
        <Input id="phone" {...form.register('phone')} type="tel" disabled={isSubmitting} />
      </div>

      {/* Country & City */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">{t('form.countryPlaceholder')}</Label>
          <Controller
            control={form.control}
            name="country"
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <SelectTrigger className={form.formState.errors.country ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('form.selectOption')} />
                </SelectTrigger>
                <SelectContent className="z-[1001]">
                  {countries.map((country) => (
                    <SelectItem key={country.isoCode} value={country.isoCode}>{country.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.country && <p className="text-sm text-destructive">{t('form.errors.required')}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">{t('form.cityPlaceholder')}</Label>
          <Controller
            control={form.control}
            name="city"
            render={({ field }) => (
              <Select onValueChange={field.onChange} disabled={!selectedCountry || isSubmitting} defaultValue={field.value} value={field.value}>
                <SelectTrigger className={form.formState.errors.city ? 'border-destructive' : ''}>
                  <SelectValue placeholder={!selectedCountry ? t('form.selectCountryFirst') : t('form.selectOption')} />
                </SelectTrigger>
                <SelectContent className="z-[1001]">
                  {cities.map((city) => (
                    <SelectItem key={`${city.name}-${city.latitude}`} value={city.name}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.city && <p className="text-sm text-destructive">{t('form.errors.required')}</p>}
        </div>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="website">{t('form.websitePlaceholder')}</Label>
        <Input id="website" {...form.register('website')} disabled={isSubmitting} />
        {form.formState.errors.website && <p className="text-sm text-destructive">{t(`form.errors.invalid_url`)}</p>}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">{t('form.categoryLabel')}</Label>
        <Controller
          control={form.control}
          name="category"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
              <SelectTrigger className={form.formState.errors.category ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('form.selectCategory')} />
              </SelectTrigger>
              <SelectContent className="z-[1001]">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{t(`form.categories.${cat}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.category && <p className="text-sm text-destructive">{t('form.errors.required')}</p>}
      </div>

      {/* Dicilo Code & Source - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="diciloCode">{t('form.diciloCodePlaceholder')}</Label>
          <Input id="diciloCode" {...form.register('diciloCode')} disabled={isSubmitting} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">{t('form.sourceLabel')}</Label>
          <Controller
            control={form.control}
            name="source"
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <SelectTrigger className={form.formState.errors.source ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('form.sourcePlaceholder')} />
                </SelectTrigger>
                <SelectContent className="z-[1001]">
                  {SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>{t(`form.sources.${source}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.source && <p className="text-sm text-destructive">{t('form.errors.required')}</p>}
        </div>
      </div>


      {/* Comments */}
      <div className="space-y-2">
        <Label htmlFor="comments">{t('form.commentsPlaceholder')}</Label>
        <Textarea id="comments" {...form.register('comments')} disabled={isSubmitting} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCancel}>
            {t('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('form.submitButton')}
        </Button>
      </div>
    </form>
  );
}

interface RecommendationFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialBusinessName?: string;
}

export function RecommendationForm({
  isOpen,
  setIsOpen,
  initialBusinessName,
}: RecommendationFormProps) {
  const { t } = useTranslation('common');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] z-[1000] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('form.title')}</DialogTitle>
          <DialogDescription>{t('form.description')}</DialogDescription>
        </DialogHeader>
        <RecommendationFormContent
          initialBusinessName={initialBusinessName}
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
