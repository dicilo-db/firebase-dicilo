'use client';

import { useForm } from 'react-hook-form';
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

// Definir el esquema de validación con Zod
const formSchema = z.object({
  companyName: z.string().min(2, 'companyNameRequired'),
  contactName: z.string().min(2, 'required'), // Made required
  email: z.string().email('invalidEmail').optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().min(1, 'required'), // Required (ISO Code)
  city: z.string().min(1, 'required'), // Required (City Name)
  website: z.string().url('invalid_url').optional().or(z.literal('')),
  category: z.string().min(1, 'required'), // Required
  comments: z.string().optional(),
});

type RecommendationFormValues = z.infer<typeof formSchema>;

interface RecommendationFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialBusinessName?: string;
}

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

export function RecommendationForm({
  isOpen,
  setIsOpen,
  initialBusinessName,
}: RecommendationFormProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
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
        country: countryName, // Save full name
        countryCode: values.country, // Save code reference
      });

      if (!result.success) throw new Error(result.error);
      toast({
        title: t('form.successTitle'),
        description: t('form.successDesc'),
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error('Error al enviar la recomendación:', error);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] z-[1000] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('form.title')}</DialogTitle>
          <DialogDescription>{t('form.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">
              {t('form.companyNamePlaceholder')}
            </Label>
            <Input
              id="companyName"
              {...form.register('companyName')}
              className={
                form.formState.errors.companyName ? 'border-destructive' : ''
              }
              disabled={isSubmitting}
            />
            {form.formState.errors.companyName && (
              <p className="text-sm text-destructive">
                {t(`form.${form.formState.errors.companyName.message}`)}
              </p>
            )}
          </div>

          {/* Contact Name (Your Name) */}
          <div className="space-y-2">
            <Label htmlFor="contactName">
              {t('form.contactNamePlaceholder')}
            </Label>
            <Input
              id="contactName"
              {...form.register('contactName')}
              className={
                form.formState.errors.contactName ? 'border-destructive' : ''
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('form.emailPlaceholder')}</Label>
            <Input
              id="email"
              {...form.register('email')}
              type="email"
              disabled={isSubmitting}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {t(`form.${form.formState.errors.email.message}`)}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">{t('form.phonePlaceholder')}</Label>
            <Input
              id="phone"
              {...form.register('phone')}
              type="tel"
              disabled={isSubmitting}
            />
          </div>

          {/* Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">{t('form.countryPlaceholder')}</Label>
              <Select
                onValueChange={(value) => form.setValue('country', value)}
                defaultValue={form.getValues('country')}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  className={
                    form.formState.errors.country ? 'border-destructive' : ''
                  }
                >
                  <SelectValue placeholder={t('form.selectOption')} />
                </SelectTrigger>
                <SelectContent className="z-[1001]">
                  {countries.map((country) => (
                    <SelectItem key={country.isoCode} value={country.isoCode}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.country && (
                <p className="text-sm text-destructive">
                  {t('form.errors.required')}
                </p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">{t('form.cityPlaceholder')}</Label>
              <Select
                onValueChange={(value) => form.setValue('city', value)}
                disabled={!selectedCountry || isSubmitting}
              >
                <SelectTrigger
                  className={
                    form.formState.errors.city ? 'border-destructive' : ''
                  }
                >
                  <SelectValue placeholder={!selectedCountry ? t('form.selectCountryFirst') : t('form.selectOption')} />
                </SelectTrigger>
                <SelectContent className="z-[1001]">
                  {cities.map((city) => (
                    <SelectItem key={`${city.name}-${city.latitude}`} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.city && (
                <p className="text-sm text-destructive">
                  {t('form.errors.required')}
                </p>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">{t('form.websitePlaceholder')}</Label>
            <Input
              id="website"
              {...form.register('website')}
              disabled={isSubmitting}
            />
            {form.formState.errors.website && (
              <p className="text-sm text-destructive">
                {t(`form.errors.invalid_url`)}
              </p>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="category">{t('form.categoryLabel')}</Label>
            <Select
              onValueChange={(value) => form.setValue('category', value)}
              defaultValue={form.getValues('category')}
              disabled={isSubmitting}
            >
              <SelectTrigger
                className={
                  form.formState.errors.category ? 'border-destructive' : ''
                }
              >
                <SelectValue placeholder={t('form.selectCategory')} />
              </SelectTrigger>
              <SelectContent className="z-[1001]">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`form.categories.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive">
                {t('form.errors.required')}
              </p>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">{t('form.commentsPlaceholder')}</Label>
            <Textarea
              id="comments"
              {...form.register('comments')}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                {t('cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                t('form.submitButton')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
