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
import { Loader2, Camera, Star } from 'lucide-react';
import { submitUGCRecommendation } from '@/app/actions/ugc-recommendation';
import { useTranslation } from 'react-i18next';

interface UGCRecommendationModalProps {
    businessId: string;
    businessName: string;
}

export function UGCRecommendationModal({
    businessId,
    businessName,
}: UGCRecommendationModalProps) {
    const { user } = useAuth(); // We need auth to submit
    const { toast } = useToast();
    const { t } = useTranslation('common'); // Assuming common has some basic strings, or we fallback
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [comment, setComment] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({
                title: "Login Required",
                description: "Please login to make a recommendation.",
                variant: "destructive"
            });
            return;
        }
        if (!photo) {
            toast({
                title: "Photo Required",
                description: "Please upload a photo of your experience.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('photo', photo);
            formData.append('comment', comment);
            formData.append('businessId', businessId);
            formData.append('userId', user.uid);
            formData.append('userName', user.displayName || 'Anonymous');

            const result = await submitUGCRecommendation(formData);

            if (result.success) {
                toast({
                    title: "Recommendation Sent!",
                    description: "Thanks! We will review it shortly.",
                });
                setIsOpen(false);
                setComment('');
                setPhoto(null);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit recommendation.",
                variant: "destructive"
            });
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
                        Sube una foto y cuéntanos tu experiencia para ganar Dicipoints.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="photo">Tu Foto (Prueba de compra/visita)</Label>
                        <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                            disabled={isSubmitting}
                        />
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
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Recomendación
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
