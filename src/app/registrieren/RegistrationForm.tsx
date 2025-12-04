// src/app/registrieren/RegistrationForm.tsx
'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2, LocateFixed } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

import { Textarea } from '@/components/ui/textarea';

const DiciloMap = dynamic(() => import('@/components/dicilo-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const registrationSchema = z.object({
  firstName: z.string().min(1, 'register.errors.required'),
  lastName: z.string().min(1, 'register.errors.required'),
  email: z.string().email('register.errors.invalidEmail'),
  password: z.string().min(6, 'register.errors.passwordMinLength').optional(),
  confirmPassword: z.string().optional(),
  whatsapp: z.string().optional(),
  contactType: z.enum(['whatsapp', 'telegram']).default('whatsapp'),
  registrationType: z.enum(['private', 'donor', 'retailer', 'premium'], {
    required_error: 'register.errors.requiredType',
  }),
  // Business Fields
  businessName: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('register.errors.invalid_url').optional().or(z.literal('')),
  imageUrl: z.string().url('register.errors.invalid_url').optional().or(z.literal('')),
  imageHint: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  currentOfferUrl: z.string().url('register.errors.invalid_url').optional().or(z.literal('')),
  mapUrl: z.string().url('register.errors.invalid_url').optional().or(z.literal('')),
  coords: z.array(z.number()).length(2).optional(),
  // Premium Fields
  welcomeText: z.string().optional(),
  headerImageUrl: z.string().url('register.errors.invalid_url').optional().or(z.literal('')),
  instagramUrl: z.string().url('register.errors.invalid_url').optional().or(z.literal('')),
  facebookUrl: z.string().url('register.errors.invalid_url').optional().or(z.literal('')),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'register.errors.passwordMismatch',
  path: ['confirmPassword'],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const registrationOptions = [
  { value: 'private', labelKey: 'options.private' },
  { value: 'donor', labelKey: 'options.donor' },
  { value: 'retailer', labelKey: 'options.retailer' },
  { value: 'premium', labelKey: 'options.premium' },
];

export const RegistrationFormSkeleton = () => (
  <CardContent className="space-y-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <Skeleton className="h-10 w-full" />
  </CardContent>
);

export function RegistrationForm() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation('register');
  const locale = i18n.language;
  const [isGeocoding, setIsGeocoding] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      registrationType: 'private',
      contactType: 'whatsapp',
      rating: 0,
    },
  });

  const registrationType = watch('registrationType');
  const showBusinessFields = ['retailer', 'premium', 'donor'].includes(registrationType);
  const showPremiumFields = registrationType === 'premium';
  const coords = watch('coords');

  const handleGeocode = React.useCallback(
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
            title: t('register.form.geocodeSuccessTitle'),
            description: t('register.form.geocodeSuccessDesc'),
          });
        } else {
          toast({
            title: t('register.form.geocodeNotFoundTitle'),
            description: t('register.form.geocodeNotFoundDesc'),
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: t('register.form.geocodeErrorTitle'),
          description: t('register.form.geocodeErrorDesc'),
          variant: 'destructive',
        });
      } finally {
        setIsGeocoding(false);
      }
    },
    [locale, setValue, t, toast]
  );

  const triggerGeocode = React.useCallback(() => {
    const address = getValues('address');
    const location = getValues('location');
    const addressToGeocode = address || location;

    if (!addressToGeocode) {
      toast({
        title: t('register.form.noAddressTitle'),
        description: t('register.form.noAddressDesc'),
        variant: 'destructive',
      });
      return;
    }
    handleGeocode(addressToGeocode);
  }, [getValues, handleGeocode, toast, t]);

  const handleMapDragEnd = (newCoords: [number, number]) => {
    setValue('coords', newCoords, { shouldDirty: true, shouldValidate: true });
  };

  const handleRegistration = async (data: RegistrationFormData) => {
    try {
      // 1. Create Authentication User (if password provided)
      let ownerUid = null;
      if (data.password) {
        try {
          const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
          const { app } = await import('@/lib/firebase');
          const auth = getAuth(app);

          const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
          );
          ownerUid = userCredential.user.uid;

          await updateProfile(userCredential.user, {
            displayName: `${data.firstName} ${data.lastName}`,
          });
        } catch (authError: any) {
          console.error('Auth Error:', authError);
          if (authError.code === 'auth/email-already-in-use') {
            // Suggest logging in or using a different email
            throw new Error(t('register.errors.emailAlreadyInUse') || 'Email already in use');
          }
          throw new Error(authError.message || t('register.form.submitError'));
        }
      }

      // 2. Save to Firestore
      const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase');
      const { slugify } = await import('@/lib/utils');
      const db = getFirestore(app);

      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        whatsapp: data.whatsapp || null,
        contactType: data.contactType || 'whatsapp',
        registrationType: data.registrationType,
        ownerUid: ownerUid,
        // Business Fields
        businessName: data.businessName || null,
        category: data.category || null,
        description: data.description || null,
        location: data.location || null,
        address: data.address || null,
        phone: data.phone || null,
        website: data.website || null,
        imageUrl: data.imageUrl || null,
        imageHint: data.imageHint || null,
        rating: data.rating || null,
        currentOfferUrl: data.currentOfferUrl || null,
        mapUrl: data.mapUrl || null,
        coords: data.coords || null,
        createdAt: serverTimestamp(),
        status: 'pending',
      };

      const registrationDocRef = await addDoc(collection(db, 'registrations'), registrationData);

      // 3. Create Client Document (if Retailer or Premium)
      if (['retailer', 'premium', 'donor'].includes(data.registrationType)) {
        const clientName = data.businessName || `${data.firstName} ${data.lastName}`;
        const defaultClientData = {
          clientName: clientName,
          clientLogoUrl: data.imageUrl || '',
          clientTitle: data.welcomeText || `Bienvenido a ${clientName}`,
          clientSubtitle: 'Esta es tu página de aterrizaje. ¡Edítala desde el panel de administración!',
          products: [],
          slug: slugify(clientName),
          socialLinks: {
            instagram: data.instagramUrl || '',
            facebook: data.facebookUrl || '',
            linkedin: ''
          },
          strengths: [],
          testimonials: [],
          translations: {},
          ownerUid: ownerUid,
          registrationId: registrationDocRef.id,
          // Added fields for directory listing
          category: data.category || '',
          description: data.description || '',
          location: data.location || '',
          address: data.address || '',
          coords: data.coords || null,
          phone: data.phone || '',
          website: data.website || '',
          currentOfferUrl: data.currentOfferUrl || '',
          headerData: {
            headerImageUrl: data.headerImageUrl || '',
          }
        };
        await addDoc(collection(db, 'clients'), defaultClientData);
      }

      // 4. Optional: Call API for Webhook (if needed, but skipping for now to ensure stability)
      // If we need the webhook, we can call a simplified API endpoint here.

      toast({
        title: t('register.form.registerSuccessTitle'),
        description: t('register.form.registerSuccessDescription'),
      });
      reset();
    } catch (error: any) {
      console.error('Registration Error:', error);
      toast({
        title: t('register.form.errorTitle'),
        description: error.message || t('register.form.submitError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleRegistration)}>
      <CardContent className="space-y-6">
        {/* Contact Person Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('register.form.recommenderSection')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('register.fields.firstName')}</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {t(errors.firstName.message as string)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('register.fields.lastName')}</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {t(errors.lastName.message as string)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('register.fields.email')}</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">
                {t(errors.email.message as string)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('register.fields.contactType')}</Label>
            <Controller
              name="contactType"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="whatsapp" id="contact-whatsapp" />
                    <Label htmlFor="contact-whatsapp">{t('register.options.whatsapp')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="telegram" id="contact-telegram" />
                    <Label htmlFor="contact-telegram">{t('register.options.telegram')}</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">{t('register.fields.whatsapp')}</Label>
            <Input id="whatsapp" {...register('whatsapp')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('register.fields.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {t(errors.password.message as string)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{t('register.fields.passwordHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('register.fields.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {t(errors.confirmPassword.message as string)}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>{t('register.fields.registrationType')}</Label>
          <Controller
            name="registrationType"
            control={control}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid grid-cols-2 gap-4"
              >
                {registrationOptions.map((option) => (
                  <Label
                    key={option.value}
                    className="flex cursor-pointer items-center space-x-2 rounded-md border p-3 hover:bg-accent has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="border-muted-foreground text-primary"
                    />
                    <span>{t(`register.${option.labelKey}`)}</span>
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
          {errors.registrationType && (
            <p className="text-sm text-destructive">
              {t(errors.registrationType.message as string)}
            </p>
          )}
        </div>

        {/* Business Fields Section - Only shown for Retailer and Premium */}
        {showBusinessFields && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">{t('register.fields.businessName')}</h3>

            <div className="space-y-2">
              <Label htmlFor="businessName">{t('register.fields.businessName')} *</Label>
              <Input id="businessName" {...register('businessName')} />
              {errors.businessName && (
                <p className="text-sm text-destructive">
                  {t(errors.businessName.message as string)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('register.fields.category')} *</Label>
              <Input id="category" {...register('category')} placeholder="Hauptkategorie / Unterkategorie" />
              {errors.category && (
                <p className="text-sm text-destructive">
                  {t(errors.category.message as string)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('register.fields.description')} *</Label>
              <Textarea id="description" {...register('description')} />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {t(errors.description.message as string)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">{t('register.fields.location')} *</Label>
                <Input id="location" {...register('location')} />
                {errors.location && (
                  <p className="text-sm text-destructive">
                    {t(errors.location.message as string)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('register.fields.address')}</Label>
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
            </div>

            {/* Map Section */}
            <div className="h-[300px] w-full overflow-hidden rounded-lg border shadow-sm">
              <DiciloMap
                key={coords ? coords.join(',') : 'default'}
                center={coords ? (coords as [number, number]) : [53.5511, 9.9937]}
                businesses={
                  coords
                    ? [
                      {
                        id: 'new-marker',
                        coords: coords as [number, number],
                        name: getValues('businessName') || 'New Business',
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
            {errors.coords && (
              <p className="text-sm text-destructive">
                {t(errors.coords.message as string)}
              </p>
            )}


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('register.fields.phone')}</Label>
                <Input id="phone" {...register('phone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{t('register.fields.website')}</Label>
                <Input id="website" {...register('website')} />
                {errors.website && (
                  <p className="text-sm text-destructive">
                    {t(errors.website.message as string)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t('register.fields.logoUrl')}</Label>
              <Input id="imageUrl" {...register('imageUrl')} placeholder={t('register.fields.logoUrlPlaceholder')} />
              {errors.imageUrl && (
                <p className="text-sm text-destructive">
                  {t(errors.imageUrl.message as string)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentOfferUrl">{t('register.fields.currentOfferUrl')}</Label>
              <Input id="currentOfferUrl" {...register('currentOfferUrl')} />
              {errors.currentOfferUrl && (
                <p className="text-sm text-destructive">
                  {t(errors.currentOfferUrl.message as string)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Landing Page Fields Section - Only shown for Premium */}
        {showPremiumFields && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">{t('register.fields.landingPageSection')}</h3>

            <div className="space-y-2">
              <Label htmlFor="welcomeText">{t('register.fields.welcomeText')}</Label>
              <Input id="welcomeText" {...register('welcomeText')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headerImageUrl">{t('register.fields.headerImageUrl')}</Label>
              <Input id="headerImageUrl" {...register('headerImageUrl')} />
              {errors.headerImageUrl && (
                <p className="text-sm text-destructive">
                  {t(errors.headerImageUrl.message as string)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagramUrl">{t('register.fields.instagramUrl')}</Label>
                <Input id="instagramUrl" {...register('instagramUrl')} />
                {errors.instagramUrl && (
                  <p className="text-sm text-destructive">
                    {t(errors.instagramUrl.message as string)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebookUrl">{t('register.fields.facebookUrl')}</Label>
                <Input id="facebookUrl" {...register('facebookUrl')} />
                {errors.facebookUrl && (
                  <p className="text-sm text-destructive">
                    {t(errors.facebookUrl.message as string)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            t('register.form.registerButton')
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
