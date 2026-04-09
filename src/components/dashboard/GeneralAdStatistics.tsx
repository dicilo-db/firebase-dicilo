'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, Download, Search, MousePointerClick, Globe, Users } from "lucide-react";
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { subDays, subHours, subMonths, subYears } from 'date-fns';

interface DailyStat {
    date: string;
    searches: number;
    cardClicks: number;
    popupClicks: number;
    impressions: number;
}

const db = getFirestore(app);

export function GeneralAdStatistics() {
    const { t } = useTranslation('admin');
    const [stats, setStats] = useState<DailyStat[]>([]);
    const [topLocations, setTopLocations] = useState<[string, number][]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('30d');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const now = new Date();
                let startDate = now;
                if (range === '24h') startDate = subHours(now, 24);
                else if (range === '48h') startDate = subHours(now, 48);
                else if (range === '7d') startDate = subDays(now, 7);
                else if (range === '30d') startDate = subMonths(now, 1);
                else if (range === '1y') startDate = subYears(now, 1);
                else if (range === 'all') startDate = new Date(2020, 0, 1);
                
                // Fetch Analytics Events
                const eventsQuery = query(
                    collection(db, 'analyticsEvents'),
                    where('timestamp', '>=', Timestamp.fromDate(startDate))
                );
                
                const eventsSnap = await getDocs(eventsQuery);
                const map: Record<string, DailyStat> = {};
                
                eventsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    const ts = data.timestamp as Timestamp;
                    if (!ts) return;
                    const dateStr = ts.toDate().toISOString().split('T')[0];
                    if (!map[dateStr]) map[dateStr] = { date: dateStr, searches: 0, cardClicks: 0, popupClicks: 0, impressions: 0 };
                    
                    if (data.type === 'search') map[dateStr].searches++;
                    else if (data.type === 'cardClick') map[dateStr].cardClicks++;
                    else if (data.type === 'popupClick') map[dateStr].popupClicks++;
                    else if (data.type === 'adImpression') map[dateStr].impressions++;
                });

                const data: DailyStat[] = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
                setStats(data);
                
                // Fetch Site Visits for Locations
                const visitsQuery = query(
                    collection(db, 'site_visits'),
                    where('createdAt', '>=', Timestamp.fromDate(startDate))
                );
                const visitsSnap = await getDocs(visitsQuery);
                const locationStats: Record<string, number> = {};
                visitsSnap.docs.forEach(doc => {
                    const country = doc.data().country || 'Unknown';
                    locationStats[country] = (locationStats[country] || 0) + 1;
                });
                
                setTopLocations(
                    Object.entries(locationStats)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                );

            } catch (error) {
                console.error("Error fetching general stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [range]);

    const totalSearches = stats.reduce((acc, curr) => acc + curr.searches, 0);
    const totalCardClicks = stats.reduce((acc, curr) => acc + curr.cardClicks, 0);
    const totalLeads = stats.reduce((acc, curr) => acc + curr.popupClicks, 0);

    const downloadReport = () => {
        const doc = new jsPDF();
        doc.text(t('statistics.general.title') || 'Metricas Globales', 14, 20);
        doc.setFontSize(10);
        doc.text(`${t('adStats.generatedOn') || 'Generado el'}: ${new Date().toLocaleDateString()}`, 14, 30);
        
        const tableData = stats.map(s => [s.date, s.searches, s.cardClicks, s.popupClicks, s.impressions]);
        autoTable(doc, {
            startY: 40,
            head: [['Fecha', 'Busquedas', 'Clics Tarjetas', 'Leads', 'Impresiones']],
            body: tableData,
            foot: [['Total', totalSearches, totalCardClicks, totalLeads, stats.reduce((a,c)=>a+c.impressions,0)]]
        });
        doc.save(`global-metrics-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">{t('statistics.general.title') || 'Métricas Globales'}</h2>
                    <p className="text-muted-foreground text-sm">{t('statistics.general.description') || 'Rendimiento agregado de interacciones reales'}</p>
                </div>
                <div className="flex gap-2">
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
                    <Button variant="outline" onClick={downloadReport}>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('statistics.general.totalSearches') || 'Búsquedas Totales'}</CardTitle>
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSearches}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('statistics.general.totalCardClicks') || 'Clics en Tarjetas'}</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCardClicks}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('statistics.general.totalLeads') || 'Leads (Popups)'}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalLeads}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('statistics.general.interactionsChart') || 'Interacciones a lo largo del tiempo'}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="searches" fill="#3b82f6" name="Búsquedas" />
                                <Bar dataKey="cardClicks" fill="#10b981" name="Clics Tarjetas" />
                                <Bar dataKey="popupClicks" fill="#8b5cf6" name="Popups / Leads" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Locations - NEW */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('statistics.general.topLocationsTitle') || 'Ubicaciones Top (Global)'}</CardTitle>
                        <CardDescription>{t('statistics.general.topLocationsSub') || 'Visitas registradas por país'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topLocations.length > 0 ? (
                            <div className="space-y-4">
                                {topLocations.map(([location, count], index) => (
                                    <div key={location} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">
                                                #{index + 1}
                                            </div>
                                            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center"><Globe className="w-4 h-4 mr-2" />{location}</span>
                                        </div>
                                        <div className="font-bold text-sm bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-2 py-1 rounded-full">{count} vis.</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-4">
                                {t('statistics.general.noLocationData') || 'No location data available yet.'}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
