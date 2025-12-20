// src/app/admin/statistics/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getCountFromServer,
  getDocs,
  where,
  Timestamp,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { app } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { useAuthGuard } from '@/hooks/useAuthGuard';

import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GeneralAdStatistics } from '@/components/dashboard/GeneralAdStatistics';
import { LayoutDashboard, MousePointerClick, Search } from 'lucide-react';

// --- TIPOS ---
const db = getFirestore(app);
interface Stats {
  totalSearches: number;
  totalCardClicks: number;
  totalPopupClicks: number;
}

type EventType = 'search' | 'cardClick' | 'popupClick' | 'adImpression';

interface AnalyticsEvent {
  id: string;
  type: EventType;
  businessName: string;
  timestamp: Timestamp;
  clickedElement?: string;
}

// --- COMPONENTES AUXILIARES ---

// Componente para una tarjeta de estadística individual
const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

// Esqueleto de la página de estadísticas
const StatisticsPageSkeleton = () => (
  <div className="flex min-h-screen flex-col">

    <main className="flex-grow space-y-6 p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </main>
    <Footer />
  </div>
);

// --- CLIENTS LIST COMPONENT ---
const ClientsStatisticsList = ({ t }: { t: any }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'clients'));
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClients(list);
      } catch (err) {
        console.error("Failed to fetch clients", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter((c: any) =>
    c.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('statistics.clientsStatsTitle') || 'Client Statistics'}</CardTitle>
        <div className="pt-2">
          <input
            type="text"
            placeholder="Search client..."
            className="w-full max-w-sm rounded border px-3 py-2 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow><TableCell colSpan={3}>No clients found.</TableCell></TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.clientName}</TableCell>
                    <TableCell><Badge variant="outline">{client.clientType || 'Standard'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/admin/statistics/client/${client.id}`}>
                          View Report
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function StatisticsPage() {
  useAuthGuard();
  const t = useTranslation('admin').t;
  const [stats, setStats] = useState<Stats>({
    totalSearches: 0,
    totalCardClicks: 0,
    totalPopupClicks: 0,
  });
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const analyticsCollection = collection(db, 'analyticsEvents');

    const fetchInitialCounts = async () => {
      try {
        const [searchesSnap, cardClicksSnap, popupClicksSnap] =
          await Promise.all([
            getCountFromServer(
              query(analyticsCollection, where('type', '==', 'search'))
            ),
            getCountFromServer(
              query(analyticsCollection, where('type', '==', 'cardClick'))
            ),
            getCountFromServer(
              query(analyticsCollection, where('type', '==', 'popupClick'))
            ),
          ]);

        setStats({
          totalSearches: searchesSnap.data().count,
          totalCardClicks: cardClicksSnap.data().count,
          totalPopupClicks: popupClicksSnap.data().count,
        });
      } catch (error) {
        console.error('Error fetching initial stat counts:', error);
      }
    };

    const subscribeToRecentEvents = () => {
      const eventsQuery = query(
        analyticsCollection,
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(
        eventsQuery,
        (snapshot) => {
          const events = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as AnalyticsEvent
          );
          setRecentEvents(events);
          if (isLoading) setIsLoading(false);
        },
        (error) => {
          console.error('Error subscribing to recent events:', error);
          if (isLoading) setIsLoading(false);
        }
      );

      return unsubscribe;
    };

    fetchInitialCounts();
    const unsubscribe = subscribeToRecentEvents();

    return () => unsubscribe(); // Limpiar suscripción al desmontar
  }, [isLoading]);

  const eventTypeMap: Record<EventType, string> = useMemo(
    () => ({
      search: t('statistics.types.search'),
      cardClick: t('statistics.types.cardClick'),
      popupClick: t('statistics.types.popupClick'),
      adImpression: 'Ad View', // Fallback or add translation key later
    }),
    [t]
  );

  const badgeVariantMap: Record<
    EventType,
    'outline' | 'secondary' | 'default'
  > = {
    search: 'outline',
    cardClick: 'secondary',
    popupClick: 'default',
    adImpression: 'secondary',
  };

  if (isLoading) {
    return <StatisticsPageSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">

      <main className="flex-grow p-4 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('statistics.title')}</h1>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('businesses.backToDashboard')}
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <GeneralAdStatistics />
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title={t('statistics.totalSearches')}
            value={stats.totalSearches}
            icon={<Search className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            title={t('statistics.totalCardClicks')}
            value={stats.totalCardClicks}
            icon={
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            }
          />
          <StatCard
            title={t('statistics.totalPopupClicks')}
            value={stats.totalPopupClicks}
            icon={
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            }
          />
        </div>

        {/* Clients Statistics Section */}
        <ClientsStatisticsList t={t} />

        <div className="mt-8"></div>

        <Card>
          <CardHeader>
            <CardTitle>{t('statistics.recentEvents')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('statistics.table.date')}</TableHead>
                  <TableHead>{t('statistics.table.eventType')}</TableHead>
                  <TableHead>
                    {t('statistics.table.businessName')}
                  </TableHead>
                  <TableHead>{t('statistics.table.details')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.length > 0 ? (
                  recentEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {event.timestamp
                          ? format(
                            event.timestamp.toDate(),
                            'dd/MM/yy HH:mm:ss'
                          )
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={badgeVariantMap[event.type] || 'default'}
                        >
                          {eventTypeMap[event.type] || event.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{event.businessName}</TableCell>
                      <TableCell>{(event as any).details || event.clickedElement || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {t('statistics.noEvents')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
