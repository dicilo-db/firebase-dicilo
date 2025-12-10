// src/app/admin/forms-dashboard/page.tsx
'use client';

import React from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building,
  DatabaseZap,
  Loader2,
  Users,
  LayoutTemplate,
  DollarSign,
  MessageSquare,
  RefreshCw,
  BarChartHorizontal,
  FileText,
} from 'lucide-react';
import { useAdminUser, useAuthGuard } from '@/hooks/useAuthGuard';
import { useServerAction } from '@/hooks/useServerAction';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

import { getFunctions, httpsCallable } from 'firebase/functions';

// --- CONFIGURACIÓN ---
const functions = getFunctions(app, 'europe-west1');
const seedDatabaseCallable = httpsCallable(functions, 'seedDatabaseCallable');
const syncExistingCustomersToErp = httpsCallable(
  functions,
  'syncExistingCustomersToErp'
);
const auth = getAuth(app);

// --- COMPONENTES AUXILIARES ---

// Esqueleto para la página del dashboard
const DashboardSkeleton = () => (
  <div className="flex min-h-screen flex-col">
    <Header />
    <main className="flex-grow p-8">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="mt-2 h-6 w-1/2" />
      <div className="mt-8 rounded-lg border bg-secondary p-4">
        <Skeleton className="mb-2 h-7 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
        <div className="mt-4 flex flex-wrap gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-56" />
        </div>
      </div>
      <div className="mt-8">
        <Skeleton className="mb-4 h-7 w-1/3" />
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function FormsDashboardPage() {
  // Hooks
  useAuthGuard(); // Protege la ruta
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation('admin');
  const { user: adminUser, isLoading: isUserLoading } = useAdminUser();

  // Hooks para las acciones de servidor
  const { isPending: isSeeding, runAction: runSeedAction } =
    useServerAction(seedDatabaseCallable);
  const { isPending: isSyncing, runAction: runSyncAction } = useServerAction(
    syncExistingCustomersToErp
  );

  // --- MANEJADORES DE EVENTOS ---

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: t('dashboard.logoutSuccess') });
      router.push('/admin');
    } catch (error) {
      toast({
        title: t('dashboard.logoutError'),
        description: t('dashboard.logoutErrorDescription'),
        variant: 'destructive',
      });
    }
  };

  const handleSeedDatabase = async () => {
    toast({
      title: t('dashboard.seedingStartTitle'),
      description: t('dashboard.seedingStartDesc'),
    });
    try {
      const result = (await runSeedAction({})) as any;
      if (result.data.success) {
        toast({
          title: t('dashboard.seedingSuccessTitle'),
          description: result.data.message,
        });
      } else {
        throw new Error(result.data.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Seeding error:', error);
      const errorMessage =
        error.code === 'permission-denied'
          ? t('dashboard.seedingPermissionError')
          : error.message || t('dashboard.seedingErrorDesc');
      toast({
        title: t('dashboard.seedingErrorTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleSyncCustomers = async () => {
    toast({
      title: t('dashboard.sync.startTitle'),
      description: t('dashboard.sync.startDesc'),
    });
    try {
      const result = (await runSyncAction({})) as any;
      if (result.data.success) {
        toast({
          title: t('dashboard.sync.successTitle'),
          description: result.data.message,
        });
      } else {
        throw new Error(result.data.message || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Syncing error:', error);
      const errorMessage =
        error.code === 'permission-denied'
          ? t('dashboard.sync.permissionError')
          : error.message || t('dashboard.sync.errorDesc');
      toast({
        title: t('dashboard.sync.errorTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // --- RENDERIZADO ---

  if (isUserLoading || !adminUser) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="flex-grow container mx-auto p-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('formsDashboard.title')}
          </h1>
          <Button onClick={handleLogout} variant="outline">
            {t('dashboard.logout')}
          </Button>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t('formsDashboard.managementTitle')}</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {t('formsDashboard.managementDescription')}
            </p>
            <p className="text-sm text-muted-foreground">
              (Feature coming soon / Under Construction)
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
