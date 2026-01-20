// src/app/admin/feedbacks/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useAuthGuard } from '@/hooks/useAuthGuard';

import Footer from '@/components/footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Star, LayoutDashboard } from 'lucide-react';

const db = getFirestore(app);

// --- TIPOS ---
type CustomerType = 'private' | 'donor' | 'company' | 'premium';

interface Feedback {
  id: string;
  name: string;
  email: string;
  rating: number;
  message: string;
  country: string;
  customerType: CustomerType;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

// --- COMPONENTES AUXILIARES ---

// Esqueleto de la página de feedbacks
const FeedbackPageSkeleton = () => (
  <div className="flex min-h-screen flex-col">

    <main className="flex-grow p-8">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-5 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-32" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-40" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-28" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
    <Footer />
  </div>
);

// Componente para renderizar las estrellas de calificación
const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function FeedbacksPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useAuthGuard(['superadmin', 'admin']);

  useEffect(() => {
    const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const feedbackList = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Feedback
        );
        setFeedbacks(feedbackList);
        if (isLoading) setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching feedbacks:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isLoading]);

  const customerTypeMap: Record<CustomerType, string> = useMemo(
    () => ({
      private: t('common:benefits.feedback.customerTypeOptions.private'),
      donor: t('common:benefits.feedback.customerTypeOptions.donor'),
      company: t('common:benefits.feedback.customerTypeOptions.company'),
      premium: t('common:benefits.feedback.customerTypeOptions.premium'),
    }),
    [t]
  );

  if (isLoading) {
    return <FeedbackPageSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">

      <main className="flex-grow p-4 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('admin:feedbacks.title')}</h1>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('admin:businesses.backToDashboard')}
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin:feedbacks.table.date')}</TableHead>
                <TableHead>{t('admin:feedbacks.table.name')}</TableHead>
                <TableHead>{t('admin:feedbacks.table.customerType')}</TableHead>
                <TableHead>{t('admin:feedbacks.table.rating')}</TableHead>
                <TableHead>{t('admin:feedbacks.table.message')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbacks.length > 0 ? (
                feedbacks.map((fb) => (
                  <TableRow key={fb.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {fb.createdAt
                        ? format(
                          new Date(fb.createdAt.seconds * 1000),
                          'dd/MM/yy HH:mm'
                        )
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{fb.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {fb.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fb.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {customerTypeMap[fb.customerType] || fb.customerType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <RatingStars rating={fb.rating} />
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm">{fb.message}</p>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t('admin:feedbacks.noResults')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
