'use client';

import imageCompression from 'browser-image-compression';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, Send, Loader2, X, Lock } from 'lucide-react';
import { nanoid } from 'nanoid';
import { createPostAction } from '@/app/actions/community';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

import { useTranslation } from 'react-i18next';
import { compressVideo } from '@/lib/video-utils';
import { Progress } from '@/components/ui/progress';

interface CreatePostProps {
    userId: string;
    neighborhood: string; // Display Name
    neighborhoodId?: string; // Query/DB ID
    onPostCreated?: () => void;
    mode?: 'public' | 'private';
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

export function CreatePost({ userId, neighborhood, neighborhoodId, onPostCreated, mode = 'public' }: CreatePostProps) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const [content, setContent] = useState('');
    const [mediaItems, setMediaItems] = useState<MediaFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isPrivate = mode === 'private';

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
                    description: `${file.name} no es una imagen ni un vídeo válido.`,
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
                    preview: URL.createObjectURL(file), // Temporary preview
                    type: 'image',
                    status: 'processing',
                    progress: 0,
                    statusText: 'Comprimiendo...'
                };
                itemsToAdd.push(newItem);

                // Options for compression
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
        if (fileInputRef.current) fileInputRef.current.value = '';
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
        if (!content.trim() && mediaItems.length === 0) return;

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('neighborhood', neighborhoodId || neighborhood);
            formData.append('userId', userId);
            formData.append('visibility', mode);

            mediaItems.forEach(item => {
                formData.append('media', item.file);
            });

            const result = await createPostAction(null, formData);

            if (result.success) {
                toast({
                    title: t('success.posted', "Publicado"),
                    description: isPrivate
                        ? "Publicado en tu Círculo Privado."
                        : "Tu mensaje ha sido publicado en el muro.",
                });
                setContent('');
                // Clear all previews
                mediaItems.forEach(item => URL.revokeObjectURL(item.preview));
                setMediaItems([]);
                if (onPostCreated) onPostCreated();
            } else {
                toast({
                    title: t('errors.postFailed', "Error al publicar"),
                    description: result.error || "Hubo un problema al crear la publicación.",
                    variant: "destructive"
                });
            }
        } catch (err) {
            console.error("Submission Error:", err);
            toast({
                title: t('errors.unexpected', "Error inesperado"),
                description: "Ocurrió un error al intentar enviar la publicación.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className={`mb-6 border-none shadow-sm ${isPrivate ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200' : 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800'}`}>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit}>
                    {/* Private Mode Indicator */}
                    {isPrivate && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-amber-700 font-medium">
                            <span className="bg-amber-100 p-1 rounded-full"><Lock size={12} /></span>
                            Tu Círculo Privado
                        </div>
                    )}

                    <Textarea
                        placeholder={isPrivate
                            ? t('social.create_post_private', "¿Qué estás pensando? (Solo para tus amigos)")
                            : t('community.feed.whats_happening', `¿Qué está pasando en ${neighborhood}?`, { name: neighborhood })}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className={`min-h-[100px] resize-none focus-visible:ring-purple-500 mb-4 ${isPrivate
                            ? 'border-amber-200 bg-white placeholder:text-amber-700/50'
                            : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50'
                            }`}
                    />

                    {mediaItems.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                            {mediaItems.map((item, index) => (
                                <div key={item.id} className="relative aspect-square rounded-md overflow-hidden bg-slate-100 group">
                                    {item.status === 'processing' ? (
                                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-purple-500 mb-2" />
                                            <span className="text-[10px] text-center text-slate-500 font-medium">{item.statusText}</span>
                                            {item.progress !== undefined && item.progress > 0 && (
                                                <Progress value={item.progress} className="h-1 mt-2 w-full max-w-[80%]" />
                                            )}
                                        </div>
                                    ) : item.type === 'image' ? (
                                        <Image
                                            src={item.preview}
                                            alt={`Preview ${index}`}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <video
                                            src={item.preview}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                    {item.status === 'ready' && item.type === 'video' && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="bg-black/30 p-2 rounded-full">
                                                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting}
                            >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                {t('community.media', 'Multimedia')}
                            </Button>
                        </div>
                        <Button
                            type="submit"
                            disabled={(!content.trim() && mediaItems.length === 0) || isSubmitting}
                            className={`${isPrivate ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {mediaItems.some(i => i.type === 'image') ? 'Procesando...' : 'Publicando...'}
                                </>
                            ) : (
                                <>
                                    {isPrivate ? <Lock className="h-3 w-3 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                    {t('community.post_btn', 'Publicar')}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
