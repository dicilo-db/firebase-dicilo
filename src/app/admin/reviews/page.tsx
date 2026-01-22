'use client';

import React, { useEffect, useState } from 'react';
import {
    getFirestore,
    collectionGroup,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    limit
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Trash2, CheckCircle, XCircle, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Review {
    id: string;
    refPath: string; // To know where to update/delete
    clientName?: string;
    userName: string;
    rating: number;
    comment: string;
    status: 'approved' | 'rejected' | 'pending';
    createdAt: any;
}

export default function AdminReviewsPage() {
    const { t } = useTranslation('admin');
    const { toast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    // Guard: Only admins
    useAuthGuard(['admin', 'superadmin']);

    useEffect(() => {
        const db = getFirestore(app);
        // Important: collectionGroup query requires an Index in Firestore!
        const q = query(
            collectionGroup(db, 'recommendations'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: Review[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                fetched.push({
                    id: doc.id,
                    refPath: doc.ref.path,
                    clientName: data.clientName || 'Unknown Client',
                    userName: data.name ? `${data.name} ${data.lastName || ''}`.trim() : 'Anonymous',
                    rating: data.rating || 5,
                    comment: data.comment || '',
                    status: data.status || 'pending',
                    createdAt: data.createdAt,
                });
            });
            setReviews(fetched);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reviews (Check Firestore Indexes):", error);
            setLoading(false);
            toast({
                title: "Error fetching reviews",
                description: "Check console for Index link if this is the first run.",
                variant: 'destructive'
            });
        });

        return () => unsubscribe();
    }, [toast]);

    const handleStatusChange = async (review: Review, newStatus: 'approved' | 'rejected') => {
        const db = getFirestore(app);
        const ref = doc(db, review.refPath);
        try {
            await updateDoc(ref, { status: newStatus });
            toast({ title: t('common.success', 'Success'), description: `Review ${newStatus}` });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', variant: 'destructive' });
        }
    };

    const handleDelete = async (review: Review) => {
        if (!confirm(t('clientReviews.actions.confirmDelete', 'Are you sure you want to delete this review permanently?'))) return;

        const db = getFirestore(app);
        const ref = doc(db, review.refPath);
        try {
            await deleteDoc(ref);
            toast({ title: 'Review deleted' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', variant: 'destructive' });
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-gray-50 p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t('clientReviews.title', 'Review Management')}</h1>
                    <p className="text-gray-500">{t('clientReviews.subtitle', 'Moderate all client reviews in one place.')}</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/admin/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t('clientReviews.backToDashboard', 'Back to Dashboard')}
                    </Link>
                </Button>
            </div>

            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('clientReviews.table.date', 'Date')}</TableHead>
                            <TableHead>{t('clientReviews.table.client', 'Client')}</TableHead>
                            <TableHead>{t('clientReviews.table.reviewer', 'Reviewer')}</TableHead>
                            <TableHead>{t('clientReviews.table.rating', 'Rating')}</TableHead>
                            <TableHead className="w-1/3">{t('clientReviews.table.comment', 'Comment')}</TableHead>
                            <TableHead>{t('clientReviews.table.status', 'Status')}</TableHead>
                            <TableHead className="text-right">{t('clientReviews.table.actions', 'Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">{t('clientReviews.table.loading', 'Loading...')}</TableCell>
                            </TableRow>
                        ) : reviews.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">{t('clientReviews.table.empty', 'No reviews found.')}</TableCell>
                            </TableRow>
                        ) : (
                            reviews.map((review) => (
                                <TableRow key={review.id}>
                                    <TableCell className="text-xs text-gray-500">
                                        {review.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                                    </TableCell>
                                    <TableCell className="font-medium">{review.clientName}</TableCell>
                                    <TableCell>{review.userName}</TableCell>
                                    <TableCell>
                                        <div className="flex text-yellow-500">
                                            {Array.from({ length: review.rating }).map((_, i) => (
                                                <Star key={i} className="h-4 w-4 fill-current" />
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm truncate max-w-xs" title={review.comment}>
                                        {review.comment}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            review.status === 'approved' ? 'default' :
                                                review.status === 'rejected' ? 'destructive' : 'secondary'
                                        }>
                                            {t(`clientReviews.status.${review.status}`, review.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {review.status !== 'approved' && (
                                                <Button size="icon" variant="ghost" onClick={() => handleStatusChange(review, 'approved')} title={t('clientReviews.actions.approve', 'Approve')}>
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                </Button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <Button size="icon" variant="ghost" onClick={() => handleStatusChange(review, 'rejected')} title={t('clientReviews.actions.reject', 'Reject')}>
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                </Button>
                                            )}
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(review)} title={t('clientReviews.actions.delete', 'Delete')}>
                                                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
