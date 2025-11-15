// src/app/admin/dashboard/page.tsx
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

const DashboardContent: React.FC = () => {
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
          <Button onClick={handleLogout} variant="destructive">
            {t('dashboard.logout')}
          </Button>
        </div>
        <p className="mt-2">
          {t('dashboard.welcome', {
            email: adminUser.email,
            role: adminUser.role,
          })}
        </p>

        {adminUser.role === 'superadmin' && (
          <div className="mt-8 rounded-lg border bg-secondary p-4">
            <h2 className="text-xl font-semibold">
              {t('dashboard.superAdminArea')}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {t('dashboard.superAdminDescription')}
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <Button onClick={handleSeedDatabase} disabled={isSeeding}>
                {isSeeding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DatabaseZap className="mr-2 h-4 w-4" />
                )}
                {isSeeding
                  ? t('dashboard.seedingInProgress')
                  : t('dashboard.seedDatabase')}
              </Button>
              <Button onClick={handleSyncCustomers} disabled={isSyncing}>
                {isSyncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {t('dashboard.sync.button')}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold">
            {t('dashboard.contentManagement')}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {t('dashboard.contentManagementDescription')}
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/admin/businesses">
                <Building className="mr-2 h-4 w-4" />
                {t('dashboard.manageBusinesses')}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/clients">
                <LayoutTemplate className="mr-2 h-4 w-4" />
                {t('clients.title', { ns: 'admin' })}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/feedbacks">
                <MessageSquare className="mr-2 h-4 w-4" />
                {t('feedbacks.title', { ns: 'admin' })}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/plans">
                <DollarSign className="mr-2 h-4 w-4" />
                {t('plans.title', { ns: 'admin' })}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/statistics">
                <BarChartHorizontal className="mr-2 h-4 w-4" />
                {t('statistics.title', { ns: 'admin' })}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/forms-dashboard">
                <FileText className="mr-2 h-4 w-4" />
                {t('formsDashboard.title', { ns: 'admin' })}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/registrations">
                <Users className="mr-2 h-4 w-4" />
                {t('registrations.title', { ns: 'admin' })}
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default function AdminDashboardPage() {
  return <DashboardContent />;
}
