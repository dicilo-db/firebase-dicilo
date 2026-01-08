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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  LayoutDashboard,
  Upload,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { importBusinessesFromExcel } from '@/app/actions/import-excel';
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
  city?: string;
  country?: string;
  createdAt?: any;
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

  // Filters State
  const [sortOrder, setSortOrder] = useState<string>('name-asc');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Import State
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await importBusinessesFromExcel(formData);
      if (res.success) {
        toast({
          title: "Import Successful",
          description: res.message, // e.g., "Imported 10, Skipped 5"
        });
        if (res.errors && res.errors.length > 0) {
          // Maybe show errors in a toast or dialog
          console.warn('Import warnings:', res.errors);
        }
        fetchBusinesses(); // Refresh list
      } else {
        toast({
          title: "Import Failed",
          description: res.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const businessesCol = collection(db, 'businesses');
      const businessSnapshot = await getDocs(businessesCol);
      const businessList = businessSnapshot.docs.map(
        (doc) => {
          const data = doc.data();
          // Try to infer city/country if missing, from location string "City, Country"
          let city = data.city;
          let country = data.country;
          if (!city && !country && data.location) {
            const parts = data.location.split(',').map((s: string) => s.trim());
            if (parts.length >= 2) {
              city = parts[0];
              country = parts[parts.length - 1]; // Last part assumed country
            } else {
              country = data.location;
            }
          }

          return {
            id: doc.id,
            ...data,
            city,
            country,
            active: data.active !== undefined ? data.active : true
          } as Business;
        }
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

  // Extract unique values
  const uniqueCities = useMemo(() => Array.from(new Set(businesses.map(b => b.city).filter(Boolean))).sort(), [businesses]);
  const uniqueCountries = useMemo(() => Array.from(new Set(businesses.map(b => b.country).filter(Boolean))).sort(), [businesses]);
  const uniqueCategories = useMemo(() => Array.from(new Set(businesses.map(b => b.category).filter(Boolean))).sort(), [businesses]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = filterCountry === 'all' || business.country === filterCountry;
      const matchesCity = filterCity === 'all' || business.city === filterCity;
      const matchesCategory = filterCategory === 'all' || business.category === filterCategory;

      return matchesSearch && matchesCountry && matchesCity && matchesCategory;
    }).sort((a, b) => {
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
      if (sortOrder === 'newest') {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      }
      if (sortOrder === 'oldest') {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    });
  }, [businesses, searchQuery, sortOrder, filterCountry, filterCity, filterCategory]);

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

          {/* Import Button */}
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".xlsx,.csv"
            />
            <Button
              variant="secondary"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
            >
              {isImporting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import Excel
            </Button>
          </div>

          <Button asChild>
            <Link href="/admin/basic/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('businesses.addBusiness')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('businesses.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          {/* Country Filter */}
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {uniqueCountries.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* City Filter */}
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {uniqueCities.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Reset */}
          <Button variant="ghost" onClick={() => {
            setSearchQuery('');
            setSortOrder('name-asc');
            setFilterCountry('all');
            setFilterCity('all');
            setFilterCategory('all');
          }}>
            Reset
          </Button>
        </div>
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
                        <Link href={`/admin/basic/${business.id}/edit`}>
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
