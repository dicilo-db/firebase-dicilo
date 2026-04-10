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
import { Loader2, Camera, Upload, Star, X, Film } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitRecommendation } from '@/app/actions/recommendation';
import { useTranslation } from 'react-i18next';
import imageCompression from 'browser-image-compression';

interface RecommendationModalProps {
    businessId: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

interface MediaFile {
    file: File;
    preview: string;
    type: 'image' | 'video';
}

export function RecommendationModal({
    businessId,
    trigger,
    open,
    onOpenChange,
}: RecommendationModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [media, setMedia] = useState<MediaFile[]>([]);
    const [rating, setRating] = useState(5);
    const formRef = useRef<HTMLFormElement>(null);

    // Internal state if uncontrolled
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    const options = {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1200,
                        useWebWorker: true,
                        fileType: 'image/webp'
                    };
                    const compressedFile = await imageCompression(file, options);
                    const preview = URL.createObjectURL(compressedFile);
                    setMedia(prev => [...prev, { file: compressedFile, preview, type: 'image' }]);
                } catch (error) {
                    console.error("Compression error:", error);
                    const preview = URL.createObjectURL(file);
                    setMedia(prev => [...prev, { file, preview, type: 'image' }]);
                }
            } else if (file.type.startsWith('video/')) {
                if (file.size > 50 * 1024 * 1024) {
                    toast({ title: 'Error', description: 'Video too large (max 50MB)', variant: 'destructive' });
                    continue;
                }
                const preview = URL.createObjectURL(file);
                setMedia(prev => [...prev, { file, preview, type: 'video' }]);
            }
        }
    };

    const removeMedia = (index: number) => {
        setMedia(prev => {
            const newMedia = [...prev];
            URL.revokeObjectURL(newMedia[index].preview);
            newMedia.splice(index, 1);
            return newMedia;
        });
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(event.currentTarget);
            // Append businessId manually if not in a hidden input, but verify hidden input presence
            // We will use hidden input in JSX
            media.forEach(m => {
                formData.append('media', m.file);
            });

            const result = await submitRecommendation(null, formData);

            if (result.success) {
                toast({
                    title: t('recommendationModal.successTitle', 'Recommendation Sent!'),
                    description: t('recommendationModal.successMessage', 'Thanks for your contribution.'),
                });
                setIsOpen(false);
                formRef.current?.reset();
                media.forEach(m => URL.revokeObjectURL(m.preview));
                setMedia([]);
                setRating(5);
            } else {
                toast({
                    title: t('recommendationModal.errorTitle', 'Error'),
                    description: result.message,
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: t('recommendationModal.errorTitle', 'Error'),
                description: t('recommendationModal.errorGeneric', 'Something went wrong.'),
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    const { t } = useTranslation('client');

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('recommendationModal.title', 'Recomendar Negocio')}</DialogTitle>
                    <DialogDescription>
                        {t('recommendationModal.description', 'Sube fotos o vídeos y cuéntanos tu experiencia.')}
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="businessId" value={businessId} />

                    <div className="grid gap-2">
                        <Label>{t('recommendationModal.photoLabel', 'Media (Fotos/Vídeos)')}</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {media.map((item, index) => (
                                <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-slate-100 group">
                                    {item.type === 'image' ? (
                                        <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                            <Film className="h-6 w-6 text-slate-400" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-2 w-2" />
                                    </button>
                                </div>
                            ))}
                            {media.length < 4 && (
                                <label className="aspect-square flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                                    <Upload className="h-5 w-5 text-slate-400" />
                                    <span className="text-[8px] text-slate-500 mt-1">{t('upload', 'Subir')}</span>
                                    <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileChange} />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="userName">{t('recommendationModal.yourName', 'Tu Nombre')}</Label>
                        <Input id="userName" name="userName" placeholder={t('recommendationForm.name', 'Nombre')} required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="userContact">{t('recommendationModal.emailOptional', 'Email o WhatsApp (Opcional)')}</Label>
                        <Input id="userContact" name="userContact" placeholder={t('recommendationForm.emailPlaceholder', 'Email')} />
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('recommendationModal.rate', 'Calificación')}</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={`h-6 w-6 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                    />
                                </button>
                            ))}
                        </div>
                        <input type="hidden" name="rating" value={rating} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="comment">{t('recommendationModal.commentLabel', 'Comentario')}</Label>
                        <Textarea
                            id="comment"
                            name="comment"
                            placeholder={t('recommendationModal.commentPlaceholder', '¿Qué te gustó más?')}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('recommendationModal.send', 'Enviar Recomendación')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
