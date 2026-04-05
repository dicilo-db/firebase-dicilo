'use client';

import imageCompression from 'browser-image-compression';
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTrustBoardPost } from '@/app/actions/trustboard';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { nanoid } from 'nanoid';
import Image from 'next/image';

interface MediaFile {
    id: string;
    file: File;
    preview: string;
    type: 'image' | 'video';
    status?: 'processing' | 'ready' | 'error';
    progress?: number;
    statusText?: string;
}

export function TrustBoardPostForm({ neighborhood, onSuccess, onCancel }: { neighborhood: string, onSuccess: () => void, onCancel: () => void }) {
    const { t, i18n } = useTranslation('common');
    const { user } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [loading, setLoading] = useState(false);
    const [mediaItems, setMediaItems] = useState<MediaFile[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'jobs'
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        if (mediaItems.length + selectedFiles.length > 6) {
            toast({
                title: t('errors.too_many_files', "Límite superado"),
                description: t('errors.max_6_files', "Solo puedes subir hasta 6 fotos o vídeos en un anuncio."),
                variant: "destructive"
            });
            return;
        }

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
                if (file.size > 25 * 1024 * 1024) {
                    toast({
                        title: "Archivo demasiado grande",
                        description: `El video ${file.name} supera el límite de 25MB permitido.`,
                        variant: "destructive"
                    });
                    continue;
                }
                const newItem: MediaFile = {
                    id, file, preview: URL.createObjectURL(file), type: 'video', status: 'ready', progress: 100, statusText: ''
                };
                itemsToAdd.push(newItem);
            } else if (isImage) {
                const newItem: MediaFile = {
                    id, file, preview: URL.createObjectURL(file), type: 'image', status: 'processing', progress: 0, statusText: 'Comprimiendo...'
                };
                itemsToAdd.push(newItem);

                const options = {
                    maxSizeMB: 0.8,
                    maxWidthOrHeight: 1280,
                    useWebWorker: true,
                    fileType: 'image/webp' as any
                };

                imageCompression(file, options).then(compressedFile => {
                    const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    let webpFile;
                    try {
                        webpFile = new File([compressedFile], fileName, { type: 'image/webp' });
                    } catch (e) {
                        webpFile = compressedFile as any;
                        webpFile.name = fileName;
                        webpFile.lastModified = new Date().getTime();
                    }
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
                    setMediaItems(prev => prev.map(item => item.id === id ? { ...item, status: 'ready', statusText: '' } : item));
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
        if (!user) return;
        
        // Prevent submission if still compressing
        if (mediaItems.some(i => i.status === 'processing')) {
             toast({ title: 'Procesando imágenes', description: 'Espera a que termine la compresión de las imágenes.' });
             return;
        }

        const totalSize = mediaItems.reduce((acc, item) => acc + item.file.size, 0);
        if (totalSize > 50 * 1024 * 1024) { 
            toast({
                title: "Archivos demasiado pesados",
                description: "El tamaño total de tu publicación supera el límite de 50MB.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('userId', user.uid);
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('category', formData.category);
            submitData.append('neighborhood', neighborhood);
            submitData.append('lang', i18n.language.substring(0, 2));

            mediaItems.forEach(item => submitData.append('media', item.file));

            const result = await createTrustBoardPost(null, submitData);
            
            if (result.success) {
                toast({
                    title: t('community.trustboard.form.success_title', '¡Anuncio Publicado!'),
                    description: t('community.trustboard.form.success_desc', 'Tu anuncio pasará por la revisión automática de Dicilo y será visible pronto.'),
                    className: "bg-emerald-50 border-emerald-200 text-emerald-800"
                });
                mediaItems.forEach(item => URL.revokeObjectURL(item.preview));
                onSuccess();
            } else {
                toast({
                    title: t('community.trustboard.form.error_title', 'Límite Alcanzado o Error'),
                    description: result.error,
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: t('community.trustboard.form.unexpected_title', 'Error Inesperado'),
                description: error.message || t('community.trustboard.form.unexpected_desc', 'Revisa tu conexión e inténtalo de nuevo.'),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label>{t('community.trustboard.form.category', 'Categoría')}</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('community.trustboard.form.cat_placeholder', 'Selecciona una especialidad')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="jobs">{t('community.trustboard.cat_jobs', 'Dicilo Jobs (Empleos locales)')}</SelectItem>
                        <SelectItem value="living">{t('community.trustboard.cat_living', 'Dicilo Living (Vivienda/Compañeros)')}</SelectItem>
                        <SelectItem value="talent">{t('community.trustboard.cat_talent', 'Dicilo Talent (Servicios/Mentores)')}</SelectItem>
                        <SelectItem value="swap">{t('community.trustboard.cat_swap', 'Gift/Swap (Intercambio/Regalos)')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>{t('community.trustboard.form.title', 'Título del Anuncio')}</Label>
                <Input 
                    required 
                    maxLength={100}
                    placeholder={t('community.trustboard.form.title_ph', 'Ej. Clases de Alemán Nivel C1')} 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label>{t('community.trustboard.form.desc', 'Descripción')}</Label>
                <Textarea 
                    required 
                    maxLength={1500}
                    className="min-h-[120px]"
                    placeholder={t('community.trustboard.form.desc_ph', 'Detalla qué ofreces o qué buscas...')} 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            {mediaItems.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                    {mediaItems.map((item, index) => (
                        <div key={item.id} className="relative aspect-square rounded-md overflow-hidden bg-slate-100 group">
                            {item.status === 'processing' ? (
                                <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary mb-1" />
                                    <span className="text-[9px] text-center text-slate-500 font-medium">{item.statusText}</span>
                                </div>
                            ) : item.type === 'image' ? (
                                <Image src={item.preview} alt={`Preview ${index}`} fill className="object-cover" />
                            ) : (
                                <video src={item.preview} className="w-full h-full object-cover" />
                            )}
                            <button
                                type="button"
                                onClick={() => removeMedia(index)}
                                className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="flex items-center">
                <input type="file" accept="image/*,video/*" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading || mediaItems.length >= 6}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {t('community.media', 'Multimedia')} ({mediaItems.length}/6)
                </Button>
            </div>
            
            <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                💡 {t('community.trustboard.form.note', 'Nota: Este anuncio se publicará en')} <strong>{neighborhood}</strong>. 
                {t('community.trustboard.form.note_premium', 'Si eres usuario premium, Cerebro DiciBot traducirá este anuncio automáticamente a los otros 11 idiomas.')}
            </p>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    {t('community.trustboard.form.cancel', 'Cancelar')}
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('community.trustboard.form.submit', 'Publicar Anuncio')}
                </Button>
            </div>
        </form>
    );
}
