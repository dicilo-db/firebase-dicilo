'use client';

import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Camera, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitRecommendation } from '@/app/actions/recommendation';
import { useTranslation } from 'react-i18next';

interface RecommendationModalProps {
    businessId: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function RecommendationModal({
    businessId,
    trigger,
    open,
    onOpenChange,
}: RecommendationModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Internal state if uncontrolled
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPhotoPreview(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(event.currentTarget);
            // Append businessId manually if not in a hidden input, but verify hidden input presence
            // We will use hidden input in JSX

            const result = await submitRecommendation(null, formData);

            if (result.success) {
                toast({
                    title: "Recommendation Sent!",
                    description: "Thanks for your contribution. It will be reviewed shortly.",
                });
                setIsOpen(false);
                formRef.current?.reset();
                setPhotoPreview(null);
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Something went wrong.",
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    const { t } = useTranslation('common');

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('community.recommend_business', 'Recomendar Negocio')}</DialogTitle>
                    <DialogDescription>
                        {t('community.recommend_desc', 'Sube una foto y cuéntanos tu experiencia para ganar puntos.')}
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="businessId" value={businessId} />

                    <div className="grid gap-2">
                        <Label htmlFor="photo">{t('community.photo', 'Foto')}</Label>
                        <div className="flex items-center gap-4">
                            <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-md border border-dashed bg-slate-50">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover rounded-md" />
                                ) : (
                                    <Camera className="h-8 w-8 text-slate-300" />
                                )}
                            </div>
                            <Input
                                id="photo"
                                name="photo"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                required
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="userName">{t('community.your_name', 'Tu Nombre')}</Label>
                        <Input id="userName" name="userName" placeholder="Juan Pérez" required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="userContact">{t('community.email_whatsapp_opt', 'Email o WhatsApp (Opcional)')}</Label>
                        <Input id="userContact" name="userContact" placeholder="Para notificarte de puntos" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="comment">{t('community.comment_label', 'Comentario')}</Label>
                        <Textarea
                            id="comment"
                            name="comment"
                            placeholder={t('community.comment_placeholder', '¿Qué te gustó más?')}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('community.send_recommendation', 'Enviar Recomendación')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

