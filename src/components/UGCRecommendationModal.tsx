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
import { Loader2, Camera, Star, X, Film, PlusCircle } from 'lucide-react';
import { submitUGCRecommendation } from '@/app/actions/ugc-recommendation';
import { useTranslation } from 'react-i18next';
import imageCompression from 'browser-image-compression';
import Image from 'next/image';
import { nanoid } from 'nanoid';
import { compressVideo } from '@/lib/video-utils';
import { Progress } from '@/components/ui/progress';

interface UGCRecommendationModalProps {
    businessId: string;
    businessName: string;
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

        const itemsToAdd: MediaFile[] = [];

        for (const file of selectedFiles) {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');
            const id = nanoid();

            if (!isImage && !isVideo) {
                toast({
                    title: "Archivo no soportado",
                    description: "Solo se permiten imágenes y vídeos.",
                    variant: "destructive"
                });
                continue;
            }

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
                        setMediaItems(prev => prev.map(item => 
                            item.id === id ? { ...item, progress: p.percentage, statusText: p.status } : item
                        ));
                    }).then(compressedFile => {
                        const newPreview = URL.createObjectURL(compressedFile);
                        setMediaItems(prev => prev.map(item => {
                            if (item.id === id) {
                                if (item.preview) URL.revokeObjectURL(item.preview);
                                return { ...item, file: compressedFile, preview: newPreview, status: 'ready', progress: 100, statusText: '' };
                            }
                            return item;
                        }));
                    }).catch(error => {
                        console.error("Video compression failed:", error);
                        setMediaItems(prev => prev.map(item => 
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
                    
                    setMediaItems(prev => prev.map(item => {
                        if (item.id === id) {
                            if (item.preview) URL.revokeObjectURL(item.preview);
                            return { ...item, file: webpFile, preview: newPreview, status: 'ready', progress: 100, statusText: '' };
                        }
                        return item;
                    }));
                }).catch(error => {
                    console.error("Image compression failed:", error);
                    setMediaItems(prev => prev.map(item => 
                        item.id === id ? { ...item, status: 'ready', statusText: '' } : item
                    ));
                });
            }
        }

        setMediaItems(prev => [...prev, ...itemsToAdd]);
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
                                <div key={item.id} className="relative aspect-square rounded-md overflow-hidden bg-slate-100 group">
                                    {item.status === 'processing' ? (
                                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-purple-500 mb-1" />
                                            <span className="text-[8px] text-center text-slate-500 font-medium">{item.statusText}</span>
                                            {item.progress !== undefined && item.progress > 0 && (
                                                <Progress value={item.progress} className="h-1 mt-1 w-full max-w-[80%]" />
                                            )}
                                        </div>
                                    ) : item.type === 'image' ? (
                                        <Image src={item.preview} alt="Preview" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                            <Film className="h-6 w-6 text-slate-500" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full z-10"
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
