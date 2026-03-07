'use client';
import { CityCombobox } from './CityCombobox';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, Camera, X, Film, Loader2, PlusCircle } from 'lucide-react';
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
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [media, setMedia] = useState<MediaFile[]>([]);

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
  const countries = Country.getAllCountries();

  const cities = useMemo(() => {
    if (!selectedCountry) return [];
    return City.getCitiesOfCountry(selectedCountry) || [];
  }, [selectedCountry]);

  useEffect(() => {
    form.setValue('city', '');
  }, [selectedCountry, form]);

  useEffect(() => {
    if (initialBusinessName) {
      form.setValue('companyName', initialBusinessName);
    }
  }, [initialBusinessName, form]);

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
        <div className="space-y-2 flex flex-col">
          <Label htmlFor="country">{t('form.countryPlaceholder')}</Label>
          <Controller
            control={form.control}
            name="country"
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground",
                      form.formState.errors.country && "border-destructive"
                    )}
                    disabled={isSubmitting}
                  >
                    {field.value
                      ? countries.find((country) => country.isoCode === field.value)?.name
                      : t('form.selectOption')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder={t('search_country', 'Buscar país...')} />
                    <CommandList>
                      <CommandEmpty>{t('no_results', 'No encontrado.')}</CommandEmpty>
                      <CommandGroup>
                        {countries.map((country) => (
                          <CommandItem
                            value={country.name}
                            key={country.isoCode}
                            onSelect={() => {
                              form.setValue("country", country.isoCode);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                country.isoCode === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {country.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          />
          {form.formState.errors.country && <p className="text-sm text-destructive">{t('form.errors.required')}</p>}
        </div>

        <div className="space-y-2 flex flex-col">
          <Label htmlFor="city">{t('form.cityPlaceholder')}</Label>
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

        {/* Neighborhood (New) */}
        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label htmlFor="neighborhood">{t('form.neighborhoodPlaceholder', 'Barrio / Distrikt (Opcional)')}</Label>
          <Input
            id="neighborhood"
            {...form.register('neighborhood')}
            disabled={isSubmitting}
            placeholder="Ej. Altona, Sternschanze..."
          />
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
