'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, Send, Loader2, X, Lock } from 'lucide-react';
import { createPostAction } from '@/app/actions/community';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

import { useTranslation } from 'react-i18next';

interface CreatePostProps {
    userId: string;
    neighborhood: string; // Display Name
    neighborhoodId?: string; // Query/DB ID
    onPostCreated?: () => void;
    mode?: 'public' | 'private';
}

export function CreatePost({ userId, neighborhood, neighborhoodId, onPostCreated, mode = 'public' }: CreatePostProps) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isPrivate = mode === 'private';

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    title: t('errors.tooLarge', "Archivo muy grande"),
                    description: "La imagen no puede pesar más de 5MB.",
                    variant: "destructive"
                });
                return;
            }
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageFile) return;

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('content', content);
            // Use ID if available, otherwise fallback to neighborhood (which might be the ID if not passed)
            formData.append('neighborhood', neighborhoodId || neighborhood);
            formData.append('userId', userId);

            // NEW: Visibility
            formData.append('visibility', mode);

            if (imageFile) {
                formData.append('image', imageFile);
            }

            const result = await createPostAction(null, formData);

            if (result.success) {
                toast({
                    title: t('success.posted', "Publicado"),
                    description: isPrivate
                        ? "Publicado en tu Círculo Privado."
                        : "Tu mensaje ha sido publicado en el muro.",
                });
                setContent('');
                removeImage();
                if (onPostCreated) onPostCreated();
            } else {
                console.error("Server Action Error:", result.error);
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

                    {imagePreview && (
                        <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden bg-slate-100">
                            <Image
                                src={imagePreview}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                {t('form.photo', 'Foto')}
                            </Button>
                        </div>
                        <Button
                            type="submit"
                            disabled={(!content.trim() && !imageFile) || isSubmitting}
                            className={`${isPrivate ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {imageFile ? 'Analizando seguridad...' : 'Publicando...'}
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
