// src/app/admin/clients/[id]/edit/EditClientForm.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  doc,
  updateDoc,
  getFirestore,
  Timestamp,
  getDoc,
  collection,
  getDocs,
  query,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  PlusCircle,
  Trash2,
  Calendar as CalendarIcon,
  UploadCloud,
  Code,
  Send,
  LocateFixed,
  MapPin,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { ClientData } from '@/types/client';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import _ from 'lodash';

const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

const LayoutEditor = dynamic(() => import('@/app/dashboard/LayoutEditor'), {
  ssr: false,
});

import { AdStatistics } from '@/components/dashboard/AdStatistics';
import { WalletCard } from '@/components/dashboard/WalletCard';
import { ClientCouponManager } from '@/components/dashboard/ClientCouponManager';



const functions = getFunctions(app, 'europe-west1');
const submitRecommendationFn = httpsCallable(functions, 'submitRecommendation');

import { InviteFriendSection } from '@/components/dashboard/InviteFriendSection';
import { ensureUniqueCode } from '@/app/actions/profile';

const recipientSchema = z
  .object({
    name: z.string().min(1, 'required'),
    email: z.string().email('invalid_email').optional().or(z.literal('')),
    whatsapp: z.string().optional(),
  })
  .refine((data) => !!data.email || !!data.whatsapp, {
    message: 'email_or_whatsapp_required',
    path: ['email'],
  });

const recommendationFormSchema = z.object({
  recommenderName: z.string().min(1, 'required'),
  recommenderEmail: z.string().email('invalid_email'),
  promoCode: z.string().optional(),
  newsletter: z.enum(['yes', 'no']),
  recommendationMessage: z.string().optional(),
  source: z.string().min(1, 'required'),
  wantsToRecommend: z.enum(['yes', 'no']),
  recipients: z.array(recipientSchema).optional(),
  productRecommendation: z.string().optional(),
  membership: z.enum(['yes', 'no']),
  confirmIndependent: z.boolean().refine((val) => val === true, 'required'),
  consentPrivacy: z.boolean().refine((val) => val === true, 'required'),
});

type RecommendationFormData = z.infer<typeof recommendationFormSchema>;

const RecommendationFormForClient = ({
  products,
  clientId,
}: {
  products: { name: string; id?: string }[];
  clientId: string;
}) => {
  const { t } = useTranslation(['form', 'legal', 'register']);
  const { toast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RecommendationFormData>({
    resolver: zodResolver(recommendationFormSchema),
    defaultValues: {
      recommenderName: '',
      recommenderEmail: '',
      promoCode: '',
      newsletter: 'no',
      recommendationMessage: '',
      source: '',
      wantsToRecommend: 'no',
      recipients: [{ name: '', email: '', whatsapp: '' }],
      productRecommendation: '',
      membership: 'no',
      confirmIndependent: false,
      consentPrivacy: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'recipients',
  });

  const wantsToRecommend = watch('wantsToRecommend');

  const onSubmit = async (data: RecommendationFormData) => {
    try {
      await submitRecommendationFn({
        ...data,
        clientId: clientId,
        lang: 'de', // Assuming a default for now
      });
      toast({
        title: t('form.submit'),
        description: 'Empfehlung erfolgreich versendet!',
      });
      reset(); // Formular nach Erfolg zurücksetzen
    } catch (error: any) {
      console.error('Error submitting recommendation:', error);
      toast({
        title: 'Fehler beim Senden',
        description: error.message || 'Ein unbekannter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-center text-2xl font-bold">{t('form.title')}</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recommenderName">{t('form.name')}</Label>
          <Input
            id="recommenderName"
            {...register('recommenderName')}
            placeholder={t('form.name') as string}
          />
          {errors.recommenderName && (
            <p className="text-sm text-destructive">
              {t(errors.recommenderName.message as any)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="recommenderEmail">{t('form.email')}</Label>
          <Input
            id="recommenderEmail"
            type="email"
            {...register('recommenderEmail')}
            placeholder={t('form.email') as string}
          />
          {errors.recommenderEmail && (
            <p className="text-sm text-destructive">
              {t(errors.recommenderEmail.message as any)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="promoCode">{t('form.promoCode')}</Label>
          <Input
            id="promoCode"
            {...register('promoCode')}
            placeholder={t('form.promoCode') as string}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newsletterSelect">{t('form.newsletter.label')}</Label>
          <Controller
            name="newsletter"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="newsletterSelect">
                  <SelectValue placeholder={t('form.newsletter.label')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">
                    {t('form.newsletter.yes')}
                  </SelectItem>
                  <SelectItem value="no">{t('form.newsletter.no')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recommendationMessage">
          {t('form.recommendation.label')}
        </Label>
        <Textarea
          id="recommendationMessage"
          {...register('recommendationMessage')}
          placeholder={t('form.recommendation.labelPlaceholder') as string}
          rows={3}
        />
      </div>

      <div className="rounded bg-gray-100 p-3 text-sm text-gray-600">
        {t('form.infoText')}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="source">{t('form.source.label')}</Label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="source">
                  <SelectValue placeholder={t('form.source.label')} />
                </SelectTrigger>
                <SelectContent>
                  {[
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
                    'other',
                  ].map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {t(`form.source.${opt}`)}
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
        <div className="space-y-2">
          <Label htmlFor="refer-select">{t('form.refer.label')}</Label>
          <Controller
            name="wantsToRecommend"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="refer-select">
                  <SelectValue placeholder={t('form.refer.label')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t('form.refer.yes')}</SelectItem>
                  <SelectItem value="no">{t('form.refer.no')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {wantsToRecommend === 'yes' && (
        <div className="space-y-4 border-t pt-4 duration-300 animate-in fade-in-50">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            <h4 className="mb-2 font-bold">{t('form.inviteInfoTitle')}</h4>
            <p>{t('form.communityText')}</p>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="relative flex items-end gap-2 rounded-lg border bg-secondary/50 p-3"
            >
              <div className="grid flex-grow grid-cols-1 gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={`recipientName-${index}`}>
                    {t('form.recipient.name')}
                  </Label>
                  <Input
                    id={`recipientName-${index}`}
                    {...register(`recipients.${index}.name`)}
                    placeholder={t('form.recipient.name') as string}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`recipientEmail-${index}`}>
                      {t('form.recipient.email')}
                    </Label>
                    <Input
                      id={`recipientEmail-${index}`}
                      {...register(`recipients.${index}.email`)}
                      type="email"
                      placeholder={t('form.recipient.email') as string}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`recipientWhatsapp-${index}`}>
                      {t('form.recipient.whatsapp')}
                    </Label>
                    <Input
                      id={`recipientWhatsapp-${index}`}
                      {...register(`recipients.${index}.whatsapp`)}
                      placeholder={t('form.recipient.whatsapp') as string}
                    />
                  </div>
                </div>
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
              {errors.recipients?.[index] && (
                <p className="mt-2 text-sm text-destructive">
                  {t(
                    (errors.recipients?.[index]?.root?.message as any) ||
                    (errors.recipients?.[index]?.name?.message as any) ||
                    (errors.recipients?.[index]?.email?.message as any)
                  )}
                </p>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ name: '', email: '', whatsapp: '' })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('form.recipient.add')}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="product-recommendation">
          {t('form.productRecommendation.label')}
        </Label>
        <Controller
          name="productRecommendation"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="product-recommendation">
                <SelectValue
                  placeholder={t('form.productRecommendation.placeholder')}
                />
              </SelectTrigger>
              <SelectContent>
                {products.length > 0 ? (
                  products.map((product, index) => (
                    <SelectItem key={product.id || index} value={product.name}>
                      {product.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-products" disabled>
                    No hay productos disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2 pt-4">
        <Label>{t('form.membership.label')}</Label>
        <Controller
          name="membership"
          control={control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="member-yes" />
                <Label htmlFor="member-yes">{t('form.membership.yes')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="member-no" />
                <Label htmlFor="member-no">{t('form.membership.no')}</Label>
              </div>
            </RadioGroup>
          )}
        />
        {errors.membership && (
          <p className="text-sm text-destructive">
            {t(errors.membership.message as any)}
          </p>
        )}
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">{t('form.privacyTitle')}</h3>
        <Controller
          name="confirmIndependent"
          control={control}
          render={({ field }) => (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="confirmIndependent"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label
                htmlFor="confirmIndependent"
                className={cn(
                  'text-xs text-muted-foreground',
                  errors.confirmIndependent && 'text-destructive'
                )}
              >
                {t('legal:no_mass_email_form')}
              </Label>
            </div>
          )}
        />
        {errors.confirmIndependent && (
          <p className="text-sm text-destructive">
            {t(errors.confirmIndependent.message as any)}
          </p>
        )}

        <Controller
          name="consentPrivacy"
          control={control}
          render={({ field }) => (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="consentPrivacy"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label
                htmlFor="consentPrivacy"
                className={cn(
                  'text-xs text-muted-foreground',
                  errors.consentPrivacy && 'text-destructive'
                )}
              >
                {t('legal:privacy')}
              </Label>
            </div>
          )}
        />
        {errors.consentPrivacy && (
          <p className="text-sm text-destructive">
            {t(errors.consentPrivacy.message as any)}
          </p>
        )}
      </div>

      <div className="rounded bg-gray-100 p-3 text-center text-sm text-gray-500">
        {t('form.captcha.placeholder')}
      </div>

      <div className="flex flex-col gap-4">
        <Button
          type="submit"
          className="w-full py-6 text-lg font-bold"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Send className="mr-2 h-4 w-4" /> {t('form.submit')}
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/registrieren">{t('register:options.private')}</Link>
        </Button>
      </div>
    </form>
  );
};

const marqueeHeaderSchema = z
  .object({
    enabled: z.boolean().default(true),
    offerEnabled: z.boolean().default(false),
    offerEndDate: z.date().optional().nullable(),
    leftButtonText: z.string().optional(),
    leftButtonLink: z.string().url().optional().or(z.literal('')),
    middleText: z.string().optional(),
    clubButtonText: z.string().optional(),
    clubButtonLink: z.string().url().optional().or(z.literal('')),
    marqueeText: z.string().optional(),
    rightButton1Text: z.string().optional(),
    rightButton1Link: z.string().url().optional().or(z.literal('')),
    rightButton2Text: z.string().optional(),
    rightButton2Link: z.string().url().optional().or(z.literal('')),
  })
  .optional();

const bodySchema = z
  .object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    imageHint: z.string().optional(),
    videoUrl: z.string().url().optional().or(z.literal('')),
    ctaButtonText: z.string().optional(),
    ctaButtonLink: z.string().url().optional().or(z.literal('')),
    layout: z.enum(['image-left', 'image-right']).optional(),
    body2BackgroundColor: z.string().optional(),
  })
  .optional();

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre del producto es obligatorio.'),
  price: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

const graphicSchema = z.object({
  imageUrl: z
    .string()
    .url({ message: 'URL de imagen no válida' })
    .optional()
    .or(z.literal('')),
  targetUrl: z
    .string()
    .url({ message: 'URL de destino no válida' })
    .optional()
    .or(z.literal('')),
  text: z.string().optional(),
});

const clientSchema = z.object({
  clientName: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  clientType: z.enum(['retailer', 'premium', 'starter']).optional().or(z.literal('')),
  clientLogoUrl: z.string().url().optional().or(z.literal('')),

  headerData: z
    .object({
      welcomeText: z.string().optional(),
      headerImageUrl: z.string().url().optional().or(z.literal('')),
      socialShareText: z.string().optional(),
      socialLinks: z
        .array(
          z.object({
            icon: z.string().optional(),
            url: z
              .string()
              .url({ message: 'URL no válida' })
              .optional()
              .or(z.literal('')),
          })
        )
        .optional(),
      headerBackgroundColor: z.string().optional(),
      headerBackgroundImageUrl: z.string().url().optional().or(z.literal('')),
      clientLogoWidth: z.coerce.number().optional(),
      headerTextColor: z.string().optional(),
      dividerLine: z
        .object({
          enabled: z.boolean().default(false),
          color: z.string().optional(),
          thickness: z.coerce.number().min(1).optional(),
        })
        .optional(),
      bannerType: z
        .enum(['embed', 'url', 'upload'])
        .optional()
        .default('embed'),
      bannerEmbedCode: z.string().optional(),
      bannerImageUrl: z.string().url().optional().or(z.literal('')),
      bannerImageWidth: z.coerce.number().optional(),
      bannerImageHeight: z.coerce.number().optional(),
      bannerShareUrl: z.string().url().optional().or(z.literal('')),
    })
    .optional(),

  marqueeHeaderData: marqueeHeaderSchema,
  bodyData: bodySchema,
  infoCards: z
    .array(
      z.object({
        title: z.string().optional(),
        content: z.string().optional(),
      })
    )
    .optional(),
  graphics: z.array(graphicSchema).optional(),
  products: z.array(productSchema).optional(),
  translations: z.string().optional(),
  layout: z.array(z.any()).optional(),
  newEmailForUpdate: z.string().email().optional().or(z.literal('')),
  ownerUid: z.string().optional(),
  galleryImages: z.array(z.string()).optional(),
  budget_remaining: z.number().optional().default(0),
  total_invested: z.number().optional().default(0),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  visibility_settings: z.object({
    active_range: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.enum(['local', 'regional', 'national', 'continental', 'international']).default('national')
    ),
    geo_coordinates: z.object({ lat: z.number(), lng: z.number() }).nullish(), // Allow null or undefined
    allowed_continents: z.array(z.string()).nullish(), // Allow null or undefined
  }).nullish(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface EditClientFormProps {
  initialData: ClientData;
}

export default function EditClientForm({ initialData }: EditClientFormProps) {
  const { t, i18n } = useTranslation(['admin', 'form', 'legal', 'register', 'client', 'common']);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const router = useRouter();
  const id = initialData.id;
  const { toast } = useToast();
  const currentLang = (i18n.language?.split('-')[0] || 'de') as 'de' | 'en' | 'es';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [embedCode, setEmbedCode] = useState('');
  const [uniqueCode, setUniqueCode] = useState<string>('');

  // Fetch unique code for invite section
  useEffect(() => {
    const fetchCode = async () => {
      const auth = getAuth(app);
      const uid = initialData.ownerUid || auth.currentUser?.uid;
      if (uid) {
        const result = await ensureUniqueCode(uid);
        if (result.success && result.uniqueCode) {
          setUniqueCode(result.uniqueCode);
        }
      }
    };
    fetchCode();
  }, [initialData.ownerUid]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'));
        const snap = await getDocs(q);
        const cats: any[] = [];
        snap.forEach((d) => cats.push({ id: d.id, ...d.data() }));

        cats.sort((a, b) => {
          const nameA = a.name?.[currentLang] || a.name?.de || '';
          const nameB = b.name?.[currentLang] || b.name?.de || '';
          return nameA.localeCompare(nameB);
        });

        setCategories(cats);
      } catch (e) {
        console.error('Error fetching categories:', e);
      }
    };
    fetchCategories();
  }, [db, currentLang]);

  const handleGeocode = async (addressToGeocode: string) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          addressToGeocode
        )}&format=json&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        setValue('coordinates.lat', newLat, { shouldDirty: true, shouldValidate: true });
        setValue('coordinates.lng', newLng, { shouldDirty: true, shouldValidate: true });

        toast({
          title: "Geocoding Successful",
          description: `Coordinates found: ${newLat}, ${newLng}`,
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "Could not find coordinates for this address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Geocoding Error",
        description: "Failed to connect to geocoding service.",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEmbedCode(
        `<iframe src="${window.location.origin}/forms/embed/${id}" width="100%" height="800px" style="border:none;"></iframe>`
      );
    }
  }, [id]);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    shouldUnregister: false,
    defaultValues: {
      clientName: '',
      slug: '',
      clientType: 'retailer',
      clientLogoUrl: '',
      headerData: {
        welcomeText: '',
        headerImageUrl: '',
        socialShareText: '',
        socialLinks: Array(6).fill({ icon: '', url: '' }),
        headerBackgroundColor: '',
        headerBackgroundImageUrl: '',
        clientLogoWidth: 80,
        headerTextColor: '#000000',
        dividerLine: {
          enabled: false,
          color: '#FFFFFF',
          thickness: 2,
        },
        bannerType: 'embed',
        bannerEmbedCode: '',
        bannerImageUrl: '',
        bannerImageWidth: 0,
        bannerImageHeight: 0,
        bannerShareUrl: '',
      },
      marqueeHeaderData: {
        enabled: true,
        offerEnabled: false,
        offerEndDate: null,
        leftButtonText: '',
        leftButtonLink: '',
        middleText: '',
        clubButtonText: '',
        clubButtonLink: '',
        marqueeText: '',
        rightButton1Text: '',
        rightButton1Link: '',
        rightButton2Text: '',
        rightButton2Link: '',
      },
      bodyData: {
        title: '',
        subtitle: '',
        description: '',
        imageUrl: '',
        imageHint: '',
        videoUrl: '',
        ctaButtonText: '',
        ctaButtonLink: '',
        layout: 'image-left',
        body2BackgroundColor: '#002B36',
      },
      infoCards: [],
      graphics: [],
      products: [],
      translations: '{}',
      layout: initialData.layout || [],
      newEmailForUpdate: '',
      ownerUid: initialData.ownerUid || '',
      galleryImages: [],
      budget_remaining: initialData.budget_remaining || 0,
      total_invested: initialData.total_invested || 0,
      address: initialData.address || '',
      phone: initialData.phone || '',
      website: initialData.website || '',
      email: initialData.email || '',
      coordinates: initialData.coordinates || { lat: 0, lng: 0 },
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState,
    reset,
    watch,
    setValue,
    getValues,
  } = form;

  /*
   * We already have a state variable `isSubmitting` defined above with useState.
   * So we only destructure `errors` from formState here to avoid conflict.
   */
  const { errors } = formState;

  // Debug: Log validation errors to console
  if (Object.keys(errors).length > 0) {
    console.error('Form Validation Errors:', errors);
  }


  const preparedData = useMemo(() => {
    const data = initialData || {};
    const headerData = data.headerData || {};
    const marqueeData = data.marqueeHeaderData || { enabled: true };
    const bodyData = data.bodyData || {};
    const socialLinks = headerData.socialLinks || [];

    // Ensure clientType is valid
    // Force Premium for specific IDs to repair visibility issues
    let forcedType = initialData.clientType;
    if (initialData.id === 'E6IUdKlV5OMlv2DWlNxE' || initialData.id === 'Qt9u8Pd1Qi52AM0no2uw') {
      forcedType = 'premium';
    }

    const validClientType = (['retailer', 'premium', 'starter'].includes(forcedType)
      ? forcedType
      : 'retailer') as 'retailer' | 'premium' | 'starter';

    return {
      clientName: initialData.clientName || '',
      slug: initialData.slug || '',
      category: initialData.category || '',
      subcategory: initialData.subcategory || '',
      clientType: validClientType,
      clientLogoUrl: data.clientLogoUrl || '',
      headerData: {
        welcomeText: headerData.welcomeText || '',
        headerImageUrl: headerData.headerImageUrl || '',
        socialShareText: headerData.socialShareText || '',
        socialLinks: [
          ...socialLinks,
          ...Array(Math.max(0, 6 - socialLinks.length)).fill({
            icon: '',
            url: '',
          }),
        ],
        headerBackgroundColor: headerData.headerBackgroundColor || '',
        headerBackgroundImageUrl: headerData.headerBackgroundImageUrl || '',
        clientLogoWidth:
          typeof headerData.clientLogoWidth === 'number'
            ? headerData.clientLogoWidth
            : 80,
        headerTextColor: headerData.headerTextColor || '#000000',
        dividerLine: {
          enabled: headerData.dividerLine?.enabled ?? false,
          color: headerData.dividerLine?.color || '#FFFFFF',
          thickness:
            typeof headerData.dividerLine?.thickness === 'number'
              ? headerData.dividerLine.thickness
              : 2,
        },
        bannerType: (headerData.bannerType as 'embed' | 'url' | 'upload') || 'embed',
        bannerEmbedCode: headerData.bannerEmbedCode || '',
        bannerImageUrl: headerData.bannerImageUrl || '',
        bannerImageWidth:
          typeof headerData.bannerImageWidth === 'number'
            ? headerData.bannerImageWidth
            : 0,
        bannerImageHeight:
          typeof headerData.bannerImageHeight === 'number'
            ? headerData.bannerImageHeight
            : 0,
        bannerShareUrl: headerData.bannerShareUrl || '',
      },
      marqueeHeaderData: {
        enabled: marqueeData.enabled ?? false,
        offerEnabled: marqueeData.offerEnabled ?? false,
        offerEndDate: marqueeData.offerEndDate
          ? typeof marqueeData.offerEndDate === 'string'
            ? parseISO(marqueeData.offerEndDate)
            : new Date((marqueeData.offerEndDate as any).seconds * 1000)
          : null,
        leftButtonText: marqueeData.leftButtonText || '',
        leftButtonLink: marqueeData.leftButtonLink || '',
        middleText: marqueeData.middleText || '',
        clubButtonText: marqueeData.clubButtonText || '',
        clubButtonLink: marqueeData.clubButtonLink || '',
        marqueeText: marqueeData.marqueeText || '',
        rightButton1Text: marqueeData.rightButton1Text || '',
        rightButton1Link: marqueeData.rightButton1Link || '',
        rightButton2Text: marqueeData.rightButton2Text || '',
        rightButton2Link: marqueeData.rightButton2Link || '',
      },
      bodyData: {
        title: bodyData.title || '',
        subtitle: bodyData.subtitle || '',
        description: bodyData.description || '',
        imageUrl: bodyData.imageUrl || '',
        imageHint: bodyData.imageHint || '',
        videoUrl: bodyData.videoUrl || '',
        ctaButtonText: bodyData.ctaButtonText || '',
        ctaButtonLink: bodyData.ctaButtonLink || '',
        layout: bodyData.layout || 'image-right',
        body2BackgroundColor: bodyData.body2BackgroundColor || '',
      },
      infoCards: data.infoCards || [],
      graphics: data.graphics || [],
      products: data.products || [],
      translations: data.translations
        ? JSON.stringify(data.translations, null, 2)
        : '{}',
      layout: data.layout || [],
      galleryImages: data.galleryImages || [],
      ownerUid: data.ownerUid || '',
      budget_remaining: data.budget_remaining || 0,
      total_invested: data.total_invested || 0,
      address: data.address || '',
      phone: data.phone || '',
      website: data.website || '',
      email: data.email || '',
      coordinates: data.coordinates || { lat: 40.4168, lng: -3.7038 },
      visibility_settings: {
        active_range: data.visibility_settings?.active_range || 'national',
        geo_coordinates: data.visibility_settings?.geo_coordinates,
        allowed_continents: data.visibility_settings?.allowed_continents || [],
      },
    };
  }, [initialData]);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset(preparedData);
    }
  }, [preparedData, reset, initialData]);

  const { fields: socialLinkFields } = useFieldArray({
    control,
    name: 'headerData.socialLinks',
  });
  const {
    fields: infoCardFields,
    append: appendInfoCard,
    remove: removeInfoCard,
  } = useFieldArray({ control, name: 'infoCards' });
  const {
    fields: graphicsFields,
    append: appendGraphic,
    remove: removeGraphic,
  } = useFieldArray({ control, name: 'graphics' });
  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({ control, name: 'products' });

  const clientType = watch('clientType');
  const selectedCategory = watch('category');
  const bannerType = watch('headerData.bannerType');

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    try {
      const storageRef = ref(storage, `client-banners/${id}/${file.name}`);
      const uploadTask = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });

      const downloadURL = await getDownloadURL(uploadTask.ref);

      const currentWidth = watch('headerData.bannerImageWidth');
      const currentHeight = watch('headerData.bannerImageHeight');

      setValue(
        'headerData',
        {
          ...watch('headerData'),
          bannerImageUrl: downloadURL,
          bannerImageWidth: currentWidth,
          bannerImageHeight: currentHeight,
          bannerType: watch('headerData.bannerType') || 'embed',
        },
        { shouldValidate: true, shouldDirty: true }
      );

      toast({
        title: 'Upload successful',
        description: 'Banner image has been uploaded.',
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      let description = 'Could not upload the banner image.';
      if (error.code === 'storage/retry-limit-exceeded') {
        description =
          'Upload failed. Please check your internet connection and try again.';
      }
      toast({ title: 'Upload failed', description, variant: 'destructive' });
    } finally {
      setUploadProgress(null);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'clients', id);

      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Client document not found.');
      }
      const originalData = docSnap.data();

      // Create a deep clone to safely modify before merging.
      const newData = _.cloneDeep(data);

      // Safely parse translations from string to object
      const safeJsonParse = (jsonString: string | undefined) => {
        if (!jsonString || jsonString.trim() === '') return {};
        try {
          return JSON.parse(jsonString);
        } catch (e) {
          toast({
            title: `Error de formato en Traducciones`,
            variant: 'destructive',
          });
          throw new Error(`Invalid JSON in translations`);
        }
      };

      if (typeof newData.translations === 'string') {
        (newData.translations as any) = safeJsonParse(newData.translations);
      }

      // Explicitly convert Date object to Firestore Timestamp before merging
      if (newData.marqueeHeaderData?.offerEndDate instanceof Date) {
        (newData.marqueeHeaderData.offerEndDate as any) = Timestamp.fromDate(
          newData.marqueeHeaderData.offerEndDate
        );
      }

      // Clean up arrays
      newData.infoCards =
        newData.infoCards?.filter(
          (card) => card && (card.title || card.content)
        ) || [];
      newData.graphics =
        newData.graphics?.filter(
          (g) => g && (g.imageUrl || g.targetUrl || g.text)
        ) || [];
      newData.products = newData.products?.filter((p) => p && p.name) || [];
      if (newData.headerData) {
        newData.headerData.socialLinks =
          newData.headerData.socialLinks?.filter(
            (link) => link && (link.icon || link.url)
          ) || [];
      }

      // Sanitize visibility_settings to avoid undefined values (Firestore error)
      if (newData.visibility_settings) {
        if (newData.visibility_settings.geo_coordinates === undefined) {
          // Default to null if not present, so Firestore doesn't reject it
          // Or if coordinates exist, try to sync?
          // For now, null to be safe.
          newData.visibility_settings.geo_coordinates = null;
        }
        // Also allowed_continents
        if (newData.visibility_settings.allowed_continents === undefined) {
          newData.visibility_settings.allowed_continents = [];
        }
      }

      const finalPayload = _.merge({}, originalData, newData);

      // Explicitly set wallet values from form data to ensure they are not lost in merge
      // especially if they are 0 or if originalData has them as undefined
      finalPayload.budget_remaining = data.budget_remaining;
      finalPayload.total_invested = data.total_invested;
      finalPayload.clientType = data.clientType;

      // Wrap updateDoc in a timeout to prevent infinite hanging
      const updatePromise = updateDoc(docRef, finalPayload);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: Saving took too long. Please check your connection.')), 15000)
      );

      await Promise.race([updatePromise, timeoutPromise]);

      toast({
        title: 'Cambios guardados',
        description: 'El cliente ha sido actualizado exitosamente.',
      });
      router.push('/admin/clients');
    } catch (error) {
      console.error('Error saving client:', error);
      if (
        !(error instanceof Error && error.message.startsWith('Invalid JSON'))
      ) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast({
          title: 'Error al guardar',
          description: `Error: ${errorMessage}.`,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.error("DEBUG: handleSubmit Validation Errors:", errors);
          toast({
            title: "Error de Validación",
            description: "Por favor revisa los campos en rojo. Ver consola para más detalles.",
            variant: "destructive"
          });
        })}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{watch('clientName') || 'Edit Client'}</CardTitle>
                {clientType && (
                  <Badge
                    className={cn('px-4 py-1.5 text-base', {
                      'bg-green-600 text-white hover:bg-green-700':
                        clientType === 'retailer',
                      'bg-blue-600 text-white hover:bg-blue-700':
                        clientType === 'premium',
                    })}
                  >
                    {clientType.charAt(0).toUpperCase() + clientType.slice(1)}
                  </Badge>
                )}
              </div>
              <CardDescription>
                {t('clients.edit.cardDescription', { clientId: id })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="flex w-full justify-start overflow-x-auto overflow-y-hidden text-nowrap">
                  <TabsTrigger value="general">{t('clients.tabs.general')}</TabsTrigger>
                  <TabsTrigger value="marqueeHeader">
                    {t('clients.tabs.marqueeHeader')}
                  </TabsTrigger>
                  <TabsTrigger value="body">{t('clients.tabs.body')}</TabsTrigger>
                  <TabsTrigger value="cards">{t('clients.tabs.infoCards')}</TabsTrigger>
                  <TabsTrigger value="products">{t('clients.tabs.products')}</TabsTrigger>
                  <TabsTrigger value="graphics">{t('clients.tabs.graphics')}</TabsTrigger>
                  <TabsTrigger value="layout">
                    Page Editor
                  </TabsTrigger>
                  <TabsTrigger value="userManagement">
                    User Management
                  </TabsTrigger>
                  <TabsTrigger value="form">{t('clients.tabs.form')}</TabsTrigger>
                  <TabsTrigger value="stats">{t('adStats.title', 'Statistics')}</TabsTrigger>
                  <TabsTrigger value="wallet" className="text-blue-600 font-bold">Wallet</TabsTrigger>
                  <TabsTrigger value="translations">
                    {t('clients.tabs.translations')}
                  </TabsTrigger>
                  <TabsTrigger value="coupons">{t('clients.tabs.coupons')}</TabsTrigger>
                  <TabsTrigger value="invite" className="text-green-600 font-bold">Invitar Amigos</TabsTrigger>
                </TabsList>



                {/* Global Error Display */}
                {Object.keys(errors).length > 0 && (
                  <div className="mb-6 rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 shadow-sm animate-pulse">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      ❌ Errores de Validación Detectados
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {Object.entries(errors).map(([key, error]) => (
                        <li key={key}>
                          <span className="font-semibold">{key}:</span> {error?.message?.toString() || 'Campo inválido'}
                          {/* Try to show nested errors for arrays/objects */}
                          {typeof error === 'object' && error !== null && (
                            <pre className="mt-1 text-xs bg-red-100 p-1 rounded overflow-x-auto max-w-full">
                              {JSON.stringify(error, null, 2)}
                            </pre>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-sm font-semibold">
                      Por favor corrige estos campos antes de guardar. Revisa todas las pestañas.
                    </p>
                  </div>
                )}

                <TabsContent value="general" className="space-y-6">
                  <CardTitle>{t('clients.tabs.general')}</CardTitle>
                  <CardDescription>
                    {t('clients.fields.general.description')}
                  </CardDescription>

                  <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
                    {/* 1. Client Name (Left) */}
                    <div className="space-y-2">
                      <Label htmlFor="clientName">
                        {t('clients.fields.clientName')}
                      </Label>
                      <Input
                        id="clientName"
                        {...register('clientName')}
                        placeholder={t('clients.fields.clientName') as string}
                      />
                      {errors.clientName && (
                        <p className="text-sm text-destructive">
                          {t(errors.clientName.message as any)}
                        </p>
                      )}
                    </div>

                    {/* 2. Slug (Right) */}
                    <div className="space-y-2">
                      <Label htmlFor="slug">
                        {t('clients.fields.slug')}
                      </Label>
                      <Input
                        id="slug"
                        {...register('slug')}
                        placeholder="my-client-slug"
                      />
                      {errors.slug && (
                        <p className="text-sm text-destructive">
                          {t((errors.slug.message as string) || 'error')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        URL: {typeof window !== 'undefined' ? window.location.origin : ''}/client/{watch('slug')}
                      </p>
                    </div>

                    {/* 3. Address (Left) */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <div className="flex gap-2">
                        <Input id="address" {...register('address')} placeholder="Calle Principal 123, Madrid" />
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isGeocoding}
                          onClick={() => handleGeocode(watch('address') || '')}
                        >
                          {isGeocoding ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                          <span className="ml-2 hidden sm:inline">Locate</span>
                        </Button>
                      </div>
                    </div>

                    {/* 4. Phone (Right) - Moved from bottom */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" {...register('phone')} placeholder="+34 600 000 000" />
                    </div>

                    {/* 5. Description (Left) */}
                    <div className="space-y-2">
                      <Label htmlFor="bodyData.description">
                        Description
                      </Label>
                      <Textarea
                        id="bodyData.description"
                        {...register('bodyData.description')}
                        placeholder="Descripción corta del negocio..."
                        className="h-24"
                      />
                    </div>

                    {/* 6. Coordinates (Right) */}
                    <div className="space-y-2">
                      <Label>Coordinates</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="any"
                          placeholder="Lat"
                          {...register('coordinates.lat', { valueAsNumber: true })}
                        />
                        <Input
                          type="number"
                          step="any"
                          placeholder="Lng"
                          {...register('coordinates.lng', { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    {/* 7. Category (Left) */}
                    <div className="space-y-2">
                      <Label htmlFor="category">
                        {t('admin:clients.fields.category')}
                      </Label>
                      <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              setValue('subcategory', '');
                            }}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  t('admin:clients.fields.category') as string
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name?.[currentLang] || cat.name?.de}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {/* 8. Subcategory (Right) */}
                    <div className="space-y-2">
                      <Label>{t('admin:clients.fields.subcategory')}</Label>
                      <Controller
                        control={control}
                        name="subcategory"
                        render={({ field }) => {
                          const currentCat = categories.find(c => c.id === selectedCategory);
                          const subs = currentCat?.subcategories || [];
                          return (
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory || subs.length === 0}>
                              <SelectTrigger>
                                <SelectValue placeholder={t('admin:clients.fields.subcategory') as string} />
                              </SelectTrigger>
                              <SelectContent>
                                {subs.map((sub: any) => (
                                  <SelectItem key={sub.id} value={sub.id}>
                                    {sub.name?.[currentLang] || sub.name?.de}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        }}
                      />
                    </div>

                    {/* 9. Website (Left) */}
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" {...register('website')} placeholder="https://example.com" />
                    </div>

                    {/* 10. Public Email (Right) */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Public Email</Label>
                      <Input id="email" {...register('email')} placeholder="contact@example.com" />
                    </div>

                    {/* No duplicate Phone field here! */}

                    <div className="space-y-2">
                      <Label htmlFor="budget_remaining">Budget Remaining (EUR)</Label>
                      <Input
                        id="budget_remaining"
                        type="number"
                        step="0.01"
                        {...register('budget_remaining', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use this to manually top-up budget for ads (0.05€ per click).
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="clientLogoUrl">
                        {t('clients.fields.clientLogoUrl')}
                      </Label>
                      <Input id="clientLogoUrl" {...register('clientLogoUrl')} />
                      {errors.clientLogoUrl && (
                        <p className="text-sm text-destructive">
                          {errors.clientLogoUrl.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="headerData.clientLogoWidth">
                        {t('clients.fields.header.clientLogoWidth')}
                      </Label>
                      <Input
                        id="headerData.clientLogoWidth"
                        type="number"
                        {...register('headerData.clientLogoWidth', {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headerData.welcomeText">
                      {t('clients.fields.header.welcomeText')}
                    </Label>
                    <Input
                      id="headerData.welcomeText"
                      {...register('headerData.welcomeText')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headerData.socialShareText">
                      {t('clients.fields.header.socialShareText')}
                    </Label>
                    <Textarea
                      id="headerData.socialShareText"
                      {...register('headerData.socialShareText')}
                      placeholder={
                        t(
                          'clients.fields.header.socialShareTextPlaceholder'
                        ) as string
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headerData.bannerShareUrl">
                      {t('clients.fields.header.bannerShareUrl')}
                    </Label>
                    <Input
                      id="headerData.bannerShareUrl"
                      {...register('headerData.bannerShareUrl')}
                      placeholder="https://example.com/special-offer"
                    />
                  </div>

                  {clientType === 'premium' && (
                    <>
                      <h3 className="pt-4 text-lg font-medium">
                        {t('clients.fields.header.stylesTitle')}
                      </h3>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="headerData.headerBackgroundColor">
                            {t('clients.fields.header.headerBackgroundColor')}
                          </Label>
                          <Input
                            id="headerData.headerBackgroundColor"
                            {...register('headerData.headerBackgroundColor')}
                            placeholder="#FFFFFF"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="headerData.headerTextColor">
                            {t('clients.fields.header.headerTextColor')}
                          </Label>
                          <Input
                            id="headerData.headerTextColor"
                            type="color"
                            {...register('headerData.headerTextColor')}
                            className="h-10 p-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="headerData.headerBackgroundImageUrl">
                          {t('clients.fields.header.headerBackgroundImageUrl')}
                        </Label>
                        <Input
                          id="headerData.headerBackgroundImageUrl"
                          {...register('headerData.headerBackgroundImageUrl')}
                          placeholder="https://example.com/background.jpg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bodyData.body2BackgroundColor">
                          Hintergrundfarbe de body 2
                        </Label>
                        <Input
                          id="bodyData.body2BackgroundColor"
                          {...register('bodyData.body2BackgroundColor')}
                          placeholder="#F9FAFB"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="headerData.headerImageUrl">
                          {t('clients.fields.header.headerImageUrl')}
                        </Label>
                        <Input
                          id="headerData.headerImageUrl"
                          {...register('headerData.headerImageUrl')}
                        />
                        {errors.headerData?.headerImageUrl && (
                          <p className="text-sm text-destructive">
                            {errors.headerData.headerImageUrl.message}
                          </p>
                        )}
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          {t('clients.fields.header.dividerLine.title')}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Controller
                            control={control}
                            name="headerData.dividerLine.enabled"
                            render={({ field }) => (
                              <Switch
                                id="dividerLineEnabled"
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                          <Label htmlFor="dividerLineEnabled">
                            {t('clients.fields.header.dividerLine.enable')}
                          </Label>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="headerData.dividerLine.color">
                              {t('clients.fields.header.dividerLine.color')}
                            </Label>
                            <Controller
                              name="headerData.dividerLine.color"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  id="headerData.dividerLine.color"
                                  type="color"
                                  {...field}
                                  className="h-10 p-1"
                                />
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="headerData.dividerLine.thickness">
                              {t('clients.fields.header.dividerLine.thickness')}
                            </Label>
                            <Input
                              id="headerData.dividerLine.thickness"
                              type="number"
                              {...register('headerData.dividerLine.thickness', {
                                valueAsNumber: true,
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="my-6" />

                      <h3 className="text-lg font-medium">
                        {t('clients.fields.header.socialLinks')}
                      </h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {socialLinkFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="space-y-2 rounded-lg border p-3"
                          >
                            <Label>
                              {t('clients.fields.header.socialLink', {
                                number: index + 1,
                              })}
                            </Label>
                            <Input
                              placeholder={t(
                                'clients.fields.header.iconPlaceholderText'
                              )}
                              {...register(`headerData.socialLinks.${index}.icon`)}
                            />
                            <Input
                              placeholder={t(
                                'clients.fields.header.urlPlaceholder'
                              )}
                              {...register(`headerData.socialLinks.${index}.url`)}
                            />
                            {errors.headerData?.socialLinks?.[index]?.url && (
                              <p className="text-sm text-destructive">
                                {errors.headerData.socialLinks[index]?.url?.message}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          {t('clients.fields.header.banner.title')}
                        </h3>
                        <Controller
                          name="headerData.bannerType"
                          control={control}
                          render={({ field }) => (
                            <RadioGroup
                              value={field.value || 'embed'}
                              onValueChange={field.onChange}
                              className="flex items-center gap-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="embed" id="embed" />
                                <Label htmlFor="embed">
                                  {t('clients.fields.header.banner.embedCode')}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="url" id="url" />
                                <Label htmlFor="url">
                                  {t('clients.fields.header.banner.imageUrl')}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="upload" id="upload" />
                                <Label htmlFor="upload">
                                  {t('clients.fields.header.banner.fileUpload')}
                                </Label>
                              </div>
                            </RadioGroup>
                          )}
                        />
                      </div>

                      {bannerType === 'embed' && (
                        <div className="space-y-2">
                          <Label htmlFor="headerData.bannerEmbedCode">
                            {t('clients.fields.header.banner.embedCode')}
                          </Label>
                          <Textarea
                            id="headerData.bannerEmbedCode"
                            {...register('headerData.bannerEmbedCode')}
                            rows={5}
                            placeholder={'<iframe...'}
                          />
                        </div>
                      )}
                      {(bannerType === 'url' || bannerType === 'upload') && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="headerData.bannerImageUrl">
                              {t('clients.fields.header.banner.imageUrl')}
                            </Label>
                            <Input
                              id="headerData.bannerImageUrl"
                              {...register('headerData.bannerImageUrl')}
                              placeholder="https://example.com/banner.jpg"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="headerData.bannerImageWidth">
                                {t('clients.fields.header.banner.width')}
                              </Label>
                              <div className="flex items-center">
                                <Input
                                  id="headerData.bannerImageWidth"
                                  type="number"
                                  {...register('headerData.bannerImageWidth', {
                                    valueAsNumber: true,
                                  })}
                                  placeholder="100"
                                />
                                <span className="ml-2">%</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="headerData.bannerImageHeight">
                                {t('clients.fields.header.banner.height')}
                              </Label>
                              <div className="flex items-center">
                                <Input
                                  id="headerData.bannerImageHeight"
                                  type="number"
                                  {...register('headerData.bannerImageHeight', {
                                    valueAsNumber: true,
                                  })}
                                  placeholder="400"
                                />
                                <span className="ml-2">px</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {bannerType === 'upload' && (
                        <div className="space-y-2">
                          <Label htmlFor="banner-upload">
                            {t('clients.fields.header.banner.fileUpload')}
                          </Label>
                          <div className="flex items-center gap-4">
                            <Input
                              id="banner-upload"
                              type="file"
                              onChange={handleFileUpload}
                              accept="image/png, image/jpeg, image/gif, image/webp"
                              className="w-full"
                            />
                            {uploadProgress !== null && (
                              <Progress value={uploadProgress} className="w-full" />
                            )}
                          </div>
                          {watch('headerData.bannerImageUrl') && (
                            <p className="text-sm text-muted-foreground">
                              {t('clients.fields.header.banner.currentImage')}:{' '}
                              <a
                                href={watch('headerData.bannerImageUrl')}
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                              >
                                {watch('headerData.bannerImageUrl')}
                              </a>
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* Layout Builder Tab */}
                <TabsContent value="layout" className="space-y-6">
                  <CardTitle>Landing Page Builder</CardTitle>
                  <CardDescription>
                    Drag and drop blocks to build your custom landing page.
                  </CardDescription>

                  {/* Gallery Uploader Section */}
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 text-lg font-semibold">Photo Gallery</h3>
                    <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                      {watch('galleryImages')?.map((url, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden rounded-lg border">
                          <img
                            src={url}
                            alt={`Gallery ${index}`}
                            className="object-cover w-full h-full"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-1 top-1 h-6 w-6"
                            onClick={() => {
                              const currentImages = watch('galleryImages') || [];
                              setValue(
                                'galleryImages',
                                currentImages.filter((_, i) => i !== index),
                                { shouldDirty: true }
                              );
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="mb-3 h-8 w-8 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span>
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;

                            toast({
                              title: 'Subiendo...',
                              description: `Iniciando subida de ${files.length} imágenes. Por favor espere.`,
                            });

                            setIsSubmitting(true);
                            try {
                              const newUrls: string[] = [];
                              for (let i = 0; i < files.length; i++) {
                                const file = files[i];
                                const storageRef = ref(
                                  storage,
                                  `clients/${id}/gallery/${Date.now()}_${file.name}`
                                );
                                await uploadBytes(storageRef, file);
                                const url = await getDownloadURL(storageRef);
                                newUrls.push(url);
                              }
                              const currentImages = watch('galleryImages') || [];
                              setValue('galleryImages', [...currentImages, ...newUrls], {
                                shouldDirty: true,
                              });
                              toast({
                                title: 'Éxito',
                                description: `${newUrls.length} imágenes subidas correctamente.`,
                              });
                            } catch (error: any) {
                              console.error('Error uploading images:', error);
                              toast({
                                title: 'Error al subir',
                                description: `Falló la subida: ${error.message || 'Error desconocido'}`,
                                variant: 'destructive',
                              });
                            } finally {
                              setIsSubmitting(false);
                              // Reset input
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload images for your photo gallery. These will be used in the "Gallery" block.
                    </p>
                  </div>

                  <Separator className="my-6" />
                  <Controller
                    name="layout"
                    control={control}
                    render={({ field }) => (
                      <LayoutEditor
                        initialLayout={field.value || []}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </TabsContent>

                {/* Visibility Settings (Geo Segmentation) */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('clients.fields.visibility_settings.title', 'Visibilidad y Alcance Geográfico')}</CardTitle>
                    <CardDescription>
                      {t('clients.fields.visibility_settings.subtitle', 'Controla dónde es visible tu perfil de negocio.')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('clients.fields.visibility_settings.active_range', 'Rango Activo')}</Label>
                        <Controller
                          control={control}
                          name="visibility_settings.active_range"
                          defaultValue="national"
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || 'national'}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('clients.fields.visibility_settings.active_range', 'Rango Activo')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="local">{t('clients.fields.visibility_settings.ranges.local', 'Local (50km)')}</SelectItem>
                                <SelectItem value="regional">{t('clients.fields.visibility_settings.ranges.regional', 'Regional (Ciudad)')}</SelectItem>
                                <SelectItem value="national">{t('clients.fields.visibility_settings.ranges.national', 'Nacional (País)')}</SelectItem>
                                <SelectItem value="continental">{t('clients.fields.visibility_settings.ranges.continental', 'Continental')}</SelectItem>
                                <SelectItem value="international">{t('clients.fields.visibility_settings.ranges.international', 'Internacional / Global')}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t('clients.fields.visibility_settings.allowed_continents', 'Continentes Permitidos')}</Label>
                        <div className="grid grid-cols-2 gap-2 border p-2 rounded max-h-40 overflow-y-auto">
                          {['Europa', 'Sudamérica', 'Centro América', 'Latinoamérica', 'North America', 'Asia'].map(c => (
                            <div key={c} className="flex items-center space-x-2">
                              <Checkbox
                                checked={watch('visibility_settings.allowed_continents')?.includes(c) || false}
                                onCheckedChange={(checked) => {
                                  const current = watch('visibility_settings.allowed_continents') || [];
                                  if (checked) {
                                    setValue('visibility_settings.allowed_continents', [...current, c]);
                                  } else {
                                    setValue('visibility_settings.allowed_continents', current.filter((x: string) => x !== c));
                                  }
                                }}
                              />
                              <span className="text-sm">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <LocateFixed className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Current Base Location: {watch('coordinates.lat')}, {watch('coordinates.lng')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* --- Section: User Management --- */}

                <TabsContent value="userManagement" className="space-y-6">
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage the user account associated with this client.
                  </CardDescription>

                  <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold">Update Email</h3>
                    <div className="flex gap-4 items-end">
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="newEmail">New Email Address</Label>
                        <Input
                          id="newEmail"
                          placeholder="new-email@example.com"
                          value={watch('newEmailForUpdate') || ''}
                          onChange={(e) => setValue('newEmailForUpdate', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={async () => {
                          const newEmail = watch('newEmailForUpdate');
                          if (!newEmail) return;
                          try {
                            setIsSubmitting(true);
                            const updateUserEmailFn = httpsCallable(functions, 'updateUserEmail');
                            // We need the ownerUid, which should be in initialData
                            const targetUid = initialData.ownerUid;
                            if (!targetUid) {
                              toast({ title: 'Error', description: 'No Owner UID found for this client.', variant: 'destructive' });
                              return;
                            }
                            await updateUserEmailFn({ targetUid, newEmail });
                            toast({ title: 'Success', description: 'Email updated successfully.' });
                            setValue('newEmailForUpdate', '');
                          } catch (error: any) {
                            console.error(error);
                            toast({ title: 'Error', description: error.message, variant: 'destructive' });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        Update Email
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Warning: Changing the email will require the user to login again with the new email.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold">Owner Management</h3>
                    <div className="space-y-2">
                      <Label htmlFor="ownerUid">Owner UID</Label>
                      <div className="flex gap-2">
                        <Input
                          id="ownerUid"
                          {...register('ownerUid')}
                          placeholder="Firebase User UID"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const auth = getAuth(app);
                            if (auth.currentUser) {
                              setValue('ownerUid', auth.currentUser.uid, { shouldDirty: true });
                            } else {
                              toast({ title: 'Error', description: 'No authenticated user found.', variant: 'destructive' });
                            }
                          }}
                        >
                          Assign to Me
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This links the client to a specific user account.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold">Password Reset</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate a password reset link for this user.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          setIsSubmitting(true);
                          const sendUserPasswordResetFn = httpsCallable(functions, 'sendUserPasswordReset');
                          // We need the current email. 
                          // If we don't have it in clientData, we might need to ask for it or fetch it.
                          // Assuming we can use the 'newEmailForUpdate' field if filled, or we need to know the current email.
                          // Actually, the function takes an email. 
                          // Let's ask the admin to enter the email to confirm, or use the one we just updated if any.
                          // Better: Use the input field above or a dedicated one.
                          const emailToReset = watch('newEmailForUpdate');
                          if (!emailToReset) {
                            toast({ title: 'Info', description: 'Please enter the email address in the "New Email Address" box above to target the reset.', variant: 'default' });
                            return;
                          }
                          const result = await sendUserPasswordResetFn({ email: emailToReset });
                          const data = result.data as any;
                          if (data.link) {
                            // Copy to clipboard
                            navigator.clipboard.writeText(data.link);
                            toast({ title: 'Success', description: 'Reset link copied to clipboard!', duration: 5000 });
                          }
                        } catch (error: any) {
                          console.error(error);
                          toast({ title: 'Error', description: error.message, variant: 'destructive' });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      Generate Reset Link
                    </Button>
                  </div>
                </TabsContent>

                {/* Marquee Header Tab */}
                <TabsContent value="marqueeHeader" className="space-y-6">
                  <CardTitle>{t('clients.tabs.marqueeHeader')}</CardTitle>
                  <CardDescription>
                    {t('clients.fields.marqueeHeader.description')}
                  </CardDescription>

                  <div className="space-y-2">
                    <Label>
                      {t('clients.fields.marqueeHeader.marqueeText')}
                    </Label>
                    <Input {...register('marqueeHeaderData.marqueeText')} />
                  </div>
                  <hr />

                  <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
                    <h4 className="font-semibold">
                      {t('clients.fields.marqueeHeader.offerSectionTitle')}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Controller
                        control={control}
                        name="marqueeHeaderData.offerEnabled"
                        render={({ field }) => (
                          <Switch
                            id="offerEnabled"
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor="offerEnabled">
                        {t('clients.fields.marqueeHeader.offerEnabled')}
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t('clients.fields.marqueeHeader.leftButtonText')}
                      </Label>
                      <Input {...register('marqueeHeaderData.leftButtonText')} />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t('clients.fields.marqueeHeader.leftButtonLink')}
                      </Label>
                      <Input {...register('marqueeHeaderData.leftButtonLink')} />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t('clients.fields.marqueeHeader.offerEndDate')}
                      </Label>
                      <Controller
                        control={control}
                        name="marqueeHeaderData.offerEndDate"
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-[280px] justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>
                                    {t(
                                      'clients.fields.marqueeHeader.pickDate'
                                    )}
                                  </span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value ?? undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
                    <div className="space-y-4 rounded-lg border p-4">
                      <h4 className="font-semibold">
                        {t('clients.fields.marqueeHeader.offerSection')}
                      </h4>
                      <div className="space-y-2">
                        <Label>
                          {t(
                            'clients.fields.marqueeHeader.middleTextOffer'
                          )}
                        </Label>
                        <Input {...register('marqueeHeaderData.middleText')} />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {t(
                            'clients.fields.marqueeHeader.buttonAfterDateText'
                          )}
                        </Label>
                        <Input
                          {...register('marqueeHeaderData.clubButtonText')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {t(
                            'clients.fields.marqueeHeader.buttonAfterDateLink'
                          )}
                        </Label>
                        <Input
                          {...register('marqueeHeaderData.clubButtonLink')}
                        />
                      </div>
                    </div>
                    <div className="space-y-4 rounded-lg border p-4">
                      <h4 className="font-semibold">
                        {t(
                          'clients.fields.marqueeHeader.rightButtonsSectionTitle'
                        )}
                      </h4>
                      <div className="space-y-2">
                        <Label>
                          {t(
                            'clients.fields.marqueeHeader.rightButton1Text'
                          )}
                        </Label>
                        <Input
                          {...register('marqueeHeaderData.rightButton1Text')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {t(
                            'clients.fields.marqueeHeader.rightButton1Link'
                          )}
                        </Label>
                        <Input
                          {...register('marqueeHeaderData.rightButton1Link')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {t(
                            'clients.fields.marqueeHeader.rightButton2Text'
                          )}
                        </Label>
                        <Input
                          {...register('marqueeHeaderData.rightButton2Text')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {t(
                            'clients.fields.marqueeHeader.rightButton2Link'
                          )}
                        </Label>
                        <Input
                          {...register('marqueeHeaderData.rightButton2Link')}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="body" className="space-y-6">
                  <CardTitle>{t('clients.tabs.body')}</CardTitle>
                  <CardDescription>
                    {t('clients.fields.body.description')}
                  </CardDescription>

                  <div className="space-y-2">
                    <Label htmlFor="bodyData.title">
                      {t('clients.fields.body.title')}
                    </Label>
                    <Input
                      id="bodyData.title"
                      {...register('bodyData.title')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyData.subtitle">
                      {t('clients.fields.body.subtitle')}
                    </Label>
                    <Input
                      id="bodyData.subtitle"
                      {...register('bodyData.subtitle')}
                    />
                  </div>
                  {/* Note: Description is also in General, but syncs to bodyData.description, so it appears here too. */}
                  <div className="space-y-2">
                    <Label htmlFor="bodyData.description_body">
                      {t('clients.fields.body.description')}
                    </Label>
                    <Textarea
                      id="bodyData.description_body"
                      {...register('bodyData.description')}
                      className="h-32"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyData.layout">
                      {t('clients.fields.body.layout')}
                    </Label>
                    <Controller
                      control={control}
                      name="bodyData.layout"
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('clients.fields.body.layout')}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image-left">
                              {t('clients.fields.body.layoutOptions.imageLeft')}
                            </SelectItem>
                            <SelectItem value="image-right">
                              {t('clients.fields.body.layoutOptions.imageRight')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyData.imageUrl">
                      {t('clients.fields.body.imageUrl')}
                    </Label>
                    <Input
                      id="bodyData.imageUrl"
                      {...register('bodyData.imageUrl')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyData.imageHint">
                      {t('clients.fields.body.imageHint')}
                    </Label>
                    <Input
                      id="bodyData.imageHint"
                      {...register('bodyData.imageHint')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyData.videoUrl">
                      {t('clients.fields.body.videoUrl')}
                    </Label>
                    <Input
                      id="bodyData.videoUrl"
                      {...register('bodyData.videoUrl')}
                      placeholder="YouTube/Vimeo URL"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bodyData.ctaButtonText">
                        {t('clients.fields.body.ctaButtonText')}
                      </Label>
                      <Input
                        id="bodyData.ctaButtonText"
                        {...register('bodyData.ctaButtonText')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bodyData.ctaButtonLink">
                        {t('clients.fields.body.ctaButtonLink')}
                      </Label>
                      <Input
                        id="bodyData.ctaButtonLink"
                        {...register('bodyData.ctaButtonLink')}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="cards" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('clients.tabs.infoCards')}</CardTitle>
                      <CardDescription>
                        {t('clients.fields.infoCards.description')}
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendInfoCard({ title: '', content: '' })
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t('clients.fields.infoCards.add')}
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {infoCardFields.map((field, index) => (
                      <Card key={field.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="grid flex-1 gap-4">
                              <div className="space-y-2">
                                <Label>
                                  {t('clients.fields.infoCards.title')}
                                </Label>
                                <Input
                                  {...register(`infoCards.${index}.title`)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>
                                  {t('clients.fields.infoCards.content')}
                                </Label>
                                <Textarea
                                  {...register(`infoCards.${index}.content`)}
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="mt-8"
                              onClick={() => removeInfoCard(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="products" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('clients.tabs.products')}</CardTitle>
                      <CardDescription>Add products to your listing.</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendProduct({ name: '', price: '' })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {productFields.map((field, index) => (
                      <Card key={field.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="grid flex-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Product Name</Label>
                                <Input {...register(`products.${index}.name`)} />
                              </div>
                              <div className="space-y-2">
                                <Label>Price</Label>
                                <Input {...register(`products.${index}.price`)} />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea {...register(`products.${index}.description`)} />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label>Image URL</Label>
                                <Input {...register(`products.${index}.imageUrl`)} />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeProduct(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="graphics" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('clients.tabs.graphics')}</CardTitle>
                      <CardDescription>
                        {t('clients.fields.graphics.description')}
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendGraphic({ imageUrl: '', targetUrl: '', text: '' })
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t('clients.fields.graphics.add')}
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {graphicsFields.map((field, index) => (
                      <Card key={field.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="grid flex-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2 md:col-span-2">
                                <Label>
                                  {t('clients.fields.graphics.text')}
                                </Label>
                                <Input
                                  {...register(`graphics.${index}.text`)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>
                                  {t('clients.fields.graphics.imageUrl')}
                                </Label>
                                <Input
                                  {...register(`graphics.${index}.imageUrl`)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>
                                  {t('clients.fields.graphics.targetUrl')}
                                </Label>
                                <Input
                                  {...register(`graphics.${index}.targetUrl`)}
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="mt-8"
                              onClick={() => removeGraphic(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="form" className="space-y-6">
                  <CardTitle>{t('clients.tabs.form')}</CardTitle>
                  <CardDescription>
                    Configure contact form settings.
                  </CardDescription>
                  <Alert>
                    <AlertTitle>Not Implemented Yet</AlertTitle>
                    <AlertDescription>
                      This section will allow you to configure custom fields for the contact form.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="stats">
                  <div className="p-4">
                    <AdStatistics adId={id} />
                  </div>
                </TabsContent>

                <TabsContent value="wallet">
                  <div className="p-4 space-y-4">
                    <CardTitle>Client Wallet</CardTitle>
                    <CardDescription>Manage budget and transactions.</CardDescription>
                    <WalletCard
                      clientId={id}
                      clientEmail={watch('email')}
                      currentBudget={watch('budget_remaining') || 0}
                      totalInvested={watch('total_invested') || 0}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="translations" className="space-y-6">
                  <CardTitle>{t('clients.tabs.translations')}</CardTitle>
                  <CardDescription>
                    {t('clients.fields.translations.description')}
                  </CardDescription>
                  <div className="space-y-2">
                    <Label htmlFor="translations">JSON Translations</Label>
                    <Textarea
                      id="translations"
                      {...register('translations')}
                      className="font-mono text-sm h-[400px]"
                      placeholder='{ "en": { ... }, "es": { ... } }'
                    />
                    <p className="text-xs text-muted-foreground">
                      Edit the raw JSON translations for this client. Be careful with syntax.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="coupons">
                  <ClientCouponManager
                    companyId={id}
                    companyName={watch('clientName')}
                    category={watch('category') || ''}
                  />
                </TabsContent>

                <TabsContent value="invite">
                  <div className="p-4 space-y-4">
                    <CardTitle>Invitar Amigos</CardTitle>
                    <CardDescription>Invita a amigos y gana recompensas para tu negocio.</CardDescription>
                    {uniqueCode ? (
                      <InviteFriendSection uniqueCode={uniqueCode} referrals={[]} />
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        Generando código de invitación...
                      </div>
                    )}
                  </div>
                </TabsContent>

              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push('/admin/clients')}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('common.save')}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Alert Dialog for Confirmations (optional usage) */}
      <AlertDialog open={false} onOpenChange={() => { }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>Action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}