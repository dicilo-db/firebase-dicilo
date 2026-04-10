// src/app/admin/registrations/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Header } from '@/components/header';
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
import { LayoutDashboard, Edit } from 'lucide-react';

const db = getFirestore(app);

// --- TIPOS ---
type RegistrationType = 'private' | 'donor' | 'retailer' | 'premium';
interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  registrationType: RegistrationType;
  createdAt: { seconds: number; nanoseconds: number };
  clientSlug?: string;
  clientId?: string;
}

// --- COMPONENTES AUXILIARES ---

// Botón de acción para gestionar el cliente asociado
const ActionButton = ({ registration }: { registration: Registration }) => {
  const { t } = useTranslation('admin');

  if (
    registration.registrationType !== 'retailer' &&
    registration.registrationType !== 'premium'
  ) {
    return null; // No mostrar botón para tipos no-cliente
  }

  if (!registration.clientId) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Edit className="mr-2 h-4 w-4" />
        {t('registrations.table.noClient')}
      </Button>
    );
  }

  return (
    <Button asChild variant="default" size="sm">
      <Link href={`/admin/clients/${registration.clientId}/edit`}>
        <Edit className="mr-2 h-4 w-4" />
        {t('registrations.table.manageClient')}
      </Link>
    </Button>
  );
};

// Esqueleto de la página mientras carga
const RegistrationSkeleton = () => (
  <div className="flex min-h-screen flex-col">
    <Header />
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
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        const regs = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Registration
        );

        // Función interna para buscar el cliente asociado a un registro
        const findClientForRegistration = async (
          registration: Registration
        ): Promise<Registration> => {
          if (
            registration.registrationType !== 'retailer' &&
            registration.registrationType !== 'premium'
          ) {
            return registration;
          }
          try {
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

        // Mejora: Procesar las búsquedas de clientes en paralelo
        const enhancedRegs = await Promise.all(
          regs.map(findClientForRegistration)
        );

        setAllRegistrations(enhancedRegs);
        if (isLoading) setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching registrations:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe(); // Limpiar la suscripción al desmontar
  }, [isLoading]); // Dependencia 'isLoading' para evitar re-fetches innecesarios

  // Memorizar los registros filtrados para optimizar el rendimiento
  const filteredRegistrations = useMemo(() => {
    if (activeTab === 'all') return allRegistrations;
    return allRegistrations.filter((reg) => reg.registrationType === activeTab);
  }, [allRegistrations, activeTab]);

  // Memorizar las traducciones para evitar recálculos
  const registrationTypeMap: Record<RegistrationType, string> = useMemo(
    () => ({
      private: t('register.options.private', { ns: 'register' }),
      donor: t('register.options.donor', { ns: 'register' }),
      retailer: t('register.options.retailer', { ns: 'register' }),
      premium: t('register.options.premium', { ns: 'register' }),
    }),
    [t]
  );

  const tabs: { value: string; label: string }[] = useMemo(
    () => [
      { value: 'all', label: t('registrations.tabs.all', { ns: 'admin' }) },
      { value: 'private', label: registrationTypeMap.private },
      { value: 'donor', label: registrationTypeMap.donor },
      { value: 'retailer', label: registrationTypeMap.retailer },
      { value: 'premium', label: registrationTypeMap.premium },
    ],
    [t, registrationTypeMap]
  );

  if (isLoading) {
    return <RegistrationSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-grow p-4 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {t('registrations.title', { ns: 'admin' })}
          </h1>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('businesses.backToDashboard', { ns: 'admin' })}
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
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
                    <TableCell className="font-medium">{`${reg.firstName} ${reg.lastName}`}</TableCell>
                    <TableCell>
                      <div>{reg.email}</div>
                      {reg.whatsapp && (
                        <div className="text-xs text-muted-foreground">
                          {reg.whatsapp}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {registrationTypeMap[reg.registrationType] ||
                          reg.registrationType}
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
