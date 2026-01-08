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
  BarChart2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

// Define la estructura de un cliente
// Define la estructura de un cliente
interface Client {
  id: string;
  clientName: string;
  clientTitle: string;
  slug: string;
  clientType: 'starter' | 'retailer' | 'premium';
  active?: boolean;
  // External Data from Business
  createdAt?: any;
  city?: string;
  country?: string;
  category?: string;
  businessId?: string;
}

const ClientsPageSkeleton = () => (
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
              <Skeleton className="h-5 w-1/3" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-5 w-1/3" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-5 w-1/4" />
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

export default function ClientsPage() {
  useAuthGuard();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type');
  const { t } = useTranslation('admin');

  // Filters State
  const [sortOrder, setSortOrder] = useState<string>('name-asc');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const clientsCol = collection(db, 'clients');
      const businessesCol = collection(db, 'businesses');

      const [clientSnapshot, businessSnapshot] = await Promise.all([
        getDocs(clientsCol),
        getDocs(businessesCol)
      ]);

      const businessMap = new Map();
      businessSnapshot.docs.forEach(doc => {
        businessMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      const clientList = clientSnapshot.docs.map((doc) => {
        const data = doc.data();
        let clientType = data.clientType;

        // Force Premium for specific IDs to repair visibility
        if (doc.id === 'E6IUdKlV5OMlv2DWlNxE' || doc.id === 'Qt9u8Pd1Qi52AM0no2uw') {
          clientType = 'premium';
        }

        const linkedBusiness = data.businessId ? businessMap.get(data.businessId) : null;

        return {
          id: doc.id,
          ...data,
          clientType,
          active: data.active !== undefined ? data.active : true,
          // Enrich with business data
          createdAt: data.createdAt || linkedBusiness?.createdAt,
          city: linkedBusiness?.city || '',
          country: linkedBusiness?.country || '',
          category: linkedBusiness?.category || '',
        } as Client;
      });
      setClients(clientList);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: t('clients.error'),
        description: t('clients.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Extract unique values for filters
  const uniqueCities = useMemo(() => Array.from(new Set(clients.map(c => c.city).filter(Boolean))).sort(), [clients]);
  const uniqueCountries = useMemo(() => Array.from(new Set(clients.map(c => c.country).filter(Boolean))).sort(), [clients]);
  const uniqueCategories = useMemo(() => Array.from(new Set(clients.map(c => c.category).filter(Boolean))).sort(), [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch = client.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter ? client.clientType === typeFilter : true;
      const matchesCountry = filterCountry === 'all' || client.country === filterCountry;
      const matchesCity = filterCity === 'all' || client.city === filterCity;
      const matchesCategory = filterCategory === 'all' || client.category === filterCategory;

      return matchesSearch && matchesType && matchesCountry && matchesCity && matchesCategory;
    }).sort((a, b) => {
      if (sortOrder === 'name-asc') return a.clientName.localeCompare(b.clientName);
      if (sortOrder === 'name-desc') return b.clientName.localeCompare(a.clientName);
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
  }, [clients, searchQuery, typeFilter, sortOrder, filterCountry, filterCity, filterCategory]);

  const handleDelete = async (clientId: string) => {
    setIsDeleting(clientId);
    try {
      await deleteDoc(doc(db, 'clients', clientId));
      toast({
        title: t('clients.deleteSuccessTitle'),
        description: t('clients.deleteSuccessDesc'),
      });
      setClients((prev) => prev.filter((b) => b.id !== clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: t('clients.deleteErrorTitle'),
        description: t('clients.deleteErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (clientId: string, currentStatus: boolean) => {
    setUpdatingId(clientId);
    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        active: !currentStatus
      });

      setClients(prev => prev.map(c =>
        c.id === clientId ? { ...c, active: !currentStatus } : c
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
    return <ClientsPageSkeleton />;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {typeFilter
            ? `${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} ${t('clients.title')}`
            : t('clients.title')}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('clients.backToDashboard')}
            </Link>
          </Button>
          <Button onClick={fetchClients} variant="outline" disabled={isLoading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            {t('clients.reload')}
          </Button>
          <Button asChild>
            <Link href="/admin/clients/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('clients.addClient')}
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
              placeholder={t('clients.searchPlaceholder')}
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
              <TableHead>{t('clients.table.name')}</TableHead>
              <TableHead>{t('clients.table.title')}</TableHead>
              <TableHead>{t('clients.table.slug')}</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>{t('clients.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.clientName}
                  </TableCell>
                  <TableCell>{client.clientTitle}</TableCell>
                  <TableCell>
                    <a
                      href={`/client/${client.slug}`}
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      /client/{client.slug}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={client.active}
                      disabled={updatingId === client.id}
                      onCheckedChange={() => handleToggleActive(client.id, client.active || false)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/clients/${client.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            disabled={isDeleting === client.id}
                          >
                            {isDeleting === client.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t('clients.confirmDeleteTitle')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('clients.confirmDeleteDesc', {
                                name: client.clientName,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t('common:cancel', { ns: 'common' })}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(client.id)}
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
                  {isLoading ? '...' : t('clients.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
