// src/app/admin/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
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
  Star,
  UserCheck,
  ThumbsUp,
  User,
  Bot,
  Tag,
  Coins,
  Wallet,
  Briefcase,
  Megaphone,
  Scan
} from 'lucide-react';
import { useAdminUser, useAuthGuard } from '@/hooks/useAuthGuard';
import { useServerAction } from '@/hooks/useServerAction';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import Footer from '@/components/footer';

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, query, where, getCountFromServer } from 'firebase/firestore';

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
const db = getFirestore(app);

import { seedCampaignsAction } from '@/app/actions/seed-freelancer';

// --- COMPONENTES AUXILIARES ---

// Helper para formatear contadores a 7 dígitos
const formatCount = (count: number) => {
  return count.toString().padStart(7, '0');
};

// Esqueleto para la página del dashboard
const DashboardSkeleton = () => (
  <div className="flex min-h-screen flex-col">

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
  console.log('DashboardContent mounting');
  // Hooks
  console.log('DashboardContent mounting');
  // Hooks
  useAuthGuard(['admin', 'superadmin', 'team_office'], 'access_admin_panel'); // Allow explicit permission access
  console.log('useAuthGuard returns');
  console.log('useAuthGuard returns');
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation('admin');
  const { user: adminUser, isLoading: isUserLoading } = useAdminUser();
  const isSuperAdmin = adminUser?.role === 'superadmin';
  const isAdminOrSuper = ['admin', 'superadmin'].includes(adminUser?.role || '');

  // Estados para contadores
  const [counts, setCounts] = useState({
    basic: 0,
    starter: 0,
    retailer: 0,
    premium: 0,
    private: 0,
    registrations: 0,
    recommendations: 0,
    tickets: 0,
  });

  // Hooks para las acciones de servidor
  const { isPending: isSeeding, runAction: runSeedAction } =
    useServerAction(seedDatabaseCallable);
  const { isPending: isSyncing, runAction: runSyncAction } = useServerAction(
    syncExistingCustomersToErp
  );
  const { isPending: isImporting, runAction: runImportAction } =
    useServerAction(importFromStorageCallable);

  // --- EFECTOS ---
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const clientsCol = collection(db, 'clients');
        const privateCol = collection(db, 'private_profiles');
        const registrationsCol = collection(db, 'registrations');
        const recommendationsCol = collection(db, 'recommendations');
        const ticketsCol = collection(db, 'tickets');

        const [
          basicSnap,
          starterSnap,
          retailerSnap,
          premiumSnap,
          privateSnap,
          registrationsSnap,
          recommendationsSnap,
          ticketsSnap,
        ] = await Promise.all([
          getCountFromServer(query(registrationsCol, where('registrationType', '==', 'donor'))),
          getCountFromServer(query(clientsCol, where('clientType', '==', 'starter'))),
          getCountFromServer(query(clientsCol, where('clientType', '==', 'retailer'))),
          getCountFromServer(query(clientsCol, where('clientType', '==', 'premium'))),
          getCountFromServer(privateCol),
          getCountFromServer(registrationsCol),
          getCountFromServer(recommendationsCol),
          getCountFromServer(query(ticketsCol, where('status', 'in', ['open', 'in_progress']))),
        ]);

        setCounts({
          basic: basicSnap.data().count,
          starter: starterSnap.data().count,
          retailer: retailerSnap.data().count,
          premium: premiumSnap.data().count,
          private: privateSnap.data().count,
          registrations: registrationsSnap.data().count,
          recommendations: recommendationsSnap.data().count,
          tickets: ticketsSnap.data().count,
        });
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      }
    };

    fetchCounts();
  }, []);

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

  const [isFreelancerSeeding, setIsFreelancerSeeding] = useState(false);
  const handleSeedFreelancer = async () => {
    setIsFreelancerSeeding(true);
    try {
      const res = await seedCampaignsAction();
      if (res.success) {
        toast({ title: "Success", description: res.message });
      } else {
        toast({ title: "Error", description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: 'destructive' });
    } finally {
      setIsFreelancerSeeding(false);
    }
  };

  // --- RENDERIZADO ---

  if (isUserLoading || !adminUser) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">

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
              Admin Tools & System
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Dicipoints Central Control - Economy */}
              <Link href="/admin/dicipoints" className="group">
                <Card className="h-full bg-red-50/50 dark:bg-red-900/10 border-red-200 transition-all hover:shadow-md hover:border-red-500 cursor-pointer relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Economy Control</CardTitle>
                    <Wallet className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">Dicipoints</div>
                    <p className="text-xs text-muted-foreground mt-1">Manage Point Value & Injection</p>
                  </CardContent>
                </Card>
              </Link>

              {/* DiciCoin Purchasers */}
              <Link href="/admin/dicicoin-purchasers" className="group">
                <Card className="h-full bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 transition-all hover:shadow-md hover:border-amber-500 cursor-pointer relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">DiciCoin Orders</CardTitle>
                    <Coins className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">DiciCoins</div>
                    <p className="text-xs text-muted-foreground mt-1">Gestión de Compras</p>
                  </CardContent>
                </Card>
              </Link>

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
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-100/50 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Freelancer Module
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleSeedFreelancer}
                    disabled={isFreelancerSeeding}
                    className="w-full"
                    variant="secondary"
                  >
                    {isFreelancerSeeding ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Briefcase className="mr-2 h-4 w-4" />
                    )}
                    Initial Seed Data
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

            {/* AI Knowledge Base (Katei) */}
            <Link href="/admin/ai-chat" className="group">
              <Card className="h-full bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 transition-all hover:shadow-md hover:border-indigo-500 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400">AI Knowledge Base</CardTitle>
                  <Bot className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Katei AI</div>
                  <p className="text-xs text-muted-foreground mt-1">Gestión de Conocimientos y FAQs</p>
                </CardContent>
              </Card>
            </Link>

            {/* Configuración de Categorías */}
            <Link href="/admin/categories" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categorías</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Categorías</div>
                  <p className="text-xs text-muted-foreground mt-1">Verwalten von Kategorien & Subkategorien</p>
                </CardContent>
              </Card>
            </Link>

            {/* Basic (Formerly Businesses / Verzeichnis) */}
            <Link href="/admin/businesses" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Basic</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Basic</div>
                  <p className="text-xs text-muted-foreground mt-1">Unternehmen verwalten</p>
                  <div className="absolute bottom-4 right-4 text-sm font-mono text-muted-foreground">
                    {formatCount(counts.basic)}
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Starter Kunden */}
            <Link href="/admin/clients?type=starter" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Starter</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Starter</div>
                  <p className="text-xs text-muted-foreground mt-1">Kundenprofile verwalten</p>
                  <div className="absolute bottom-4 right-4 text-sm font-mono text-muted-foreground">
                    {formatCount(counts.starter)}
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Retailer (Einzelhändler) Kunden */}
            <Link href="/admin/clients?type=retailer" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Einzelhändler</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Einzelhändler</div>
                  <p className="text-xs text-muted-foreground mt-1">Unternehmen verwalten</p>
                  <div className="absolute bottom-4 right-4 text-sm font-mono text-muted-foreground">
                    {formatCount(counts.retailer)}
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Premium Kunden */}
            <Link href="/admin/clients?type=premium" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Premium</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Premium</div>
                  <p className="text-xs text-muted-foreground mt-1">Premium Kunden verwalten</p>
                  <div className="absolute bottom-4 right-4 text-sm font-mono text-muted-foreground">
                    {formatCount(counts.premium)}
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Privat User (renamed from Privatkunden) */}
            {isAdminOrSuper && (
              <Link href="/admin/private-users" className="group">
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Privatkunden</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Privatuser</div>
                    <p className="text-xs text-muted-foreground mt-1">Private Profile verwalten</p>
                    <div className="absolute bottom-4 right-4 text-sm font-mono text-muted-foreground">
                      {formatCount(counts.private)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* Landing Pages / Builder */}
            <Link href="/admin/clients" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Landing Pages</CardTitle>
                  <LayoutTemplate className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.builder.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('dashboard.cards.builder.description')}</p>
                </CardContent>
              </Card>
            </Link>

            {/* Pläne */}
            {isAdminOrSuper && (
              <Link href="/admin/plans" className="group">
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('plans.title', { ns: 'admin' })}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{t('dashboard.cards.plans.title')}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.cards.plans.description')}</p>
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* Statistiken */}
            <Link href="/admin/statistics" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('statistics.title', { ns: 'admin' })}</CardTitle>
                  <BarChartHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.stats.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('dashboard.cards.stats.description')}</p>
                </CardContent>
              </Card>
            </Link>

            {/* Formulare */}
            <Link href="/admin/forms-dashboard" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('formsDashboard.title', { ns: 'admin' })}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.forms.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('dashboard.cards.forms.description')}</p>
                </CardContent>
              </Card>
            </Link>

            {/* Registrierungen */}
            <Link href="/admin/registrations" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('registrations.title', { ns: 'admin' })}</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.registrations.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('dashboard.cards.registrations.description')}</p>
                  <div className="absolute bottom-4 right-4 text-sm font-mono text-muted-foreground">
                    {formatCount(counts.registrations)}
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Ads Manager */}
            <Link href="/admin/ads-manager" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ads Manager</CardTitle>
                  <LayoutTemplate className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Ads Manager</div>
                  <p className="text-xs text-muted-foreground mt-1">Manage advertising banners</p>
                </CardContent>
              </Card>
            </Link>

            {/* Empfehlungen (NEW) */}
            <Link href="/admin/recommendations" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Empfehlungen</CardTitle>
                  <ThumbsUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Empfehlungen</div>
                  <p className="text-xs text-muted-foreground mt-1">Empfehlungen auf den Landingpage</p>
                  <div className="absolute bottom-4 right-4 text-sm font-mono text-muted-foreground">
                    {formatCount(counts.recommendations)}
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Email Templates (NEW) */}
            <Link href="/admin/email-templates" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Plantillas Email</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Plantillas Email</div>
                  <p className="text-xs text-muted-foreground mt-1">Gestión de correos automatizados</p>
                </CardContent>
              </Card>
            </Link>

            {/* Feedbacks */}
            <Link href="/admin/feedbacks" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('feedbacks.title', { ns: 'admin' })}</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t('dashboard.cards.feedback.title')}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('dashboard.cards.feedback.description')}</p>
                </CardContent>
              </Card>
            </Link>

            {/* Scanner & Reports (B2B Tools) */}
            <Link href="/admin/scan" className="group">
              <Card className="h-full bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 transition-all hover:shadow-md hover:border-blue-500 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Scanner & Reports</CardTitle>
                  <Scan className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Scanner Pro</div>
                  <p className="text-xs text-muted-foreground mt-1">Captura OCR & Reportes B2B</p>
                </CardContent>
              </Card>
            </Link>

            {/* Support Tickets (Central) */}
            <Link href="/dashboard/freelancer" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-blue-500/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gig Economy</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Freelancer</div>
                  <p className="text-xs text-muted-foreground mt-1">Gestión de Promovendedores</p>
                </CardContent>
              </Card>
            </Link>

            {/* Ads Manager (NEW MODULE) */}
            <Link href="/dashboard/ads-manager" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-purple-500/50 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Marketing Tools</CardTitle>
                  <Megaphone className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Ads Manager</div>
                  <p className="text-xs text-muted-foreground mt-1">QRs Dinámicos & Campañas</p>
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
