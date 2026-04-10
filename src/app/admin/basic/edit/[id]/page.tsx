// src/app/admin/businesses/[id]/edit/page.tsx

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { isValidUrl } from '@/lib/utils';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Loader2,
  LocateFixed,
  Star,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DiciloMap = dynamic(() => import('@/components/dicilo-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

// Zod schema for business data validation
const businessSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().optional(),
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
});

type BusinessFormData = z.infer<typeof businessSchema>;

const EditBusinessSkeleton = () => (
  <div className="space-y-6 p-8">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-24" />
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function EditBusinessPage() {
  useAuthGuard();
  const db = getFirestore(app);
  const functions = getFunctions(app, 'europe-west1');
  const promoteToClientFn = httpsCallable(functions, 'promoteToClient');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]+/g, '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
  });

  const coords = watch('coords');
  const imageUrl = watch('imageUrl');

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
            title: t('admin.businesses.edit.geocode.successTitle'),
            description: `${t('admin.businesses.edit.geocode.successDesc')}: ${newCoords.join(', ')}`,
          });
        } else {
          toast({
            title: t('admin.businesses.edit.geocode.notFoundTitle'),
            description: t('admin.businesses.edit.geocode.notFoundDesc'),
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: t('admin.businesses.edit.geocode.errorTitle'),
          description: t('admin.businesses.edit.geocode.errorDesc'),
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
    const location = getValues('location');
    const addressToGeocode = address || location;

    if (!addressToGeocode) {
      toast({
        title: t('admin.businesses.edit.geocode.noAddressTitle'),
        description: t('admin.businesses.edit.geocode.noAddressDesc'),
        variant: 'destructive',
      });
      return;
    }
    handleGeocode(addressToGeocode);
  }, [getValues, handleGeocode, toast, t]);

  const handlePromote = async (clientType: 'retailer' | 'premium') => {
    setIsPromoting(true);
    try {
      const result: any = await promoteToClientFn({
        businessId: id,
        clientType,
      });
      if (result.data.success) {
        toast({
          title: 'Promotion Successful',
          description: result.data.message,
        });
        router.push(`/admin/clients/${result.data.clientId}/edit`);
      } else {
        throw new Error(result.data.message || 'Promotion failed');
      }
    } catch (error: any) {
      toast({
        title: 'Promotion Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsPromoting(false);
    }
  };

  useEffect(() => {
    if (id) {
      const fetchBusiness = async () => {
        setIsLoadingData(true);
        try {
          const docRef = doc(db, 'businesses', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const formData = {
              name: data.name || '',
              category: data.category || '',
              description: data.description || '',
              location: data.location || '',
              address: data.address || '',
              phone: data.phone || '',
              website: data.website || '',
              imageUrl: data.imageUrl || '',
              imageHint: data.imageHint || '',
              rating: data.rating || 0,
              coords: data.coords || undefined,
              currentOfferUrl: data.currentOfferUrl || '',
              mapUrl: data.mapUrl || '',
            };
            reset(formData as BusinessFormData);
          } else {
            toast({
              title: t('admin.businesses.edit.notFoundTitle'),
              description: t('admin.businesses.edit.notFoundDesc'),
              variant: 'destructive',
            });
            router.push('/admin/basic');
          }
        } catch (error) {
          console.error('Error fetching business:', error);
          toast({
            title: t('admin.businesses.edit.fetchErrorTitle'),
            description: t('admin.businesses.edit.fetchErrorDesc'),
            variant: 'destructive',
          });
          router.push('/admin/basic');
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchBusiness();
    }
  }, [id, reset, router, toast, t, db]);

  const handleMapDragEnd = (newCoords: [number, number]) => {
    setValue('coords', newCoords, { shouldDirty: true, shouldValidate: true });
    toast({
      title: t('admin.businesses.edit.geocode.successTitle'),
      description: `${t('admin.businesses.edit.geocode.dragSuccessDesc')}: ${newCoords[0].toFixed(6)}, ${newCoords[1].toFixed(6)}`,
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

      const docRef = doc(db, 'businesses', id);
      await updateDoc(docRef, finalData);

      toast({
        title: t('admin.businesses.edit.saveSuccessTitle'),
        description: t('admin.businesses.edit.saveSuccessDesc'),
      });
      router.push('/admin/basic');
    } catch (error) {
      console.error('Error during submission:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast({
        title: t('admin.businesses.edit.saveErrorTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return <EditBusinessSkeleton />;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t('admin.businesses.edit.title')}
        </h1>
        <Button variant="outline" asChild>
          <Link href="/admin/basic">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('admin.businesses.edit.back')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.businesses.edit.cardTitle')}</CardTitle>
            <CardDescription>
              {t('admin.businesses.edit.cardDescription', { id })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Form fields */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('admin.businesses.fields.name')}
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
                    {t('admin.businesses.fields.category')}
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
                    {t('admin.businesses.fields.description')}
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
                    {t('admin.businesses.fields.location')}
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
                    {t('admin.businesses.fields.address')}
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
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {t('admin.businesses.fields.phone')}
                  </Label>
                  <Input id="phone" {...register('phone')} />
                </div>
                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">
                    {t('admin.businesses.fields.website')}
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
                    {t('admin.businesses.fields.currentOfferUrl')}
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
                    {t('admin.businesses.fields.mapUrl')}
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
                    {t('admin.businesses.fields.logoUrl')}
                  </Label>
                  <div className="flex items-center gap-4">
                    {isValidUrl(imageUrl) && (
                      <Image
                        src={imageUrl!}
                        alt="Logo preview"
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                      />
                    )}
                    <Input
                      id="imageUrl"
                      {...register('imageUrl')}
                      placeholder={
                        t(
                          'admin.businesses.fields.logoUrlPlaceholder'
                        ) as string
                      }
                      className={errors.imageUrl ? 'border-destructive' : ''}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.businesses.edit.logo.urlHelp')}
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
                    {t('admin.businesses.fields.imageHint')}
                  </Label>
                  <Input id="imageHint" {...register('imageHint')} />
                </div>
                {/* Rating */}
                <div className="space-y-2">
                  <Label htmlFor="rating">
                    {t('admin.businesses.fields.rating')}
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
                    {t('admin.businesses.fields.coords')}
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
                    {t('admin.businesses.fields.coordsHelp')}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" disabled={isPromoting}>
                        {isPromoting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Star className="mr-2 h-4 w-4" />
                        )}
                        Promote to Client
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handlePromote('retailer')}
                      >
                        As Retailer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePromote('premium')}
                      >
                        As Premium
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('admin.businesses.edit.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="relative z-0 h-[400px] w-full overflow-hidden rounded-lg shadow-lg lg:h-full">
          {coords && (
            <DiciloMap
              key={coords.join(',')}
              center={coords as [number, number]}
              businesses={[
                {
                  id: 'edit-marker',
                  coords: coords as [number, number],
                  name: getValues('name'),
                  category: getValues('category'),
                  description: getValues('description'),
                  location: getValues('location') || '',
                  imageUrl: getValues('imageUrl') || '',
                  imageHint: getValues('imageHint') || '',
                },
              ]}
              selectedBusinessId="edit-marker"
              onMarkerDragEnd={handleMapDragEnd}
              zoom={15}

            />
          )}
        </div>
      </div>
    </div>
  );
}
