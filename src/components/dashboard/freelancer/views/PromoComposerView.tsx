'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { DateRange } from "react-day-picker";

// UI Components
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FreelancerRules } from '@/components/dashboard/freelancer/FreelancerRules';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Icons
import {
    Bookmark,
    CheckCircle2,
    Copy,
    Facebook,
    Globe,
    Heart,
    Instagram,
    Languages,
    Linkedin,
    Loader2,
    Mail,
    MessageCircle,
    MoreHorizontal,
    Plus,
    Repeat,
    Search,
    Send,
    Share2,
    Smartphone,
    ThumbsUp,
    Twitter,
    Youtube,
    Check,
    Sparkles,
    ChevronRight,
    Calendar as CalendarIcon
} from 'lucide-react';

// Context & Actions
import { useAuth } from '@/context/AuthContext';
import { getCampaignById } from '@/app/actions/freelancer';
import { processCampaignPost } from '@/app/actions/campaign-engagement';
import { translateUserText } from '@/app/actions/translate';
import { correctText } from '@/app/actions/grammar';
import { getUserSocialConnections, SocialConnection } from '@/app/actions/social-connections';
import { exploreCampaigns, ExplorableCampaign } from '@/app/actions/campaign-explorer';
import { Campaign } from '@/types/freelancer';
import { useRouter } from 'next/navigation';

export function PromoComposerView() {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const campaignId = searchParams?.get('campaignId');

    const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    // Campaign Exploration State (for empty state)
    const [explorableCampaigns, setExplorableCampaigns] = useState<ExplorableCampaign[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isExploring, setIsExploring] = useState(false);

    // Multi-language Text State
    const [texts, setTexts] = useState<{ [key: string]: string }>({
        es: '',
        en: '',
        de: '',
        fr: '',
        pt: '',
        it: ''
    });
    const [activeLangTab, setActiveLangTab] = useState('es');
    const [targetLanguage, setTargetLanguage] = useState('en');
    const [isCorrecting, setIsCorrecting] = useState(false);

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null); // Track V2 asset
    const [visibleImagesCount, setVisibleImagesCount] = useState(4);

    // Shortener Logic
    const [generatedLink, setGeneratedLink] = useState('');
    const [draftLinkId, setDraftLinkId] = useState<string>('');
    const debounceTimer = React.useRef<NodeJS.Timeout>();

    // Facebook Modal State
    const [showFacebookModal, setShowFacebookModal] = useState(false);

    // Connections State
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [previewNetwork, setPreviewNetwork] = useState('instagram');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [rewardAmount, setRewardAmount] = useState<number>(activeCampaign?.reward_per_action ? Math.round(activeCampaign.reward_per_action * 100) : 10);

    const isGrayMode = activeCampaign ? (activeCampaign.status === 'gray_mode' || (activeCampaign.budget_remaining !== undefined && activeCampaign.budget_remaining <= 0)) : false;

    // Pricing Tiers Configuration
    const PRICING_TIERS: { chars: number; rate: number }[] = [
        { chars: 300, rate: 0.20 },
        { chars: 600, rate: 0.40 }
    ];

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Target URL State
    const [selectedTargetUrl, setSelectedTargetUrl] = useState<string>('');

    const currentText = texts[activeLangTab] || '';

    const currentTier = PRICING_TIERS.reduce((prev, curr) => {
        return currentText.length >= curr.chars ? curr : prev;
    }, { chars: 0, rate: 0.00 });

    // Load Campaign & Connections
    useEffect(() => {
        async function loadData() {
            if (!campaignId) return;
            setIsLoading(true);

            // 1. Load Campaign
            const campaign = await getCampaignById(campaignId);
            if (campaign) {
                setGeneratedLink(`https://dicilo.net/r/${campaign.id?.substring(0, 8)}`);
                setActiveCampaign(campaign);

                // Asset / Image Init
                if (campaign.assets && campaign.assets.length > 0) {
                    setSelectedAssetId(campaign.assets[0].id);
                    setSelectedImageIndex(0);
                    // Pre-fill text from first asset
                    const asset = campaign.assets[0];
                    if (asset) {
                        const initialTexts: any = { ...texts };
                        // Fill all available translations from asset
                        Object.keys(asset.translations).forEach(lang => {
                            initialTexts[lang] = asset.translations[lang] || '';
                        });
                        // Ensure base text is set for source lang
                        if (asset.sourceLanguage) initialTexts[asset.sourceLanguage] = asset.baseText;

                        setTexts(initialTexts);
                    }
                } else {
                    setSelectedImageIndex(0);
                }
                setVisibleImagesCount(8);
            }

            // 2. Load Connections
            if (user) {
                const connResult = await getUserSocialConnections(user.uid);
                if (connResult.success && connResult.connections) {
                    setConnections(connResult.connections);
                    if (connResult.connections.length > 0) {
                        setPreviewNetwork(connResult.connections[0].provider);
                    }
                }
            }

            setIsLoading(false);
        }
        loadData();
    }, [campaignId, user?.uid]);

    // Load Explorable Campaigns for selection
    useEffect(() => {
        async function loadExplorer() {
            if (activeCampaign) return;
            setIsExploring(true);
            const res = await exploreCampaigns();
            if (res.success && res.campaigns) {
                setExplorableCampaigns(res.campaigns);
            }
            setIsExploring(false);
        }
        loadExplorer();
    }, [activeCampaign]);

    const filteredCampaigns = explorableCampaigns.filter(c =>
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectCampaign = (id: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('campaignId', id);
        router.push(`/dashboard/freelancer?${params.toString()}`);
    };

    // 1. Auto-select default URL
    useEffect(() => {
        if (!activeCampaign) return;

        // Auto-select first target URL for the language if available
        const urls = activeCampaign.target_urls?.[activeLangTab];
        if (urls && Array.isArray(urls) && urls.length > 0) {
            setSelectedTargetUrl(urls[0].trim());
        } else {
            setSelectedTargetUrl('');
        }
    }, [activeCampaign, activeLangTab]);

    // 2. Generate/Update Short Link (Debounced)
    useEffect(() => {
        if (!activeCampaign || !user) return;

        const updateLink = async () => {
            try {
                const res = await fetch('/api/shorten', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        campaignId: activeCampaign.id,
                        freelancerId: user.uid,
                        targetUrl: selectedTargetUrl || activeCampaign.target_urls?.[activeLangTab]?.[0] || activeCampaign.targetUrl,
                        selectedImageUrl: activeCampaign?.assets?.length
                            ? activeCampaign.assets[selectedImageIndex].imageUrl
                            : (activeCampaign.images?.[selectedImageIndex] || activeCampaign.companyLogo),
                        assetId: selectedAssetId,
                        language: activeLangTab,
                        text: texts[activeLangTab],
                        existingId: draftLinkId || undefined
                    })
                });
                const data = await res.json();
                if (data.success) {
                    if (!draftLinkId) setDraftLinkId(data.shortId);
                    setGeneratedLink(data.shortUrl);
                }
            } catch (e) {
                console.error("Shortener failed", e);
            }
        };

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(updateLink, 1000);

        return () => clearTimeout(debounceTimer.current);

    }, [activeCampaign, activeLangTab, selectedTargetUrl, selectedImageIndex, texts, user, selectedAssetId, draftLinkId]);

    // Reset draft ID when campaign changes real change
    useEffect(() => {
        setDraftLinkId('');
        setGeneratedLink('');
    }, [activeCampaign?.id]);

    // Update Text when Asset Changes (V2)
    const handleAssetSelection = (index: number) => {
        setSelectedImageIndex(index);

        if (activeCampaign?.assets && activeCampaign.assets[index]) {
            const asset = activeCampaign.assets[index];
            setSelectedAssetId(asset.id);

            setTexts(prev => {
                const newTexts: any = { ...prev };
                Object.entries(asset.translations).forEach(([lang, txt]) => {
                    if (txt) newTexts[lang] = txt;
                });
                return newTexts;
            });
        } else {
            setSelectedAssetId(null);
        }
    };

    const handleCorrectGrammar = async () => {
        const textToCorrect = texts[activeLangTab];
        if (!textToCorrect || textToCorrect.length < 5) return;
        setIsCorrecting(true);
        try {
            const result = await correctText(textToCorrect);
            if (result.success && result.correctedText) {
                setTexts(prev => ({ ...prev, [activeLangTab]: result.correctedText || '' }));
                if (result.wasCorrected) {
                    toast({
                        title: t('freelancer.composer.grammar_success_title'),
                        description: t('freelancer.composer.grammar_success_desc'),
                        className: "bg-purple-600 text-white"
                    });
                } else {
                    toast({ title: t('freelancer.composer.grammar_perfect_title'), description: t('freelancer.composer.grammar_perfect_desc') });
                }
            }
        } catch (e) {
            toast({ title: "Error", description: "No se pudo conectar con el editor IA.", variant: "destructive" });
        } finally {
            setIsCorrecting(false);
        }
    };

    const handleTranslate = async () => {
        const sourceText = texts[activeLangTab];
        if (!activeCampaign || !sourceText) return;

        if (activeLangTab === targetLanguage) {
            toast({ title: "Info", description: "Selecciona un idioma diferente al actual.", variant: "default" });
            return;
        }

        setIsTranslating(true);
        try {
            const result = await translateUserText(sourceText, targetLanguage);
            if (result.success && (result as any).translation) {
                setTexts(prev => ({ ...prev, [targetLanguage]: (result as any).translation }));
                setActiveLangTab(targetLanguage);
                toast({
                    title: t('freelancer.composer.translation_success_title'),
                    description: t('freelancer.composer.translation_success_desc', { lang: targetLanguage.toUpperCase() }),
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({ title: "Error", description: "Fallo al traducir.", variant: "destructive" });
        } finally {
            setIsTranslating(false);
        }
    };

    const handleCopyText = async () => {
        if (!currentText || !activeCampaign) return;
        const trackingLink = generatedLink;
        const message = `${currentText}\n\n${trackingLink} #${activeCampaign.companyName.replace(/[^a-zA-Z0-9]/g, '')}`;
        await navigator.clipboard.writeText(message);
        toast({ title: t('freelancer.composer.copy_success_title'), description: t('freelancer.composer.copy_success_desc') });
    };

    const handleCopyLink = async () => {
        if (!generatedLink) return;
        await navigator.clipboard.writeText(generatedLink);
        toast({ 
            title: t('freelancer.composer.copy_link_success_title', '¡Enlace Copiado!'), 
            description: t('freelancer.composer.copy_link_success_desc', 'El enlace de la campaña ha sido copiado al portapapeles.'),
            className: "bg-purple-600 text-white"
        });
    };

    const selectedImageUrl = activeCampaign?.assets?.length
        ? activeCampaign.assets[selectedImageIndex].imageUrl
        : (activeCampaign?.images && activeCampaign.images.length > 0
            ? activeCampaign.images[selectedImageIndex]
            : 'https://placehold.co/600x400/png');

    const handleShare = async (platform: string) => {
        if (!activeCampaign) return;

        const trackingLink = generatedLink;
        const message = `${currentText}\n\n${trackingLink} #${activeCampaign.companyName.replace(/[^a-zA-Z0-9]/g, '')}`;

        // Open Platform URL
        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        } else if (platform === 'telegram') {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(trackingLink)}&text=${encodeURIComponent(currentText)}`, '_blank');
        } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
        } else if (platform === 'facebook') {
            await navigator.clipboard.writeText(message);
            setShowFacebookModal(true);
            return; // Modal will handle the open logic
        } else if (platform === 'email') {
            window.open(`mailto:?subject=${encodeURIComponent(activeCampaign.companyName)}&body=${encodeURIComponent(message)}`, '_self');
        } else if (platform === 'native') {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: activeCampaign.companyName,
                        text: currentText,
                        url: trackingLink
                    });
                } catch (e) {
                    console.error("Native share failed", e);
                }
            } else {
                await navigator.clipboard.writeText(message);
                toast({ title: "Enlace Copiado", description: "El menú de compartir no está disponible en este navegador, pero hemos copiado el enlace." });
            }
        } else if (platform === 'clipboard') {
            await navigator.clipboard.writeText(message);
            toast({ 
                title: t('freelancer.composer.copy_link_success_title', '¡Enlace Copiado!'), 
                description: t('freelancer.composer.copy_link_success_desc', 'El enlace de la campaña ha sido copiado al portapapeles.'),
                className: "bg-purple-600 text-white"
            });
        }

        setIsSharing(true);
        try {
            const result = await processCampaignPost(
                user?.uid || 'demo_user_id',
                activeCampaign.id!,
                activeLangTab,
                currentText.length,
                selectedImageUrl,
                selectedAssetId || '',
                draftLinkId || '',
                selectedTargetUrl || '',
                rewardAmount / 100,
                dateRange?.from,
                dateRange?.to
            );

            if (result.success) {
                const reward = (result as any).reward;
                toast({
                    title: `¡Compartido en ${platform.toUpperCase()}!`,
                    description: `Has asegurado $${reward} por creación. ¡Consigue 5 clics para el bono extra!`,
                    className: "bg-green-600 text-white"
                });
            } else if ((result as any).error?.includes('10 posts')) {
                toast({
                    title: "Límite Diario",
                    description: "Has completado tus 10 posts de hoy. No se generará recompensa extra.",
                    className: "bg-yellow-500 text-white",
                });
            }
        } catch (error: any) {
            console.error("Share error:", error);
        } finally {
            setIsSharing(false);
        }
    };

    if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

    if (!activeCampaign) {
        return (
            <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-black/10 min-h-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('freelancer.composer.selectCampaign.title', 'Selecciona una Campaña')}</h1>
                        <p className="text-muted-foreground">{t('freelancer.composer.selectCampaign.description', 'Elige una campaña para ver sus plantillas y empezar a compartir.')}</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('campaign_explorer.search_placeholder', 'Buscar por nombre o descripción')}
                            className="pl-9 h-10 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isExploring ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden border-0 shadow-sm">
                                <Skeleton className="h-40 w-full" />
                                <div className="p-4 space-y-2">
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Search className="h-12 w-12 mb-4 opacity-20" />
                        <p>No se encontraron campañas compatibles.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCampaigns.map((campaign) => (
                            <Card
                                key={campaign.id}
                                onClick={() => handleSelectCampaign(campaign.id)}
                                className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950"
                            >
                                <div className="relative h-40 overflow-hidden">
                                    {(campaign.images?.length || 0) > 0 ? (
                                        <Image
                                            src={campaign.images![0]}
                                            alt={campaign.companyName}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-slate-100 italic text-muted-foreground text-xs uppercase tracking-widest">
                                            {campaign.companyName}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                                        <h3 className="text-white font-bold truncate">{campaign.companyName}</h3>
                                        <p className="text-white/80 text-[10px] truncate">{campaign.title}</p>
                                    </div>
                                </div>
                                <CardContent className="p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                                            {campaign.languages?.slice(0, 2).join(', ').toUpperCase() || 'ALL'}
                                        </Badge>
                                        <span className="text-xs font-bold text-green-600">
                                            €{(campaign.reward_per_action || 0.10).toFixed(2)}
                                        </span>
                                    </div>
                                    <Button variant="default" className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm">
                                        Seleccionar Plantilla
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 pb-32 animate-in fade-in slide-in-from-right-4 min-h-full">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    {activeCampaign.companyLogo && (
                        <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-white shadow-md relative shrink-0">
                            <Image src={activeCampaign.companyLogo} alt="Logo" fill className="object-cover" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{activeCampaign.companyName}</h2>
                        <div className="flex gap-2 mt-1">
                             <Badge variant="secondary" className="text-[10px] uppercase font-bold">{activeCampaign.status}</Badge>
                             <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Globe className="h-3 w-3" /> {activeCampaign.categories?.join(' • ')}
                             </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.delete('campaignId');
                            router.push(`/dashboard/freelancer?${params.toString()}`);
                        }}
                        className="h-10 text-xs px-4 rounded-xl hover:bg-slate-100 border bg-white order-2 md:order-1"
                    >
                        <Repeat className="h-4 w-4 mr-2" />
                        {t('freelancer.composer.change_campaign', 'Cambiar Campaña')}
                    </Button>
                    
                    <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 order-1 md:order-2">
                        <span className="text-sm font-bold text-purple-700 flex items-center">
                            +
                            <Input 
                                type="number" 
                                value={rewardAmount} 
                                onChange={(e) => setRewardAmount(Number(e.target.value) || 0)}
                                className="w-16 h-6 px-1 py-0 mx-1 text-center bg-white border-purple-200 text-purple-700 font-bold hide-arrows"
                                min="0"
                            />
                            DP
                        </span>
                        <span className="text-xs text-purple-600/80 font-medium whitespace-nowrap">por envío</span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="templates" className="w-full space-y-8">
                 <div className="bg-white p-1 rounded-2xl border shadow-sm max-w-sm mx-auto md:mx-0">
                    <TabsList className="grid w-full grid-cols-3 bg-transparent h-10">
                        <TabsTrigger value="info" className="rounded-xl text-xs font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">
                            {t('campaign_explorer.tabs.info')}
                        </TabsTrigger>
                        <TabsTrigger value="rules" className="rounded-xl text-xs font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">
                            {t('campaign_explorer.tabs.rules')}
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="rounded-xl text-xs font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">
                            {t('campaign_explorer.tabs.templates')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="info" className="animate-in fade-in duration-300">
                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="p-8 space-y-8">
                            <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Sobre esta Campaña</h3>
                                        <p className="text-slate-600 leading-relaxed">{activeCampaign.description}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Presupuesto</div>
                                            <div className="text-lg font-bold text-slate-800">€{activeCampaign.budget}</div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Vigencia</div>
                                            <div className="text-[10px] font-bold text-slate-800 leading-tight">
                                                {activeCampaign.startDate ? (
                                                    <>
                                                        {format(activeCampaign.startDate.toDate ? activeCampaign.startDate.toDate() : new Date(activeCampaign.startDate), 'dd/MM/yy')} <br/>
                                                        {activeCampaign.endDate ? format(activeCampaign.endDate.toDate ? activeCampaign.endDate.toDate() : new Date(activeCampaign.endDate), 'dd/MM/yy') : '∞'}
                                                    </>
                                                ) : 'Indefinida'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                                    <Image src={activeCampaign.companyCover || '/placeholder-cover.png'} alt="Cover" fill className="object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-6 left-6 text-white">
                                        <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Link Directo</div>
                                        <div className="font-mono text-sm underline truncate max-w-[200px]">{activeCampaign.targetUrl}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rules" className="animate-in fade-in duration-300">
                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="p-8">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-6 underline decoration-purple-500 decoration-2 underline-offset-8">Normas de Publicación</h3>
                            <div className="grid md:grid-cols-2 gap-8 text-sm">
                                <ul className="space-y-4">
                                    <li className="flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check className="h-4 w-4" /></div>
                                        <span className="text-slate-600">Usar el enlace oficial trackeado obligatoriamente.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check className="h-4 w-4" /></div>
                                        <span className="text-slate-600">Publicar en redes sociales o vía email directo.</span>
                                    </li>
                                </ul>
                                <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                                    <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" /> Importante
                                    </h4>
                                    <p className="text-xs text-purple-600 leading-relaxed font-medium">
                                        El pago se procesa tras verificar que las publicaciones cumplen con el mensaje de marca. Evita spam o contenido engañoso.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="templates" className="animate-in fade-in duration-300">
                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
                        {/* Editor Column */}
                        <div className="lg:col-span-7 space-y-6 w-full">
                            {/* 1. Multimedia Assets */}
                            <Card className="shadow-sm border-slate-200 overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Recursos Multimedia</CardTitle>
                                        <Badge variant="outline" className="text-[10px] font-bold bg-white">{activeCampaign.assets?.length || activeCampaign.images?.length || 0} Disponibles</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="flex gap-4 mb-6 p-4 bg-purple-50/50 rounded-2xl border border-purple-100 items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-purple-600" />
                                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Programar Envío</span>
                                        </div>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    className={cn(
                                                        "h-9 px-4 rounded-xl border-purple-200 bg-white flex items-center gap-2 shadow-sm",
                                                        dateRange && "border-purple-600 text-purple-600 shadow-purple-100"
                                                    )}
                                                >
                                                    <span className="text-[11px] font-black">
                                                        {dateRange?.from ? (
                                                            dateRange.to ? (
                                                                `${format(dateRange.from, "dd MMM")} - ${format(dateRange.to, "dd MMM")}`
                                                            ) : format(dateRange.from, "dd MMM")
                                                        ) : "SIN PROGRAMAR"}
                                                    </span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-none" align="end">
                                                <Calendar
                                                    mode="range"
                                                    selected={dateRange}
                                                    onSelect={setDateRange}
                                                    disabled={(date) => date < new Date()}
                                                    initialFocus
                                                    className="p-3"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        {activeCampaign.assets && activeCampaign.assets.length > 0 ? (
                                            activeCampaign.assets.slice(0, visibleImagesCount).map((asset, i) => (
                                                <div 
                                                    key={asset.id} 
                                                    onClick={() => handleAssetSelection(i)} 
                                                    className={cn(
                                                        "relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group ring-offset-2",
                                                        i === selectedImageIndex ? "ring-2 ring-purple-600 shadow-lg scale-[0.98]" : "hover:scale-[1.02] grayscale-[0.3] hover:grayscale-0"
                                                    )}
                                                >
                                                    <Image src={asset.imageUrl} alt="" fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">Envío {i+1}</span>
                                                    </div>
                                                    {i === selectedImageIndex && (
                                                        <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1 shadow-md animate-in zoom-in">
                                                            <Check className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            activeCampaign.images?.slice(0, visibleImagesCount).map((img, i) => (
                                                <div 
                                                    key={i} 
                                                    onClick={() => handleAssetSelection(i)} 
                                                    className={cn(
                                                        "relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group ring-offset-2",
                                                        i === selectedImageIndex ? "ring-2 ring-purple-600 shadow-lg scale-[0.98]" : "hover:scale-[1.02] grayscale-[0.3] hover:grayscale-0"
                                                    )}
                                                >
                                                    <Image src={img} alt="" fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">Envío {i+1}</span>
                                                    </div>
                                                    {i === selectedImageIndex && (
                                                        <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1 shadow-md">
                                                            <Check className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                        <button className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-purple-300 hover:text-purple-500 hover:bg-purple-50 transition-all group">
                                            <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Subir</span>
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 2. Contenido & IA */}
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Mensaje de la Campaña</CardTitle>
                                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border shadow-sm">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Traducir:</span>
                                            <select 
                                                value={targetLanguage}
                                                onChange={(e) => setTargetLanguage(e.target.value)}
                                                className="text-[10px] font-bold bg-transparent border-none focus:ring-0 p-0 pr-4 h-auto cursor-pointer"
                                            >
                                                <option value="es">ES</option>
                                                <option value="en">EN</option>
                                                <option value="de">DE</option>
                                                <option value="fr">FR</option>
                                            </select>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={handleTranslate} 
                                                disabled={isTranslating}
                                                className="h-5 w-5 text-purple-600 hover:bg-purple-50"
                                            >
                                                {isTranslating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <Tabs value={activeLangTab} onValueChange={setActiveLangTab} className="w-full">
                                        <TabsList className="grid grid-cols-6 mb-6 bg-slate-100/50 p-1 rounded-xl h-9">
                                            {['es', 'en', 'de', 'fr', 'pt', 'it'].map(lang => (
                                                <TabsTrigger 
                                                    key={lang} 
                                                    value={lang} 
                                                    className="rounded-lg text-[10px] font-bold uppercase data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
                                                >
                                                    {lang}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>

                                        {['es', 'en', 'de', 'fr', 'pt', 'it'].map(lang => (
                                            <TabsContent key={lang} value={lang} className="mt-0 animate-in fade-in duration-300">
                                                <div className="relative group">
                                                    <Textarea
                                                        value={texts[lang] || ''}
                                                        onChange={(e) => setTexts(prev => ({ ...prev, [lang]: e.target.value }))}
                                                        placeholder="Escribe el mensaje cautivador aquí..."
                                                        className="min-h-[180px] rounded-2xl border-slate-200 focus:border-purple-300 focus:ring-purple-200 transition-all resize-none text-sm leading-relaxed p-6 bg-slate-50/30 group-hover:bg-transparent"
                                                    />
                                                    <div className="absolute top-4 right-4 flex gap-2">
                                                        <Button 
                                                            variant="secondary" 
                                                            size="icon" 
                                                            onClick={handleCorrectGrammar}
                                                            disabled={isCorrecting || !texts[lang]}
                                                            className="h-8 w-8 rounded-xl bg-white shadow-sm border border-slate-100 hover:bg-purple-50 text-purple-600"
                                                        >
                                                            {isCorrecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                                        </Button>
                                                        <Button 
                                                            variant="secondary" 
                                                            size="icon" 
                                                            onClick={handleCopyText}
                                                            className="h-8 w-8 rounded-xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 text-slate-500"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {/* 3. El Enlace */}
                            <Card className="shadow-sm border-slate-200">
                                <CardContent className="p-6">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Configuración del Enlace</h4>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 font-mono text-xs text-slate-500 truncate select-all relative group">
                                            {generatedLink}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={handleCopyLink}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white/80"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                                        <label className="text-[10px] font-bold text-blue-400 uppercase block mb-2">Página de Aterrizaje</label>
                                        <Select value={selectedTargetUrl} onValueChange={setSelectedTargetUrl}>
                                            <SelectTrigger className="h-10 bg-white border-blue-200 focus:ring-blue-100 rounded-xl text-xs font-medium text-blue-700">
                                                <SelectValue placeholder="Selecciona el destino" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-blue-100">
                                                {(!activeCampaign.target_urls?.[activeLangTab]?.length) && (
                                                    <SelectItem value="default" className="text-xs font-medium">Default Campaign URL</SelectItem>
                                                )}
                                                {activeCampaign.target_urls?.[activeLangTab]?.map((url, i) => (
                                                    <SelectItem key={i} value={url.trim()} className="text-xs font-medium">{url.trim()}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Preview Column */}
                        <div className="lg:col-span-5 w-full sticky top-4">
                            <div className="aspect-[9/19] max-w-[320px] mx-auto bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[8px] border-slate-800 relative ring-4 ring-slate-100/50 dark:ring-white/5">
                                {/* iPhone Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
                                
                                {/* Screen Content */}
                                <div className="h-full w-full bg-slate-50 rounded-[2.2rem] overflow-hidden flex flex-col relative">
                                    {/* Top Status Bar Sim */}
                                    <div className="h-6 w-full px-6 pt-1 flex justify-between items-center z-10">
                                        <span className="text-[10px] font-bold text-slate-800">9:41</span>
                                        <div className="flex gap-1 items-center">
                                            <div className="w-3 h-2 bg-slate-800 rounded-sm"></div>
                                            <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* App Header Sim */}
                                    <div className="bg-white px-4 py-3 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                {activeCampaign.companyLogo && <Image src={activeCampaign.companyLogo} alt="" width={20} height={20} className="rounded-full" />}
                                            </div>
                                            <span className="text-xs font-bold text-slate-900">{activeCampaign.companyName}</span>
                                        </div>
                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                    </div>

                                    {/* Scrollable Feed Sim */}
                                    <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                                        <div className="aspect-square w-full relative">
                                            <Image src={selectedImageUrl} alt="" fill className="object-cover" />
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <div className="flex gap-4">
                                                <div className="h-4 w-4 rounded-full border-2 border-slate-900"></div>
                                                <div className="h-4 w-4 rounded-sm border-2 border-slate-900"></div>
                                                <div className="h-4 w-4 rotate-12 border-2 border-slate-900"></div>
                                            </div>
                                            <div className="text-xs font-bold text-slate-900">1,248 likes</div>
                                            <p className="text-xs text-slate-800 leading-snug">
                                                <span className="font-bold mr-2">{activeCampaign.companyName}</span>
                                                {currentText || "Escribe tu primer post e impacta al mundo..."}
                                            </p>
                                            <p className="text-[10px] text-blue-600 font-bold underline cursor-pointer truncate">
                                                {generatedLink}
                                            </p>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Hace 2 minutos • Patrocinado</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Reward Card below phone */}
                            <div className="mt-8 max-w-[320px] mx-auto bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-purple-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                        <Sparkles className="h-6 w-6 text-white" />
                                    </div>
                                    <Badge className="bg-white/20 text-white border-white/30 text-[10px] uppercase font-bold">Premium</Badge>
                                </div>
                                <h5 className="text-lg font-bold mb-1">Recompensa Estimada</h5>
                                <p className="text-xs text-white/70 mb-4 font-medium leading-relaxed">Multiplica tus ganancias compartiendo en múltiples plataformas autorizadas.</p>
                                <div className="text-3xl font-black flex items-baseline gap-1">
                                    €{currentTier.rate.toFixed(2)}
                                    <span className="text-sm font-bold opacity-60">/ share</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width,0px)] bg-white/95 backdrop-blur-2xl border-t border-slate-200 p-4 z-50 animate-in slide-in-from-bottom-full duration-500 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <Button 
                        variant="ghost" 
                        className="h-12 px-6 rounded-2xl text-slate-500 font-bold hover:bg-slate-50"
                        onClick={() => router.back()}
                    >
                        Cancelar
                    </Button>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    className="h-12 px-8 rounded-2xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm"
                                >
                                    <Share2 className="h-5 w-5" />
                                    Compartir
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none">
                                <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="rounded-xl h-11 flex items-center gap-3 cursor-pointer hover:bg-green-50 hover:text-green-700 font-bold transition-colors">
                                    <MessageCircle className="h-5 w-5 text-green-500" />
                                    WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare('telegram')} className="rounded-xl h-11 flex items-center gap-3 cursor-pointer hover:bg-sky-50 hover:text-sky-700 font-bold transition-colors">
                                    <Send className="h-5 w-5 text-sky-500" />
                                    Telegram
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare('facebook')} className="rounded-xl h-11 flex items-center gap-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 font-bold transition-colors">
                                    <Facebook className="h-5 w-5 text-blue-600" />
                                    Facebook
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare('twitter')} className="rounded-xl h-11 flex items-center gap-3 cursor-pointer hover:bg-slate-50 hover:text-slate-900 font-bold transition-colors">
                                    <Twitter className="h-5 w-5 text-slate-800" />
                                    X (Twitter)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare('email')} className="rounded-xl h-11 flex items-center gap-3 cursor-pointer hover:bg-purple-50 hover:text-purple-700 font-bold transition-colors">
                                    <Mail className="h-5 w-5 text-purple-600" />
                                    Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem onClick={() => handleShare('native')} className="rounded-xl h-11 flex items-center gap-3 cursor-pointer hover:bg-slate-50 font-bold">
                                    <Share2 className="h-4 w-4 text-slate-400" />
                                    ... Más opciones...
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare('clipboard')} className="rounded-xl h-11 flex items-center gap-3 cursor-pointer hover:bg-slate-50 font-bold">
                                    <Copy className="h-4 w-4 text-slate-400" />
                                    Copiar Enlace
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button 
                            onClick={handleCopyLink}
                            className="h-12 px-8 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Check className="h-5 w-5" />
                            <span className="hidden sm:inline">Guardar y Copiar Enlace</span>
                            <span className="sm:hidden">Guardar</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* FACEBOOK INSTRUCTION MODAL */}
            <Dialog open={showFacebookModal} onOpenChange={setShowFacebookModal}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-md mx-auto">
                    <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                        <Facebook className="h-32 w-32 absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                        <div className="bg-white/20 h-14 w-14 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 shadow-xl border border-white/30">
                            <Facebook className="h-8 w-8 text-white fill-current" />
                        </div>
                        <DialogTitle className="text-2xl font-black mb-2">Publicar en Facebook</DialogTitle>
                        <DialogDescription className="text-blue-100 font-medium">
                            Facebook requiere que pegues tu mensaje manualmente por seguridad.
                        </DialogDescription>
                    </div>
                    
                    <div className="p-8 bg-white space-y-8">
                        <div className="flex gap-4 items-start">
                            <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Haz clic en el campo <span className="text-slate-900 font-bold">"¿Qué estás pensando?"</span> cuando se abra Facebook.</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Mantén presionado o haz click derecho y selecciona <span className="text-slate-900 font-bold">"Pegar"</span>.</p>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1 h-14 rounded-2xl text-slate-400 font-bold hover:bg-slate-50" onClick={() => setShowFacebookModal(false)}>
                                Cancelar
                            </Button>
                            <Button 
                                className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-100 transition-all active:scale-95"
                                onClick={() => {
                                    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generatedLink)}`;
                                    window.open(url, '_blank', 'width=600,height=600');
                                    setShowFacebookModal(false);
                                }}
                            >
                                Abrir e ir a Facebook
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ============================================================================
// RESPONSIVE LAYOUT WRAPPERS
// Extracted to prevent re-renders on every state change
// ============================================================================

const MainLayout = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const EditorPanelWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const PreviewPanelWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;
