'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
// import { I18nProvider } from '@/context/i18n-provider';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { sendStatisticsEmail } from '@/app/actions/statistics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import {
    Download,
    Mail,
    ArrowLeft,
    Calendar,
    Eye,
    MousePointerClick,
    MapPin,
    Share2,
    Trophy,
    Activity,
    User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

// --- Types ---
interface DailyStat {
    date: string;
    views: number;
    clicks: number;
    profileViews?: number;
    driveToStoreCount?: number;
    socialClickCount?: number;
    topPositionCount?: number;
    cost?: number;
    [key: string]: any;
}

interface ClientData {
    clientName: string;
    clientLogoUrl?: string;
    clientType?: string;
    address?: string;
}

// --- Components ---
const MetricCard = ({
    title,
    value,
    subtext,
    icon: Icon,
    colorClass = 'text-gray-900',
}: {
    title: string;
    value: string | number;
    subtext?: string;
    icon: any;
    colorClass?: string;
}) => (
    <Card>
        <CardContent className="flex items-center justify-between p-6">
            <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                <h3 className={`text-2xl font-bold ${colorClass}`}>{value}</h3>
                {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
        </CardContent>
    </Card>
);

export default function ClientStatisticsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t } = useTranslation('admin'); // Assuming admin translations, fallback to common
    const { toast } = useToast();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [stats, setStats] = useState<DailyStat[]>([]);
    const [client, setClient] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [overallTotals, setOverallTotals] = useState<any>(null);

    // --- Fetch Data ---
    // --- Fetch Data ---
    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Fetch real stats
                const queryParams = new URLSearchParams();
                if (dateRange.start) queryParams.append('start', dateRange.start);
                if (dateRange.end) queryParams.append('end', dateRange.end);

                const statsPromise = fetch(`/api/admin/statistics/${id}?${queryParams.toString()}`);
                const clientPromise = fetch(`/api/admin/clients/${id}`); // Assuming this exists or we get it from elsewhere
                // Actually, for now let's just mock the CLIENT INFO if that API doesn't exist, but get REAL STATS.
                // Or better, fetch client info from `businesses` or `clients`.

                // Let's assume we can at least get the stats.
                const res = await statsPromise;
                if (!res.ok) throw new Error("Failed to fetch stats");
                const data = await res.json();

                setStats(data.stats || []);
                setOverallTotals(data.overallTotals || null);

                // Mock Client Info for now if we don't have a dedicated endpoint, 
                // OR try to fetch it if we know the endpoint.
                // Assuming we might need to fetch business details.
                // For now, let's keep the client info mock but use REAL stats.
                // Ideally, we should fetch the actual client Name.
                setClient({
                    clientName: 'Client ' + id, // Fallback
                    clientLogoUrl: '',
                    address: '',
                    clientType: 'standard'
                });

            } catch (error) {
                console.error('Failed to fetch stats', error);
                toast({
                    title: t('common:error') || 'Error',
                    description: 'Error loading statistics',
                    variant: 'destructive'
                });
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchStats();
        }
    }, [id, dateRange, toast, t]);

    // --- Aggregations ---
    const totals = useMemo(() => {
        // If API provided overall totals, use them! (Matches Ads Manager)
        if (overallTotals) {
            return {
                views: overallTotals.views,
                clicks: overallTotals.clicks,
                driveToStore: 0, // Not tracked in banners yet
                socialClick: overallTotals.shares, // mapped to social icon in Ads Manager
                topPosition: 0, // Not tracked
                cost: overallTotals.cost,
            };
        }

        return stats.reduce(
            (acc, curr) => ({
                views: acc.views + (curr.views || 0),
                clicks: acc.clicks + (curr.clicks || 0),
                driveToStore: acc.driveToStore + (curr.driveToStoreCount || 0),
                socialClick: acc.socialClick + (curr.socialClickCount || 0),
                topPosition: acc.topPosition + (curr.topPositionCount || 0),
                cost: acc.cost + (curr.cost || 0),
            }),
            { views: 0, clicks: 0, driveToStore: 0, socialClick: 0, topPosition: 0, cost: 0 }
        );
    }, [stats, overallTotals]);

    const ctr = totals.views > 0 ? ((totals.clicks / totals.views) * 100).toFixed(2) : '0.00';

    const generatePDF = async () => {
        const element = document.getElementById('statistics-dashboard');
        if (!element) return null;

        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            return pdf;
        } catch (error) {
            console.error("PDF Generation failed", error);
            return null;
        }
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        toast({ title: 'Generating PDF...', description: 'Please wait.' });
        const pdf = await generatePDF();
        if (pdf) {
            pdf.save(`Report_${client?.clientName || 'Client'}_${new Date().toISOString().split('T')[0]}.pdf`);
            toast({ title: 'Success', description: 'PDF downloaded successfully' });
        } else {
            toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
        }
        setIsGeneratingPdf(false);
    };

    const handleEmailReport = async () => {
        const email = prompt("Enter recipient email address:");
        if (!email) return;

        setIsGeneratingPdf(true);
        toast({ title: 'Generating Report...', description: 'Preparing PDF for email.' });

        const pdf = await generatePDF();
        if (!pdf) {
            toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
            setIsGeneratingPdf(false);
            return;
        }

        const pdfBase64 = pdf.output('datauristring');
        const dateStr = `${dateRange.start || 'Start'} to ${dateRange.end || 'Now'}`;

        toast({ title: 'Sending Email...', description: 'This may take a moment.' });

        // Dynamic import to avoid server-action issues if needed, or just standard import
        // Assuming sendStatisticsEmail is available from import
        const result = await sendStatisticsEmail(email, client?.clientName || 'Client', pdfBase64, dateStr);

        if (result.success) {
            toast({ title: 'Sent!', description: 'Report sent successfully!' });
        } else {
            toast({ title: 'Error', description: 'Failed to send email: ' + result.error, variant: 'destructive' });
        }
        setIsGeneratingPdf(false);
    };

    if (loading && !client) return <div className="p-8 text-center">Loading Statistics...</div>;

    return (
        <div id="statistics-dashboard" className="container mx-auto p-6 space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="print:hidden">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    {client?.clientLogoUrl && (
                        <Image
                            src={client.clientLogoUrl}
                            alt="Logo"
                            width={64}
                            height={64}
                            className="rounded-lg shadow-sm border bg-white p-1"
                        />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{client?.clientName || t('statistics.client.title')}</h1>
                        <p className="text-sm text-gray-500">{client?.address}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                    <Button variant="outline" className="gap-2" onClick={handleDownloadPDF} disabled={isGeneratingPdf}>
                        <Download className="w-4 h-4" />
                        {isGeneratingPdf ? t('statistics.client.generating') : t('statistics.client.downloadPdf')}
                    </Button>
                    <Button variant="default" className="gap-2" onClick={handleEmailReport} disabled={isGeneratingPdf}>
                        <Mail className="w-4 h-4" />
                        {t('statistics.client.emailReport')}
                    </Button>
                </div>
            </div>

            {/* Date Filter & Progress */}
            <Card className="bg-white border-0 shadow-sm print:hidden">
                <CardContent className="p-4 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <Input
                            type="date"
                            className="w-40"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="text-gray-400">-</span>
                        <Input
                            type="date"
                            className="w-40"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Campaign Progress</span>
                            <span>Active</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-3/4 rounded-full"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <MetricCard
                    title={t('statistics.client.views')}
                    value={totals.views.toLocaleString()}
                    icon={Eye}
                    colorClass="text-blue-600"
                />
                <MetricCard
                    title={t('statistics.client.clicks')}
                    value={totals.clicks.toLocaleString()}
                    icon={MousePointerClick}
                    colorClass="text-green-600"
                />
                <MetricCard
                    title={t('statistics.client.ctr')}
                    value={`${ctr}%`}
                    icon={Activity}
                    colorClass="text-purple-600"
                />
                <MetricCard
                    title={t('statistics.client.topPositions')}
                    value={totals.topPosition.toLocaleString()}
                    subtext={t('statistics.client.topPositionsSub')}
                    icon={Trophy}
                    colorClass="text-amber-500"
                />
                <MetricCard
                    title={t('statistics.client.driveToStore')}
                    value={totals.driveToStore.toLocaleString()}
                    subtext={t('statistics.client.driveToStoreSub')}
                    icon={MapPin}
                    colorClass="text-red-500"
                />
                <MetricCard
                    title={t('statistics.client.socialViews')}
                    value={totals.socialClick.toLocaleString()}
                    subtext={t('statistics.client.socialViewsSub')}
                    icon={Share2}
                    colorClass="text-indigo-500"
                />
            </div>

            {/* Detailed Charts Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-white p-1 border">
                    <TabsTrigger value="overview">{t('statistics.client.tabs.overview')}</TabsTrigger>
                    <TabsTrigger value="ads">{t('statistics.client.tabs.ads')}</TabsTrigger>
                    <TabsTrigger value="geo">{t('statistics.client.tabs.geo')}</TabsTrigger>
                    <TabsTrigger value="events">{t('statistics.client.tabs.events')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('statistics.client.trendChart')}</CardTitle>
                            <CardDescription>{t('statistics.client.trendChartSub')}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={(val) => val.slice(8, 10)} />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line yAxisId="left" type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} dot={false} name={t('statistics.client.views')} />
                                    <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#16a34a" strokeWidth={2} dot={false} name={t('statistics.client.clicks')} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ads">
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            Detailed ad breakdown coming soon...
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="geo">
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            Geo distribution map coming soon...
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
}
