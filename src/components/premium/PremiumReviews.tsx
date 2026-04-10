'use client';

import React, { useEffect, useState } from 'react';
import { ClientData } from '@/types/client';
import { getFirestore, collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import { Star, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { RecommendationModal } from '../recommendations/recommendation-modal';

interface Recommendation {
    id: string;
    name?: string;     // Legacy
    userName?: string; // New standard
    lastName?: string;
    comment: string;
    country?: string;
    rating?: number;
    createdAt?: any;
    status?: string;
}

interface PremiumReviewsProps {
    clientData: ClientData;
}

export const PremiumReviews: React.FC<PremiumReviewsProps> = ({ clientData }) => {
    const { t } = useTranslation('client');
    const [reviews, setReviews] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const db = getFirestore(app);
        const reviewsRef = collection(db, 'clients', clientData.id, 'recommendations');
        // Filter by approved status to ensure only moderated content is shown
        const q = query(
            reviewsRef,
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedRecommendations: Recommendation[] = [];
            snapshot.forEach((doc) => {
                fetchedRecommendations.push({ id: doc.id, ...doc.data() } as Recommendation);
            });
            setReviews(fetchedRecommendations);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reviews:", error);
            // If index is missing, it might fail. 
            setLoading(false);
        });

        return () => unsubscribe();
    }, [clientData.id]);

    if (loading) return <div className="h-40 w-full animate-pulse bg-gray-100 rounded-xl" />;

    // Helper to get display name
    const getDisplayName = (r: Recommendation) => {
        if (r.userName) return r.userName;
        const first = r.name || 'Anonymous';
        const last = r.lastName || '';
        return `${first} ${last}`.trim();
    };

    if (reviews.length === 0) {
        return (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-bold">{t('reviews.title', 'What others think')}</h3>
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="mb-4">{t('reviews.beTheFirst', 'Be the first to recommend {{name}}!', { name: clientData.clientName })}</p>
                    <RecommendationModal
                        businessId={clientData.id}
                        trigger={
                            <Button variant="outline" size="sm">
                                {t('reviews.writeReview', 'Escribir reseña')}
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col max-h-[400px]">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-bold">{t('reviews.evaluationsTitle', 'Evaluations')}</h3>
                <div className="flex items-center gap-1 text-sm font-medium bg-white px-2 py-1 rounded-full border">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span>{clientData.rating_promedio || '0.0'}</span>
                    <span className="text-gray-400">({clientData.total_resenas || reviews.length})</span>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
                {reviews.map((review) => {
                    const displayName = getDisplayName(review);
                    return (
                        <div key={review.id} className="border-b last:border-0 pb-4">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
                                        <AvatarFallback>{displayName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{displayName}</p>
                                        {review.country && <p className="text-xs text-gray-400">{review.country}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-3 w-3 ${star <= (review.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>

                            {review.comment.length > 100 && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="link" className="p-0 h-auto text-xs text-primary mt-1">
                                            {t('reviews.readMore', 'Read more')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{t('reviews.reviewBy', { name: displayName })}</DialogTitle>
                                            <DialogDescription className="text-sm text-gray-500">
                                                {review.createdAt && formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true })}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="mt-4">
                                            <div className="flex items-center gap-1 mb-4">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`h-4 w-4 ${star <= (review.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
