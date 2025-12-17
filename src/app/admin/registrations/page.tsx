// src/app/admin/registrations/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { app } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { useAuthGuard } from '@/hooks/useAuthGuard';

import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard, Edit, RefreshCw, Trash2, MoreHorizontal, Play, Pause, Trash } from 'lucide-react';
import { runDatabaseCleanup, deleteRegistration, updateRegistrationStatus } from '@/app/actions/registrations';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const db = getFirestore(app);

// --- TIPOS ---
type RegistrationType = 'private' | 'donor' | 'retailer' | 'premium' | 'starter';
interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  registrationType: RegistrationType;
  createdAt: { seconds: number; nanoseconds: number };
  status?: 'active' | 'paused' | 'pending';
  clientSlug?: string;
  clientId?: string;
}

// --- COMPONENTES AUXILIARES ---

// Botón de acción para gestionar el cliente asociado
const ActionButton = ({ registration }: { registration: Registration }) => {
  const { t } = useTranslation('admin');
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm(t('Are you sure you want to delete this registration?'))) return;
    const res = await deleteRegistration(registration.id, registration.registrationType);
    if (res.success) {
      toast({ title: 'Deleted', description: 'Registration deleted successfully.' });
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = registration.status === 'paused' ? 'active' : 'paused'; // Assuming 'status' field exists or defaults to active
    const res = await updateRegistrationStatus(registration.id, newStatus);
    if (res.success) {
      toast({ title: 'Updated', description: `User ${newStatus === 'active' ? 'activated' : 'paused'}.` });
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('Actions')}</DropdownMenuLabel>

        {/* EDIT CLIENT (For Companies) */}
        {registration.clientId && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/clients/${registration.clientId}/edit`} className="flex items-center cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              {t('registrations.table.manageClient')}
            </Link>
          </DropdownMenuItem>
        )}

        {/* PRIVATE USER ACTIONS */}
        {registration.registrationType === 'private' && (
          <>
            <DropdownMenuItem onClick={handleStatusToggle} className="cursor-pointer">
              {registration.status === 'paused' ? (
                <><Play className="mr-2 h-4 w-4 text-green-600" /> Activate Account</>
              ) : (
                <><Pause className="mr-2 h-4 w-4 text-yellow-600" /> Pause Account</>
              )}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* DELETE (All Types) */}
        <DropdownMenuItem onClick={handleDelete} className="text-red-600 cursor-pointer">
          <Trash className="mr-2 h-4 w-4" />
          Delete Registration
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Esqueleto de la página mientras carga
const RegistrationSkeleton = () => (
  <div className="flex min-h-screen flex-col">

    <main className="flex-grow p-8">
      <Skeleton className="mb-4 h-8 w-64" />
      <Skeleton className="mb-6 h-10 w-full" />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {[...Array(5)].map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-5 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(5)].map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
    <Footer />
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function RegistrationsPage() {
  // Hooks
  const { t } = useTranslation(['admin', 'register']);
  const { toast } = useToast();
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  useAuthGuard(['superadmin']);

  // Efecto para suscribirse a los registros en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, 'registrations'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        // Raw data
        const rawRegs = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Registration
        );

        // Client lookup optimization:
        // Instead of querying one by one, we could try to look up based on email if we had strict linking.
        // But the existing logic looks up by "FirstName LastName".
        // Let's keep the logic but optimize parallelism.

        const findClientForRegistration = async (
          registration: Registration
        ): Promise<Registration> => {
          // Skip if private
          if (registration.registrationType === 'private') return registration;

          try {
            // Fallback logic: check if 'clientId' is already in registration (future proofing)
            if (registration.clientId) return registration;

            const clientNameForQuery = `${registration.firstName} ${registration.lastName}`;
            const clientQuery = query(
              collection(db, 'clients'),
              where('clientName', '==', clientNameForQuery),
              limit(1)
            );
            const clientSnapshot = await getDocs(clientQuery);

            if (!clientSnapshot.empty) {
              const clientDoc = clientSnapshot.docs[0];
              return {
                ...registration,
                clientId: clientDoc.id,
                clientSlug: clientDoc.data().slug,
              };
            }
          } catch (error) {
            console.error(
              `Error finding client for ${registration.email}:`,
              error
            );
          }
          return registration;
        };

        const enhancedRegs = await Promise.all(
          rawRegs.map(findClientForRegistration)
        );

        setAllRegistrations(enhancedRegs);
        if (isLoading) setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching registrations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load registrations.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCleanup = async () => {
    setIsCleaning(true);
    toast({ title: 'Cleaning Database...', description: 'Removing duplicates and categorizing entries.' });

    const result = await runDatabaseCleanup();

    setIsCleaning(false);

    if (result.success) {
      toast({
        title: 'Cleanup Complete',
        description: `Removed ${result.stats?.duplicatesRemoved} duplicates. Updated ${result.stats?.updatedToBasic} to Basic.`,
      });
      // The snapshot listener will automatically update the UI
    } else {
      toast({
        title: 'Cleanup Failed',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  // Filtrado y Contadores
  // Ensure types match exactly: 'donor' is Basic

  const counts = useMemo(() => {
    return {
      all: allRegistrations.length,
      donor: allRegistrations.filter(r => r.registrationType === 'donor').length,
      starter: allRegistrations.filter(r => r.registrationType === 'starter').length,
      retailer: allRegistrations.filter(r => r.registrationType === 'retailer').length,
      premium: allRegistrations.filter(r => r.registrationType === 'premium').length,
      private: allRegistrations.filter(r => r.registrationType === 'private').length,
    };
  }, [allRegistrations]);

  const filteredRegistrations = useMemo(() => {
    if (activeTab === 'all') return allRegistrations;
    return allRegistrations.filter((reg) => reg.registrationType === activeTab);
  }, [allRegistrations, activeTab]);

  const typeLabels: Record<string, string> = {
    all: t('registrations.tabs.all', { ns: 'admin' }),
    donor: 'Basic', // Forced Label per instructions
    starter: 'Starter',
    retailer: 'Einzelhändler',
    premium: 'Premium',
    private: 'Privatuser'
  };

  // Order: Alle, Basic, Starter, Einzelhändler, Premium, Privatuser
  const tabOrder = ['all', 'donor', 'starter', 'retailer', 'premium', 'private'];

  if (isLoading) {
    return <RegistrationSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">

      <main className="flex-grow p-4 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">
            {t('registrations.title', { ns: 'admin' })}
          </h1>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleCleanup} disabled={isCleaning}>
              {isCleaning ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {isCleaning ? 'Cleaning...' : 'Cleanup DB Duplicates'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {t('businesses.backToDashboard', { ns: 'admin' })}
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {tabOrder.map(key => (
              <TabsTrigger key={key} value={key} className="flex flex-col items-center py-2 sm:flex-row sm:justify-center sm:gap-2">
                <span>{typeLabels[key]}</span>
                <Badge variant="secondary" className="ml-0 mt-1 sm:ml-2 sm:mt-0 h-5 px-1.5 text-[10px]">
                  {counts[key as keyof typeof counts] || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-6 rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('registrations.table.name', { ns: 'admin' })}</TableHead>
                <TableHead>{t('registrations.table.contact', { ns: 'admin' })}</TableHead>
                <TableHead>{t('registrations.table.type', { ns: 'admin' })}</TableHead>
                <TableHead>{t('registrations.table.date', { ns: 'admin' })}</TableHead>
                <TableHead>{t('registrations.table.actions', { ns: 'admin' })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.length > 0 ? (
                filteredRegistrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">
                      {reg.businessName || `${reg.firstName} ${reg.lastName}`}
                      {reg.businessName && (
                        <div className="text-xs text-muted-foreground">{reg.firstName} {reg.lastName}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{reg.email}</div>
                      {reg.whatsapp && (
                        <div className="text-xs text-muted-foreground">
                          {reg.whatsapp}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        reg.registrationType === 'premium' ? 'default' :
                          reg.registrationType === 'retailer' ? 'secondary' : 'outline'
                      }>
                        {typeLabels[reg.registrationType] || reg.registrationType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reg.createdAt
                        ? format(
                          new Date(reg.createdAt.seconds * 1000),
                          'dd/MM/yyyy HH:mm'
                        )
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <ActionButton registration={reg} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t('registrations.noResults', { ns: 'admin' })}
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
