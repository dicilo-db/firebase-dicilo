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
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
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
import type { ClientData } from './page';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import _ from 'lodash';

const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

const functions = getFunctions(app, 'europe-west1');
const submitRecommendationFn = httpsCallable(functions, 'submitRecommendation');

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
  const { t } = useTranslation();
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
  clientType: z.enum(['retailer', 'premium']),
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
});

type ClientFormData = z.infer<typeof clientSchema>;

interface EditClientFormProps {
  initialData: ClientData;
}

export default function EditClientForm({ initialData }: EditClientFormProps) {
  const { t } = useTranslation();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const router = useRouter();
  const id = initialData.id;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [embedCode, setEmbedCode] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEmbedCode(
        `<iframe src="${window.location.origin}/forms/embed/${id}" width="100%" height="800px" style="border:none;"></iframe>`
      );
    }
  }, [id]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      clientName: '',
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
        layout: 'image-right',
        body2BackgroundColor: '',
      },
      infoCards: [],
      graphics: [],
      products: [],
      translations: '{}',
    },
  });

  const preparedData = useMemo(() => {
    const data = initialData || {};
    const headerData = data.headerData || {};
    const marqueeData = data.marqueeHeaderData || {};
    const bodyData = data.bodyData || {};
    const socialLinks = headerData.socialLinks || [];

    return {
      clientName: data.clientName || '',
      clientType: data.clientType || 'retailer',
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
        bannerType: headerData.bannerType || 'embed',
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
        enabled: marqueeData.enabled ?? true,
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
        newData.marqueeHeaderData.offerEndDate = Timestamp.fromDate(
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

      const finalPayload = _.merge({}, originalData, newData);

      await updateDoc(docRef, finalPayload);
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
      <form onSubmit={handleSubmit(onSubmit)}>
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
              {t('admin.clients.edit.cardDescription', { id })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general">
              <TabsList className="mb-6 grid w-full grid-cols-4 md:grid-cols-8">
                <TabsTrigger value="general">
                  {t('admin.clients.tabs.general')}
                </TabsTrigger>
                <TabsTrigger value="marqueeHeader">
                  {t('admin.clients.tabs.marqueeHeader')}
                </TabsTrigger>
                <TabsTrigger value="body">
                  {t('admin.clients.tabs.body')}
                </TabsTrigger>
                <TabsTrigger value="cards">
                  {t('admin.clients.tabs.infoCards')}
                </TabsTrigger>
                <TabsTrigger value="products">
                  {t('admin.clients.tabs.products')}
                </TabsTrigger>
                <TabsTrigger value="graphics">
                  {t('admin.clients.tabs.graphics')}
                </TabsTrigger>
                <TabsTrigger value="form">
                  {t('admin.clients.tabs.form')}
                </TabsTrigger>
                <TabsTrigger value="translations">
                  {t('admin.clients.tabs.translations')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <CardTitle>{t('admin.clients.tabs.general')}</CardTitle>
                <CardDescription>
                  {t('admin.clients.fields.general.description')}
                </CardDescription>

                <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">
                      {t('admin.clients.fields.clientName')}
                    </Label>
                    <Input id="clientName" {...register('clientName')} />
                    {errors.clientName && (
                      <p className="text-sm text-destructive">
                        {errors.clientName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientType">
                      {t('admin.clients.fields.clientType')}
                    </Label>
                    <Controller
                      name="clientType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || 'retailer'}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retailer">Retailer</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientLogoUrl">
                      {t('admin.clients.fields.clientLogoUrl')}
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
                      {t('admin.clients.fields.header.clientLogoWidth')}
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
                    {t('admin.clients.fields.header.welcomeText')}
                  </Label>
                  <Input
                    id="headerData.welcomeText"
                    {...register('headerData.welcomeText')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headerData.socialShareText">
                    {t('admin.clients.fields.header.socialShareText')}
                  </Label>
                  <Textarea
                    id="headerData.socialShareText"
                    {...register('headerData.socialShareText')}
                    placeholder={
                      t(
                        'admin.clients.fields.header.socialShareTextPlaceholder'
                      ) as string
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headerData.bannerShareUrl">
                    {t('admin.clients.fields.header.bannerShareUrl')}
                  </Label>
                  <Input
                    id="headerData.bannerShareUrl"
                    {...register('headerData.bannerShareUrl')}
                    placeholder="https://example.com/special-offer"
                  />
                </div>

                <h3 className="pt-4 text-lg font-medium">
                  {t('admin.clients.fields.header.stylesTitle')}
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="headerData.headerBackgroundColor">
                      {t('admin.clients.fields.header.headerBackgroundColor')}
                    </Label>
                    <Input
                      id="headerData.headerBackgroundColor"
                      {...register('headerData.headerBackgroundColor')}
                      placeholder="#FFFFFF"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headerData.headerTextColor">
                      {t('admin.clients.fields.header.headerTextColor')}
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
                    {t('admin.clients.fields.header.headerBackgroundImageUrl')}
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
                    {t('admin.clients.fields.header.headerImageUrl')}
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
                    {t('admin.clients.fields.header.dividerLine.title')}
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
                      {t('admin.clients.fields.header.dividerLine.enable')}
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="headerData.dividerLine.color">
                        {t('admin.clients.fields.header.dividerLine.color')}
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
                        {t('admin.clients.fields.header.dividerLine.thickness')}
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
                  {t('admin.clients.fields.header.socialLinks')}
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {socialLinkFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-2 rounded-lg border p-3"
                    >
                      <Label>
                        {t('admin.clients.fields.header.socialLink', {
                          number: index + 1,
                        })}
                      </Label>
                      <Input
                        placeholder={t(
                          'admin.clients.fields.header.iconPlaceholderText'
                        )}
                        {...register(`headerData.socialLinks.${index}.icon`)}
                      />
                      <Input
                        placeholder={t(
                          'admin.clients.fields.header.urlPlaceholder'
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
                    {t('admin.clients.fields.header.banner.title')}
                  </h3>
                  <Controller
                    name="headerData.bannerType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex items-center gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="embed" id="embed" />
                          <Label htmlFor="embed">
                            {t('admin.clients.fields.header.banner.embedCode')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="url" id="url" />
                          <Label htmlFor="url">
                            {t('admin.clients.fields.header.banner.imageUrl')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="upload" id="upload" />
                          <Label htmlFor="upload">
                            {t('admin.clients.fields.header.banner.fileUpload')}
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                {bannerType === 'embed' && (
                  <div className="space-y-2">
                    <Label htmlFor="headerData.bannerEmbedCode">
                      {t('admin.clients.fields.header.banner.embedCode')}
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
                        {t('admin.clients.fields.header.banner.imageUrl')}
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
                          {t('admin.clients.fields.header.banner.width')}
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
                          {t('admin.clients.fields.header.banner.height')}
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
                      {t('admin.clients.fields.header.banner.fileUpload')}
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
                        {t('admin.clients.fields.header.banner.currentImage')}:{' '}
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
              </TabsContent>

              {/* Marquee Header Tab */}
              <TabsContent value="marqueeHeader" className="space-y-6">
                <CardTitle>{t('admin.clients.tabs.marqueeHeader')}</CardTitle>
                <CardDescription>
                  {t('admin.clients.fields.marqueeHeader.description')}
                </CardDescription>

                <div className="space-y-2">
                  <Label>
                    {t('admin.clients.fields.marqueeHeader.marqueeText')}
                  </Label>
                  <Input {...register('marqueeHeaderData.marqueeText')} />
                </div>
                <hr />

                <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
                  <h4 className="font-semibold">
                    {t('admin.clients.fields.marqueeHeader.offerSectionTitle')}
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
                      {t('admin.clients.fields.marqueeHeader.offerEnabled')}
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t('admin.clients.fields.marqueeHeader.leftButtonText')}
                    </Label>
                    <Input {...register('marqueeHeaderData.leftButtonText')} />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t('admin.clients.fields.marqueeHeader.leftButtonLink')}
                    </Label>
                    <Input {...register('marqueeHeaderData.leftButtonLink')} />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t('admin.clients.fields.marqueeHeader.offerEndDate')}
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
                                    'admin.clients.fields.marqueeHeader.pickDate'
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
                      {t('admin.clients.fields.marqueeHeader.offerSection')}
                    </h4>
                    <div className="space-y-2">
                      <Label>
                        {t(
                          'admin.clients.fields.marqueeHeader.middleTextOffer'
                        )}
                      </Label>
                      <Input {...register('marqueeHeaderData.middleText')} />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t(
                          'admin.clients.fields.marqueeHeader.buttonAfterDateText'
                        )}
                      </Label>
                      <Input
                        {...register('marqueeHeaderData.clubButtonText')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t(
                          'admin.clients.fields.marqueeHeader.buttonAfterDateLink'
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
                        'admin.clients.fields.marqueeHeader.rightButtonsSectionTitle'
                      )}
                    </h4>
                    <div className="space-y-2">
                      <Label>
                        {t(
                          'admin.clients.fields.marqueeHeader.rightButton1Text'
                        )}
                      </Label>
                      <Input
                        {...register('marqueeHeaderData.rightButton1Text')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t(
                          'admin.clients.fields.marqueeHeader.rightButton1Link'
                        )}
                      </Label>
                      <Input
                        {...register('marqueeHeaderData.rightButton1Link')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t(
                          'admin.clients.fields.marqueeHeader.rightButton2Text'
                        )}
                      </Label>
                      <Input
                        {...register('marqueeHeaderData.rightButton2Text')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t(
                          'admin.clients.fields.marqueeHeader.rightButton2Link'
                        )}
                      </Label>
                      <Input
                        {...register('marqueeHeaderData.rightButton2Link')}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Body Tab */}
              <TabsContent value="body" className="space-y-6">
                <CardTitle>{t('admin.clients.tabs.body')}</CardTitle>
                <CardDescription>
                  {t('admin.clients.fields.body.description')}
                </CardDescription>
                <div className="space-y-2">
                  <Label htmlFor="bodyData.title">
                    {t('admin.clients.fields.body.title')}
                  </Label>
                  <Input id="bodyData.title" {...register('bodyData.title')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyData.subtitle">
                    {t('admin.clients.fields.body.subtitle')}
                  </Label>
                  <Input
                    id="bodyData.subtitle"
                    {...register('bodyData.subtitle')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyData.description">
                    {t('admin.clients.fields.body.descriptionField')}
                  </Label>
                  <Controller
                    name="bodyData.description"
                    control={control}
                    render={({ field }) => (
                      <TiptapEditor
                        name="bodyData.description"
                        control={control}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyData.imageUrl">
                    {t('admin.clients.fields.body.imageUrl')}
                  </Label>
                  <Input
                    id="bodyData.imageUrl"
                    {...register('bodyData.imageUrl')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyData.videoUrl">
                    {t('admin.clients.fields.body.videoUrl')}
                  </Label>
                  <Input
                    id="bodyData.videoUrl"
                    {...register('bodyData.videoUrl')}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyData.ctaButtonText">
                    {t('admin.clients.fields.body.ctaButtonText')}
                  </Label>
                  <Input
                    id="bodyData.ctaButtonText"
                    {...register('bodyData.ctaButtonText')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyData.ctaButtonLink">
                    {t('admin.clients.fields.body.ctaButtonLink')}
                  </Label>
                  <Input
                    id="bodyData.ctaButtonLink"
                    {...register('bodyData.ctaButtonLink')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyData.layout">
                    {t('admin.clients.fields.body.layout')}
                  </Label>
                  <Controller
                    name="bodyData.layout"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || 'image-right'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image-left">Bild links</SelectItem>
                          <SelectItem value="image-right">
                            Bild rechts
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Info Cards Tab */}
              <TabsContent value="cards" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {t('admin.clients.fields.infoCards.title')}
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => appendInfoCard({ title: '', content: '' })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />{' '}
                    {t('admin.clients.fields.infoCards.add')}
                  </Button>
                </div>
                <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                  {infoCardFields.map((field, index) => (
                    <fieldset key={field.id} className="rounded-md border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <legend className="px-1 text-sm font-medium">
                          {t('admin.clients.fields.infoCards.card')} {index + 1}
                        </legend>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInfoCard(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-2 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`infoCards.${index}.title`}>
                            {t('admin.clients.fields.title')}
                          </Label>
                          <Input
                            id={`infoCards.${index}.title`}
                            {...register(`infoCards.${index}.title`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`infoCards.${index}.content`}>
                            {t('admin.clients.fields.content')}
                          </Label>
                          <Controller
                            name={`infoCards.${index}.content`}
                            control={control}
                            render={({ field }) => (
                              <TiptapEditor
                                name={`infoCards.${index}.content`}
                                control={control}
                              />
                            )}
                          />
                        </div>
                      </div>
                    </fieldset>
                  ))}
                </div>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {t('admin.clients.tabs.products')}
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => appendProduct({ name: '' })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />{' '}
                    {t('admin.clients.fields.products.add')}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('admin.clients.fields.products.description')}
                </p>
                <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                  {productFields.map((field, index) => (
                    <fieldset key={field.id} className="rounded-md border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <legend className="px-1 text-sm font-medium">
                          {t('admin.clients.fields.products.product')}{' '}
                          {index + 1}
                        </legend>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`products.${index}.name`}>
                          {t('admin.clients.fields.products.productName')}
                        </Label>
                        <Input
                          id={`products.${index}.name`}
                          {...register(`products.${index}.name`)}
                        />
                        {errors.products?.[index]?.name && (
                          <p className="text-sm text-destructive">
                            {errors.products?.[index]?.name?.message}
                          </p>
                        )}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </TabsContent>

              {/* Graphics Tab */}
              <TabsContent value="graphics" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {t('admin.clients.fields.graphics.title')}
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      appendGraphic({ imageUrl: '', targetUrl: '', text: '' })
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />{' '}
                    {t('admin.clients.fields.graphics.add')}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('admin.clients.fields.graphics.description')}
                </p>
                <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                  {graphicsFields.map((field, index) => (
                    <fieldset key={field.id} className="rounded-md border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <legend className="px-1 text-sm font-medium">
                          {t('admin.clients.fields.graphics.graphic')}{' '}
                          {index + 1}
                        </legend>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeGraphic(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`graphics.${index}.imageUrl`}>
                            {t('admin.clients.fields.graphics.imageUrl')}
                          </Label>
                          <Input
                            id={`graphics.${index}.imageUrl`}
                            {...register(`graphics.${index}.imageUrl`)}
                          />
                          {errors.graphics?.[index]?.imageUrl && (
                            <p className="text-sm text-destructive">
                              {errors.graphics[index]?.imageUrl?.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`graphics.${index}.targetUrl`}>
                            {t('admin.clients.fields.graphics.targetUrl')}
                          </Label>
                          <Input
                            id={`graphics.${index}.targetUrl`}
                            {...register(`graphics.${index}.targetUrl`)}
                          />
                          {errors.graphics?.[index]?.targetUrl && (
                            <p className="text-sm text-destructive">
                              {errors.graphics[index]?.targetUrl?.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`graphics.${index}.text`}>
                            {t('admin.clients.fields.graphics.title')}
                          </Label>
                          <Input
                            id={`graphics.${index}.text`}
                            {...register(`graphics.${index}.text`)}
                          />
                        </div>
                      </div>
                    </fieldset>
                  ))}
                </div>
              </TabsContent>

              {/* Form Tab */}
              <TabsContent value="form">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <CardTitle>{t('admin.clients.tabs.form')}</CardTitle>
                    <CardDescription>
                      {t('admin.clients.fields.form.description')}
                    </CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">
                        <Code className="mr-2 h-4 w-4" /> Insertar en Landing
                        Page
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Insertar Formulario</AlertDialogTitle>
                        <AlertDialogDescription>
                          Copie y pegue este código en el HTML de su landing
                          page para insertar el formulario.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <pre className="mt-2 w-full overflow-x-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4">
                        <code className="break-all text-white">
                          {embedCode}
                        </code>
                      </pre>
                      <AlertDialogFooter>
                        <AlertDialogAction
                          onClick={() => {
                            navigator.clipboard.writeText(embedCode);
                            toast({
                              title: '¡Copiado!',
                              description:
                                'El código de inserción se ha copiado al portapapeles.',
                            });
                          }}
                        >
                          Copiar Código
                        </AlertDialogAction>
                        <AlertDialogCancel>Cerrar</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="mt-6 rounded-lg border bg-slate-50 p-4">
                  <RecommendationFormForClient
                    products={watch('products') || []}
                    clientId={id}
                  />
                </div>
              </TabsContent>

              {/* Translations Tab */}
              <TabsContent value="translations">
                <div className="space-y-2">
                  <Label htmlFor="translations">
                    {t('admin.clients.fields.translations')}
                  </Label>
                  <Controller
                    name="translations"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        id="translations"
                        {...field}
                        rows={15}
                        placeholder={
                          t(
                            'admin.clients.fields.jsonPlaceholderObject'
                          ) as string
                        }
                        className="w-full rounded-md border p-2 font-mono text-sm"
                      />
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('admin.clients.fields.jsonHelpObject')}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('admin.clients.edit.save')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </>
  );
}
