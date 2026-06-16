import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import AdsDashboard from '@/components/ads-manager/AdsDashboard';
import { updatePrivateProfile, ensureUniqueCode } from '@/app/actions/profile';
import { User } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, addDoc, collection } from 'firebase/firestore';
import { ALL_COUNTRIES } from '@/data/countries';
import { app } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Share2, Gift, Users, Heart, Settings, Star, CreditCard, Info, Download, QrCode, Coins, Lock, Briefcase, ChevronRight, Bot, MessageCircle, Target, Megaphone, BarChart3, Shield, HelpCircle, Network, Map, Calendar, MoreVertical, TrendingUp, LifeBuoy } from 'lucide-react';
import { CategorySelector, CATEGORIES } from './CategorySelector';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from './DashboardLayout';
import { WalletSection } from './WalletSection';
import { InviteFriendSection } from './InviteFriendSection';
import { DiciCoinSection } from './DiciCoinSection';
import { WhatsAppGroupSection } from './WhatsAppGroupSection';
import { TicketsManager } from './tickets/TicketsManager';
import { FreelancerLanding } from './freelancer/FreelancerLanding';
import { FreelancerPanel } from './freelancer/FreelancerPanel';
import { CommunityView } from './CommunityView';
import { FaqsView } from './FaqsView';
import { GeneralInfoSection } from './GeneralInfoSection';
import { NotificationBell } from './NotificationBell';
import ScannerPro from '../admin/ScannerPro';
import { StatisticsView } from './freelancer/views/StatisticsView';
import { AlliesMap } from './AlliesMap';
import { MiBox } from './MiBox';
import { SuperAdminStatsGrid } from './SuperAdminStatsGrid';
import { MyNetworkView } from './MyNetworkView';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ensureHttps, formatSocialUrl } from '@/lib/url-utils';
import { VideoFeedbackUploader } from './VideoFeedbackUploader';
import { FinancesSection } from './finances/FinancesSection';
import MasterCalendarPage from '@/app/dashboard/business/crm/calendar/page';

const db = getFirestore(app);
// Private Dashboard Component

interface PrivateDashboardProps {
    user: User;
    profile: any;
    initialWalletData?: any;
}

export function PrivateDashboard({ user, profile, initialWalletData }: PrivateDashboardProps) {
    const { toast } = useToast();
    const { t } = useTranslation(['common', 'admin']);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeView, setActiveView] = useState(searchParams?.get('view') || 'overview'); // overview, wallet, invite, map, settings, dicicoin, tickets
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState(profile);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const [walletData, setWalletData] = useState<{ balance: number, valueInEur: number, valueInUsd?: number, pointValue: number } | null>(initialWalletData || null);
    const [registerUrl, setRegisterUrl] = useState('');

    const role = (formData?.role || (formData?.isFreelancer ? 'freelancer' : 'user')).toLowerCase();
    const permissions = formData?.permissions || [];
    const isFreelancerOrHigher = ['freelancer', 'team_leader', 'team_office', 'admin', 'superadmin'].includes(role) || permissions.includes('freelancer_tool');

    // Fetch wallet data if not provided (fallback)
    useEffect(() => {
        if (user?.uid && !walletData) {
            import('@/app/actions/wallet').then(({ getWalletData }) => {
                getWalletData(user.uid).then((data) => setWalletData(data));
            });
        }
    }, [user?.uid, walletData]);

    // Sync wallet data when prop changes
    useEffect(() => {
        if (initialWalletData) {
            setWalletData(initialWalletData);
        }
    }, [initialWalletData]);

    useEffect(() => {
        if (typeof window !== 'undefined' && formData?.uniqueCode) {
            setRegisterUrl(`${window.location.origin}/registrieren?ref=${formData.uniqueCode}`);
        }
    }, [formData?.uniqueCode]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: t('dashboard.copied', 'Copied!'),
            description: t('dashboard.codeCopied', 'Code copied to clipboard.'),
        });
    };

    const handleDownloadQr = async () => {
        if (!registerUrl) return;
        try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registerUrl)}`;
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dicilo-code-${formData.uniqueCode || 'invite'}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            toast({ title: t('dashboard.errorTitle'), description: t('dashboard.errorDesc'), variant: 'destructive' });
        }
    };

    const handleShareQr = async () => {
        if (!registerUrl) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Dicilo Invitation',
                    text: t('dashboard.scanToRegister'),
                    url: registerUrl
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            copyToClipboard(registerUrl);
        }
    };

    // State initialized above

    // Sync state with URL changes if user navigates back/forward
    useEffect(() => {
        const viewParam = searchParams?.get('view');
        if (viewParam && viewParam !== activeView) {
            setActiveView(viewParam);
        }
    }, [searchParams]);

    const handleViewChange = (view: string) => {
        setActiveView(view);
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set('view', view);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const handleSendFeedback = async () => {
        if (!feedbackMessage.trim()) return;
        setIsSubmittingFeedback(true);
        try {
            await addDoc(collection(db, 'feedbacks'), {
                name: (formData.firstName || '') + ' ' + (formData.lastName || ''),
                email: formData.email,
                rating: feedbackRating,
                message: feedbackMessage,
                country: formData.country || 'Unknown',
                city: formData.city || 'Unknown',
                customerType: 'private',
                createdAt: new Date(),
                rewardPreference: formData.profileData?.rewardPreference || 'none',
                uid: user.uid
            });
            toast({
                title: t('benefits.feedback.successTitle'),
                description: t('benefits.feedback.successDesc')
            });
            setFeedbackMessage('');
            setFeedbackRating(0);
        } catch (error) {
            console.error(error);
            toast({
                title: t('benefits.feedback.errorTitle'),
                description: t('benefits.feedback.errorDesc'),
                variant: 'destructive'
            });
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    // Real-time updates for the profile
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'private_profiles', user.uid), (doc) => {
            if (doc.exists()) {
                setFormData(doc.data());
            }
        });
        return () => unsub();
    }, [user.uid]);

    // Ensure Unique Code exists
    useEffect(() => {
        if (user && formData) {
            if (!formData.uniqueCode) {
                ensureUniqueCode(user.uid).then((res) => {
                    if (res.success && res.uniqueCode) {
                        setFormData((prev: any) => ({ ...prev, uniqueCode: res.uniqueCode }));
                    }
                });
            }
        }
    }, [user, formData?.uniqueCode]);

    const handleUpdate = async (section: string, data: any) => {
        setIsLoading(true);
        try {
            const userRef = doc(db, 'private_profiles', user.uid);
            await setDoc(userRef, data, { merge: true });
            toast({
                title: t('dashboard.saved', 'Saved'),
                description: t('dashboard.successDesc', 'Your changes have been saved.'),
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: t('dashboard.errorTitle', 'Error'),
                description: t('dashboard.errorDesc', 'Failed to save changes.'),
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };



    // Safe Date Parsing
    const memberSinceDate = formData.createdAt?.seconds
        ? new Date(formData.createdAt.seconds * 1000).toLocaleDateString()
        : new Date().toLocaleDateString();

    const birthDateValue = formData.birthDate?.seconds
        ? new Date(formData.birthDate.seconds * 1000).toISOString().split('T')[0]
        : formData.birthDate
            ? new Date(formData.birthDate).toISOString().split('T')[0]
            : '';

    const renderView = () => {
        switch (activeView) {
            case 'overview':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                                    ¡Hola, {formData.firstName}! 👋
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                                    Bienvenido a tu panel de control
                                </p>
                            </div>
                            <NotificationBell />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            {/* Card 1: Conversaciones */}
                            <Card className="w-full p-3 sm:p-4 bg-white border border-slate-100/80 shadow-sm rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
                                <div>
                                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <MessageCircle className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-2 sm:mt-3 tracking-tight">128</div>
                                    <div className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">Conversaciones</div>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-600 font-bold mt-1.5 sm:mt-2">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>12% vs ayer</span>
                                </div>
                            </Card>

                            {/* Card 2: Contactos nuevos */}
                            <Card className="w-full p-3 sm:p-4 bg-white border border-slate-100/80 shadow-sm rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
                                <div>
                                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Users className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-2 sm:mt-3 tracking-tight">248</div>
                                    <div className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">Contactos nuevos</div>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-600 font-bold mt-1.5 sm:mt-2">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>18% vs ayer</span>
                                </div>
                            </Card>

                            {/* Card 3: Campañas activas */}
                            <Card className="w-full p-3 sm:p-4 bg-white border border-slate-100/80 shadow-sm rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
                                <div>
                                    <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                        <Target className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-2 sm:mt-3 tracking-tight">15</div>
                                    <div className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">Campañas activas</div>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-600 font-bold mt-1.5 sm:mt-2">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>5% vs ayer</span>
                                </div>
                            </Card>

                            {/* Card 4: Tasa de conversión */}
                            <Card className="w-full p-3 sm:p-4 bg-white border border-slate-100/80 shadow-sm rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
                                <div>
                                    <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                        <BarChart3 className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-2 sm:mt-3 tracking-tight">32.5%</div>
                                    <div className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">Tasa de conversión</div>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-600 font-bold mt-1.5 sm:mt-2">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>8% vs ayer</span>
                                </div>
                            </Card>
                        </div>

                        {/* Section 1: Acciones Rápidas (Native Mockup Grid) */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Acciones rápidas</h3>
                                <span className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">Ver todo</span>
                            </div>
                            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-none snap-x">
                                {/* Action 1: Crear Chatbot */}
                                <div 
                                    className="flex flex-col items-center shrink-0 cursor-pointer group snap-start"
                                    onClick={() => window.dispatchEvent(new Event('open-dicibot'))}
                                >
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                                        <Bot className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 text-center mt-2 w-14 sm:w-16 line-clamp-2">
                                        Crear Chatbot
                                    </span>
                                </div>

                                {/* Action 2: Nueva Campaña */}
                                <div 
                                    className="flex flex-col items-center shrink-0 cursor-pointer group snap-start"
                                    onClick={() => handleViewChange('freelancer')}
                                >
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                                        <Target className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 text-center mt-2 w-14 sm:w-16 line-clamp-2">
                                        Nueva Campaña
                                    </span>
                                </div>

                                {/* Action 3: Agregar Contacto */}
                                <div 
                                    className="flex flex-col items-center shrink-0 cursor-pointer group snap-start"
                                    onClick={() => handleViewChange('invite')}
                                >
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                                        <Users className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 text-center mt-2 w-14 sm:w-16 line-clamp-2">
                                        Agregar Contacto
                                    </span>
                                </div>

                                {/* Action 4: Nuevo Broadcast */}
                                <div 
                                    className="flex flex-col items-center shrink-0 cursor-pointer group snap-start"
                                    onClick={() => handleViewChange('ads-manager')}
                                >
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                                        <Megaphone className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 text-center mt-2 w-14 sm:w-16 line-clamp-2">
                                        Nuevo Broadcast
                                    </span>
                                </div>

                                {/* Action 5: Ver Reportes */}
                                <div 
                                    className="flex flex-col items-center shrink-0 cursor-pointer group snap-start"
                                    onClick={() => handleViewChange('freelancer')}
                                >
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                                        <BarChart3 className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 text-center mt-2 w-14 sm:w-16 line-clamp-2">
                                        Ver Reportes
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Launchpad de Módulos (All Menu Items Represented) */}
                        <div className="space-y-3 pt-2">
                            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Mis Módulos de Trabajo</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {/* Module 1: Mi Wallet */}
                                <div 
                                    className="bg-white border border-slate-100/80 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                    onClick={() => handleViewChange('wallet')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 transition-colors group-hover:bg-emerald-100">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">Mi Wallet</span>
                                </div>

                                {/* Module 2: Invitar Amigos */}
                                <div 
                                    className="bg-white border border-slate-100/80 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                    onClick={() => handleViewChange('invite')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 transition-colors group-hover:bg-blue-100">
                                        <Share2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">Invitar Amigos</span>
                                </div>

                                {/* Module 3: Calendario */}
                                <div 
                                    className="bg-white border border-slate-100/80 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                    onClick={() => handleViewChange('calendar')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 transition-colors group-hover:bg-rose-100">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">Calendario</span>
                                </div>

                                {/* Module 4: Mapa de Aliados */}
                                <div 
                                    className="bg-white border border-slate-100/80 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                    onClick={() => handleViewChange('map')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 transition-colors group-hover:bg-indigo-100">
                                        <Map className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">Mapa de Aliados</span>
                                </div>

                                {/* Module 5: DiciCoin */}
                                <div 
                                    className="bg-white border border-slate-100/80 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                    onClick={() => handleViewChange('dicicoin')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0 transition-colors group-hover:bg-yellow-100">
                                        <Coins className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">DiciCoin</span>
                                </div>

                                {/* Module 6: Tu Comunidad */}
                                <div 
                                    className="bg-white border border-slate-100/80 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                    onClick={() => handleViewChange('community')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 transition-colors group-hover:bg-pink-100">
                                        <Heart className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">Tu Comunidad</span>
                                </div>

                                {/* Module 7: Mi Red Dicilo */}
                                <div 
                                    className="bg-white border border-slate-100/80 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                    onClick={() => handleViewChange('my-network')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 transition-colors group-hover:bg-purple-100">
                                        <Network className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">Mi Red Dicilo</span>
                                </div>

                                {/* Module 8: Ajustes */}
                                <div 
                                    className="bg-white border border-slate-100/80 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                    onClick={() => handleViewChange('settings')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 transition-colors group-hover:bg-gray-200">
                                        <Settings className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">Ajustes</span>
                                </div>

                                {/* Module 9: Soporte (Tickets) */}
                                <div 
                                    className="bg-white border border-slate-100/80 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                    onClick={() => handleViewChange('tickets')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 transition-colors group-hover:bg-sky-100">
                                        <LifeBuoy className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">Soporte</span>
                                </div>

                                {/* Module 10: FAQs */}
                                <div 
                                    className="bg-white border border-slate-100/80 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                    onClick={() => handleViewChange('faqs')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 transition-colors group-hover:bg-teal-100">
                                        <HelpCircle className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">FAQs</span>
                                </div>

                                {/* Module 11: Panel Freelancer (Condicional) */}
                                {isFreelancerOrHigher && (
                                    <div 
                                        className="bg-lime-50/50 border border-lime-200/50 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                        onClick={() => handleViewChange('freelancer')}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[#8cc63f] text-white flex items-center justify-center shrink-0">
                                            <Briefcase className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-800">Freelancer</span>
                                    </div>
                                )}

                                {/* Module 12: Admin Panel (Condicional) */}
                                {(role === 'admin' || role === 'superadmin' || user?.email?.includes('dicilo.net')) && (
                                    <div 
                                        className="bg-red-50/50 border border-red-200/50 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group w-full"
                                        onClick={() => router.push('/admin')}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                                            <Shield className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-800">Admin</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Mis Chatbots (Premium design matching mockup) */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Mis chatbots</h3>
                                <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:text-blue-800" onClick={() => handleViewChange('freelancer')}>
                                    Ver todos
                                </span>
                            </div>
                            <div className="space-y-3">
                                {/* Chatbot 1: Ventas de Campañas */}
                                <Card className="p-4 shadow-sm border border-slate-100/80 flex items-center justify-between bg-white rounded-2xl hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="h-11 w-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Bot className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">Ventas de Campañas</h4>
                                            <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Atiende consultas y genera ventas</p>
                                            <div className="flex items-center gap-3 mt-1.5 text-[9px] sm:text-[10px] font-semibold text-slate-400">
                                                <span className="flex items-center gap-1">💬 342</span>
                                                <span className="flex items-center gap-1">👥 1.2K</span>
                                                <span className="flex items-center gap-1">📊 28%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Switch defaultChecked className="data-[state=checked]:bg-[#8cc63f]" />
                                        <Button variant="ghost" size="icon" className="h-11 w-11 md:h-8 md:w-8 text-slate-400 flex items-center justify-center">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
 
                                {/* Chatbot 2: Soporte al Cliente */}
                                <Card className="p-4 shadow-sm border border-slate-100/80 flex items-center justify-between bg-white rounded-2xl hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="h-11 w-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                            <Bot className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">Soporte al Cliente</h4>
                                            <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Resuelve dudas y da soporte 24/7</p>
                                            <div className="flex items-center gap-3 mt-1.5 text-[9px] sm:text-[10px] font-semibold text-slate-400">
                                                <span className="flex items-center gap-1">💬 210</span>
                                                <span className="flex items-center gap-1">👥 856</span>
                                                <span className="flex items-center gap-1">📊 26%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Switch defaultChecked className="data-[state=checked]:bg-[#8cc63f]" />
                                        <Button variant="ghost" size="icon" className="h-11 w-11 md:h-8 md:w-8 text-slate-400 flex items-center justify-center">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
 
                                {/* Chatbot 3: Reservas */}
                                <Card className="p-4 shadow-sm border border-slate-100/80 flex items-center justify-between bg-white rounded-2xl hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="h-11 w-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <Bot className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">Reservas</h4>
                                            <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Gestiona reservas y agendamientos</p>
                                            <div className="flex items-center gap-3 mt-1.5 text-[9px] sm:text-[10px] font-semibold text-slate-400">
                                                <span className="flex items-center gap-1">💬 98</span>
                                                <span className="flex items-center gap-1">👥 352</span>
                                                <span className="flex items-center gap-1">📊 31%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Switch defaultChecked className="data-[state=checked]:bg-[#8cc63f]" />
                                        <Button variant="ghost" size="icon" className="h-11 w-11 md:h-8 md:w-8 text-slate-400 flex items-center justify-center">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Section 4: Campañas recientes (Mockup details) */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Campañas recientes</h3>
                                <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:text-blue-800" onClick={() => handleViewChange('freelancer')}>
                                    Ver todas
                                </span>
                            </div>
                            <div className="space-y-3">
                                {/* Campaign 1 */}
                                <Card className="p-4 shadow-sm border border-slate-100/80 bg-white rounded-2xl hover:shadow-md transition-all duration-300 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">Promoción de Verano ☀️</h4>
                                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">Enviada el 20 May, 2024 • WhatsApp</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xs font-bold text-slate-700">1.2K Enviados</div>
                                            <div className="text-[10px] font-semibold text-slate-400">380 Leídos • 24% CTR</div>
                                        </div>
                                        <div className="text-right sm:hidden">
                                            <div className="text-[10px] font-bold text-slate-700">1.2K env.</div>
                                            <div className="text-[9px] font-semibold text-slate-400">24% CTR</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-slate-300" />
                                    </div>
                                </Card>

                                {/* Campaign 2 */}
                                <Card className="p-4 shadow-sm border border-slate-100/80 bg-white rounded-2xl hover:shadow-md transition-all duration-300 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">Nuevo Lanzamiento 🚀</h4>
                                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">Enviada el 15 May, 2024 • WhatsApp</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xs font-bold text-slate-700">2.2K Enviados</div>
                                            <div className="text-[10px] font-semibold text-slate-400">390 Leídos • 2% CTR</div>
                                        </div>
                                        <div className="text-right sm:hidden">
                                            <div className="text-[10px] font-bold text-slate-700">2.2K env.</div>
                                            <div className="text-[9px] font-semibold text-slate-400">2% CTR</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-slate-300" />
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* SuperAdmin Quick Stats */}
                        {(user.email === 'superadmin@dicilo.net' || formData.role === 'SuperAdmin' || formData.role === 'superadmin') && (
                            <SuperAdminStatsGrid />
                        )}

                        {/* Wallets & Cards Section */}
                        <div className="grid gap-6 lg:grid-cols-2 pt-4 border-t border-slate-100">
                            {/* DiciPoints Wallet (Dark Card) */}
                            <div className="flex flex-col gap-1 h-full">
                                <div className="bg-slate-950 text-white rounded-2xl p-6 flex flex-col justify-between shadow-lg aspect-auto min-h-[220px] md:aspect-[1.58/1] w-full">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-sm text-slate-400 uppercase">{t('dashboard.wallet.dicipointsTitle', 'DICIPOINTS WALLET')}</h3>
                                                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 mt-1 inline-block">Personal</span>
                                            </div>
                                            <CreditCard className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="text-3xl font-bold">
                                                {walletData ? walletData.balance.toFixed(0) : <Skeleton className="h-9 w-24 inline-block bg-slate-800" />} DP <span className="text-xl align-top">*</span>
                                            </div>
                                            <div className="text-sm text-slate-400">
                                                ≈ {walletData ? (walletData.balance * (walletData.pointValue || 0.10)).toFixed(2) : <Skeleton className="h-4 w-16 inline-block bg-slate-800" />} EUR / USD $
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="secondary" className="w-full mt-4 bg-white text-slate-950 hover:bg-slate-200 h-11 md:h-10" onClick={handleDownloadQr}>
                                        <QrCode className="mr-2 h-4 w-4" />
                                        {t('dashboard.wallet.showQr', 'Show QR to Pay')}
                                    </Button>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-800 px-1 mt-0.5">
                                    * {t('dashboard.wallet.dpLegend', 'DP = DiciPoint puntos de pago en dicilo')}
                                </div>
                            </div>

                            {/* Prepaid Card (Image Background) */}
                            <div className="flex flex-col gap-1 h-full">
                                <div className="rounded-2xl overflow-hidden shadow-lg aspect-auto min-h-[220px] md:aspect-[1.58/1] w-full relative flex flex-col justify-between p-6 text-white group">
                                    {/* Background Image */}
                                    <div className="absolute inset-0 z-0">
                                        <Image
                                            src="/dicilo-prepaid-bg.png"
                                            alt="Dicilo Prepaid Card"
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    </div>

                                    {/* Content Overlay */}
                                    <div className="relative z-10 flex justify-end items-start w-full h-full">
                                        <div className="text-right">
                                            <div className="text-xs text-emerald-100 opacity-90 font-medium">GANANCIAS</div>
                                            <div className="font-bold text-2xl drop-shadow-md">
                                                € {walletData ? walletData.valueInEur.toFixed(2) : <Skeleton className="h-8 w-20 inline-block bg-emerald-400/30" />}
                                            </div>
                                            {walletData?.valueInUsd ? (
                                                <div className="font-bold text-lg text-white drop-shadow-md mt-1">
                                                    $ {walletData.valueInUsd.toFixed(2)}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-auto">
                                        {/* Spacer to push content down if needed, chip is in bg image */}
                                        <div className="h-8"></div>

                                        <div className="font-mono text-lg tracking-widest drop-shadow-sm mb-1 text-shadow">
                                            •••• •••• •••• 60WA
                                        </div>
                                        <div className="text-xs uppercase font-bold tracking-wider opacity-90 drop-shadow-sm">
                                            {(formData.firstName + ' ' + formData.lastName).toUpperCase() || 'MEMBER'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-800 px-1 mt-0.5">
                                    * {t('dashboard.wallet.prepaidLegend', 'Prepaid: Tarjeta Prepago con bonos en efectivo')}
                                </div>
                            </div>
                        </div>

                        {/* General Info & Events Section */}
                        <div id="general-info-section" className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 mt-6 scroll-m-6">
                            <GeneralInfoSection />
                        </div>

                        {/* Community Section - New Row */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600 mt-6">
                            <WhatsAppGroupSection />
                        </div>
                    </div>
                );
            case 'community':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <CommunityView defaultNeighborhood={formData.city || 'Hamburg'} currentUser={user} />
                    </div>
                );
            case 'my-network':
                return (
                    <div className="animate-in fade-in duration-500">
                        <MyNetworkView uid={user.uid} />
                    </div>
                );
            case 'faqs':
                return <FaqsView />;
            case 'scanner':
                return (
                    <div className="animate-in fade-in duration-500">
                        <ScannerPro recruiterId={user.uid} />
                    </div>
                );
            case 'wallet':
                return <WalletSection uid={user.uid} uniqueCode={formData.uniqueCode} userProfile={formData} initialData={walletData} />;
            case 'invite':
                return <InviteFriendSection uniqueCode={formData.uniqueCode} referrals={formData.referrals} />;
            case 'dicicoin':
                return <DiciCoinSection userData={formData} walletData={walletData} onViewHistory={() => handleViewChange('wallet')} />;
            case 'tickets':
                return <TicketsManager />;
            case 'ads-manager':
                return <AdsDashboard />;
            case 'calendar':
                return <MasterCalendarPage />;
            case 'freelancer':
                return <FreelancerPanel />;
            case 'settings':
                return (
                    <Tabs defaultValue="personal" className="space-y-4">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.settings')}</h2>
                            <div className="flex items-center gap-2">
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm" 
                                    className="border-[#8cc63f] text-[#5a5a5a] hover:bg-[#8cc63f]/10 shrink-0 h-11 lg:h-9"
                                    onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                                >
                                    Ajustes de Cookies
                                </Button>
                                {isFreelancerOrHigher && (
                                    <Button 
                                        type="button"
                                        variant="outline" 
                                        size="sm" 
                                        className="border-[#8cc63f] text-[#8cc63f] hover:bg-[#8cc63f]/10 shrink-0 font-bold h-11 lg:h-9"
                                        onClick={() => handleViewChange('freelancer')}
                                    >
                                        Panel Freelancer
                                    </Button>
                                )}
                            </div>
                        </div>
                        <TabsList className="flex flex-wrap h-auto gap-1">
                            <TabsTrigger value="personal" className="flex-grow sm:flex-grow-0">{t('dashboard.personalData')}</TabsTrigger>
                            <TabsTrigger value="interests" className="flex-grow sm:flex-grow-0">{t('dashboard.interests')}</TabsTrigger>
                            <TabsTrigger value="finanzas" className="flex-grow sm:flex-grow-0 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                {t('dashboard.finances', 'Finanzas')} {!['freelancer', 'team_leader', 'manager', 'admin', 'superadmin', 'SuperAdmin'].includes(formData?.role?.toLowerCase() || '') && formData?.referrals?.length < 10 && <Lock className="inline w-3 h-3 ml-1"/>}
                            </TabsTrigger>
                            <TabsTrigger value="mibox" className="flex-grow sm:flex-grow-0">{t('dashboard.miBox', 'Mi Box')}</TabsTrigger>
                            <TabsTrigger value="companies" className="flex-grow sm:flex-grow-0">{t('dashboard.companiesOfInterest', 'Empresas de mi Interés')}</TabsTrigger>
                            <TabsTrigger value="social" className="flex-grow sm:flex-grow-0">{t('dashboard.socialRewards')}</TabsTrigger>
                        </TabsList>

                        {/* Re-using existing content logic for settings sub-tabs */}
                        <TabsContent value="personal" className="space-y-6">
                            {/* Dicilo ID & QR Section */}
                            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                                <CardHeader className="bg-slate-50 border-b">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <QrCode className="h-5 w-5 text-emerald-600" />
                                                Dicilo ID & QR
                                            </CardTitle>
                                            <CardDescription>
                                                {t('dashboard.uniqueIdLabel', 'Tu identificación única y código de recomendación.')}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                            {t('dashboard.active', 'Activo')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* ID Details */}
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t('dashboard.diciloId', 'ID de Dicilo')}</Label>
                                                <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-lg font-mono text-lg font-bold">
                                                    {formData.uniqueCode || '---'}
                                                    <Button variant="ghost" size="icon" className="ml-auto h-11 w-11 lg:h-8 lg:w-8" onClick={() => copyToClipboard(formData.uniqueCode)}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t('dashboard.fullName', 'Nombre Completo')}</Label>
                                                <p className="font-semibold text-slate-800">{formData.firstName} {formData.lastName}</p>
                                            </div>

                                            {formData.phone && (
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">WhatsApp</Label>
                                                    <p className="font-semibold text-slate-800">{formData.phone}</p>
                                                </div>
                                            )}

                                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-11 lg:h-10" onClick={handleDownloadQr}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    {t('dashboard.downloadQr', 'Descargar QR')}
                                                </Button>
                                                <Button variant="outline" className="flex-1 h-11 lg:h-10" onClick={handleShareQr}>
                                                    <Share2 className="mr-2 h-4 w-4" />
                                                    {t('dashboard.share', 'Compartir')}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* QR Image */}
                                        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                            {registerUrl ? (
                                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                                    <img 
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(registerUrl)}`}
                                                        alt="Referral QR"
                                                        className="w-[150px] h-[150px]"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-[150px] h-[150px] bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
                                                    <QrCode className="h-10 w-10" />
                                                </div>
                                            )}
                                            <p className="text-[10px] text-muted-foreground mt-4 text-center">
                                                {t('dashboard.scanToRegister', 'Escanea para registrarte con mi enlace de referencia')}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('dashboard.personalInfo')}</CardTitle>
                                    <CardDescription>{t('dashboard.personalInfoDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.firstName')}</Label>
                                            <Input value={formData.firstName || ''} onChange={(e) => setFormData({...formData, firstName: e.target.value})} onBlur={() => handleUpdate('firstName', {firstName: formData.firstName})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.lastName')}</Label>
                                            <Input value={formData.lastName || ''} onChange={(e) => setFormData({...formData, lastName: e.target.value})} onBlur={() => handleUpdate('lastName', {lastName: formData.lastName})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.dateOfBirth')}</Label>
                                            <Input
                                                type="date"
                                                value={birthDateValue}
                                                onChange={(e) => {
                                                    const date = new Date(e.target.value);
                                                    handleUpdate('birthDate', { birthDate: date });
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.gender')}</Label>
                                            <Select
                                                value={formData.gender || ''}
                                                onValueChange={(val) => handleUpdate('gender', { gender: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('dashboard.selectGender')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">{t('dashboard.male')}</SelectItem>
                                                    <SelectItem value="female">{t('dashboard.female')}</SelectItem>
                                                    <SelectItem value="diverse">{t('dashboard.diverse')}</SelectItem>
                                                    <SelectItem value="prefer_not_to_say">{t('dashboard.preferNotToSay')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t">
                                        <h3 className="text-lg font-medium">{t('dashboard.location')}</h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.country')}</Label>
                                                <Select
                                                    value={formData.country || ''}
                                                    onValueChange={(val) => {
                                                        setFormData({ ...formData, country: val });
                                                        handleUpdate('country', { country: val });
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ALL_COUNTRIES.map((c) => (
                                                            <SelectItem key={c.value} value={c.value}>
                                                                {c.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.city')}</Label>
                                                <Input
                                                    value={formData.city || ''}
                                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    onBlur={() => handleUpdate('city', { city: formData.city })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                        <h3 className="text-lg font-medium">{t('dashboard.contactPhones', 'Teléfonos de Contacto')}</h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.fixedPhone')}</Label>
                                                <Input
                                                    value={formData.fixedPhone || ''}
                                                    onChange={(e) => setFormData({ ...formData, fixedPhone: e.target.value })}
                                                    onBlur={() => handleUpdate('fixedPhone', { fixedPhone: formData.fixedPhone })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.workPhone')}</Label>
                                                <Input
                                                    value={formData.workPhone || ''}
                                                    onChange={(e) => setFormData({ ...formData, workPhone: e.target.value })}
                                                    onBlur={() => handleUpdate('workPhone', { workPhone: formData.workPhone })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                        <h3 className="text-lg font-medium">{t('dashboard.communicationPreferences')}</h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.whatsappHandle')}</Label>
                                                <Input
                                                    value={formData.whatsapp || ''}
                                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                                    onBlur={() => handleUpdate('whatsapp', { whatsapp: formData.whatsapp })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.telegramHandle')}</Label>
                                                <Input
                                                    value={formData.telegram || ''}
                                                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                                                    onBlur={() => handleUpdate('telegram', { telegram: formData.telegram })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="interests">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('dashboard.yourInterests')}</CardTitle>
                                    <CardDescription>{t('dashboard.yourInterestsDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <CategorySelector
                                        selectedCategories={formData.interests || []}
                                        onChange={(newInterests) => handleUpdate('interests', { interests: newInterests })}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="finanzas">
                            <FinancesSection user={user} profile={formData} handleUpdate={handleUpdate} />
                        </TabsContent>

                        <TabsContent value="social">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('dashboard.socialGroups')}</CardTitle>
                                        <CardDescription>{t('dashboard.joinCommunity')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.joinQuestion')}</Label>
                                            <RadioGroup
                                                value={formData.profileData?.socialGroup || 'none'}
                                                onValueChange={(val) => handleUpdate('socialGroup', {
                                                    profileData: { ...formData.profileData, socialGroup: val }
                                                })}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="whatsapp" id="s1" />
                                                    <Label htmlFor="s1">{t('dashboard.joinWhatsapp')}</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="telegram" id="s2" />
                                                    <Label htmlFor="s2">{t('dashboard.joinTelegram')}</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="none" id="s3" />
                                                    <Label htmlFor="s3">{t('dashboard.preferNotJoin')}</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                        {(formData.profileData?.socialGroup === 'whatsapp' || formData.profileData?.socialGroup === 'telegram') && (
                                            <div className="pt-4 flex flex-col gap-2">
                                                <Button className="w-full h-11 lg:h-10" onClick={() => window.open(formData.profileData?.socialGroup === 'whatsapp' ? 'https://chat.whatsapp.com/IPFpYXlHJTdH0rZosQGws4' : 'https://t.me/+XHaw-Wa4EsBmMjk6', '_blank')}>
                                                    {formData.profileData?.socialGroup === 'whatsapp' ? t('dashboard.joinWhatsapp') : t('dashboard.joinTelegram')}
                                                </Button>
                                                {formData.profileData?.socialGroup === 'whatsapp' && (
                                                    <Button variant="outline" className="w-full h-11 lg:h-10" onClick={() => {
                                                        const text = t('whatsappInvite');
                                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                                    }}>
                                                        <Share2 className="mr-2 h-4 w-4" /> Share WhatsApp Group
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('dashboard.socialNetworks')}</CardTitle>
                                        <CardDescription>{t('dashboard.manageProfile')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.facebook')}</Label>
                                                <Input
                                                    value={formData.socialLinks?.facebook || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                                                    })}
                                                    onBlur={() => {
                                                        const formatted = formatSocialUrl(formData.socialLinks?.facebook || '', 'facebook');
                                                        handleUpdate('facebook', {
                                                            socialLinks: { ...formData.socialLinks, facebook: formatted }
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.instagram')}</Label>
                                                <Input
                                                    value={formData.socialLinks?.instagram || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                                                    })}
                                                    onBlur={() => {
                                                        const formatted = formatSocialUrl(formData.socialLinks?.instagram || '', 'instagram');
                                                        handleUpdate('instagram', {
                                                            socialLinks: { ...formData.socialLinks, instagram: formatted }
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.tiktok')}</Label>
                                                <Input
                                                    value={formData.socialLinks?.tiktok || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        socialLinks: { ...formData.socialLinks, tiktok: e.target.value }
                                                    })}
                                                    onBlur={() => {
                                                        const formatted = formatSocialUrl(formData.socialLinks?.tiktok || '', 'tiktok');
                                                        handleUpdate('tiktok', {
                                                            socialLinks: { ...formData.socialLinks, tiktok: formatted }
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.twitter')}</Label>
                                                <Input
                                                    value={formData.socialLinks?.twitter || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                                                    })}
                                                    onBlur={() => {
                                                        const formatted = formatSocialUrl(formData.socialLinks?.twitter || '', 'twitter');
                                                        handleUpdate('twitter', {
                                                            socialLinks: { ...formData.socialLinks, twitter: formatted }
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('dashboard.rewardsFeedback')}</CardTitle>
                                        <CardDescription>{t('dashboard.tellUs')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.whatToWin')}</Label>
                                            <Select
                                                value={formData.profileData?.rewardPreference || ''}
                                                onValueChange={(val) => handleUpdate('rewardPreference', {
                                                    profileData: { ...formData.profileData, rewardPreference: val }
                                                })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('dashboard.selectOption')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="prizes">{t('dashboard.prizes')}</SelectItem>
                                                    <SelectItem value="points">{t('dashboard.points')}</SelectItem>
                                                    <SelectItem value="cash">{t('dashboard.cash')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        {/* New Video Feedback Component */}
                                        <div className="pt-2">
                                            <VideoFeedbackUploader formData={formData} uid={user.uid} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Persistent PWA Installation Card */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base sm:text-lg">Aplicación Móvil (PWA)</CardTitle>
                                        <CardDescription>Instala Dicilo en tu dispositivo móvil para un acceso rápido y directo.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Al instalar la aplicación como PWA, tendrás un acceso directo en tu pantalla de inicio y una navegación fluida equivalente a una app nativa, evitando tiempos de carga del navegador.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                            <Button 
                                                type="button"
                                                variant="outline" 
                                                className="border-[#8cc63f] text-[#5a5a5a] hover:bg-[#8cc63f]/10 font-bold w-full sm:w-auto h-11 lg:h-9"
                                                onClick={() => {
                                                    window.dispatchEvent(new Event('trigger-pwa-install'));
                                                }}
                                            >
                                                <Download className="mr-2 h-4 w-4 text-[#8cc63f]" />
                                                Instalar App en el Teléfono
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="mibox" className="bg-white rounded-lg pt-4">
                            <MiBox user={user} />
                        </TabsContent>

                        <TabsContent value="companies" className="h-[75vh] min-h-[600px] border rounded-lg overflow-hidden bg-white mt-6 relative">
                            <AlliesMap
                                userInterests={formData.interests || []}
                                userId={user.uid}
                                onNavigateToSettings={() => {
                                    document.querySelector<HTMLElement>('[value="interests"]')?.click();
                                }}
                            />
                        </TabsContent>
                    </Tabs>
                );
            case 'map':
                return (
                    <div className="h-[75vh] min-h-[600px] border rounded-lg overflow-hidden bg-white animate-in fade-in duration-500">
                        <AlliesMap
                            userInterests={formData.interests || []}
                            userId={user.uid}
                            onNavigateToSettings={() => handleViewChange('settings')}
                        />
                    </div>
                );
            default:
                return <div>View Not Found</div>;
        }
    };

    return (
        <DashboardLayout
            userData={formData}
            currentView={activeView}
            onViewChange={handleViewChange}
            walletData={walletData}
        >
            {renderView()}
        </DashboardLayout>
    );
}
