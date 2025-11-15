'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
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
import { useRouter } from 'next/navigation';
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
interface Client {
  id: string;
  clientName: string;
  clientTitle: string;
  slug: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { t } = useTranslation('admin');

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const clientsCol = collection(db, 'clients');
      const clientSnapshot = await getDocs(clientsCol);
      const clientList = clientSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Client
      );
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

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      client.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

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

  if (isLoading) {
    return <ClientsPageSkeleton />;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('clients.title')}</h1>
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

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('clients.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('clients.table.name')}</TableHead>
              <TableHead>{t('clients.table.title')}</TableHead>
              <TableHead>{t('clients.table.slug')}</TableHead>
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
                <TableCell colSpan={4} className="h-24 text-center">
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
