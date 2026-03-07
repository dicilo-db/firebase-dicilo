'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Star, X, Film } from 'lucide-react';
import { submitUGCRecommendation } from '@/app/actions/ugc-recommendation';
import { useTranslation } from 'react-i18next';
import imageCompression from 'browser-image-compression';
import Image from 'next/image';

interface UGCRecommendationModalProps {
    businessId: string;
    businessName: string;
}

interface MediaFile {
    file: File;
    preview: string;
    type: 'image' | 'video';
}

export function UGCRecommendationModal({
    businessId,
    businessName,
}: UGCRecommendationModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [comment, setComment] = useState('');
    const [mediaItems, setMediaItems] = useState<MediaFile[]>([]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        const newMediaItems: MediaFile[] = [];

        for (const file of selectedFiles) {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');

            if (!isImage && !isVideo) {
                toast({
                    title: "Archivo no soportado",
                    description: "Solo se permiten imágenes y vídeos.",
                    variant: "destructive"
                });
                continue;
            }

            if (isVideo) {
                if (file.size > 50 * 1024 * 1024) {
                    toast({
                        title: "Vídeo demasiado grande",
                        description: "Máximo 50MB.",
                        variant: "destructive"
                    });
                    continue;
                }
                newMediaItems.push({
                    file,
                    preview: URL.createObjectURL(file),
                    type: 'video'
                });
            } else if (isImage) {
                const options = {
                    maxSizeMB: 0.8,
                    maxWidthOrHeight: 1600,
                    useWebWorker: true,
                    fileType: 'image/webp' as any
                };

                try {
                    const compressedFile = await imageCompression(file, options);
                    const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    const webpFile = new File([compressedFile], fileName, { type: 'image/webp' });

                    newMediaItems.push({
                        file: webpFile,
                        preview: URL.createObjectURL(webpFile),
                        type: 'image'
                    });
                } catch (error) {
                    console.error("Compression error:", error);
                    newMediaItems.push({
                        file,
                        preview: URL.createObjectURL(file),
                        type: 'image'
                    });
                }
            }
        }

        setMediaItems(prev => [...prev, ...newMediaItems]);
        e.target.value = '';
    };

    const removeMedia = (index: number) => {
        setMediaItems(prev => {
            const item = prev[index];
            if (item.preview) URL.revokeObjectURL(item.preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Login Required", variant: "destructive" });
            return;
        }
        if (mediaItems.length === 0) {
            toast({ title: "Foto/Video requerido", description: "Sube al menos una foto o video.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            mediaItems.forEach(item => {
                formData.append('media', item.file);
            });
            formData.append('comment', comment);
            formData.append('businessId', businessId);
            formData.append('userId', user.uid);
            formData.append('userName', user.displayName || 'Anonymous');

            const result = await submitUGCRecommendation(formData);

            if (result.success) {
                toast({ title: "¡Recomendación enviada!", description: "Gracias por compartir tu experiencia." });
                setIsOpen(false);
                setComment('');
                mediaItems.forEach(i => URL.revokeObjectURL(i.preview));
                setMediaItems([]);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Error al enviar.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold">
                    <Camera className="h-4 w-4" />
                    <span className="hidden sm:inline">Recomendar</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Recomendar {businessName}</DialogTitle>
                    <DialogDescription>
                        Sube fotos o vídeos y cuéntanos tu experiencia.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Fotos y Vídeos</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {mediaItems.map((item, index) => (
                                <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-slate-100 group">
                                    {item.type === 'image' ? (
                                        <Image src={item.preview} alt="Preview" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                            <Film className="h-6 w-6 text-slate-500" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:border-slate-400 transition-colors">
                                <PlusCircle className="h-6 w-6 text-slate-400" />
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isSubmitting}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="comment">Comentario (Opcional)</Label>
                        <Textarea
                            id="comment"
                            placeholder={`¿Qué te gustó de ${businessName}?`}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Recomendación
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
