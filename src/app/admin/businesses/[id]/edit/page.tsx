// src/app/admin/businesses/[id]/edit/page.tsx

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, getDoc, updateDoc, deleteDoc, getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { isValidUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Category } from '@/types/category';
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
  MapPinOff,
  Database,
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { seedCategories } from '@/lib/seed-categories';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

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
  active: z.boolean().default(true),
  businessCode: z.string().optional(),
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
  const { t, i18n } = useTranslation('admin');
  const locale = i18n.language;
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  // Category State
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('');
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<string>('');
  const [openCategory, setOpenCategory] = useState(false);
  const [openSubcategory, setOpenSubcategory] = useState(false);

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
    control,
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
  });

  const coords = watch('coords');
  const imageUrl = watch('imageUrl');

  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  const getLocalizedName = useCallback((obj: { name: { de: string; en?: string; es?: string } } | undefined) => {
    if (!obj) return '';
    if (locale.startsWith('es') && obj.name.es) return obj.name.es;
    if (locale.startsWith('en') && obj.name.en) return obj.name.en;
    return obj.name.de;
  }, [locale]);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'));
        const snapshot = await getDocs(q);
        const cats: Category[] = [];
        snapshot.forEach((doc) => cats.push(doc.data() as Category));
        // Sort in memory by Localized name
        cats.sort((a, b) => getLocalizedName(a).localeCompare(getLocalizedName(b)));
        setCategories(cats);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoaded(true);
      }
    };
    fetchCategories();
  }, [db, getLocalizedName]);

  // Effect to sync selects with the form's 'category' string
  useEffect(() => {
    if (selectedCategorySlug) {
      const cat = categories.find((c) => c.id === selectedCategorySlug);
      if (cat) {
        let catString = getLocalizedName(cat);
        if (selectedSubcategorySlug) {
          const sub = cat.subcategories.find((s) => s.id === selectedSubcategorySlug);
          if (sub) {
            catString += ` / ${getLocalizedName(sub)}`;
          }
        }
        setValue('category', catString, { shouldDirty: true, shouldValidate: true });
      }
    }
  }, [selectedCategorySlug, selectedSubcategorySlug, categories, setValue, getLocalizedName]);


  const handleGeocode = useCallback(
    async (addressToGeocode: string) => {
      setIsGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressToGeocode)}&format=json&limit=1&addressdetails=1&accept-language=${locale}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon, address } = data[0];
          const newCoords: [number, number] = [
            parseFloat(lat),
            parseFloat(lon),
          ];

          setValue('coords', newCoords, {
            shouldValidate: true,
            shouldDirty: true,
          });

          // Attempt to extract city - ONLY if location field is empty
          const currentLoc = getValues('location');
          if (!currentLoc) {
            const city = address.city || address.town || address.village || address.municipality;
            if (city) {
              setValue('location', city, { shouldValidate: true, shouldDirty: true });
            }
          }

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
    const location = getValues('location');
    const addressToGeocode = address || location;

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

  const handlePromote = async (clientType: 'starter' | 'retailer' | 'premium') => {
    setIsPromoting(true);
    try {
      const businessName = getValues('name');
      const slug = slugify(businessName);

      // [CHECK] Check if client already exists to avoid duplicates
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Client exists - Update instead of creating new
        const existingClient = querySnapshot.docs[0];
        const clientRef = doc(db, 'clients', existingClient.id);

        await updateDoc(clientRef, {
          clientType: clientType
        });

        toast({
          title: 'Client Updated',
          description: `Existing client updated to ${clientType}. Redirecting...`,
        });

        try {
          await deleteDoc(doc(db, 'businesses', id));
        } catch (e) {
          console.warn('Could not delete business doc (maybe already gone):', e);
        }

        router.push(`/admin/clients/${existingClient.id}/edit`);
        return;
      }

      // If not exists, proceed with promotion (Create new Client)
      const result: any = await promoteToClientFn({
        businessId: id,
        clientType,
      });
      if (result.data.success) {
        try {
          await deleteDoc(doc(db, 'businesses', id));
        } catch (delError) {
          console.error('Failed to delete basic business after promotion:', delError);
        }

        toast({
          title: 'Promotion Successful',
          description: result.data.message,
        });
        router.push(`/admin/clients/${result.data.clientId}/edit`);
      } else {
        throw new Error(result.data.message || 'Promotion failed');
      }
    } catch (error: any) {
      console.error('Promotion error:', error);
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
    if (id && categoriesLoaded) {
      const fetchBusiness = async () => {
        setIsLoadingData(true);
        try {
          const docRef = doc(db, 'businesses', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const formData = {
              name: data.name || '',
              // ... map remaining fields ...
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
              active: data.active !== undefined ? data.active : true,
              businessCode: data.businessCode || '',
            };
            reset(formData as BusinessFormData);

            // Attempt to pre-select category dropdowns
            if (data.category && categories.length > 0) {
              const parts = data.category.split('/').map((s: string) => s.trim());
              if (parts.length > 0) {
                const mainName = parts[0];
                const subName = parts[1];
                const matchedCat = categories.find(c => c.name.de === mainName);
                if (matchedCat) {
                  setSelectedCategorySlug(matchedCat.id);
                  if (subName) {
                    const matchedSub = matchedCat.subcategories.find(s => s.name.de === subName);
                    if (matchedSub) setSelectedSubcategorySlug(matchedSub.id);
                  }
                }
              }
            }
          } else {
            toast({
              title: t('businesses.edit.notFoundTitle'),
              description: t('businesses.edit.notFoundDesc'),
              variant: 'destructive',
            });
            router.push('/admin/businesses');
          }
        } catch (error) {
          console.error('Error fetching business:', error);
          toast({
            title: t('businesses.edit.fetchErrorTitle'),
            description: t('businesses.edit.fetchErrorDesc'),
            variant: 'destructive',
          });
          router.push('/admin/businesses');
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchBusiness();
    }
  }, [id, reset, router, toast, t, db, categoriesLoaded, categories]);

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

      // Ensure category_key is set based on the slugs from selection
      if (selectedCategorySlug) {
        finalData.category_key = `category.${selectedCategorySlug}`;
        if (selectedSubcategorySlug) {
          finalData.subcategory_key = `subcategory.${selectedSubcategorySlug}`;
        } else {
          finalData.subcategory_key = '';
        }
      } else {
        // Fallback to legacy string parsing if no dropdown selection (edge case)
        const [mainCategory, subCategory] = data.category
          .split('/')
          .map((s) => s.trim());
        // Note: reusing the old slugify local function for fallback
        finalData.category_key = `category.${slugify(mainCategory)}`;
        if (subCategory) {
          finalData.subcategory_key = `subcategory.${slugify(subCategory)}`;
        } else {
          finalData.subcategory_key = '';
        }
      }


      Object.keys(finalData).forEach((key) => {
        if (finalData[key] === undefined || finalData[key] === '') {
          delete finalData[key];
        }
      });

      const docRef = doc(db, 'businesses', id);
      await updateDoc(docRef, finalData);

      toast({
        title: t('businesses.edit.saveSuccessTitle'),
        description: t('businesses.edit.saveSuccessDesc'),
      });
      router.push('/admin/businesses');
    } catch (error) {
      console.error('Error during submission:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast({
        title: t('businesses.edit.saveErrorTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData || !categoriesLoaded) {
    return <EditBusinessSkeleton />;
  }

  // Find selected category object for subcategory filtering
  const selectedCategoryObj = categories.find(c => c.id === selectedCategorySlug);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t('businesses.edit.title')}
        </h1>
        <Button variant="outline" asChild>
          <Link href="/admin/businesses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('businesses.edit.back')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>{t('businesses.edit.cardTitle')}</CardTitle>
              <CardDescription>
                {t('businesses.edit.cardDescription', { id })}
              </CardDescription>
            </div>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <div className="flex flex-row items-center space-x-2 space-y-0">
                  <Label htmlFor="active-switch" className="text-sm font-medium">Business Active</Label>
                  <Switch
                    id="active-switch"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Form fields */}
              {/* Form fields */}
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

                {/* ID Field (Read Only) */}
                <div className="space-y-2">
                  <Label>ID #</Label>
                  <Input
                    value={watch('businessCode') ? `EMDC ${watch('businessCode')}` : 'Pending'}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Categories - Combobox */}
                <div className="flex flex-col space-y-2">
                  <Label>{t('businesses.fields.category', 'Categoría')}</Label>
                  <Popover open={openCategory} onOpenChange={setOpenCategory}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCategory}
                        className={cn(
                          "w-full justify-between",
                          !selectedCategorySlug && "text-muted-foreground"
                        )}
                      >
                        {selectedCategorySlug
                          ? getLocalizedName(categories.find((c) => c.id === selectedCategorySlug))
                          : t('businesses.fields.selectCategory', 'Seleccionar Categoría')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder={t('businesses.fields.searchCategory', 'Buscar categoría...')} />
                        <CommandList>
                          <CommandEmpty>{t('businesses.fields.noCategoryFound', 'No se encontró la categoría.')}</CommandEmpty>
                          <CommandGroup>
                            {categories.map((cat) => {
                              const catName = getLocalizedName(cat);
                              return (
                                <CommandItem
                                  key={cat.id}
                                  value={catName}
                                  onSelect={() => {
                                    setSelectedCategorySlug(cat.id);
                                    setSelectedSubcategorySlug(''); // Reset sub on main change
                                    setOpenCategory(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCategorySlug === cat.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {catName}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {/* Validation/Empty State for Categories */}
                  {categoriesLoaded && categories.length === 0 && (
                    <div className="mt-2 flex items-center justify-between rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
                      <div className="flex items-center gap-2">
                        <Database className="h-3 w-3" />
                        <span>No categories.</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 border-yellow-300 bg-white px-2 text-xs hover:bg-yellow-100"
                        onClick={async () => {
                          const confirm = window.confirm('Seed default categories? This will populate the DB.');
                          if (confirm) {
                            try {
                              const { getAuth } = await import('firebase/auth');
                              const auth = getAuth(app);
                              const user = auth.currentUser;
                              if (!user) throw new Error("Not authenticated");
                              const token = await user.getIdToken();

                              const res = await fetch('/api/admin/seed-categories', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });

                              if (!res.ok) {
                                const err = await res.json();
                                throw new Error(err.error || 'Request failed');
                              }

                              window.location.reload();
                            } catch (e: any) {
                              alert('Seeding failed: ' + e.message);
                            }
                          }
                        }}
                      >
                        Seed
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <Label>{t('businesses.fields.subcategory', 'Subcategoría')}</Label>
                  <Popover open={openSubcategory} onOpenChange={setOpenSubcategory}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        disabled={!selectedCategorySlug}
                        aria-expanded={openSubcategory}
                        className={cn(
                          "w-full justify-between",
                          !selectedSubcategorySlug && "text-muted-foreground"
                        )}
                      >
                        {selectedSubcategorySlug
                          ? getLocalizedName(selectedCategoryObj?.subcategories.find((s) => s.id === selectedSubcategorySlug))
                          : t('businesses.fields.selectSubcategory', 'Seleccionar Subcategoría')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder={t('businesses.fields.searchSubcategory', 'Buscar subcategoría...')} />
                        <CommandList>
                          <CommandEmpty>{t('businesses.fields.noSubcategoryFound', 'No se encontró subcategoría.')}</CommandEmpty>
                          <CommandGroup>
                            {selectedCategoryObj?.subcategories?.map((sub) => {
                              const subName = getLocalizedName(sub);
                              return (
                                <CommandItem
                                  key={sub.id}
                                  value={subName}
                                  onSelect={() => {
                                    setSelectedSubcategorySlug(sub.id);
                                    setOpenSubcategory(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedSubcategorySlug === sub.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {subName}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Hidden input to satisfy internal form logic/validation */}
                <input type="hidden" {...register('category')} />
                {errors.category && (
                  <p className="text-sm text-destructive col-span-2">
                    Category selection is required.
                  </p>
                )}

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">
                    {t('businesses.fields.description')}
                  </Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder={t('businesses.fields.descriptionPlaceholder', "Hablanos sobre ti...")}
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
                    onBlur={(e) => {
                      let val = e.target.value.trim();
                      if (val && !val.match(/^https?:\/\//)) {
                        setValue('website', `https://${val}`, { shouldValidate: true });
                      }
                    }}
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
                        onClick={() => handlePromote('starter')}
                      >
                        As Starter
                      </DropdownMenuItem>
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
                  {t('businesses.edit.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="relative z-0 h-[400px] w-full overflow-hidden rounded-lg shadow-lg lg:h-full bg-slate-100">
          {coords ? (
            <DiciloMap
              key={coords.join(',')}
              center={coords as [number, number]}
              zoom={15}
              businesses={[
                {
                  id: id,
                  name: getValues('name'),
                  coords: coords as [number, number],
                  category: getValues('category'),
                  address: getValues('address'),
                  phone: getValues('phone'),
                  website: getValues('website'),
                  currentOfferUrl: getValues('currentOfferUrl'),
                  mapUrl: getValues('mapUrl'),
                },
              ]}
              selectedBusinessId={id}
              onMarkerDragEnd={handleMapDragEnd}
              t={t}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <MapPinOff className="mb-4 h-12 w-12 opacity-50" />
              <h3 className="text-lg font-semibold">{t('businesses.edit.noCoordsTitle', 'No Location Data')}</h3>
              <p className="max-w-xs text-sm">
                {t('businesses.edit.noCoordsDesc', 'Use the "Locate" button next to the address address field to generate coordinates for this business.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
