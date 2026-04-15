'use client';

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { Loader2, Download, TrendingUp, MousePointerClick, Eye, Euro, Smartphone, Monitor, Share2, Users } from "lucide-react";
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { subDays } from 'date-fns';

interface DailyStat {
    date: string;
    views: number;
    clicks: number;
    cost: number;
    ctr: number;
    locations?: any;
}

interface AdStatisticsProps {
    adId: string;
}

const db = getFirestore(app);

export function AdStatistics({ adId }: AdStatisticsProps) {
    const { t } = useTranslation('admin');
    const [stats, setStats] = useState<DailyStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('7'); // days
    const [recommendationStats, setRecommendationStats] = useState<Record<string, number>>({});
    const [totalRecommendations, setTotalRecommendations] = useState(0);
    const [deviceStats, setDeviceStats] = useState({ mobile: 0, desktop: 0 });

    useEffect(() => {
        if (!adId) return;

        const fetchStats = async () => {
            setLoading(true);
            try {
                // Calculate date range
                const endDate = new Date();
                const startDate = subDays(endDate, parseInt(range));
                const startDateStr = startDate.toISOString().split('T')[0];

                const q = query(
                    collection(db, 'ad_stats_daily'),
                    where('adId', '==', adId),
                    where('date', '>=', startDateStr),
                    orderBy('date', 'asc')
                );

                const snapshot = await getDocs(q);
                let totalMob = 0;
                let totalDesk = 0;

                const data: DailyStat[] = snapshot.docs.map(doc => {
                    const d = doc.data();
                    const views = d.views || 0;
                    const clicks = d.clicks || 0;
                    totalMob += (d.mobileViews || 0);
                    totalDesk += (d.desktopViews || 0);

                    return {
                        date: d.date,
                        views,
                        clicks,
                        cost: d.cost || 0,
                        ctr: views > 0 ? (clicks / views) * 100 : 0,
                        locations: d.locations,
                        mobileViews: d.mobileViews || 0,
                        desktopViews: d.desktopViews || 0
                    } as any;
                });

                setStats(data);
                setDeviceStats({ mobile: totalMob, desktop: totalDesk });

                // Fetch Recommendations directly
                const recSnapshot = await getDocs(collection(db, 'clients', adId, 'recommendations'));
                const allRecs = recSnapshot.docs.map(d => d.data());
                
                const filteredRecs = allRecs.filter(r => {
                    if (!r.createdAt) return false;
                    const rDate = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
                    return rDate >= startDate;
                });
                
                const processedEmails: string[] = [];
                filteredRecs.forEach(r => {
                    if (r.referrals && Array.isArray(r.referrals)) {
                        r.referrals.forEach((ref: any) => {
                            if (ref.contact && ref.contact.includes('@')) {
                                const domain = ref.contact.split('@')[1].toLowerCase();
                                const publicDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'web.de', 'gmx.de', 'icloud.com'];
                                if (publicDomains.includes(domain)) {
                                    processedEmails.push(`@${domain}`);
                                } else {
                                    const parts = domain.split('.');
                                    const ext = parts.pop() || '';
                                    const base = parts.join('.');
                                    const baseObs = base.length > 3 ? base.slice(-3) : base;
                                    processedEmails.push(`...@...${baseObs}.${ext}`);
                                }
                            }
                        });
                    }
                });

                const recFreq: Record<string, number> = {};
                processedEmails.forEach(e => {
                   recFreq[e] = (recFreq[e] || 0) + 1;
                });
                
                setRecommendationStats(recFreq);
                setTotalRecommendations(processedEmails.length);

            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [adId, range]);

    // Totals
    const totalViews = stats.reduce((acc, curr) => acc + curr.views, 0);
    const totalClicks = stats.reduce((acc, curr) => acc + curr.clicks, 0);
    const totalCost = stats.reduce((acc, curr) => acc + curr.cost, 0);
    const avgCtr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    // Aggregate Locations
    const locationStats: Record<string, number> = {};
    stats.forEach(stat => {
        if (stat.locations) {
            Object.entries(stat.locations).forEach(([country, data]: [string, any]) => {
                locationStats[country] = (locationStats[country] || 0) + (data.clicks || 0);
                if (data.cities) {
                    Object.entries(data.cities).forEach(([city, count]: [string, any]) => {
                        const cityKey = `${city}, ${country}`;
                        // Optional: Track city specific stats if needed
                    });
                }
            });
        }
    });

    const topLocations = Object.entries(locationStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);


    const downloadReport = () => {
        const doc = new jsPDF();

        doc.text(t('adStats.reportTitle', 'Ad Performance Report'), 14, 20);
        doc.setFontSize(10);
        doc.text(`${t('adStats.generatedOn', 'Generated on')}: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableData = stats.map(s => [
            s.date,
            s.views,
            s.clicks,
            s.ctr.toFixed(2) + '%',
            s.cost.toFixed(2) + '€'
        ]);

        autoTable(doc, {
            startY: 40,
            head: [[
                t('adStats.date', 'Date'),
                t('adStats.views', 'Views'),
                t('adStats.clicks', 'Clicks'),
                t('adStats.ctr', 'CTR'),
                t('adStats.cost', 'Cost')
            ]],
            body: tableData,
            foot: [[
                t('adStats.total', 'Total'),
                totalViews,
                totalClicks,
                avgCtr.toFixed(2) + '%',
                totalCost.toFixed(2) + '€'
            ]]
        });

        // Add Device Stats
        doc.text(`Dispositivos: Móvil: ${deviceStats.mobile}  |  PC/Desktop: ${deviceStats.desktop}`, 14, doc.autoTable.previous.finalY + 15);

        // Add Recommendations
        if (totalRecommendations > 0) {
            doc.text(`Recomendaciones enviadas (Viral): ${totalRecommendations}`, 14, doc.autoTable.previous.finalY + 25);
            let startY = doc.autoTable.previous.finalY + 32;
            Object.entries(recommendationStats).sort((a,b) => b[1]-a[1]).forEach(([email, count]) => {
                doc.text(`${email}: ${count} veces`, 14, startY);
                startY += 6;
            });
        }

        doc.save(`dicilo-report-${adId}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    }

    if (stats.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>{t('adStats.title', 'Ad Statistics')}</CardTitle>
                    <CardDescription>{t('adStats.noData', 'No data available for the selected period.')}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">{t('adStats.title', 'Ad Statistics')}</h2>
                <div className="flex gap-2">
                    <Select value={range} onValueChange={setRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">{t('adStats.last7Days', 'Last 7 Days')}</SelectItem>
                            <SelectItem value="30">{t('adStats.last30Days', 'Last 30 Days')}</SelectItem>
                            <SelectItem value="90">{t('adStats.last90Days', 'Last 3 Months')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={downloadReport}>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('adStats.views', 'Views')}</CardTitle>
                        <Eye className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalViews}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center"><Smartphone className="h-3 w-3 mr-1"/> {deviceStats.mobile}</span>
                            <span className="flex items-center"><Monitor className="h-3 w-3 mr-1"/> {deviceStats.desktop}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('adStats.clicks', 'Clicks')}</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClicks}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CTR / Impacto</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgCtr.toFixed(2)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recomendaciones (Viral)</CardTitle>
                        <Share2 className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRecommendations}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('adStats.viewsAndClicks', 'Views & Clicks')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="views" fill="#3b82f6" name={t('adStats.views', 'Views')} />
                                <Bar dataKey="clicks" fill="#22c55e" name={t('adStats.clicks', 'Clicks')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('adStats.costProgression', 'Cost Progression')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="cost" stroke="#ef4444" name={t('adStats.cost', 'Cost (€)')} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top Locations & Recommendations */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Locations</CardTitle>
                        <CardDescription>Where your clicks are coming from</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topLocations.length > 0 ? (
                            <div className="space-y-4">
                                {topLocations.map(([location, count], index) => (
                                    <div key={location} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                                {index + 1}
                                            </div>
                                            <span>{location}</span>
                                        </div>
                                        <div className="font-bold">{count} clicks</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-4">
                                No location data available yet.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Impacto Viral (Recomendaciones)</CardTitle>
                        <CardDescription>Plataformas donde te han recomendado (Privacidad protegida)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(recommendationStats).length > 0 ? (
                            <div className="space-y-4">
                                {Object.entries(recommendationStats)
                                    .sort((a,b) => b[1]-a[1])
                                    .map(([domain, count], index) => (
                                    <div key={domain} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium">{domain}</span>
                                        </div>
                                        <div className="font-bold text-rose-600">{count} envíos</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                Aún no has recibido recomendaciones esta semana.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
