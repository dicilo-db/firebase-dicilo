// src/app/admin/plans/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, PlusCircle, Trash2, LayoutDashboard } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';

const db = getFirestore(app);

interface Plan {
  id: string;
  title: string;
  price: string;
  isPopular: boolean;
  order: number;
  language: 'de' | 'en' | 'es';
}

const PlansSkeleton = () => (
  <div className="flex min-h-screen flex-col">
    <Header />
    <main className="flex-grow p-8">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-5 w-1/4" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-1/4" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-1/4" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-1/4" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-20" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(4)].map((_, i) => (
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
      <div className="mt-6">
        <Skeleton className="h-10 w-48" />
      </div>
    </main>
    <Footer />
  </div>
);

export default function PlansPage() {
  useAuthGuard();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const plansCol = collection(db, 'pricing_plans');
      const q = query(plansCol, orderBy('order'));
      const planSnapshot = await getDocs(q);
      const planList = planSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Plan
      );
      setPlans(planList);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({ title: t('admin.plans.fetchError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDelete = async (planId: string) => {
    setIsDeleting(planId);
    try {
      await deleteDoc(doc(db, 'pricing_plans', planId));
      toast({ title: t('admin.plans.deleteSuccessTitle') });
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: t('admin.plans.deleteErrorTitle'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return <PlansSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('admin.plans.title')}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {t('admin.businesses.backToDashboard')}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/plans/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('admin.plans.addPlan')}
              </Link>
            </Button>
          </div>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.plans.table.order')}</TableHead>
                <TableHead>{t('admin.plans.table.title')}</TableHead>
                <TableHead>{t('admin.plans.table.language')}</TableHead>
                <TableHead>{t('admin.plans.table.price')}</TableHead>
                <TableHead>{t('admin.plans.table.popular')}</TableHead>
                <TableHead>{t('admin.plans.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{plan.order}</TableCell>
                  <TableCell className="font-medium">{plan.title}</TableCell>
                  <TableCell>
                    {plan.language && (
                      <Badge variant="outline">
                        {plan.language.toUpperCase()}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{plan.price}</TableCell>
                  <TableCell>
                    {plan.isPopular ? t('common.yes') : t('common.no')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/plans/${plan.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            disabled={isDeleting === plan.id}
                          >
                            {isDeleting === plan.id ? (
                              <Trash2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t('admin.plans.confirmDeleteTitle')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('admin.plans.confirmDeleteDesc', {
                                name: plan.title,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t('common:cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(plan.id)}
                            >
                              {t('common:delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
}
