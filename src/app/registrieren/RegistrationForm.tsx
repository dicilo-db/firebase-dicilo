// src/app/registrieren/RegistrationForm.tsx
'use client';

import { cn } from '@/lib/utils';

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
import { Loader2, LocateFixed, Eye, EyeOff, User, Mail, Phone, Lock, Briefcase, Globe, Image as ImageIcon, MapPin, Instagram, Facebook, Star, Type } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

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
  inviteId: z.string().optional(),
  referralCode: z.string().optional(),
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
  const searchParams = useSearchParams();
  const getInitialType = () => {
    const regTypeParam = searchParams.get('type');
    return (regTypeParam && ['private', 'donor', 'retailer', 'premium'].includes(regTypeParam)) 
      ? regTypeParam 
      : 'private';
  };

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
      registrationType: getInitialType() as any,
      contactType: 'whatsapp',
      rating: 0,
    },
  });

  const registrationType = watch('registrationType');
  const showBusinessFields = ['retailer', 'premium', 'donor'].includes(registrationType);
  const showPremiumFields = registrationType === 'premium';
  const coords = watch('coords');

  const [isGeocoding, setIsGeocoding] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
  // Success & Verification States
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState('');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);

  React.useEffect(() => {
    const ref = searchParams.get('ref');
    const inviteId = searchParams.get('inviteId'); 
    const regType = searchParams.get('type');
    if (ref) {
      setValue('referralCode', ref);
    } else {
      if (!getValues('referralCode')) setValue('referralCode', 'DCLSYSTEM01');
    }
    if (inviteId) setValue('inviteId', inviteId);
    if (regType && ['private', 'donor', 'retailer', 'premium'].includes(regType)) {
      setValue('registrationType', regType as any, { shouldValidate: true, shouldDirty: true });
    }
  }, [searchParams, setValue, getValues]);

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
      // Logic for Private Users: Client-Side Auth + Profile Sync
      if (data.registrationType === 'private') {
        const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('firebase/auth');
        const auth = getAuth(); // Uses the singleton app from firebase-config implicitly or pass app if needed
        // Ideally import app from lib/firebase.ts, but let's try implicit first or dynamically import.
        // Better:
        const { app } = await import('@/lib/firebase');
        const clientAuth = getAuth(app);

        // 1. Create User on Client
        let userCredential;
        try {
          if (data.password) {
            userCredential = await createUserWithEmailAndPassword(clientAuth, data.email, data.password);
          } else {
            throw new Error(t('register.errors.passwordRequired'));
          }
        } catch (authError: any) {
          console.error("Auth Error", authError);
          if (authError.code === 'auth/email-already-in-use') {
            throw new Error(t('register.errors.emailAlreadyInUse'));
          }
          throw authError;
        }

        const user = userCredential.user;
        const idToken = await user.getIdToken();

        // 2. Create Profile in Backend
        const profileResponse = await fetch('/api/private-user/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            uid: user.uid,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phone || data.whatsapp, // Fallback
            contactType: data.contactType,
            referralCode: data.referralCode,
            inviteId: data.inviteId,
            lang: locale
          }),
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.message || errorData.error || 'Failed to create profile');
        }

        toast({
          title: t('register.form.registerSuccessTitle'),
          description: t('register.form.registerSuccessDescription'),
        });

        // Set success state instead of redirect immediately
        setRegisteredEmail(data.email);
        setIsSuccess(true);
        return;
      }

      // Existing Logic for Retailer / Premium / Donor (still uses server-side registration)
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, lang: locale }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error codes if needed, or just show the message
        throw new Error(result.message || result.error || t('register.form.submitError'));
      }

      toast({
        title: t('register.form.registerSuccessTitle'),
        description: t('register.form.registerSuccessDescription'),
      });
      setRegisteredEmail(data.email);
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Registration Error:', error);
      toast({
        title: t('register.form.errorTitle'),
        description: error.message || t('register.form.submitError'),
        variant: 'destructive',
      });
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 6) return;
    setIsVerifying(true);
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail, code: verificationCode }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Código inválido.');
      
      toast({
        title: locale === 'es' ? 'Verificación Exitosa' : (locale === 'de' ? 'Erfolgreich' : 'Verification Success'),
        description: locale === 'es' ? 'Cuenta verificada correctamente.' : (locale === 'de' ? 'Konto erfolgreich verifiziert.' : 'Account verified successfully.'),
      });
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isSuccess) {
    const isEs = locale === 'es';
    const isDe = locale === 'de';
    
    const uiTitle = isEs ? '¡Su registro ha sido completado!' : (isDe ? 'Registrierung erfolgreich abgeschlossen!' : 'Registration successfully completed!');
    const uiMsg = isEs ? 'Gracias por elegir Dicilo. Nos tomamos su seguridad muy en serio. Acabamos de enviarle un código de seguridad seguro a su bandeja de correo electrónico.' : 
                  (isDe ? 'Vielen Dank, dass Sie sich für Dicilo entschieden haben. Wir haben einen sicheren Sicherheitscode an Ihren Posteingang gesendet.' : 
                  'Thank you for choosing Dicilo. We take your security very seriously. We have just sent a secure code to your email inbox.');
    const uiPrompt = isEs ? 'Por favor ingrese el código de 6 dígitos aquí:' : (isDe ? 'Bitte geben Sie den 6-stelligen Code hier ein:' : 'Please enter the 6-digit code here:');
    const uiBtn = isEs ? 'Verificar y Entrar' : (isDe ? 'Überprüfen und Eintreten' : 'Verify & Enter');
    
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-4">{uiTitle}</h2>
        <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto">{uiMsg}</p>
        
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 max-w-sm w-full shadow-sm">
          <Label className="block mb-4 text-sm font-semibold text-slate-700">{uiPrompt}</Label>
          <Input 
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="000000"
            className="text-center text-3xl letter-spacing-widest font-mono h-16 bg-white mb-6 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
            maxLength={6}
          />
          <Button 
            onClick={handleVerifyCode} 
            disabled={isVerifying || verificationCode.length < 6}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-md transition-all"
          >
            {isVerifying ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            {uiBtn}
          </Button>
          <p className="mt-6 text-xs text-slate-400">Dicilo Secure Login • MILENIUM HOLDING & CONSULTING</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleRegistration)}>
      <CardContent className="space-y-6">
        {/* Personal Information Section */}
        <div className="space-y-4 p-5 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm transition-all hover:bg-slate-50">
          <div className="flex items-center gap-3 mb-2 border-b border-slate-200 pb-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{t('register.form.recommenderSection')}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">{t('register.fields.firstName')}</Label>
              <Input 
                id="firstName" 
                {...register('firstName')} 
                className="bg-white transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {t(errors.firstName.message as string)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-2">{t('register.fields.lastName')}</Label>
              <Input 
                id="lastName" 
                {...register('lastName')} 
                className="bg-white transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {t(errors.lastName.message as string)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {t('register.fields.email')}
            </Label>
            <Input 
              id="email" 
              type="email" 
              {...register('email')} 
              className="bg-white transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {t(errors.email.message as string)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">{t('register.fields.contactType')}</Label>
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
                    <Label htmlFor="contact-whatsapp" className="cursor-pointer">{t('register.options.whatsapp')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="telegram" id="contact-telegram" />
                    <Label htmlFor="contact-telegram" className="cursor-pointer">{t('register.options.telegram')}</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {t('register.fields.whatsapp')}
              </Label>
              <Input 
                id="whatsapp" 
                {...register('whatsapp')} 
                className="bg-white transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralCode" className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                {t('register.fields.referralCode')}
              </Label>
              <Input 
                id="referralCode" 
                {...register('referralCode')} 
                className="bg-white transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <p className="text-[10px] text-muted-foreground leading-tight mt-1">
                {t('register.fields.referralHint', 'Si has sido invitado por un amigo, por favor cambia este código por el de la persona que te invitó.')}
              </p>
            </div>
          </div>

          {/* Security Sub-section */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <Label htmlFor="password">{t('register.fields.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  className="pr-10 bg-white transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {t(errors.password.message as string)}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">{t('register.fields.passwordHint')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('register.fields.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="pr-10 bg-white transition-all focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {t(errors.confirmPassword.message as string)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 p-5 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm transition-all hover:bg-slate-50">
          <div className="flex items-center gap-3 mb-2 border-b border-slate-200 pb-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <Star className="h-5 w-5" />
            </div>
            <Label className="text-lg font-bold text-slate-800">{t('register.fields.registrationType')}</Label>
          </div>
          
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
                    className={cn(
                      "flex cursor-pointer items-center space-x-2 rounded-xl border p-4 transition-all hover:border-emerald-200 hover:bg-white",
                      field.value === option.value 
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 ring-offset-2" 
                        : "border-slate-100 bg-white"
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="text-emerald-500"
                    />
                    <span className={cn(
                      "font-medium",
                      field.value === option.value ? "text-emerald-700" : "text-slate-600"
                    )}>
                      {t(`register.${option.labelKey}`)}
                    </span>
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
          <div className="space-y-6 p-5 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm transition-all hover:bg-slate-100/50 pt-4">
            <div className="flex items-center gap-3 mb-2 border-b border-slate-200 pb-3">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{t('register.fields.businessInfo')}</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName" className="flex items-center gap-2">{t('register.fields.businessName')} *</Label>
              <Input 
                id="businessName" 
                {...register('businessName')} 
                className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              {errors.businessName && <p className="text-sm text-destructive">{t(errors.businessName.message as string)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">{t('register.fields.category')} *</Label>
              <Input 
                id="category" 
                {...register('category')} 
                placeholder={t('register.fields.categoryPlaceholder')} 
                className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              {errors.category && <p className="text-sm text-destructive">{t(errors.category.message as string)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">{t('register.fields.description')} *</Label>
              <Textarea 
                id="description" 
                {...register('description')} 
                className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent min-h-[100px]"
              />
              {errors.description && <p className="text-sm text-destructive">{t(errors.description.message as string)}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {t('register.fields.location')} *
                </Label>
                <Input 
                  id="location" 
                  {...register('location')} 
                  className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
                {errors.location && <p className="text-sm text-destructive">{t(errors.location.message as string)}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {t('register.fields.address')}
                </Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="address" 
                    {...register('address')} 
                    className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={triggerGeocode}
                    disabled={isGeocoding}
                    className="shrink-0 hover:bg-orange-50 hover:text-orange-600 transition-colors"
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
            <div className="h-[300px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-inner">
              <DiciloMap
                key={coords ? coords.join(',') : 'default'}
                center={coords ? (coords as [number, number]) : [53.5511, 9.9937]}
                businesses={
                  coords
                    ? [
                      {
                        id: 'new-marker',
                        coords: coords as [number, number],
                        name: watch('businessName') || 'New Business',
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
            {errors.coords && <p className="text-sm text-destructive">{t(errors.coords.message as string)}</p>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {t('register.fields.phone')}
                </Label>
                <Input 
                  id="phone" 
                  {...register('phone')} 
                  className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  {t('register.fields.website')}
                </Label>
                <Input 
                  id="website" 
                  {...register('website')} 
                  className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
                {errors.website && <p className="text-sm text-destructive">{t(errors.website.message as string)}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                {t('register.fields.logoUrl')}
              </Label>
              <Input 
                id="imageUrl" 
                {...register('imageUrl')} 
                placeholder={t('register.fields.logoUrlPlaceholder')} 
                className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              {errors.imageUrl && <p className="text-sm text-destructive">{t(errors.imageUrl.message as string)}</p>}
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <Label htmlFor="currentOfferUrl" className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-slate-400" />
                {t('register.fields.currentOfferUrl')}
              </Label>
              <Input 
                id="currentOfferUrl" 
                {...register('currentOfferUrl')} 
                className="bg-white transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              {errors.currentOfferUrl && <p className="text-sm text-destructive">{t(errors.currentOfferUrl.message as string)}</p>}
            </div>
          </div>
        )}

        {/* Landing Page Fields Section - Only shown for Premium */}
        {showPremiumFields && (
          <div className="space-y-6 p-5 rounded-xl bg-slate-50/50 border border-slate-100 shadow-sm transition-all hover:bg-slate-100/50 pt-4">
            <div className="flex items-center gap-3 mb-2 border-b border-slate-200 pb-3">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                <Instagram className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{t('register.fields.landingPageSection')}</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcomeText" className="flex items-center gap-2">
                <Type className="h-3.5 w-3.5 text-slate-400" />
                {t('register.fields.welcomeText')}
              </Label>
              <Input 
                id="welcomeText" 
                {...register('welcomeText')} 
                className="bg-white transition-all focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headerImageUrl" className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                {t('register.fields.headerImageUrl')}
              </Label>
              <Input 
                id="headerImageUrl" 
                {...register('headerImageUrl')} 
                className="bg-white transition-all focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              {errors.headerImageUrl && <p className="text-sm text-destructive">{t(errors.headerImageUrl.message as string)}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagramUrl" className="flex items-center gap-2">
                  <Instagram className="h-3.5 w-3.5 text-slate-400" />
                  {t('register.fields.instagramUrl')}
                </Label>
                <Input 
                  id="instagramUrl" 
                  {...register('instagramUrl')} 
                  className="bg-white transition-all focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                {errors.instagramUrl && <p className="text-sm text-destructive">{t(errors.instagramUrl.message as string)}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebookUrl" className="flex items-center gap-2">
                  <Facebook className="h-3.5 w-3.5 text-slate-400" />
                  {t('register.fields.facebookUrl')}
                </Label>
                <Input 
                  id="facebookUrl" 
                  {...register('facebookUrl')} 
                  className="bg-white transition-all focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                {errors.facebookUrl && <p className="text-sm text-destructive">{t(errors.facebookUrl.message as string)}</p>}
              </div>
            </div>
          </div>
        )}

      </CardContent>
      <CardFooter>
        <Button 
          type="submit" 
          className="w-full h-12 text-lg font-bold bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            t('register.form.registerButton')
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
