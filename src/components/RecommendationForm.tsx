'use client';
import { CityCombobox } from './CityCombobox';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, Camera, X, Film, Loader2, PlusCircle, Building2, User, Mail, Phone, Globe, MapPin, Tag, Share2, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { compressVideo } from '@/lib/video-utils';
import { Progress } from '@/components/ui/progress';
import imageCompression from 'browser-image-compression';
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

import { cn } from "@/lib/utils";
import React, { useState, useEffect, useMemo } from 'react';
import { submitRecommendation } from '@/app/actions/recommendations';
import { getPrivateProfile } from '@/app/actions/user-profile';
import { useTranslation } from 'react-i18next';
import { Label } from './ui/label';
import { Badge } from '@/components/ui/badge';
import { Country, City } from 'country-state-city';
import { useAuth } from '@/context/AuthContext';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import esLocale from 'i18n-iso-countries/langs/es.json';
import deLocale from 'i18n-iso-countries/langs/de.json';

countries.registerLocale(enLocale);
countries.registerLocale(esLocale);
countries.registerLocale(deLocale);

// Schema
const formSchema = z.object({
  companyName: z.string().min(2, 'companyNameRequired'),
  contactFirstName: z.string().min(1, 'required'),
  contactLastName: z.string().min(1, 'required'),
  email: z.string().email('invalidEmail').optional().or(z.literal('')),
  phone: z.string().optional(),
  companyEmail: z.string().email('invalidEmail').optional().or(z.literal('')),
  companyPhone: z.string().optional(),
  country: z.string().min(1, 'required'),
  city: z.string().min(1, 'required'),
  website: z.string().url('invalid_url').optional().or(z.literal('')),
  category: z.string().min(1, 'required'),
  comments: z.string().optional(),
  diciloCode: z.string().optional(), // New
  source: z.string().min(1, 'required'), // New
  neighborhood: z.string().optional(),
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


interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  status?: 'processing' | 'ready' | 'error';
  progress?: number;
  statusText?: string;
}

export function RecommendationFormContent({ initialBusinessName, onSuccess, onCancel }: RecommendationFormContentProps) {
  const { t, i18n } = useTranslation('common');
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [rewardAmount, setRewardAmount] = useState(10);

  const form = useForm<RecommendationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: initialBusinessName || '',
      contactFirstName: '',
      contactLastName: '',
      email: '',
      phone: '',
      companyEmail: '',
      companyPhone: '',
      country: '',
      city: '',
      website: '',
      category: '',
      comments: '',
      diciloCode: '',
      source: '',
      neighborhood: '',
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const itemsToAdd: MediaFile[] = [];

    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const id = nanoid();

      if (!isImage && !isVideo) continue;

      if (isVideo) {
        const needsCompression = file.size > 50 * 1024 * 1024;
        const newItem: MediaFile = {
          id,
          file,
          preview: URL.createObjectURL(file),
          type: 'video',
          status: needsCompression ? 'processing' : 'ready',
          progress: 0,
          statusText: needsCompression ? 'Comprimiendo...' : ''
        };
        itemsToAdd.push(newItem);

        if (needsCompression) {
          compressVideo(file, 50, (p) => {
            setMedia(prev => prev.map(item => 
              item.id === id ? { ...item, progress: p.percentage, statusText: p.status } : item
            ));
          }).then(compressedFile => {
            const newPreview = URL.createObjectURL(compressedFile);
            setMedia(prev => prev.map(item => {
              if (item.id === id) {
                if (item.preview) URL.revokeObjectURL(item.preview);
                return { ...item, file: compressedFile, preview: newPreview, status: 'ready', progress: 100, statusText: '' };
              }
              return item;
            }));
          }).catch(error => {
            console.error("Video compression failed:", error);
            setMedia(prev => prev.map(item => 
              item.id === id ? { ...item, status: 'ready', statusText: 'Error en compresión' } : item
            ));
          });
        }
      } else if (isImage) {
        const newItem: MediaFile = {
          id,
          file,
          preview: URL.createObjectURL(file),
          type: 'image',
          status: 'processing',
          progress: 0,
          statusText: 'Comprimiendo...'
        };
        itemsToAdd.push(newItem);

        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: 'image/webp' as any
        };

        imageCompression(file, options).then(compressedFile => {
          const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          const webpFile = new File([compressedFile], fileName, { type: 'image/webp' });
          const newPreview = URL.createObjectURL(webpFile);
          
          setMedia(prev => prev.map(item => {
            if (item.id === id) {
              if (item.preview) URL.revokeObjectURL(item.preview);
              return { ...item, file: webpFile, preview: newPreview, status: 'ready', progress: 100, statusText: '' };
            }
            return item;
          }));
        }).catch(error => {
          console.error("Image compression failed:", error);
          setMedia(prev => prev.map(item => 
            item.id === id ? { ...item, status: 'ready', statusText: '' } : item
          ));
        });
      }
    }

    setMedia(prev => [...prev, ...itemsToAdd]);
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setMedia(prev => {
      const newMedia = [...prev];
      URL.revokeObjectURL(newMedia[index].preview);
      newMedia.splice(index, 1);
      return newMedia;
    });
  };

  const onSubmit = async (values: RecommendationFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const countryData = Country.getCountryByCode(values.country);
      formData.set('country', countryData ? countryData.name : values.country);
      formData.append('countryCode', values.country);
      if (user?.uid) formData.append('userId', user.uid);

      media.forEach(m => {
        formData.append('media', m.file);
      });

      formData.append('rewardAmount', rewardAmount.toString());
      formData.append('lang', i18n.language.split('-')[0] || 'es');
      
      const freelancerName = userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() : '';
      if (freelancerName) {
        formData.append('referrerName', freelancerName);
      }

      const result = await submitRecommendation(formData);

      if (!result.success) throw new Error(result.error);
      
      toast({
        title: t('form.successTitle'),
        description: t('form.successDesc'),
      });

      media.forEach(m => URL.revokeObjectURL(m.preview));
      setMedia([]);
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error sending recommendation:', error);
      toast({
        title: t('form.errorTitle'),
        description: error.message || t('form.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCountry = form.watch('country');
  
  const allCountries = useMemo(() => {
    const lang = i18n.language.split('-')[0] || 'es';
    return Country.getAllCountries().map(c => ({
      ...c,
      localizedName: countries.getName(c.isoCode, lang, { select: 'official' }) || c.name
    })).sort((a, b) => a.localizedName.localeCompare(b.localizedName));
  }, [i18n.language]);


  const cities = useMemo(() => {
    if (!selectedCountry) return [];
    return City.getCitiesOfCountry(selectedCountry) || [];
  }, [selectedCountry]);

  useEffect(() => {
    async function loadUserProfile() {
      if (user?.uid) {
        const result = await getPrivateProfile(user.uid);
        if (result.success && result.profile) {
          const profile = result.profile;
          setUserProfile(profile);
          
          // Pre-fill form if not already filled or if initialBusinessName
          if (profile.firstName) {
            form.setValue('contactFirstName', profile.firstName);
          }
          if (profile.lastName) {
            form.setValue('contactLastName', profile.lastName);
          }
          if (profile.email) {
            form.setValue('email', profile.email);
          }
          if (profile.phone) {
            form.setValue('phone', profile.phone);
          }
          if (profile.uniqueCode) {
            form.setValue('diciloCode', profile.uniqueCode);
          }
        }
      }
    }
    loadUserProfile();
  }, [user?.uid, form]);

  useEffect(() => {
    form.setValue('city', '');
  }, [selectedCountry, form]);

  useEffect(() => {
    if (initialBusinessName) {
      form.setValue('companyName', initialBusinessName);
    }
  }, [initialBusinessName, form]);

  // Data Protection Logic
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty || media.length > 0) {
        const msg = t('form.confirmCancel', 'Tienes cambios sin enviar. ¿Seguro que quieres salir?');
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.formState.isDirty, media.length, t]);

  const handleCancelWithConfirm = () => {
    if (!onCancel) return;
    if (form.formState.isDirty || media.length > 0) {
      if (window.confirm(t('form.confirmCancel', 'Tienes cambios sin enviar. ¿Seguro que quieres salir?'))) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
      {/* Media Upload */}
      <div className="space-y-3">
        <Label>{t('community.add_media', 'Agregar Fotos/Vídeos')}</Label>
        <div className="grid grid-cols-3 gap-2">
          {media.map((item, index) => (
            <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group">
              {item.status === 'processing' ? (
                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500 mb-1" />
                  <span className="text-[8px] text-center text-slate-500 font-medium">{item.statusText}</span>
                  {item.progress !== undefined && item.progress > 0 && (
                    <Progress value={item.progress} className="h-1 mt-1 w-full max-w-[80%]" />
                  )}
                </div>
              ) : item.type === 'image' ? (
                <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200">
                  <Film className="h-8 w-8 text-slate-400" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {media.length < 5 && (
            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all">
              <PlusCircle className="h-6 w-6 text-slate-400" />
              <span className="text-[10px] text-slate-500 mt-1">{t('upload', 'Subir')}</span>
              <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileChange} />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-slate-800">{t('form.companyInfo', 'Información de la Empresa')}</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="companyName" className="flex items-center gap-2">
            {t('form.companyNamePlaceholder')}
          </Label>
          <Input
            id="companyName"
            {...form.register('companyName')}
            className={cn(
              "bg-white transition-all focus:ring-2 focus:ring-purple-400 focus:border-transparent",
              form.formState.errors.companyName ? 'border-destructive' : ''
            )}
            disabled={isSubmitting}
          />
          {form.formState.errors.companyName && (
            <p className="text-sm text-destructive">{t(`form.${form.formState.errors.companyName.message}`)}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-slate-800">{t('form.yourContact', 'Tu Contacto')}</h3>
          </div>
          <div className="flex items-center gap-2">
            {userProfile && (
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t('freelancer.logged_in', 'Freelancer Activo')}
              </Badge>
            )}
            {userProfile?.uniqueCode && (
               <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-[10px]">
                  ID: {userProfile.uniqueCode}
               </Badge>
            )}
          </div>
        </div>

        {/* Contact Name - Split into First and Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactFirstName" className="flex items-center gap-2">
              {t('form.contactFirstNamePlaceholder')}
            </Label>
            <Input
              id="contactFirstName"
              {...form.register('contactFirstName')}
              className={cn(
                "bg-white transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent",
                form.formState.errors.contactFirstName ? 'border-destructive' : ''
              )}
              disabled={isSubmitting}
              placeholder={t('form.contactFirstNamePlaceholder')}
            />
            {form.formState.errors.contactFirstName && (
              <p className="text-sm text-destructive">{t('form.errors.required')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactLastName" className="flex items-center gap-2">
              {t('form.contactLastNamePlaceholder')}
            </Label>
            <Input
              id="contactLastName"
              {...form.register('contactLastName')}
              className={cn(
                "bg-white transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent",
                form.formState.errors.contactLastName ? 'border-destructive' : ''
              )}
              disabled={isSubmitting}
              placeholder={t('form.contactLastNamePlaceholder')}
            />
            {form.formState.errors.contactLastName && (
              <p className="text-sm text-destructive">{t('form.errors.required')}</p>
            )}
          </div>
        </div>

        {/* Email & Phone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {t('form.emailPlaceholder')}
            </Label>
            <Input 
              id="email" 
              {...form.register('email')} 
              type="email" 
              className="bg-white transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              disabled={isSubmitting} 
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{t(`form.${form.formState.errors.email.message}`)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {t('form.phonePlaceholder')}
            </Label>
            <Input 
              id="phone" 
              {...form.register('phone')} 
              type="tel" 
              className="bg-white transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              disabled={isSubmitting} 
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-emerald-500" />
          <h3 className="font-semibold text-slate-800">{t('form.locationInfo', 'Ubicación')}</h3>
        </div>

        {/* Country & City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 flex flex-col">
            <Label htmlFor="country" className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              {t('form.countryPlaceholder')}
            </Label>
            <Controller
              control={form.control}
              name="country"
              render={({ field }) => (
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue("city", ""); // Reset city when country changes
                  }}
                  value={field.value}
                  disabled={isSubmitting}
                >
                  <SelectTrigger 
                    className={cn(
                      "w-full bg-white transition-all hover:bg-slate-50",
                      !field.value && "text-muted-foreground",
                      form.formState.errors.country && "border-destructive"
                    )}
                  >
                    <SelectValue placeholder={t('form.selectOption')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {allCountries.map((country) => (
                      <SelectItem key={country.isoCode} value={country.isoCode}>
                        {country.localizedName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.country && <p className="text-sm text-destructive">{t('form.errors.required')}</p>}
          </div>

          <div className="space-y-2 flex flex-col">
            <Label htmlFor="city" className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {t('form.cityPlaceholder')}
            </Label>
            <Controller
              control={form.control}
              name="city"
              render={({ field }) => (
                <CityCombobox
                  cities={cities}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!selectedCountry || isSubmitting}
                  t={t}
                />
              )}
            />
            {form.formState.errors.city && <p className="text-sm text-destructive">{t('form.errors.required')}</p>}
          </div>

          {/* Neighborhood */}
          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label htmlFor="neighborhood" className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {t('form.neighborhoodPlaceholder')}
            </Label>
            <Input
              id="neighborhood"
              {...form.register('neighborhood')}
              className="bg-white transition-all focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              disabled={isSubmitting}
              placeholder={t('form.neighborhoodHint', 'Ej. Altona, Sternschanze...')}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold text-slate-800">{t('form.additionalInfo')}</h3>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            {t('form.websitePlaceholder')}
          </Label>
          <Input 
            id="website" 
            {...form.register('website')} 
            className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            disabled={isSubmitting} 
          />
          {form.formState.errors.website && <p className="text-sm text-destructive">{t(`form.errors.invalid_url`)}</p>}
        </div>

        {/* Category & Business Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              {t('form.categoryLabel')}
            </Label>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                  <SelectTrigger className={cn(
                    "bg-white transition-all hover:bg-slate-50",
                    form.formState.errors.category ? 'border-destructive' : ''
                  )}>
                    <SelectValue placeholder={t('form.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent className="z-[1001]">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="cursor-pointer">
                        {t(`form.categories.${cat}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.category && <p className="text-sm text-destructive">{t('form.errors.required')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyPhone" className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {t('form.companyPhonePlaceholder')}
            </Label>
            <Input 
              id="companyPhone" 
              {...form.register('companyPhone')} 
              type="tel" 
              className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              disabled={isSubmitting} 
              placeholder={t('form.companyPhonePlaceholder')}
            />
          </div>
        </div>

        {/* Business Email */}
        <div className="space-y-2">
          <Label htmlFor="companyEmail" className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {t('form.companyEmailPlaceholder')}
          </Label>
          <Input 
            id="companyEmail" 
            {...form.register('companyEmail')} 
            type="email" 
            className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            disabled={isSubmitting} 
            placeholder={t('form.companyEmailPlaceholder')}
          />
          {form.formState.errors.companyEmail && (
            <p className="text-sm text-destructive">{t(`form.${form.formState.errors.companyEmail.message}`)}</p>
          )}
        </div>

        {/* Dicilo Code & Source - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="diciloCode" className="flex items-center gap-2">
              <Share2 className="h-3.5 w-3.5 text-slate-400" />
              {t('form.diciloCodePlaceholder')}
            </Label>
            <Input 
              id="diciloCode" 
              {...form.register('diciloCode')} 
              className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              disabled={isSubmitting} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source" className="flex items-center gap-2">
              <Share2 className="h-3.5 w-3.5 text-slate-400" />
              {t('form.sourceLabel')}
            </Label>
            <Controller
              control={form.control}
              name="source"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                  <SelectTrigger className={cn(
                    "bg-white transition-all hover:bg-slate-50",
                    form.formState.errors.source ? 'border-destructive' : ''
                  )}>
                    <SelectValue placeholder={t('form.sourcePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="z-[1001]">
                    {SOURCES.map((source) => (
                      <SelectItem key={source} value={source} className="cursor-pointer">
                        {t(`form.sources.${source}`)}
                      </SelectItem>
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
          <Label htmlFor="comments" className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            {t('form.commentsPlaceholder')}
          </Label>
          <Textarea 
            id="comments" 
            {...form.register('comments')} 
            className="bg-white min-h-[100px] transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            disabled={isSubmitting} 
          />
        </div>

        {/* DP Reward Module (Manual Value) */}
        <div className="pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">{t('form.reward_label', 'Recompensa por envío')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-700">+</span>
                    <Input 
                        type="number" 
                        value={rewardAmount} 
                        onChange={(e) => setRewardAmount(Number(e.target.value) || 0)}
                        className="w-16 h-7 px-1 py-0 text-center bg-white border-purple-200 text-purple-700 font-bold hide-arrows focus:ring-purple-400"
                        min="0"
                    />
                    <span className="text-sm font-bold text-purple-700">DP</span>
                    <span className="text-[10px] text-purple-600/70 font-medium ml-1">por envío</span>
                </div>
            </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            disabled={isSubmitting} 
            onClick={handleCancelWithConfirm}
            className="hover:bg-slate-100"
          >
            {t('cancel')}
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white px-8 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
        >
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
