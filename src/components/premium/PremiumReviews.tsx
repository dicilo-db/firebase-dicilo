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

    // Calculate rating breakdown distribution
    const totalReviews = reviews.length;
    const distribution = [0, 0, 0, 0, 0]; // 1, 2, 3, 4, 5 stars
    reviews.forEach(r => {
        const rating = Math.min(5, Math.max(1, r.rating || 5));
        distribution[rating - 1]++;
    });

    return (
        <div className="rounded-[2.5rem] border border-white/30 bg-white/40 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col max-h-[550px] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:scale-[1.01]">
            <div className="p-6 border-b border-slate-100 bg-white/60 flex justify-between items-center">
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="h-5.5 w-5.5 text-blue-600 animate-pulse" />
                    {t('reviews.evaluationsTitle', 'Evaluations')}
                </h3>
                <div className="flex items-center gap-1.5 text-sm font-extrabold bg-white/95 px-3 py-1.5 rounded-full border border-gray-200/40 shadow-sm">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="text-slate-800">{clientData.rating_promedio || '0.0'}</span>
                    <span className="text-slate-400 font-semibold">({clientData.total_resenas || reviews.length})</span>
                </div>
            </div>

            {/* Ratings Breakdown Summary Header */}
            {totalReviews > 0 && (
                <div className="p-6 bg-slate-50/50 border-b border-slate-100/50 flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-4xl font-black text-slate-800">{clientData.rating_promedio || '0.0'}</div>
                        <div className="flex gap-0.5 mt-1 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`h-3 w-3 ${star <= Math.round(Number(clientData.rating_promedio || 5)) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`}
                                />
                            ))}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Schnitt</div>
                    </div>
                    <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((stars) => {
                            const count = distribution[stars - 1];
                            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                            return (
                                <div key={stars} className="flex items-center gap-2 text-xs">
                                    <span className="w-3 text-right font-bold text-slate-500">{stars}</span>
                                    <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                                    <div className="flex-1 h-2 bg-slate-200/50 rounded-full overflow-hidden border border-slate-100">
                                        <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="w-6 text-slate-400 font-bold text-left">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="overflow-y-auto flex-1 p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {reviews.map((review) => {
                    const displayName = getDisplayName(review);
                    return (
                        <div key={review.id} className="p-4 bg-white/70 rounded-2xl border border-white hover:border-blue-100 transition-all duration-300 hover:shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-white shadow-sm">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
                                        <AvatarFallback className="font-bold text-sm bg-blue-100/55 text-blue-700">{displayName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 leading-tight">{displayName}</p>
                                        {review.country && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{review.country}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-3 w-3 ${star <= (review.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                "{review.comment}"
                            </p>

                            {review.comment.length > 100 && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="link" className="p-0 h-auto text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors mt-2">
                                            {t('reviews.readMore', 'Read more')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-3xl border border-white/30 bg-white/95 backdrop-blur-xl max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-extrabold text-slate-800">{t('reviews.reviewBy', { name: displayName })}</DialogTitle>
                                            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                {review.createdAt && formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true })}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="mt-4 space-y-4">
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`h-4.5 w-4.5 ${star <= (review.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-slate-600 leading-relaxed font-medium italic text-lg whitespace-pre-wrap">"{review.comment}"</p>
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
