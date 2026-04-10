import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Star, Upload, Video, X, Loader2 } from 'lucide-react';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressVideo } from '@/lib/video-utils';

const db = getFirestore(app);
const storage = getStorage(app);

export function VideoFeedbackUploader({ formData, uid }: { formData: any, uid: string }) {
    const { t } = useTranslation(['common', 'admin']);
    const { toast } = useToast();
    
    const [rating, setRating] = useState(0);
    const [message, setMessage] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState(0);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast({ title: 'Error', description: 'Por favor selecciona un archivo de video.', variant: 'destructive' });
            return;
        }

        // Limit roughly to mobile cameras. Web limit compresses later.
        if (file.size > 150 * 1024 * 1024) { 
            toast({ title: 'Video muy pesado', description: 'El video debe pesar menos de 150MB para comprimirse.', variant: 'destructive' });
            return;
        }
        
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
        setVideoFile(file);
    };

    const clearVideo = () => {
        setVideoFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
        setCompressionProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendFeedback = async () => {
        if (!message.trim() && !videoFile) {
            toast({ title: 'Requerido', description: 'Por favor añade un comentario o un video.', variant: 'destructive' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            let finalVideoUrl = '';

            if (videoFile) {
                // Compress Video First
                setCompressionProgress(10);
                const webmBlob = await compressVideo(videoFile, 50, (p) => {
                    setCompressionProgress(10 + Math.floor(p * 0.5)); // 10% -> 60%
                });

                if (!webmBlob) throw new Error("Video compression returned null");

                const storageRef = ref(storage, `feedbacks/videos/${uid}_${Date.now()}.webm`);
                
                // Uploading
                setCompressionProgress(70);
                await uploadBytes(storageRef, webmBlob);
                
                setCompressionProgress(95);
                finalVideoUrl = await getDownloadURL(storageRef);
            }

            // Save Metadata
            await addDoc(collection(db, 'feedbacks'), {
                name: (formData.firstName || '') + ' ' + (formData.lastName || ''),
                email: formData.email || '',
                rating: rating,
                message: message,
                country: formData.country || 'Unknown',
                city: formData.city || 'Unknown',
                customerType: 'private',
                createdAt: new Date(),
                videoUrl: finalVideoUrl,
                status: 'pending',     // Require admin approval
                isPublic: true,        // Intended for public use
                rewardPreference: formData.profileData?.rewardPreference || 'none',
                uid: uid
            });
            
            toast({
                title: t('benefits.feedback.successTitle', '¡Gracias!'),
                description: 'Tu opinión ha sido enviada con éxito. Será revisada y publicada pronto.'
            });
            
            setMessage('');
            setRating(0);
            clearVideo();

        } catch (error: any) {
            console.error('Feedback error:', error);
            toast({
                title: t('benefits.feedback.errorTitle', 'Error'),
                description: 'No se pudo enviar: ' + (error.message || 'Intente de nuevo.'),
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
            setCompressionProgress(0);
        }
    };

    return (
        <Card className="border-green-600/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <CardHeader className="pl-6 pb-2">
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-500">
                    <Video className="w-5 h-5" /> 
                    {t('dashboard.yourOpinions', 'Tus opiniones')}
                </CardTitle>
                <CardDescription>
                    {t('dashboard.copyOpinionsDesc', 'Espacio donde se comparten las opiniones del usuario. Déjanos tu video-reseña.')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pl-6">
                
                {/* CALIFICACIÓN ESTRELLAS */}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tu calificación</Label>
                    <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`cursor-pointer h-6 w-6 transition-colors ${
                                    star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 dark:text-slate-800'
                                }`}
                                onClick={() => setRating(star)}
                            />
                        ))}
                    </div>
                </div>

                {/* TEXT AREA */}
                <div className="space-y-1">
                    <Textarea
                        placeholder="Escribe tu reseña..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border-none resize-none"
                    />
                </div>

                {/* VIDEO PREVIEW OR UPLOAD BUTTON */}
                <div className="space-y-2 mt-2">
                    {previewUrl ? (
                        <div className="relative w-full rounded-md overflow-hidden bg-black border">
                            <video src={previewUrl} controls className="w-full h-auto max-h-[250px] object-contain" />
                            {!isSubmitting && (
                                <Button 
                                    size="icon" 
                                    variant="destructive" 
                                    className="absolute top-2 right-2 w-7 h-7 rounded-full opacity-80" 
                                    onClick={clearVideo}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="w-full border-2 border-dashed border-green-200 dark:border-green-900/50 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-green-50/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                accept="video/*" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleFileSelect}
                            />
                            <div className="bg-red-500 rounded-lg p-3 text-white mb-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19.615 3.184C20.697 3.398 21.6 4.301 21.815 5.385C22 6.326 22 8.428 22 12C22 15.572 22 17.674 21.815 18.615C21.602 19.699 20.699 20.602 19.615 20.815C18.674 21 16.572 21 13 21H11C7.428 21 5.326 21 4.385 20.815C3.301 20.602 2.398 19.699 2.185 18.615C2 17.674 2 15.572 2 12C2 8.428 2 6.326 2.185 5.385C2.398 4.301 3.301 3.398 4.385 3.184C5.326 3 7.428 3 11 3H13C16.572 3 18.674 3 19.615 3.184Z" fill="white"/>
                                    <path d="M10.5 8V16L16 12L10.5 8Z" fill="#ef4444"/>
                                </svg>
                            </div>
                            <h4 className="font-semibold text-sm">Sube tu Video Reseña</h4>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                {t('dashboard.uploadVideoLimit', 'Sube un video corto (Máximo 60 segundos)')}
                            </p>
                        </div>
                    )}
                </div>

                <Button 
                    variant="default" 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={handleSendFeedback} 
                    disabled={isSubmitting || (!message.trim() && !videoFile)}
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {compressionProgress > 0 && compressionProgress < 100 
                                ? `Procesando... ${compressionProgress}%`
                                : `Enviando...`
                            }
                        </div>
                    ) : (
                        'Enviar Opinión'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
