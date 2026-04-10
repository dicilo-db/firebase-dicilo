'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getFreelancerStats, FreelancerStats } from '@/app/actions/freelancer-stats';
import { getMarketingSends, MarketingSend } from '@/app/actions/marketing-sends';
import { checkAdminRole } from '@/lib/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { ProspectValidationDialog } from '@/components/admin/ProspectValidationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import {
    Eye, ThumbsUp, Share2, Calendar,
    Facebook, Instagram, Twitter, Linkedin,
    Image as ImageIcon, Youtube,
    MessageCircle, Send, Pin, Twitch,
    BarChart3, Users, Building2, Info, ExternalLink, CheckCircle2, Clock, Mail,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Helper: Video Icon
const VideoIcon = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v-4z" />
        <rect x="3" y="6" width="12" height="12" rx="2" />
    </svg>
)

export function StatisticsView() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState<FreelancerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [marketingSends, setMarketingSends] = useState<MarketingSend[]>([]);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const [userRole, setUserRole] = useState<string>('user');
    const [isValidationOpen, setIsValidationOpen] = useState(false);
    const [validationProspect, setValidationProspect] = useState<any>(null);

    // All users who can access their own statistics view can edit their own prospects
    const hasValidationAccess = true;

    useEffect(() => {
        if (!user) return;
        async function load() {
            setIsLoading(true);
            try {
                const [statsRes, sendsRes, adminData] = await Promise.all([
                    getFreelancerStats(user!.uid),
                    getMarketingSends(user!.uid),
                    checkAdminRole(user!)
                ]);

                if (adminData) {
                    setUserRole(adminData.role);
                }

                if (statsRes.success && statsRes.stats) {
                    setStats(statsRes.stats);
                }
                if (sendsRes.success && sendsRes.sends) {
                    setMarketingSends(sendsRes.sends);
                }
            } catch (error) {
                console.error('Error loading stats/sends:', error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [user]);

    // Derived Stats (Mocking mostly since we transition to a Follower-heavy view)
    const totalPosts = stats?.totalPosts || 0;
    const totalEarnings = stats?.totalEarnings || 0;
    const totalViews = totalPosts * 154; // Mock estimate based on screenshot numbers
    const totalReach = Math.floor(totalViews * 0.85);
    const totalInteractions = Math.floor(totalViews * 0.05);

    const toggleSection = (section: string) => {
        setActiveSection(prev => prev === section ? null : section);
        
        // Scroll to the section if opening it
        if (activeSection !== section) {
            setTimeout(() => {
                const id = section === 'prospects' ? 'prospects-table' 
                         : section === 'marketing' ? 'marketing-sends-table'
                         : section === 'posts' ? 'posts-table' : null;
                if (id) {
                    const el = document.getElementById(id);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };

    const handleVerifyClick = async (prospectId: string) => {
        if (!hasValidationAccess) {
            toast({ title: t('common.error', 'Error'), description: t('freelancer_views.statistics.no_permission', 'No tienes permiso para realizar esta acción.'), variant: 'destructive' });
            return;
        }
        
        try {
            const db = getFirestore(app);
            const docRef = doc(db, 'recommendations', prospectId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setValidationProspect({ id: snap.id, ...snap.data() });
                setIsValidationOpen(true);
            } else {
                toast({ title: 'Error', description: 'No se encontró la recomendación.' });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Error al abrir la recomendación.' });
        }
    };

    const handleCardClick = (label: string) => {
        const prospectsLabel = t('adsManager.cards.programs.prospects.managerTitle', 'Empresas Registradas');
        const marketingLabel = "Envíos de E-Mail Marketing";
        const postsLabel = t('freelancer_views.statistics.published_posts');

        if (label === prospectsLabel || label === 'Mis Prospectos Registrados') {
            toggleSection('prospects');
        } else if (label === marketingLabel) {
            toggleSection('marketing');
        } else if (label === postsLabel) {
            toggleSection('posts');
        } else {
            toast({
                title: label,
                description: t('freelancer_views.statistics.card_click_msg', 'Visualización detallada próximamente'),
            });
        }
    };

    const channels = [
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-500' },
        { id: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-500' },
        { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
        { id: 'facebook', label: 'Facebook Fanpage', icon: Facebook, color: 'text-blue-600' },
        { id: 'tiktok', label: 'TikTok', icon: VideoIcon, color: 'text-black dark:text-white' },
        { id: 'linkedin', label: 'LinkedIn Fanpage', icon: Linkedin, color: 'text-blue-700' },
        { id: 'youtube', label: 'YouTube Kanal', icon: Youtube, color: 'text-red-600' },
        { id: 'twitter', label: '"X" (Früher Twitter)', icon: Twitter, color: 'text-slate-900 dark:text-slate-50' },
        { id: 'twitch', label: 'Twitch Kanal', icon: Twitch, color: 'text-purple-600' },
        { id: 'pinterest', label: 'Pinterest Kanal', icon: Pin, color: 'text-red-500' },
    ];


    if (isLoading) {
        return (
            <div className="p-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
                <Skeleton className="h-64 mt-8" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 dark:bg-black/10 min-h-full w-full max-w-full overflow-x-hidden">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    {t('freelancer_views.statistics.title')} {getIconForPlatform('facebook')} {getIconForPlatform('instagram')}
                </h1>
                <p className="text-muted-foreground mt-1 max-w-3xl">
                    {t('freelancer_views.statistics.subtitle')}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                <KpiCard icon={ImageIcon} label={t('freelancer_views.statistics.published_posts')} value={totalPosts} onClick={() => handleCardClick(t('freelancer_views.statistics.published_posts'))} />
                <KpiCard icon={Calendar} label={t('freelancer_views.statistics.planned')} value="-" onClick={() => handleCardClick(t('freelancer_views.statistics.planned'))} />
                <KpiCard icon={Eye} label={t('freelancer_views.statistics.contacts')} value={totalViews} onClick={() => handleCardClick(t('freelancer_views.statistics.contacts'))} />
                <KpiCard icon={Share2} label={t('freelancer_views.statistics.reach')} value={totalReach} onClick={() => handleCardClick(t('freelancer_views.statistics.reach'))} />

                <KpiCard icon={Building2} label={t('adsManager.cards.programs.prospects.managerTitle', 'Empresas Registradas')} value={stats?.totalBusinessesRegistered || 0} onClick={() => handleCardClick(t('adsManager.cards.programs.prospects.managerTitle', 'Empresas Registradas'))} />
                <KpiCard icon={ThumbsUp} label={t('freelancer_menu.connections')} value={totalInteractions} onClick={() => handleCardClick(t('freelancer_menu.connections'))} />
                <KpiCard icon={Facebook} label="Facebook" value="121" onClick={() => handleCardClick("Facebook")} />
                <KpiCard icon={Instagram} label="Instagram" value="79" onClick={() => handleCardClick("Instagram")} />
                <KpiCard 
                    icon={Mail} 
                    label="Envíos de E-Mail Marketing" 
                    value={marketingSends.length} 
                    onClick={() => handleCardClick("Envíos de E-Mail Marketing")}
                    isActive={activeSection === 'marketing'}
                />
                <KpiCard icon={Users} label={t('freelancer_views.statistics.referred_users', 'Usuarios en mi Red')} value={stats?.totalReferredUsers || 0} onClick={() => handleCardClick(t('freelancer_views.statistics.referred_users', 'Usuarios en mi Red'))} />
            </div>

            {/* Recent Prospects List */}
            {stats?.recentProspects && stats.recentProspects.length > 0 && (
                <Card id="prospects-table" className={cn(
                    "bg-white dark:bg-card shadow-sm border overflow-hidden transition-all duration-300",
                    activeSection === 'prospects' ? "ring-2 ring-purple-500/20" : "opacity-90 grayscale-[0.2]"
                )}>
                    <CardHeader 
                        className="border-b bg-slate-50/50 cursor-pointer hover:bg-slate-100/80 transition-colors"
                        onClick={() => toggleSection('prospects')}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-purple-500" />
                                <CardTitle className="text-lg">
                                    {t('adsManager.cards.programs.prospects.managerTitle', 'Mis Prospectos Registrados')}
                                </CardTitle>
                            </div>
                            {activeSection === 'prospects' ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                        </div>
                    </CardHeader>
                    {activeSection === 'prospects' && (
                        <CardContent className="p-0 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px] leading-tight">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-3 py-2 text-left">{t('recommendations.table.paymentStatus', 'Estado del Pago')}</th>
                                        <th className="px-3 py-2 text-right">{t('recommendations.table.actions', 'Acciones')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {stats.recentProspects.map((prospect) => (
                                        <tr key={prospect.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-3 py-2 font-medium text-slate-900">{prospect.companyName}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-col">
                                                    <span>{prospect.contactName}</span>
                                                    <span className="text-[10px] text-muted-foreground">{prospect.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-slate-600">{prospect.companyEmail || prospect.email}</td>
                                            <td className="px-3 py-2 text-slate-600 capitalize">{prospect.category}</td>
                                            <td className="px-3 py-2 text-slate-600">{prospect.city}, {prospect.country}</td>
                                            <td className="px-3 py-2 max-w-[120px]">
                                                <div className="flex flex-col gap-1">
                                                    <span className="truncate" title={prospect.comments}>{prospect.comments}</span>
                                                    {prospect.website && (
                                                        <a href={prospect.website} target="_blank" className="text-blue-500 text-[10px] flex items-center gap-1 hover:underline">
                                                            <ExternalLink className="h-2 w-2" /> Web
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge className={cn(
                                                    "capitalize text-[10px] gap-1",
                                                    prospect.converted ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                                                )}>
                                                    {prospect.converted ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                    {prospect.converted ? t('recommendations.status.converted', 'Convertido') : t('recommendations.status.pending', 'Pendiente')}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold">{prospect.rewardAmount} DP</span>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[8px] py-0 px-1 leading-none",
                                                        prospect.pointsPaid ? "border-green-200 text-green-600 bg-green-50" : "border-yellow-200 text-yellow-600 bg-yellow-50"
                                                    )}>
                                                        {prospect.pointsPaid ? t('recommendations.status.paid', 'Pagado') : t('recommendations.status.pending', 'Pendiente')}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right whitespace-nowrap">
                                                {hasValidationAccess ? (
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-blue-600" onClick={() => handleVerifyClick(prospect.id)}>
                                                        {t('recommendations.actions.technicalSheet', 'Ficha Técnica')}
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-slate-500" onClick={() => {
                                                        toast({
                                                            title: prospect.companyName,
                                                            description: `${t('common.date', 'Fecha')}: ${new Date(prospect.date).toLocaleDateString()}`,
                                                        });
                                                    }}>
                                                        {t('recommendations.actions.details', 'Detalles')}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </CardContent>
                    )}
                </Card>
            )}

            {/* Community Posts History */}
            {stats?.communityPosts && stats.communityPosts.length > 0 && (
                <Card id="posts-table" className={cn(
                    "bg-white dark:bg-card shadow-sm border overflow-hidden transition-all duration-300",
                    activeSection === 'posts' ? "ring-2 ring-blue-500/20" : "opacity-90 grayscale-[0.2]"
                )}>
                    <CardHeader 
                        className="border-b bg-slate-50/50 cursor-pointer hover:bg-slate-100/80 transition-colors"
                        onClick={() => toggleSection('posts')}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-blue-500" />
                                <CardTitle className="text-lg">
                                    {t('freelancer_views.statistics.published_posts')} (Comunidad)
                                </CardTitle>
                            </div>
                            {activeSection === 'posts' ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                        </div>
                    </CardHeader>
                    {activeSection === 'posts' && (
                        <CardContent className="p-0 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px] leading-tight text-center">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-3 py-2 text-left">{t('common.date', 'Fecha')}</th>
                                        <th className="px-3 py-2">{t('common.time', 'Hora')}</th>
                                        <th className="px-3 py-2 text-right">{t('recommendations.table.reward', 'Recompensa')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {stats.communityPosts.map((post) => {
                                        const dateObj = new Date(post.date);
                                        return (
                                            <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-3 py-2 text-left font-medium text-slate-900">
                                                    {dateObj.toLocaleDateString()}
                                                </td>
                                                <td className="px-3 py-2 text-slate-600">
                                                    {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className="font-bold text-green-600">+{post.amount} DP</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        </CardContent>
                    )}
                </Card>
            )}

            {/* Email Marketing Sends History */}
            {marketingSends.length > 0 && (
                <Card id="marketing-sends-table" className={cn(
                    "bg-white dark:bg-card shadow-sm border overflow-hidden transition-all duration-300",
                    activeSection === 'marketing' ? "ring-2 ring-emerald-500/20" : "opacity-90 grayscale-[0.2]"
                )}>
                    <CardHeader 
                        className="border-b bg-slate-50/50 py-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                        onClick={() => toggleSection('marketing')}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-emerald-500" />
                                <CardTitle className="text-lg font-bold">
                                    Envíos de E-Mail Marketing
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                    {marketingSends.length} Total
                                </Badge>
                                {activeSection === 'marketing' ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                            </div>
                        </div>
                    </CardHeader>
                    {activeSection === 'marketing' && (
                        <CardContent className="p-0 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px] leading-tight text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-3">Fecha / Hora</th>
                                        <th className="px-4 py-3">Destinatario</th>
                                        <th className="px-4 py-3">Plantilla</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                        <th className="px-4 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {marketingSends.map((send) => {
                                        const dateObj = new Date(send.createdAt);
                                        const initial = send.friendName?.charAt(0).toUpperCase() || '?';
                                        
                                        return (
                                            <tr key={send.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-4 py-3 font-medium">
                                                    <div className="text-slate-900 font-semibold">{dateObj.toLocaleDateString()}</div>
                                                    <div className="text-[10px] text-muted-foreground">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                                                            {initial}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-slate-800 truncate">{send.friendName}</span>
                                                            <span className="text-[10px] text-muted-foreground truncate">{send.friendEmail}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="bg-slate-50 text-[10px] font-medium capitalize truncate max-w-[120px]">
                                                        {send.template.replace(/_/g, ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {send.converted ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] py-0 px-2">
                                                            Registrado
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100 text-[10px] py-0 px-2 italic">
                                                            Enviado
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-base">
                                                    <span className="font-black text-emerald-600">+{send.rewardAmount} <span className="text-[10px]">DP</span></span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 text-[11px] font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100"
                                                        onClick={() => {
                                                            toast({
                                                                title: "Detalles del Envío",
                                                                description: `Invitación enviada a ${send.friendName} usando la plantilla ${send.template}.`,
                                                            });
                                                        }}
                                                    >
                                                        Ver
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        </CardContent>
                    )}
                </Card>
            )}

            {/* ACCORDION for Insights */}
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-bold">{t('freelancer_views.statistics.accordion_title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('freelancer_views.statistics.accordion_desc')}</p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {channels.map((channel) => {
                        // Mock growth data logic per channel
                        const data = generateMockData(channel.id === 'facebook' ? 120 : channel.id === 'instagram' ? 70 : 10);
                        const currentFollowers = data[data.length - 1].value;
                        const growth = ((currentFollowers - data[0].value) / data[0].value * 100).toFixed(2);

                        return (
                            <AccordionItem key={channel.id} value={channel.id}>
                                <AccordionTrigger className="hover:no-underline px-4 border rounded-lg mb-2 data-[state=open]:mb-0 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:bg-slate-50 transition-all">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className={cn("h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0", channel.color)}>
                                            <channel.icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold text-base">{channel.label}</span>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
                                                <span>{currentFollowers} {t('freelancer_views.statistics.followers')}</span>
                                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded", Number(growth) >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                                    {Number(growth) > 0 ? '+' : ''}{growth}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="border border-t-0 p-6 rounded-b-lg">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="text-lg font-bold flex items-center gap-2">
                                                    {channel.label} <channel.icon className={cn("h-5 w-5", channel.color)} />
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm font-semibold">+{Math.floor(Math.random() * 5)} {t('freelancer_views.statistics.followers')}</span>
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('freelancer_views.statistics.since')} 29.12.2024</span>
                                                </div>
                                            </div>
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold bg-white shadow-sm">{t('freelancer_views.statistics.filter_total')}</Button>
                                                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">{t('freelancer_views.statistics.filter_last_month')}</Button>
                                                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">{t('freelancer_views.statistics.filter_last_3_months')}</Button>
                                            </div>
                                        </div>

                                        {/* CHART */}
                                        <div className="h-[250px] w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data}>
                                                    <defs>
                                                        <linearGradient id={`grad-${channel.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="name"
                                                        stroke="#94a3b8"
                                                        fontSize={10}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#94a3b8"
                                                        fontSize={10}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        domain={['dataMin - 1', 'dataMax + 1']}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#3b82f6"
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        fill={`url(#grad-${channel.id})`}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>

            {hasValidationAccess && validationProspect && (
                <ProspectValidationDialog
                    prospect={validationProspect}
                    isOpen={isValidationOpen}
                    onOpenChange={setIsValidationOpen}
                    onUpdate={(updatedProspect) => {
                        // Optimistically update the list if needed, or simply reload stats.
                        // Ideally we update the specific item in stats.recentProspects.
                        if (stats) {
                            setStats({
                                ...stats,
                                recentProspects: stats.recentProspects.map(p => 
                                    p.id === updatedProspect.id 
                                        ? { ...p, status: updatedProspect.status || p.status, converted: updatedProspect.converted }
                                        : p
                                )
                            });
                        }
                    }}
                />
            )}
        </div>
    );
}

function KpiCard({ icon: Icon, label, value, onClick, isActive }: { icon: any, label: string, value: string | number, onClick?: () => void, isActive?: boolean }) {
    return (
        <Card 
            className={cn(
                "shadow-sm border-0 border-l-4 transition-all duration-300",
                isActive ? "border-l-primary bg-primary/5 ring-1 ring-primary/10" : "border-l-primary/20",
                onClick && "cursor-pointer hover:bg-slate-50 active:scale-[0.98] active:shadow-inner"
            )}
            onClick={onClick}
        >
            <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-lg md:text-xl font-bold truncate tracking-tight">{value}</div>
                    <div className="text-[10px] md:text-xs font-medium text-muted-foreground break-words leading-tight" title={label}>{label}</div>
                </div>
            </CardContent>
        </Card>
    );
}

// Helper for icons
function getIconForPlatform(platform: string) {
    if (platform === 'facebook') return <Facebook className="h-4 w-4 text-blue-600 inline" />;
    if (platform === 'instagram') return <Instagram className="h-4 w-4 text-pink-600 inline" />;
    return null;
}

// Generate consistent mock data for charts
function generateMockData(baseValue: number) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    let current = baseValue;
    return months.map(m => {
        // Random fluctuation
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        current += change;
        if (current < 0) current = 0;
        return { name: m, value: current };
    });
}
