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
  DownloadCloud,
} from 'lucide-react';
import { useAdminUser, useAuthGuard } from '@/hooks/useAuthGuard';
import { useServerAction } from '@/hooks/useServerAction';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

import { getFunctions, httpsCallable } from 'firebase/functions';

// --- CONFIGURACIÓN ---
const functions = getFunctions(app, 'europe-west1');
const seedDatabaseCallable = httpsCallable(functions, 'seedDatabaseCallable');
const importFromStorageCallable = httpsCallable(
  functions,
  'importBusinessesFromStorage'
);
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
  const { isPending: isImporting, runAction: runImportAction } =
    useServerAction(importFromStorageCallable);

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

  const handleImportFromStorage = async () => {
    toast({
      title: t('dashboard.import.startTitle'),
      description: t('dashboard.import.startDesc'),
    });
    try {
      const result = (await runImportAction({})) as any;
      if (result.data.success) {
        toast({
          title: t('dashboard.import.successTitle'),
          description: result.data.message,
        });
      } else {
        throw new Error(result.data.message || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Importing error:', error);
      const errorMessage =
        error.code === 'permission-denied'
          ? t('dashboard.import.permissionError')
          : error.message || t('dashboard.import.errorDesc');
      toast({
        title: t('dashboard.import.errorTitle'),
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
      <main className="flex-grow p-8 container mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t('dashboard.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('dashboard.welcome', {
                email: adminUser.email,
                role: adminUser.role,
              })}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="shrink-0">
            {t('dashboard.logout')}
          </Button>
        </div>

        {adminUser.role === 'superadmin' && (
          <div className="mb-10 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DatabaseZap className="h-5 w-5 text-primary" />
              {t('dashboard.superAdminArea')}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-slate-100/50 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('dashboard.cards.databaseSeeding.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleSeedDatabase}
                    disabled={isSeeding}
                    className="w-full"
                    variant="secondary"
                  >
                    {isSeeding ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <DatabaseZap className="mr-2 h-4 w-4" />
                    )}
                    {isSeeding
                      ? t('dashboard.seedingInProgress')
                      : t('dashboard.seedDatabase')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-100/50 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('dashboard.cards.erpSync.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleSyncCustomers}
                    disabled={isSyncing}
                    className="w-full"
                    variant="secondary"
                  >
                    {isSyncing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {t('dashboard.sync.button')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-100/50 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('dashboard.cards.storageImport.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleImportFromStorage}
                    disabled={isImporting}
                    className="w-full"
                    variant="secondary"
                  >
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <DownloadCloud className="mr-2 h-4 w-4" />
                    )}
                    {t('dashboard.import.button')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            {t('dashboard.contentManagement')}
          </h2>
          <p className="text-muted-foreground">
            {t('dashboard.contentManagementDescription')}
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Link href="/admin/clients" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Landing Pages
                  </CardTitle>
                  <LayoutTemplate className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.builder.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.cards.builder.description')}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/clients" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('clients.title', { ns: 'admin' })}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.clients.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.cards.clients.description')}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/businesses" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Businesses
                  </CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.directory.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.cards.directory.description')}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/feedbacks" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('feedbacks.title', { ns: 'admin' })}
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.feedback.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.cards.feedback.description')}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/plans" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('plans.title', { ns: 'admin' })}
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.plans.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.cards.plans.description')}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/statistics" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('statistics.title', { ns: 'admin' })}
                  </CardTitle>
                  <BarChartHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.stats.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.cards.stats.description')}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/forms-dashboard" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('formsDashboard.title', { ns: 'admin' })}
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.forms.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.cards.forms.description')}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/registrations" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('registrations.title', { ns: 'admin' })}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.registrations.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.cards.registrations.description')}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/private-users" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('dashboard.cards.privateUsers.title')}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.privateUsers.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.cards.privateUsers.description')}
                  </p>
                </CardContent>
              </Card>
            </Link>
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
