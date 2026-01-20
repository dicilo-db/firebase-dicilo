// src/app/admin/businesses/new/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, LocateFixed } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { isValidUrl } from '@/lib/utils';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { BERLIN_NEIGHBORHOODS, HAMBURG_NEIGHBORHOODS } from '@/data/neighborhoods';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DiciloMap = dynamic(() => import('@/components/dicilo-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

// Zod schema for business data validation
const businessSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().optional(), // Now optional if address/city/zip are used
  address: z.string().optional(),
  zip: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  neighborhood: z.string().optional(),
  country: z.string().default('Deutschland'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  imageUrl: z
    .string()
    .url({ message: 'Invalid URL format' })
    .optional()
    .or(z.literal('')),
  imageHint: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  coords: z.array(z.number()).length(2).optional(),
  currentOfferUrl: z.string().url().optional().or(z.literal('')),
  mapUrl: z.string().url().optional().or(z.literal('')),
  tier_level: z.enum(['basic', 'premium']).default('basic'),
});

type BusinessFormData = z.infer<typeof businessSchema>;

const NewBusinessSkeleton = () => (
  <div className="p-8">
    <div className="mb-6 flex items-center justify-between">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-lg lg:h-full" />
    </div>
  </div>
);

export default function NewBusinessPage() {
  useAuthGuard();
  const db = getFirestore(app);
  const router = useRouter();
  const { toast } = useToast();
  const { t, i18n } = useTranslation('admin');
  const locale = i18n.language;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]+/g, '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    control,
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      location: '', // Deprecated but kept for backward compatibility if needed
      address: '',
      zip: '',
      city: 'Hamburg', // Default or empty
      neighborhood: '',
      country: 'Deutschland',
      phone: '',
      website: '',
      imageUrl: '',
      imageHint: '',
      rating: 0,
      coords: undefined,
      currentOfferUrl: '',
      mapUrl: '',
    },
  });

  const imageUrl = watch('imageUrl');
  const coords = watch('coords');
  const city = watch('city');

  // Determine available neighborhoods based on city
  const filteredNeighborhoods = React.useMemo(() => {
    const normalize = (s: string) => s?.toLowerCase().trim();
    const c = normalize(city || '');
    if (c.includes('berlin')) return BERLIN_NEIGHBORHOODS;
    if (c.includes('hamburg')) return HAMBURG_NEIGHBORHOODS;
    return [];
  }, [city]);

  const handleGeocode = useCallback(
    async (addressToGeocode: string) => {
      setIsGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressToGeocode)}&format=json&limit=1&accept-language=${locale}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const newCoords: [number, number] = [
            parseFloat(lat),
            parseFloat(lon),
          ];
          setValue('coords', newCoords, {
            shouldValidate: true,
            shouldDirty: true,
          });
          toast({
            title: t('businesses.edit.geocode.successTitle'),
            description: `${t('businesses.edit.geocode.successDesc')}: ${newCoords.join(', ')}`,
          });
        } else {
          toast({
            title: t('businesses.edit.geocode.notFoundTitle'),
            description: t('businesses.edit.geocode.notFoundDesc'),
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: t('businesses.edit.geocode.errorTitle'),
          description: t('businesses.edit.geocode.errorDesc'),
          variant: 'destructive',
        });
      } finally {
        setIsGeocoding(false);
      }
    },
    [locale, setValue, t, toast]
  );

  const triggerGeocode = useCallback(() => {
    const address = getValues('address');
    const city = getValues('city');
    const zip = getValues('zip');
    // Construct address for geocoding
    const addressToGeocode = `${address || ''}, ${zip || ''} ${city || ''}, ${getValues('country') || ''}`;

    if (!addressToGeocode) {
      toast({
        title: t('businesses.edit.geocode.noAddressTitle'),
        description: t('businesses.edit.geocode.noAddressDesc'),
        variant: 'destructive',
      });
      return;
    }
    handleGeocode(addressToGeocode);
  }, [getValues, handleGeocode, toast, t]);

  const handleMapDragEnd = (newCoords: [number, number]) => {
    setValue('coords', newCoords, { shouldDirty: true, shouldValidate: true });
    toast({
      title: t('businesses.edit.geocode.successTitle'),
      description: `${t('businesses.edit.geocode.dragSuccessDesc')}: ${newCoords[0].toFixed(6)}, ${newCoords[1].toFixed(6)}`,
    });
  };

  const onSubmit = async (data: BusinessFormData) => {
    setIsSubmitting(true);
    try {
      let finalData: { [key: string]: any } = { ...data };

      const [mainCategory, subCategory] = data.category
        .split('/')
        .map((s) => s.trim());
      finalData.category_key = `category.${slugify(mainCategory)}`;
      if (subCategory) {
        finalData.subcategory_key = `subcategory.${slugify(subCategory)}`;
      } else {
        finalData.subcategory_key = '';
      }

      Object.keys(finalData).forEach((key) => {
        if (finalData[key] === undefined || finalData[key] === '') {
          delete finalData[key];
        }
      });

      await addDoc(collection(db, 'businesses'), finalData);
      toast({
        title: t('businesses.new.saveSuccessTitle'),
        description: t('businesses.new.saveSuccessDesc'),
      });
      router.push('/admin/basic');
    } catch (error) {
      console.error('Error during submission:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast({
        title: t('businesses.new.saveErrorTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t('businesses.new.title')}
        </h1>
        <Button variant="outline" asChild>
          <Link href="/admin/basic">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('businesses.new.back')}
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('businesses.new.cardTitle')}</CardTitle>
            <CardDescription>
              {t('businesses.new.cardDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Membership Type Selector */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
                <Label className="text-base font-semibold">
                  {t('businesses.fields.tierLevel', 'Tipo de Membresía')}
                </Label>
                <Controller
                  control={control}
                  name="tier_level"
                  render={({ field }) => (
                    <div className="flex gap-4">
                      <label className={cn(
                        "flex-1 cursor-pointer rounded-md border p-4 transition-all hover:bg-accent",
                        field.value === 'basic' ? "border-primary bg-accent/50 ring-1 ring-primary" : "border-input"
                      )}>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="basic"
                            checked={field.value === 'basic'}
                            onChange={() => field.onChange('basic')}
                            className="sr-only"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold">Básica</span>
                            <span className="text-xs text-muted-foreground">Gratis, visibilidad estándar.</span>
                          </div>
                        </div>
                      </label>

                      <label className={cn(
                        "flex-1 cursor-pointer rounded-md border p-4 transition-all hover:bg-yellow-50",
                        field.value === 'premium' ? "border-yellow-500 bg-yellow-50 ring-1 ring-yellow-500" : "border-input"
                      )}>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="premium"
                            checked={field.value === 'premium'}
                            onChange={() => field.onChange('premium')}
                            className="sr-only"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-yellow-700">Premium / Starter</span>
                            <span className="text-xs text-yellow-600/80">Destacado, galería, verificado.</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('businesses.fields.name')}
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    {t('businesses.fields.category')}
                  </Label>
                  <Input
                    id="category"
                    {...register('category')}
                    className={errors.category ? 'border-destructive' : ''}
                    placeholder="Hauptkategorie / Unterkategorie"
                  />
                  {errors.category && (
                    <p className="text-sm text-destructive">
                      {errors.category.message}
                    </p>
                  )}
                </div>
                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">
                    {t('businesses.fields.description')}
                  </Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>
                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">
                    {t('businesses.fields.location')}
                  </Label>
                  <Input
                    id="location"
                    {...register('location')}
                    className={errors.location ? 'border-destructive' : ''}
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive">
                      {errors.location.message}
                    </p>
                  )}
                </div>
                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">
                    {t('businesses.fields.address')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input id="address" {...register('address')} />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={triggerGeocode}
                      disabled={isGeocoding}
                    >
                      {isGeocoding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LocateFixed className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip">
                      PLZ (Zip)
                    </Label>
                    <Input id="zip" {...register('zip')} placeholder="20095" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      Stadt (City)
                    </Label>
                    <Input id="city" {...register('city')} placeholder="Hamburg" />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">
                    Stadtteil (Neighborhood)
                  </Label>
                  {filteredNeighborhoods.length > 0 ? (
                    <Controller
                      control={control}
                      name="neighborhood"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <SelectTrigger>
                            <SelectValue placeholder="Bezirk auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Keine Auswahl</SelectItem>
                            {filteredNeighborhoods.map((n) => (
                              <SelectItem key={n.id} value={n.id}>
                                {n.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  ) : (
                    <Input
                      id="neighborhood"
                      {...register('neighborhood')}
                      placeholder="e.g. Altona, Mitte..."
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Für Berlin/Hamburg: Bitte den Bezirk/Stadtteil auswählen.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Input id="country" {...register('country')} defaultValue="Deutschland" />
                </div>
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {t('businesses.fields.phone')}
                  </Label>
                  <Input id="phone" {...register('phone')} />
                </div>
                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">
                    {t('businesses.fields.website')}
                  </Label>
                  <Input
                    id="website"
                    {...register('website')}
                    className={errors.website ? 'border-destructive' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive">
                      {errors.website.message}
                    </p>
                  )}
                </div>
                {/* Current Offer URL */}
                <div className="space-y-2">
                  <Label htmlFor="currentOfferUrl">
                    {t('businesses.fields.currentOfferUrl')}
                  </Label>
                  <Input
                    id="currentOfferUrl"
                    {...register('currentOfferUrl')}
                    className={
                      errors.currentOfferUrl ? 'border-destructive' : ''
                    }
                  />
                  {errors.currentOfferUrl && (
                    <p className="text-sm text-destructive">
                      {errors.currentOfferUrl.message}
                    </p>
                  )}
                </div>
                {/* Map URL */}
                <div className="space-y-2">
                  <Label htmlFor="mapUrl">
                    {t('businesses.fields.mapUrl')}
                  </Label>
                  <Input
                    id="mapUrl"
                    {...register('mapUrl')}
                    className={errors.mapUrl ? 'border-destructive' : ''}
                  />
                  {errors.mapUrl && (
                    <p className="text-sm text-destructive">
                      {errors.mapUrl.message}
                    </p>
                  )}
                </div>
                {/* Image URL */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="imageUrl">
                    {t('businesses.fields.logoUrl')}
                  </Label>
                  <div className="flex items-center gap-4">
                    {isValidUrl(imageUrl) && (
                      <Image
                        src={imageUrl!}
                        alt="Logo preview"
                        width={64}
                        height={64}
                        className="rounded-md object-cover bg-muted"
                      />
                    )}
                    <Input
                      id="imageUrl"
                      {...register('imageUrl')}
                      placeholder={
                        t(
                          'businesses.fields.logoUrlPlaceholder'
                        ) as string
                      }
                      className={errors.imageUrl ? 'border-destructive' : ''}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('businesses.edit.logo.urlHelp')}
                  </p>
                  {errors.imageUrl && (
                    <p className="text-sm text-destructive">
                      {errors.imageUrl.message}
                    </p>
                  )}
                </div>
                {/* Image Hint */}
                <div className="space-y-2">
                  <Label htmlFor="imageHint">
                    {t('businesses.fields.imageHint')}
                  </Label>
                  <Input id="imageHint" {...register('imageHint')} />
                </div>
                {/* Rating */}
                <div className="space-y-2">
                  <Label htmlFor="rating">
                    {t('businesses.fields.rating')}
                  </Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    {...register('rating')}
                    className={errors.rating ? 'border-destructive' : ''}
                  />
                  {errors.rating && (
                    <p className="text-sm text-destructive">
                      {errors.rating.message}
                    </p>
                  )}
                </div>
                {/* Coords */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="coords">
                    {t('businesses.fields.coords')}
                  </Label>
                  <Input
                    id="coords"
                    value={
                      coords
                        ? `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`
                        : ''
                    }
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('businesses.fields.coordsHelp')}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('businesses.new.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="h-[400px] w-full overflow-hidden rounded-lg shadow-lg lg:h-full">
          <DiciloMap
            key={coords ? coords.join(',') : 'default'}
            center={coords ? (coords as [number, number]) : [53.5511, 9.9937]}
            businesses={
              coords
                ? [
                  {
                    id: 'new-marker',
                    coords: coords as [number, number],
                    name: getValues('name'),
                  },
                ]
                : []
            }
            selectedBusinessId={coords ? 'new-marker' : null}
            onMarkerDragEnd={handleMapDragEnd}
            zoom={coords ? 15 : 12}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
