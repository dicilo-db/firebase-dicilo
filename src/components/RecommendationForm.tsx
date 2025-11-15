'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { Label } from './ui/label';

// Definir el esquema de validación con Zod
const formSchema = z.object({
  companyName: z.string().min(2, 'companyNameRequired'),
  contactName: z.string().optional(),
  email: z.string().email('invalidEmail').optional().or(z.literal('')),
  phone: z.string().optional(),
  category: z.string().optional(),
  comments: z.string().optional(),
});

type RecommendationFormValues = z.infer<typeof formSchema>;

interface RecommendationFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialBusinessName?: string;
}

const firestoreDb = getFirestore(app);

export function RecommendationForm({
  isOpen,
  setIsOpen,
  initialBusinessName,
}: RecommendationFormProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<RecommendationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: initialBusinessName || '',
      contactName: '',
      email: '',
      phone: '',
      category: '',
      comments: '',
    },
  });

  useEffect(() => {
    if (initialBusinessName) {
      form.setValue('companyName', initialBusinessName);
    }
  }, [initialBusinessName, form]);

  const onSubmit = async (values: RecommendationFormValues) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestoreDb, 'recommendations'), {
        ...values,
        timestamp: new Date(),
        source: 'search_page_recommendation',
      });
      toast({
        title: t('form.successTitle'),
        description: t('form.successDesc'),
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error('Error al enviar la recomendación:', error);
      toast({
        title: t('form.errorTitle'),
        description: t('form.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('form.title')}</DialogTitle>
          <DialogDescription>{t('form.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">
              {t('form.companyNamePlaceholder')}
            </Label>
            <Input
              id="companyName"
              {...form.register('companyName')}
              className={
                form.formState.errors.companyName ? 'border-destructive' : ''
              }
              disabled={isSubmitting}
            />
            {form.formState.errors.companyName && (
              <p className="text-sm text-destructive">
                {t(`form.${form.formState.errors.companyName.message}`)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">
              {t('form.contactNamePlaceholder')}
            </Label>
            <Input
              id="contactName"
              {...form.register('contactName')}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('form.emailPlaceholder')}</Label>
            <Input
              id="email"
              {...form.register('email')}
              type="email"
              disabled={isSubmitting}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {t(`form.${form.formState.errors.email.message}`)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('form.phonePlaceholder')}</Label>
            <Input
              id="phone"
              {...form.register('phone')}
              type="tel"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">{t('form.categoryPlaceholder')}</Label>
            <Input
              id="category"
              {...form.register('category')}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comments">{t('form.commentsPlaceholder')}</Label>
            <Textarea
              id="comments"
              {...form.register('comments')}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                {t('cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                t('form.submitButton')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
