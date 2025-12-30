'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  LayoutDashboard,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
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
import { useAuthGuard } from '@/hooks/useAuthGuard';

const db = getFirestore(app);

// Define la estructura de un negocio
interface Business {
  id: string;
  name: string;
  category: string;
  location: string;
  active?: boolean;
}

const BusinessesSkeleton = () => (
  <div className="p-8">
    <div className="mb-6 flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
    <Skeleton className="mb-4 h-10 w-full" />
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
              <Skeleton className="h-5 w-20" />
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
  </div>
);

export default function BusinessesPage() {
  useAuthGuard();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const t = useTranslation('admin').t;

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const businessesCol = collection(db, 'businesses');
      const businessSnapshot = await getDocs(businessesCol);
      const businessList = businessSnapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
          active: doc.data().active !== undefined ? doc.data().active : true
        }) as Business
      );
      setBusinesses(businessList);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast({
        title: t('businesses.error'),
        description: t('businesses.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) =>
      business.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [businesses, searchQuery]);

  const handleDelete = async (businessId: string) => {
    setIsDeleting(businessId);
    try {
      await deleteDoc(doc(db, 'businesses', businessId));
      toast({
        title: t('businesses.deleteSuccessTitle'),
        description: t('businesses.deleteSuccessDesc'),
      });
      // Refresh the list
      setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
    } catch (error) {
      console.error('Error deleting business:', error);
      toast({
        title: t('businesses.deleteErrorTitle'),
        description: t('businesses.deleteErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (businessId: string, currentStatus: boolean) => {
    setUpdatingId(businessId);
    try {
      const businessRef = doc(db, 'businesses', businessId);
      await updateDoc(businessRef, {
        active: !currentStatus
      });

      setBusinesses(prev => prev.map(b =>
        b.id === businessId ? { ...b, active: !currentStatus } : b
      ));

      toast({
        title: t('businesses.edit.saveSuccessTitle', "Saved"),
        description: t('businesses.edit.saveSuccessDesc', "Status updated"),
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: t('businesses.edit.saveErrorTitle', "Error"),
        description: t('businesses.edit.saveErrorDesc', "Could not update status"),
        variant: "destructive"
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return <BusinessesSkeleton />;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Basic</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('businesses.backToDashboard')}
            </Link>
          </Button>
          <Button
            onClick={fetchBusinesses}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            {t('businesses.reload')}
          </Button>
          <Button asChild>
            <Link href="/admin/businesses/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('businesses.addBusiness')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('businesses.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('businesses.table.name')}</TableHead>
              <TableHead>{t('businesses.table.category')}</TableHead>
              <TableHead>{t('businesses.table.location')}</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>{t('businesses.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-3/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-2/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-1/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-1/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell className="font-medium">{business.name}</TableCell>
                  <TableCell>{business.category}</TableCell>
                  <TableCell>{business.location}</TableCell>
                  <TableCell>
                    <Switch
                      checked={business.active}
                      disabled={updatingId === business.id}
                      onCheckedChange={() => handleToggleActive(business.id, business.active || false)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/businesses/${business.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            disabled={isDeleting === business.id}
                          >
                            {isDeleting === business.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t('businesses.confirmDeleteTitle')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('businesses.confirmDeleteDesc', {
                                name: business.name,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t('common:cancel', { ns: 'common' })}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(business.id)}
                            >
                              {t('common:delete', { ns: 'common' })}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t('businesses.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
