// src/app/[locale]/registrieren/RegistrationForm.tsx
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
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const registrationSchema = z.object({
  firstName: z.string().min(1, 'errors.required'),
  lastName: z.string().min(1, 'errors.required'),
  email: z.string().email('errors.invalidEmail'),
  whatsapp: z.string().optional(),
  registrationType: z.enum(['private', 'donor', 'retailer', 'premium'], {
    required_error: 'errors.requiredType',
  }),
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
    {[...Array(4)].map((_, i) => (
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
  const t = useTranslations('register');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const handleRegistration = async (data: RegistrationFormData) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(t('submitError'));
      }

      toast({
        title: t('successTitle'),
        description: t('successDescription'),
      });
      reset();
    } catch (error: any) {
      toast({
        title: t('errorTitle'),
        description: error.message || t('submitError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleRegistration)}>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('fields.firstName')}</Label>
            <Input id="firstName" {...register('firstName')} />
            {errors.firstName && (
              <p className="text-sm text-destructive">
                {t(errors.firstName.message as string)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t('fields.lastName')}</Label>
            <Input id="lastName" {...register('lastName')} />
            {errors.lastName && (
              <p className="text-sm text-destructive">
                {t(errors.lastName.message as string)}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('fields.email')}</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && (
            <p className="text-sm text-destructive">
              {t(errors.email.message as string)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">{t('fields.whatsapp')}</Label>
          <Input id="whatsapp" {...register('whatsapp')} />
        </div>

        <div className="space-y-3">
          <Label>{t('fields.registrationType')}</Label>
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
                    <span>{t(option.labelKey)}</span>
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
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            t('submitButton')
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
