'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, Send, Loader2, X } from 'lucide-react';
import { createPostAction } from '@/app/actions/community';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface CreatePostProps {
    userId: string;
    neighborhood: string;
    onPostCreated?: () => void;
}

export function CreatePost({ userId, neighborhood, onPostCreated }: CreatePostProps) {
    const { toast } = useToast();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    title: "Archivo muy grande",
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
            formData.append('neighborhood', neighborhood);
            formData.append('userId', userId);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const result = await createPostAction(null, formData);

            if (result.success) {
                toast({
                    title: "Publicado",
                    description: "Tu mensaje ha sido publicado en el muro.",
                });
                setContent('');
                removeImage();
                if (onPostCreated) onPostCreated();
            } else {
                console.error("Server Action Error:", result.error);
                toast({
                    title: "Error al publicar",
                    description: result.error || "Hubo un problema al crear la publicación.",
                    variant: "destructive"
                });
            }
        } catch (err) {
            console.error("Submission Error:", err);
            toast({
                title: "Error inesperado",
                description: "Ocurrió un error al intentar enviar la publicación.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="mb-6 border-none shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit}>
                    <Textarea
                        placeholder={`¿Qué está pasando en ${neighborhood}?`}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[100px] border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 resize-none focus-visible:ring-purple-500 mb-4"
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
                                Foto
                            </Button>
                        </div>
                        <Button
                            type="submit"
                            disabled={(!content.trim() && !imageFile) || isSubmitting}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {imageFile ? 'Analizando seguridad...' : 'Publicando...'}
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Publicar
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
