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
import { Loader2, Download, TrendingUp, MousePointerClick, Eye, Euro } from "lucide-react";
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
}

const db = getFirestore(app);

export function GeneralAdStatistics() {
    const { t } = useTranslation('admin');
    const [stats, setStats] = useState<DailyStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('30'); // default 30 days for general stats

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Calculate date range
                const endDate = new Date();
                const startDate = subDays(endDate, parseInt(range));
                const startDateStr = startDate.toISOString().split('T')[0];

                // Query ALL ad_stats_daily for the date range
                // Note: This might be expensive if we have 10k+ ads.
                // Optimally we'd have a scheduled function aggregating this into 'global_stats_daily'.
                const q = query(
                    collection(db, 'ad_stats_daily'),
                    where('date', '>=', startDateStr),
                    orderBy('date', 'asc')
                );

                const snapshot = await getDocs(q);

                // Client-side aggregation
                const map: Record<string, DailyStat> = {};

                snapshot.docs.forEach(doc => {
                    const d = doc.data();
                    const date = d.date;
                    if (!map[date]) {
                        map[date] = { date, views: 0, clicks: 0, cost: 0, ctr: 0 };
                    }
                    map[date].views += (d.views || 0);
                    map[date].clicks += (d.clicks || 0);
                    map[date].cost += (d.cost || 0);
                });

                // Convert map to array and calc CTR
                const data: DailyStat[] = Object.values(map)
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(d => ({
                        ...d,
                        ctr: d.views > 0 ? (d.clicks / d.views) * 100 : 0
                    }));

                setStats(data);
            } catch (error) {
                console.error("Error fetching general stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [range, t]);

    // Totals
    const totalViews = stats.reduce((acc, curr) => acc + curr.views, 0);
    const totalClicks = stats.reduce((acc, curr) => acc + curr.clicks, 0);
    const totalCost = stats.reduce((acc, curr) => acc + curr.cost, 0);
    const avgCtr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    const downloadReport = () => {
        const doc = new jsPDF();

        doc.text(t('adStats.reportTitle', 'Ad Performance Report'), 14, 20);
        doc.setFontSize(10);
        doc.text(`${t('adStats.generatedOn', 'Generated on')}: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.text(`Scope: All Ads`, 14, 35);

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

        doc.save(`general-ad-report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    }

    if (stats.length === 0) {
        return (
            <Card className="w-full mt-6">
                <CardHeader>
                    <CardTitle>{t('adStats.title', 'Ad Statistics')}</CardTitle>
                    <CardDescription>{t('adStats.noData', 'No data available for the selected period.')}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">{t('adStats.title', 'Ad Statistics')}</h2>
                    <p className="text-muted-foreground text-sm">Aggregated performance across all ads</p>
                </div>
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
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalViews}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('adStats.clicks', 'Clicks')}</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClicks}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AVG CTR</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgCtr.toFixed(2)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total {t('adStats.cost', 'Cost')}</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCost.toFixed(2)}€</div>
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
        </div>
    );
}
