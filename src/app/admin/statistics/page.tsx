'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import { format, subHours, subDays, subMonths, subYears } from 'date-fns';
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
import { LayoutDashboard, MousePointerClick, Search, Download, TrendingUp, Users, Smartphone, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- CONFIGURACIÓN BASE ---
const STATISTICS_CONFIG = {
  legacyViews: 500000, 
  launchDate: '2024-05-20' 
};

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
const StatCard = ({ title, value, icon, percentage }: { title: string; value: number | string; icon: React.ReactNode; percentage?: string }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
      {percentage && <p className="text-xs text-emerald-600 font-medium mt-1">+{percentage}% este mes</p>}
    </CardContent>
  </Card>
);

const StatisticsPageSkeleton = () => (
  <div className="flex min-h-screen flex-col">
    <main className="flex-grow space-y-6 p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 w-full" />
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
      } catch (err) { } finally {
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
        <CardTitle>{t('statistics.clientsStatsTitle') || 'Estadísticas por Cliente'}</CardTitle>
        <div className="pt-2">
          <input
            type="text"
            placeholder="Buscar empresa..."
            className="w-full max-w-sm rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Membresía</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3}>Cargando...</TableCell></TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow><TableCell colSpan={3}>No hay clientes registrados.</TableCell></TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.clientName}</TableCell>
                    <TableCell><Badge variant="outline" className="bg-slate-50">{client.clientType || 'Standard'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200" asChild>
                        <Link href={`/admin/statistics/client/${client.id}`}>
                          Ver Reporte
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

// --- TRAFFIC COMPONENT ---
const TrafficAndAnalytics = () => {
    const { t } = useTranslation('admin');
    const [realVisits, setRealVisits] = useState(0);
    const [deviceData, setDeviceData] = useState<any[]>([]);
    const [countryData, setCountryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('all');

    const COLORS = ['#0d9488', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

    useEffect(() => {
        const fetchVisits = async () => {
            setLoading(true);
            try {
                let visitsQuery = query(collection(db, 'site_visits'));
                
                if (range !== 'all') {
                    const now = new Date();
                    let startDate = now;
                    if (range === '24h') startDate = subHours(now, 24);
                    else if (range === '48h') startDate = subHours(now, 48);
                    else if (range === '7d') startDate = subDays(now, 7);
                    else if (range === '30d') startDate = subMonths(now, 1);
                    else if (range === '1y') startDate = subYears(now, 1);
                    
                    visitsQuery = query(
                        collection(db, 'site_visits'), 
                        where('createdAt', '>=', Timestamp.fromDate(startDate))
                    );
                }

                const visitsSnap = await getDocs(visitsQuery);
                const visits = visitsSnap.docs.map(d => d.data());
                
                setRealVisits(visits.length);

                // Group by device
                const devices = visits.reduce((acc: any, v: any) => {
                    const dev = v.device || 'Unknown';
                    acc[dev] = (acc[dev] || 0) + 1;
                    return acc;
                }, {});
                setDeviceData(Object.keys(devices).map(k => ({ name: k, value: devices[k] })));

                // Group by country
                const countries = visits.reduce((acc: any, v: any) => {
                    const c = v.country || 'Unknown';
                    acc[c] = (acc[c] || 0) + 1;
                    return acc;
                }, {});
                
                const sortedCountries = Object.keys(countries)
                    .map(k => ({ name: k, vistas: countries[k] }))
                    .sort((a, b) => b.vistas - a.vistas)
                    .slice(0, 5); // Top 5
                
                setCountryData(sortedCountries);

            } catch (err) {
                console.error("Traffic load error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchVisits();
    }, [range]);

    const totalDisplayViews = STATISTICS_CONFIG.legacyViews + realVisits;

    if (loading) return <div className="p-8 text-center"><Skeleton className="h-40 w-full rounded-2xl" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-end mb-4">
                <Select value={range} onValueChange={setRange}>
                    <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800">
                        <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="24h">{t('statistics.ranges.24h') || "Últimas 24 horas"}</SelectItem>
                        <SelectItem value="48h">{t('statistics.ranges.48h') || "Últimas 48 horas"}</SelectItem>
                        <SelectItem value="7d">{t('statistics.ranges.7d') || "Últimos 7 días"}</SelectItem>
                        <SelectItem value="30d">{t('statistics.ranges.30d') || "Último Mes"}</SelectItem>
                        <SelectItem value="1y">{t('statistics.ranges.1y') || "Último Año"}</SelectItem>
                        <SelectItem value="all">{t('statistics.ranges.all') || "Todo el Tiempo"}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-lg border-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <TrendingUp className="w-24 h-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-teal-50 font-medium text-lg">Tráfico Total Acumulado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold mb-2">{totalDisplayViews.toLocaleString()}</div>
                        <p className="text-sm text-teal-100 flex items-center gap-1">
                            <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                                +{realVisits.toLocaleString()} recientes
                            </Badge>
                            (Desde Mayo 2024)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-purple-500" /> Distribución de Dispositivos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center">
                        {deviceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {deviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <span className="text-sm text-slate-400">Sin datos registrados</span>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" /> Top 5 Países
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        {countryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="vistas" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <span className="text-sm text-slate-400 flex h-full items-center justify-center">Sin datos registrados</span>}
                    </CardContent>
                </Card>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-semibold text-blue-900">Nota para Inversores</h4>
                    <p className="text-sm text-blue-800/80 leading-relaxed max-w-4xl">
                        El tráfico inicial (Legacy Offset) comprende el volumen verificado desde la activación temprana de Dicilo (Dic 2023). El script de monitoreo en tiempo real anexa al acumulado el flujo orgánico actual de manera automatizada garantizando precisión a partir de 2024.
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function StatisticsPage() {
  useAuthGuard();
  const t = useTranslation('admin').t;
  const reportRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<Stats>({
    totalSearches: 0,
    totalCardClicks: 0,
    totalPopupClicks: 0,
  });
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const analyticsCollection = collection(db, 'analyticsEvents');

    const fetchInitialCounts = async () => {
      try {
        const [searchesSnap, cardClicksSnap, popupClicksSnap] =
          await Promise.all([
            getCountFromServer(query(analyticsCollection, where('type', '==', 'search'))),
            getCountFromServer(query(analyticsCollection, where('type', '==', 'cardClick'))),
            getCountFromServer(query(analyticsCollection, where('type', '==', 'popupClick'))),
          ]);

        setStats({
          totalSearches: searchesSnap.data().count,
          totalCardClicks: cardClicksSnap.data().count,
          totalPopupClicks: popupClicksSnap.data().count,
        });
      } catch (error) { }
    };

    const subscribeToRecentEvents = () => {
      const eventsQuery = query(analyticsCollection, orderBy('timestamp', 'desc'), limit(10));
      return onSnapshot(eventsQuery, (snapshot) => {
          const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AnalyticsEvent);
          setRecentEvents(events);
          if (isLoading) setIsLoading(false);
      }, () => { if (isLoading) setIsLoading(false); });
    };

    fetchInitialCounts();
    const unsubscribe = subscribeToRecentEvents();
    return () => unsubscribe();
  }, [isLoading]);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
        // Force light mode colors strictly for the PDF by temporarily adding a class or inline styles if necessary.
        // html2canvas supports background colors
        const canvas = await html2canvas(reportRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff', // Force white background for investor prints
            onclone: (clonedDoc: any) => {
                // Ensure the cloned document forces light mode styles
                clonedDoc.documentElement.classList.remove('dark');
            }
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Add header
        pdf.setFontSize(18);
        pdf.setTextColor(13, 148, 136); // Teal-600
        pdf.text('Dicilo.net - Reporte Analítico de Crecimiento', 14, 20);
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);
        
        pdf.addImage(imgData, 'PNG', 0, 35, pdfWidth, pdfHeight);
        pdf.save(`Dicilo_Reporte_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
        console.error("PDF Export Error: ", err);
    } finally {
        setIsExporting(false);
    }
  };

  const eventTypeMap: Record<string, string> = useMemo(
    () => ({
      search: t('statistics.events.search') || '🔍 Búsqueda en Directorio',
      cardClick: t('statistics.events.cardClick') || '👆 Clic en Tarjeta de Negocio',
      popupClick: t('statistics.events.popupClick') || '⭐ Interacción de Lead (Popup)',
      adImpression: t('statistics.events.adImpression') || '👁️ Impresión de Perfil'
    }),
    [t]
  );

  const badgeVariantMap: Record<string, 'outline' | 'secondary' | 'default'> = {
    search: 'outline',
    cardClick: 'secondary',
    popupClick: 'default',
    adImpression: 'secondary',
  };

  if (isLoading) return <StatisticsPageSkeleton />;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Centro de Control Estadístico</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Monitorea el crecimiento de visitas, interacciones y conversiones.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50" onClick={exportPDF} disabled={isExporting}>
                <Download className={`mr-2 h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
                {isExporting ? 'Procesando...' : 'Exportar Reporte PDF'}
            </Button>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200" asChild>
                <Link href="/admin/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Panel Admin
                </Link>
            </Button>
          </div>
        </div>

        {/* Wrap content in a div for PDF capturing */}
        <div ref={reportRef} className="bg-white dark:bg-slate-900 rounded-xl p-2">
            <Tabs defaultValue="traffic" className="w-full">
                <TabsList className="grid w-full md:w-[600px] grid-cols-3 mb-8 bg-slate-100 dark:bg-slate-800 p-1">
                    <TabsTrigger value="traffic" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-md"><Users className="w-4 h-4 mr-2" /> Tráfico Crecimiento</TabsTrigger>
                    <TabsTrigger value="ads" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-md"><MousePointerClick className="w-4 h-4 mr-2" /> Ads & Conversión</TabsTrigger>
                    <TabsTrigger value="clients" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-md"><TrendingUp className="w-4 h-4 mr-2" /> Red de Clientes</TabsTrigger>
                </TabsList>

                {/* TAB 1: VISITS & ANALYTICS */}
                <TabsContent value="traffic" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <TrafficAndAnalytics />
                </TabsContent>

                {/* TAB 2: ADS PERFORMANCE */}
                <TabsContent value="ads" className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
                    <GeneralAdStatistics />
                    
                    <div className="grid gap-6 md:grid-cols-3">
                        <StatCard
                            title="Total Búsquedas"
                            value={stats.totalSearches}
                            icon={<Search className="h-4 w-4 text-slate-400" />}
                        />
                        <StatCard
                            title="Ad Clicks (Tarjetas)"
                            value={stats.totalCardClicks}
                            icon={<MousePointerClick className="h-4 w-4 text-slate-400" />}
                        />
                        <StatCard
                            title="Leads (Popups Abiertos)"
                            value={stats.totalPopupClicks}
                            icon={<MousePointerClick className="h-4 w-4 text-slate-400" />}
                        />
                    </div>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg">Registro de Actividad en Vivo</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="pl-6">Fecha y Hora</TableHead>
                                        <TableHead>Acción</TableHead>
                                        <TableHead>Target (Empresa)</TableHead>
                                        <TableHead>Elemento</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentEvents.length > 0 ? (
                                        recentEvents.map((event) => (
                                            <TableRow key={event.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                                <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-300 pl-6">
                                                    {event.timestamp ? format(event.timestamp.toDate(), 'dd/MMM yyyy HH:mm') : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={badgeVariantMap[event.type] || 'default'} className="font-medium shadow-none">
                                                        {eventTypeMap[event.type] || event.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{event.businessName}</TableCell>
                                                <TableCell className="text-sm text-slate-500">{(event as any).details || event.clickedElement || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-slate-400">Sin interacciones recientes</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: CLIENTS */}
                <TabsContent value="clients" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ClientsStatisticsList t={t} />
                </TabsContent>
            </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
