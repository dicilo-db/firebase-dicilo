// src/app/admin/businesses/[id]/edit/page.tsx

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, getDoc, updateDoc, deleteDoc, getFirestore, collection, query, where, getDocs, orderBy, runTransaction } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { isValidUrl } from '@/lib/utils';
import { uploadImage } from '@/app/actions/upload';
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
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { seedCategories } from '@/lib/seed-categories';
import { BERLIN_NEIGHBORHOODS, HAMBURG_NEIGHBORHOODS } from '@/data/neighborhoods';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles as SparklesIcon } from 'lucide-react';

const DiciloMap = dynamic(() => import('@/components/dicilo-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

// Zod schema for business data validation
const businessSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  description_translations: z.object({
    en: z.string().optional(),
    es: z.string().optional(),
    de: z.string().optional(),
  }).optional(),
  location: z.string().optional(),
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
  active: z.boolean().default(true),
  businessCode: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
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
  const city = watch('city');

  // Determine available neighborhoods based on city
  const filteredNeighborhoods = React.useMemo(() => {
    const normalize = (s: string) => s?.toLowerCase().trim();
    const c = normalize(city || '');
    if (c.includes('berlin')) return BERLIN_NEIGHBORHOODS;
    if (c.includes('hamburg')) return HAMBURG_NEIGHBORHOODS;
    return [];
  }, [city]);

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

  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslateDescription = async (sourceLang: 'es' | 'en' | 'de' | 'auto', text: string) => {
    if (!text) return;
    setIsTranslating(true);
    try {
      // If auto, target all. If specific, target others.
      const targetLanguages = ['es', 'en', 'de'].filter(l => sourceLang === 'auto' ? true : l !== sourceLang);

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguages, sourceLanguage: sourceLang }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('businesses.edit.translation.errorDesc', 'Translation failed'));
      }

      // Update form values
      Object.entries(data.translations).forEach(([lang, translatedText]) => {
        console.log(`Applying translation for ${lang}:`, translatedText);
        setValue(`description_translations.${lang}` as any, translatedText as string, {
          shouldDirty: true,
          shouldValidate: true,
          shouldTouch: true
        });
      });

      toast({
        title: t('businesses.edit.translation.successTitle', "Translation Complete"),
        description: t('businesses.edit.translation.successDesc', "Description has been translated to other languages."),
      });
    } catch (error: any) {
      console.error('Translation error:', error);
      toast({
        title: t('businesses.edit.translation.errorTitle', "Translation Error"),
        description: error.message || t('businesses.edit.translation.errorDesc', "Failed to translate description."),
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };


  const generateInternalId = async () => {
    if (getValues('businessCode')) return;

    try {
      const newCode = await runTransaction(db, async (transaction) => {
        const busRef = doc(db, 'businesses', id);
        const busDoc = await transaction.get(busRef);
        if (!busDoc.exists()) throw new Error("Business not found");

        // Double check inside transaction
        if (busDoc.data().businessCode) return busDoc.data().businessCode;

        // Logic for year: Default to 26 (2026) for now as requested for the example.
        // "todos las que ya estan creadas... comenzado con el año 25".
        // If we want to detect old ones, we could check createdAt.
        // For now, let's use 26 to match the "EMPDC-26..." request for the active example.
        // If the user wants 25 for everything old, we might need a migration script or stronger logic.
        // But for "Edit Business", using the current year (26) is the safest bet for "Active/New" interactions.
        const yearPrefix = 26;

        const counterRef = doc(db, 'counters', `businesses-EMPDC-${yearPrefix}`);
        const counterDoc = await transaction.get(counterRef);

        let nextVal = 1;
        if (counterDoc.exists()) {
          nextVal = counterDoc.data().val + 1;
          transaction.update(counterRef, { val: nextVal });
        } else {
          transaction.set(counterRef, { val: 1 });
        }

        // EMPDC-260000001 (7 digits for the counter part)
        const code = `EMPDC-${yearPrefix}${String(nextVal).padStart(7, '0')}`;
        transaction.update(busRef, { businessCode: code });
        return code;
      });

      setValue('businessCode', newCode);
      toast({
        title: "ID Generated",
        description: `Internal ID assigned: ${newCode}`,
      });
    } catch (e: any) {
      console.error('ID Gen Error:', e);
      toast({
        title: "Error generating ID",
        description: e.message,
        variant: "destructive"
      });
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Path: businesses/{id}/logo-{timestamp}.{ext}
      const ext = file.name.split('.').pop();
      const path = `businesses/${id}/logo-${Date.now()}.${ext}`;
      formData.append('path', path);

      const result = await uploadImage(formData);
      if (result.success && result.url) {
        setValue('imageUrl', result.url, { shouldValidate: true, shouldDirty: true });
        toast({
          title: "Logo Uploaded",
          description: "Logo has been uploaded successfully.",
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
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
              description_translations: data.description_translations || {
                es: data.description || '',
                en: '',
                de: ''
              },
              location: data.location || '',
              address: data.address || '',
              zip: data.zip || '',
              city: data.city || '',
              neighborhood: data.neighborhood || '',
              country: data.country || 'Deutschland',
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
              email: data.email || '',
            };
            reset(formData as BusinessFormData);

            // Attempt to pre-select category dropdowns using Keys (Preferred) or Improved Legacy parsing
            if (categories.length > 0) {
              let foundCatId = '';
              let foundSubId = '';

              // Strategy 1: Use explicit keys if available (Most Robust)
              if (data.category_key) {
                foundCatId = data.category_key.replace(/^category\./, '');
              }
              if (data.subcategory_key) {
                foundSubId = data.subcategory_key.replace(/^subcategory\./, '');
              }

              // Strategy 2: Fallback to string matching (Legacy support)
              // Tries to match the stored string against ANY language name (de, es, en)
              if (!foundCatId && data.category) {
                const parts = data.category.split('/').map((s: string) => s.trim());
                if (parts.length > 0) {
                  const mainName = parts[0];
                  const subName = parts[1];

                  const matchedCat = categories.find(c =>
                    c.name.de === mainName ||
                    c.name.es === mainName ||
                    c.name.en === mainName
                  );

                  if (matchedCat) {
                    foundCatId = matchedCat.id;
                    if (subName) {
                      const matchedSub = matchedCat.subcategories.find(s =>
                        s.name.de === subName ||
                        s.name.es === subName ||
                        s.name.en === subName
                      );
                      if (matchedSub) foundSubId = matchedSub.id;
                    }
                  }
                }
              }

              // Apply selection
              if (foundCatId) {
                setSelectedCategorySlug(foundCatId);
                if (foundSubId) {
                  setSelectedSubcategorySlug(foundSubId);
                }
              }
            }
          } else {
            toast({
              title: t('businesses.edit.notFoundTitle'),
              description: t('businesses.edit.notFoundDesc'),
              variant: 'destructive',
            });
            router.push('/admin/basic');
          }
        } catch (error) {
          console.error('Error fetching business:', error);
          toast({
            title: t('businesses.edit.fetchErrorTitle'),
            description: t('businesses.edit.fetchErrorDesc'),
            variant: 'destructive',
          });
          router.push('/admin/basic');
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

  const esDescription = watch('description_translations.es');
  useEffect(() => {
    if (esDescription) {
      setValue('description', esDescription, { shouldDirty: true });
    }
  }, [esDescription, setValue]);

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
      // router.push('/admin/basic'); // User requested to stay on page
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
          <Link href="/admin/basic">
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
                    value={watch('businessCode') || 'Pending'}
                    disabled
                    className="bg-muted font-mono"
                  />

                  {/* Better: Put it in an input group or just below */}
                  {!watch('businessCode') && (
                    <Button
                      type="button"
                      onClick={generateInternalId}
                      variant="outline"
                      size="sm"
                      className="mt-1"
                    >
                      Generate Internal ID (EMPDC)
                    </Button>
                  )}
                </div>

                {/* Categories - Select */}
                <div className="flex flex-col space-y-2">
                  <Label>{t('businesses.fields.category', 'Categoría')}</Label>
                  <Select
                    value={selectedCategorySlug}
                    onValueChange={(val) => {
                      setSelectedCategorySlug(val);
                      setSelectedSubcategorySlug(''); // Reset sub on main change
                    }}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder={t('businesses.fields.selectCategory', 'Seleccionar Categoría')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {getLocalizedName(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
                  <Select
                    value={selectedSubcategorySlug}
                    onValueChange={setSelectedSubcategorySlug}
                    disabled={!selectedCategorySlug}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder={t('businesses.fields.selectSubcategory', 'Seleccionar Subcategoría')} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategoryObj?.subcategories?.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {getLocalizedName(sub)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hidden input to satisfy internal form logic/validation */}
                <input type="hidden" {...register('category')} />
                {errors.category && (
                  <p className="text-sm text-destructive col-span-2">
                    Category selection is required.
                  </p>
                )}

                {/* Description with Translations */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('businesses.fields.description')}</Label>
                    <div className="flex items-center gap-2">
                      {isTranslating && <span className="text-xs text-muted-foreground animate-pulse">{t('businesses.edit.translation.translating', 'Translating...')}</span>}
                    </div>
                  </div>

                  <Tabs defaultValue="es" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="es">🇪🇸 ES</TabsTrigger>
                      <TabsTrigger value="en">🇬🇧 EN</TabsTrigger>
                      <TabsTrigger value="de">🇩🇪 DE</TabsTrigger>
                    </TabsList>

                    {['es', 'en', 'de'].map((lang) => (
                      <TabsContent key={lang} value={lang} className="space-y-2">
                        <div className="relative">
                          <Textarea
                            {...register(`description_translations.${lang}` as any)}
                            placeholder={`Description in ${lang.toUpperCase()}...`}
                            className="min-h-[120px] pr-12"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-primary"
                            title={`Translate to other languages`}
                            onClick={() => {
                              const text = getValues(`description_translations.${lang}` as any);
                              // Pass 'auto' to force detection since user might have typed wrong language in this tab
                              handleTranslateDescription('auto' as any, text);
                            }}
                          >
                            <SparklesIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                  {/* Keep main description hidden as it's synced with ES but needed for schema/legacy */}
                  <input type="hidden" {...register('description')} />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip">PLZ (Zip)</Label>
                    <Input id="zip" {...register('zip')} placeholder="20095" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Stadt (City)</Label>
                    <Input id="city" {...register('city')} placeholder="Hamburg" />
                    {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Stadtteil (Neighborhood)</Label>
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
                              <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  ) : (
                    <Input id="neighborhood" {...register('neighborhood')} placeholder="e.g. Altona, Mitte..." />
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

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {t('businesses.fields.email')}
                  </Label>
                  <Input
                    id="email"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Image URL */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="imageUrl">
                    {t('businesses.fields.logoUrl')}
                  </Label>
                  {/* Enhanced Logo Upload Area */}
                  <div className="rounded-lg border bg-blue-50/50 p-4">
                    <div className="mb-4 flex flex-wrap items-center gap-4">
                      {/* Input File Hidden */}
                      <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />

                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200"
                        >
                          {isUploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {t('businesses.edit.logo.upload', 'Sube tu logo')}
                        </Button>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">{t('businesses.edit.logo.or', 'O')}</p>
                        <Button
                          type="button"
                          variant="secondary"
                          className="bg-white hover:bg-slate-50 border"
                          onClick={() => setValue('imageUrl', 'https://dicilo.net/logo.png', { shouldValidate: true, shouldDirty: true })}
                        >
                          <div className="flex items-center gap-2">
                            <span>{t('businesses.edit.logo.useStandard', 'Agrega Estándar')}</span>
                            <Image src="/logo.png" width={20} height={20} alt="Dicilo" />
                          </div>
                        </Button>
                      </div>

                      {/* Preview */}
                      <div className="flex-1 flex justify-center">
                        {isValidUrl(imageUrl) ? (
                          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-sm bg-white">
                            <Image
                              src={imageUrl!}
                              alt="Logo preview"
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-blue-200 bg-white text-blue-200">
                            <span className="text-xs">{t('businesses.edit.logo.noLogo', 'Sin Logo')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Label htmlFor="imageUrl" className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('businesses.edit.logo.pasteUrl', 'O pega una URL pública:')}
                    </Label>
                    <Input
                      id="imageUrl"
                      {...register('imageUrl')}
                      placeholder="https://..."
                      className={cn("bg-white", errors.imageUrl ? 'border-destructive' : '')}
                    />
                    {errors.imageUrl && (
                      <p className="mt-1 text-sm text-destructive">
                        {errors.imageUrl.message}
                      </p>
                    )}
                  </div>
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
                        {t('businesses.edit.updateToClient')}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handlePromote('starter')}
                      >
                        {t('businesses.edit.asStarter')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePromote('retailer')}
                      >
                        {t('businesses.edit.asRetailer')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePromote('premium')}
                      >
                        {t('businesses.edit.asPremium')}
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
                  description: getValues('description'),
                  imageUrl: getValues('imageUrl') || '',
                  imageHint: getValues('imageHint') || '',
                  location: getValues('location') || '',
                  email: getValues('email'),
                  address: getValues('address'),
                  phone: getValues('phone'),
                  website: getValues('website'),
                  currentOfferUrl: getValues('currentOfferUrl'),
                  mapUrl: getValues('mapUrl'),
                },
              ]}
              selectedBusinessId={id}
              onMarkerDragEnd={handleMapDragEnd}

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
