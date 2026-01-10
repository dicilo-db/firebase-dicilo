'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

// UI Components
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from '@/components/ui/card';
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
    Calendar as CalendarIcon
} from 'lucide-react';

// Context & Actions
import { useAuth } from '@/context/AuthContext';
import { getCampaignById } from '@/app/actions/freelancer';
import { processCampaignPost } from '@/app/actions/campaign-engagement';
import { translateUserText } from '@/app/actions/translate';
import { correctText } from '@/app/actions/grammar';
import { getUserSocialConnections, SocialConnection } from '@/app/actions/social-connections';
import { Campaign } from '@/types/freelancer';

export function PromoComposerView() {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const campaignId = searchParams?.get('campaignId');

    const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

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
    const [generatedLink, setGeneratedLink] = useState('');

    // Connections State
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [previewNetwork, setPreviewNetwork] = useState('instagram');
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);

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

    // 2. Generate Link
    useEffect(() => {
        if (!activeCampaign) return;

        const legacyId = activeCampaign.id?.substring(0, 8) || 'campaign';
        const specificTrackingId = activeCampaign.tracking_ids?.[activeLangTab];

        // Fallback: Generate one like "xc90_es"
        const generatedId = specificTrackingId || `${legacyId}_${activeLangTab.toUpperCase()}`;

        let baseLink = `https://dicilo.net/r/${generatedId}`;
        const params = new URLSearchParams();

        // 1. Destination
        if (selectedTargetUrl) {
            const cleanUrl = selectedTargetUrl.trim().replace(/^\s+|\s+$/g, '');
            params.set('dest', cleanUrl);
        }

        // 2. Open Graph Data (Rich Previews)
        if (activeCampaign.images && activeCampaign.images.length > selectedImageIndex) {
            params.set('og_img', activeCampaign.images[selectedImageIndex]);
        }
        if (activeCampaign.companyName) {
            params.set('og_title', activeCampaign.companyName);
        }
        const desc = texts[activeLangTab] || activeCampaign.description || '';
        if (desc) {
            params.set('og_desc', desc.substring(0, 150));
        }

        const paramString = params.toString();
        if (paramString) {
            baseLink += `?${paramString}`;
        }

        setGeneratedLink(baseLink);
    }, [activeCampaign, activeLangTab, selectedTargetUrl, selectedImageIndex, texts]);

    // Update Text when Asset Changes (V2)
    const handleAssetSelection = (index: number) => {
        setSelectedImageIndex(index);

        if (activeCampaign?.assets && activeCampaign.assets[index]) {
            const asset = activeCampaign.assets[index];
            setSelectedAssetId(asset.id);

            // Populate Texts
            setTexts(prev => {
                const newTexts: any = { ...prev };
                // Fill from confirmed translations
                Object.entries(asset.translations).forEach(([lang, txt]) => {
                    if (txt) newTexts[lang] = txt;
                });
                return newTexts;
            });

            // Toast info
            // toast({ title: "Asset Selected", description: "Text updated from asset." });
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
        const sourceText = texts[activeLangTab]; // Translate FROM current tab
        if (!activeCampaign || !sourceText) return;

        // Prevent translating to same language
        if (activeLangTab === targetLanguage) {
            toast({ title: "Info", description: "Selecciona un idioma diferente al actual.", variant: "default" });
            return;
        }

        setIsTranslating(true);
        try {
            const result = await translateUserText(sourceText, targetLanguage);
            if (result.success && (result as any).translation) {
                setTexts(prev => ({ ...prev, [targetLanguage]: (result as any).translation }));
                // Switch to the target language tab to show result
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

    const selectedImageUrl = activeCampaign?.assets?.length
        ? activeCampaign.assets[selectedImageIndex].imageUrl
        : (activeCampaign?.images && activeCampaign.images.length > 0
            ? activeCampaign.images[selectedImageIndex]
            : 'https://placehold.co/600x400/png');

    const handleWhatsAppShare = async () => {
        if (!activeCampaign) return;

        // 1. OPTIMISTIC SHARE: Open WhatsApp immediately for best UX
        // Use generatedLink (Polymorphic) instead of backend returned linkId
        const trackingLink = generatedLink;
        const message = `${currentText}\n\n${trackingLink} #${activeCampaign.companyName.replace(/[^a-zA-Z0-9]/g, '')}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');

        // 2. BACKEND PROCESSING (Background)
        setIsSharing(true);
        try {
            // Use current tab language for post
            const postLang = activeLangTab;

            // Pass the selected image URL to backend
            const result = await processCampaignPost(
                'demo_user_id', // TODO: user?.uid when backend ready
                activeCampaign.id!,
                postLang,
                currentText.length,
                selectedImageUrl,
                selectedAssetId || '' // Pass assetId
            );

            if (!result.success) {
                if ((result as any).error?.includes('10 posts')) {
                    toast({
                        title: "Límite Diario Alcanzado",
                        description: "Nota: Has completado tus 10 posts de hoy. Este post no generará recompensa adicional.",
                        className: "bg-yellow-500 text-white mb-2",
                        variant: "default" // Changed to warning/info since we allowed the share
                    });
                    return;
                }
                // Silently log or show minor error, but share already happened
                console.error("Backend process error:", (result as any).error);
            } else {
                const reward = (result as any).reward;
                toast({
                    title: "¡Publicando!",
                    description: `Has asegurado $${reward} por creación. ¡Consigue 5 clics para el bono extra de $0.10!`,
                    className: "bg-green-600 text-white"
                });
            }
        } catch (error: any) {
            console.error("Share error:", error);
        } finally {
            setIsSharing(false);
        }
    }

    if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

    if (!activeCampaign) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-center p-8 text-muted-foreground">
                <Search className="h-12 w-12 mb-4 opacity-20" />
                <h2 className="text-xl font-semibold text-foreground">{t('freelancer.composer.selectCampaign.title')}</h2>
                <p>{t('freelancer.composer.selectCampaign.description')}</p>
            </div>
        );
    }

    // Helper for generic icons
    const NetworkIcon = ({ provider, className }: { provider: string, className?: string }) => {
        switch (provider) {
            case 'facebook': return <Facebook className={className} />;
            case 'instagram': return <Instagram className={className} />;
            case 'linkedin': return <Linkedin className={className} />;
            case 'twitter': return <Twitter className={className} />;
            case 'youtube': return <Youtube className={className} />;
            default: return <Smartphone className={className} />;
        }
    };

    return (
        <MainLayout isMobile={isMobile}>
            {/* LEFT PANEL: EDITOR */}
            <EditorPanelWrapper isMobile={isMobile}>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
                    {/* Header Section */}
                    <div className="flex items-center gap-4">
                        {activeCampaign.companyLogo && activeCampaign.companyLogo !== '/placeholder-logo.png' ? (
                            <div className="h-14 w-14 rounded-full overflow-hidden border shrink-0 relative shadow-sm">
                                <Image src={activeCampaign.companyLogo} alt="Logo" fill className="object-cover" sizes="56px" />
                            </div>
                        ) : (
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl shadow-sm">
                                {activeCampaign.companyName.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold truncate">{activeCampaign.companyName}</h1>
                            <div className="flex gap-2 mt-1 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{activeCampaign.status}</Badge>
                                {activeCampaign.categories?.slice(0, 2).map(c => <Badge key={c} variant="outline" className="text-[10px] px-1.5 h-5">{c}</Badge>)}
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="templates" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4 h-9">
                            <TabsTrigger value="info" className="text-xs">{t('campaign_explorer.tabs.info')}</TabsTrigger>
                            <TabsTrigger value="rules" className="text-xs">{t('campaign_explorer.tabs.rules')}</TabsTrigger>
                            <TabsTrigger value="templates" className="text-xs">{t('campaign_explorer.tabs.templates')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4">
                            <Card className="shadow-none border-dashed">
                                <CardContent className="pt-4 pb-4 px-4">
                                    <h3 className="font-semibold text-sm mb-2">Descripción</h3>
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{activeCampaign.description}</p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="rules">
                            <div className="scale-95 origin-top-left w-[105%]">
                                <FreelancerRules />
                            </div>
                        </TabsContent>

                        <TabsContent value="templates" className="space-y-5">
                            {/* 1. Image Selector */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('freelancer.composer.selectImage')}</label>
                                    {/* Show count based on assets OR images */}
                                    {(activeCampaign.assets?.length || activeCampaign.images?.length || 0) > visibleImagesCount && (
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setVisibleImagesCount(prev => Math.min(prev + 4, 32))}>
                                            <Plus className="h-3 w-3 mr-1" /> Más
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {/* V2 ASSETS LOOP */}
                                    {activeCampaign.assets && activeCampaign.assets.length > 0 ? (
                                        activeCampaign.assets.slice(0, visibleImagesCount).map((asset, i) => (
                                            <div key={asset.id} onClick={() => handleAssetSelection(i)} className={`relative aspect-square rounded-md overflow-hidden border cursor-pointer transition-all ${i === selectedImageIndex ? 'border-primary ring-2 ring-primary/20 ring-offset-1' : 'border-transparent hover:opacity-90'}`}>
                                                <Image src={asset.imageUrl} alt="" fill className="object-cover bg-muted" />
                                                {/* Badge for Asset-based */}
                                                <div className="absolute top-1 left-1 bg-blue-500/80 text-white rounded px-1 py-0.5 text-[8px] font-bold">V2</div>
                                                {i === selectedImageIndex && <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 shadow-sm"><CheckCircle2 className="h-3 w-3" /></div>}
                                            </div>
                                        ))
                                    ) : (
                                        /* V1 LEGACY IMAGES LOOP */
                                        activeCampaign.images?.slice(0, visibleImagesCount).map((img, i) => (
                                            <div key={i} onClick={() => handleAssetSelection(i)} className={`relative aspect-square rounded-md overflow-hidden border cursor-pointer transition-all ${i === selectedImageIndex ? 'border-primary ring-2 ring-primary/20 ring-offset-1' : 'border-transparent hover:opacity-90'}`}>
                                                <Image src={img} alt="" fill className="object-cover bg-muted" />
                                                {i === selectedImageIndex && <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 shadow-sm"><CheckCircle2 className="h-3 w-3" /></div>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* 2. Text Editor */}
                            <div className="space-y-3">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('freelancer.composer.content_translation_label')}</label>

                                    {/* Link Selection - ALWAYS VISIBLE with Fallback */}
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800 mb-2">
                                        <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 block">
                                            {t('freelancer.composer.link_target_label')}
                                        </label>
                                        <Select
                                            value={selectedTargetUrl}
                                            onValueChange={setSelectedTargetUrl}
                                            disabled={!activeCampaign.target_urls?.[activeLangTab]?.length} // Disable if no choices
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-950">
                                                <SelectValue placeholder={
                                                    (!activeCampaign.target_urls?.[activeLangTab]?.length)
                                                        ? "Default Campaign URL"
                                                        : "Selecciona URL destino"
                                                } />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {/* Always show at least one option if list is empty, effectively the default */}
                                                {(!activeCampaign.target_urls?.[activeLangTab]?.length) && (
                                                    <SelectItem value="default" className="text-xs">
                                                        {t('freelancer.composer.default_url_placeholder')}
                                                    </SelectItem>
                                                )}

                                                {activeCampaign.target_urls?.[activeLangTab]?.map((url, i) => (
                                                    <SelectItem key={i} value={url.trim()} className="text-xs">
                                                        {url.trim()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground font-medium ml-1">{t('freelancer.composer.translate_to')}</span>
                                            <select
                                                value={targetLanguage}
                                                onChange={(e) => setTargetLanguage(e.target.value)}
                                                className="h-9 md:h-7 text-sm md:text-xs rounded border-0 bg-transparent focus:ring-0 font-medium py-0 pl-1 pr-8 cursor-pointer hover:bg-black/5"
                                            >
                                                <option value="es">Español</option>
                                                <option value="en">English</option>
                                                <option value="de">Deutsch</option>
                                                <option value="fr">Français</option>
                                                <option value="pt">Português</option>
                                                <option value="it">Italiano</option>
                                            </select>
                                        </div>
                                        <Button size="sm" onClick={handleTranslate} disabled={isTranslating} className="h-7 text-xs px-3">
                                            {isTranslating ? <Loader2 className="animate-spin h-3 w-3" /> : <Languages className="h-3 w-3 mr-1" />}
                                            {t('freelancer.composer.translate_button')}
                                        </Button>
                                    </div>
                                </div>

                                <Tabs value={activeLangTab} onValueChange={setActiveLangTab} className="w-full">
                                    <TabsList className="mb-0 w-full justify-start h-8 bg-transparent p-0 border-b rounded-none gap-4 overflow-x-auto no-scrollbar">
                                        {['es', 'en', 'de', 'fr', 'pt', 'it'].map(lang => (
                                            <TabsTrigger
                                                key={lang}
                                                value={lang}
                                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-8 px-1 text-xs font-medium text-muted-foreground data-[state=active]:text-foreground shrink-0"
                                            >
                                                {lang === 'es' ? 'Español' : lang === 'en' ? 'English' : lang === 'de' ? 'Deutsch' : lang === 'fr' ? 'Français' : lang === 'pt' ? 'Português' : 'Italiano'}
                                                {texts[lang] && <div className="h-1.5 w-1.5 rounded-full bg-green-500 ml-1.5" />}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {['es', 'en', 'de', 'fr', 'pt', 'it'].map(lang => (
                                        <TabsContent key={lang} value={lang} className="mt-3">
                                            <div className="relative">
                                                <Textarea
                                                    value={texts[lang] || ''}
                                                    onChange={(e) => setTexts(prev => ({ ...prev, [lang]: e.target.value }))}
                                                    readOnly={!!selectedAssetId && !!texts[lang]} // Read-only if asset selected AND text exists
                                                    className={`min-h-[200px] resize-none focus-visible:ring-1 focus-visible:ring-primary/50 text-sm leading-relaxed p-3 ${selectedAssetId ? 'bg-slate-50 text-slate-600' : ''}`}
                                                    placeholder={t('freelancer.composer.write_placeholder', { lang: lang.toUpperCase() })}
                                                />
                                                <div className="absolute bottom-2 right-2 flex gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={handleCorrectGrammar}
                                                        disabled={isCorrecting || !texts[lang]}
                                                        className="h-8 w-8 md:h-7 md:w-7 text-purple-600 hover:bg-purple-50 rounded-full"
                                                        title={t('freelancer.composer.grammar_tooltip')}
                                                    >
                                                        {isCorrecting ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={handleCopyText} className="h-7 w-7 text-muted-foreground hover:bg-slate-100 rounded-full" title={t('freelancer.composer.copy_tooltip')}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>

                                <div className="mt-auto pt-4 border-t">
                                    <div className="flex gap-3 items-center">
                                        {/* URL DISPLAY (Expanded) */}
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-md border p-1 h-10 w-full overflow-hidden flex-1 relative">
                                            <div className="bg-transparent px-3 py-1 text-xs font-mono text-muted-foreground select-all truncate flex-1 leading-8">
                                                {generatedLink}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 absolute right-1 hover:bg-slate-200 dark:hover:bg-slate-800"
                                                onClick={async () => {
                                                    await navigator.clipboard.writeText(generatedLink);
                                                    toast({
                                                        title: t('freelancer.composer.copy_link_only_success'),
                                                        description: t('freelancer.composer.copy_link_only_success_desc')
                                                    });
                                                }}
                                                title={t('freelancer.composer.copy_link_only_title')}
                                            >
                                                <Copy className="h-4 w-4 text-slate-500" />
                                            </Button>
                                        </div>

                                        {/* SCHEDULER */}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-[240px] pl-3 text-left font-normal bg-white dark:bg-slate-950",
                                                        !scheduledDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    {scheduledDate ? (
                                                        format(scheduledDate, "PPP")
                                                    ) : (
                                                        <span>{t('freelancer.composer.pick_date_placeholder')}</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={scheduledDate}
                                                    onSelect={setScheduledDate}
                                                    disabled={(date) =>
                                                        date < new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        {/* GENERIC SHARE MENU */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="default"
                                                    disabled={currentText.length < 10 || isGrayMode}
                                                    className={cn(
                                                        "h-10 px-6 font-bold text-white shadow-sm transition-all",
                                                        isGrayMode
                                                            ? "bg-slate-400 cursor-not-allowed hover:bg-slate-400"
                                                            : "bg-green-600 hover:bg-green-700"
                                                    )}
                                                    title={isGrayMode ? t('freelancer.composer.share_disabled_tooltip') : t('freelancer.composer.share_button')}
                                                >
                                                    <Share2 className="h-4 w-4 mr-2" />
                                                    {t('freelancer.composer.share_button')}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuItem onClick={handleWhatsAppShare} className="cursor-pointer">
                                                    <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
                                                    WhatsApp
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={handleWhatsAppShare} className="cursor-pointer">
                                                    <MessageCircle className="mr-2 h-4 w-4 text-green-700" />
                                                    WhatsApp Business
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => {
                                                    const text = `${currentText}\n\n${generatedLink}`;
                                                    window.open(`https://t.me/share/url?url=${encodeURIComponent(generatedLink)}&text=${encodeURIComponent(currentText)}`, '_blank');
                                                }} className="cursor-pointer">
                                                    <Send className="mr-2 h-4 w-4 text-sky-500" />
                                                    Telegram
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => {
                                                    const text = `${currentText} ${generatedLink}`;
                                                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                                                }} className="cursor-pointer">
                                                    <Twitter className="mr-2 h-4 w-4 text-black dark:text-white" />
                                                    X (Twitter)
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={async () => {
                                                    await navigator.clipboard.writeText(`${currentText}\n\n${generatedLink}`);
                                                    toast({
                                                        title: "Texto Copiado",
                                                        description: "Pega el texto (Ctrl+V) en Facebook.",
                                                        duration: 4000
                                                    });
                                                    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generatedLink)}`;
                                                    window.open(url, '_blank', 'width=600,height=600');
                                                }} className="cursor-pointer">
                                                    <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                                                    Facebook
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => {
                                                    const subject = `Check out ${activeCampaign.companyName}`;
                                                    const body = `${currentText}\n\n${generatedLink}`;
                                                    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                                                }} className="cursor-pointer">
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Email
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem onClick={() => {
                                                    if (navigator.share) {
                                                        navigator.share({
                                                            title: activeCampaign.companyName,
                                                            text: currentText,
                                                            url: generatedLink
                                                        }).catch(console.error);
                                                    } else {
                                                        toast({ description: "Native sharing not supported on this device." });
                                                    }
                                                }} className="cursor-pointer">
                                                    <MoreHorizontal className="mr-2 h-4 w-4" />
                                                    Más opciones...
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </EditorPanelWrapper>

            {/* Handle only for desktop is handled inside wrapper or here? Handled here */}
            {!isMobile && <ResizableHandle withHandle className="bg-slate-200 dark:bg-slate-800" />}

            {/* RIGHT PANEL: PREVIEW */}
            <PreviewPanelWrapper isMobile={isMobile}>
                {/* Modern Dot Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                </div>

                {/* Top Floating Control Bar */}
                <div className="h-16 flex items-center justify-center shrink-0 z-10 relative pointer-events-none">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-800 rounded-full px-4 py-1.5 flex items-center gap-3 pointer-events-auto mt-4 transition-all hover:scale-105">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('freelancer.composer.preview.mode_label')}</span>
                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                        <Select value={previewNetwork} onValueChange={setPreviewNetwork}>
                            <SelectTrigger className="w-[140px] h-7 text-xs border-0 bg-transparent focus:ring-0 shadow-none px-0 gap-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="instagram">
                                    <div className="flex items-center gap-2">
                                        <Instagram className="h-3 w-3" /> Instagram
                                    </div>
                                </SelectItem>
                                <SelectItem value="facebook">
                                    <div className="flex items-center gap-2">
                                        <Facebook className="h-3 w-3" /> Facebook
                                    </div>
                                </SelectItem>
                                <SelectItem value="twitter">
                                    <div className="flex items-center gap-2">
                                        <Twitter className="h-3 w-3" /> X / Twitter
                                    </div>
                                </SelectItem>
                                <SelectItem value="linkedin">
                                    <div className="flex items-center gap-2">
                                        <Linkedin className="h-3 w-3" /> LinkedIn
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Main Preview Canvas - Centered & Scrollable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 relative z-10 flex flex-col items-center justify-center min-h-0">
                    <div className="origin-center animate-in fade-in zoom-in duration-500 w-full flex justify-center">
                        {/* MODERN REALISTIC PHONE MOCKUP */}
                        <div className="relative w-[300px] h-[610px] sm:w-[320px] sm:h-[650px] bg-white dark:bg-black border-[6px] border-slate-800 rounded-[35px] sm:rounded-[40px] overflow-hidden shadow-2xl flex flex-col shrink-0 ring-1 ring-white/10 transition-all">
                            {/* Modern Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-xl z-30 pointer-events-none flex justify-center items-center">
                                <div className="w-12 h-1.5 bg-slate-700/50 rounded-full"></div>
                            </div>

                            {/* Status Bar */}
                            <div className="h-10 w-full bg-white dark:bg-black flex items-center justify-between px-6 shrink-0 relative z-20">
                                <span className="text-[10px] font-bold text-slate-900 dark:text-white">9:41</span>
                                <div className="flex gap-1.5 items-center">
                                    <div className="h-2.5 w-4 bg-slate-900 dark:bg-white rounded-[2px]" />
                                </div>
                            </div>

                            {/* App Header */}
                            <div className="h-12 border-b bg-white dark:bg-black flex items-center justify-between px-4 shrink-0 z-10 sticky top-0 relative">
                                {previewNetwork === 'instagram' && (
                                    <>
                                        <div className="font-bold text-lg font-serif tracking-tighter">Instagram</div>
                                        <div className="flex gap-3">
                                            <Heart className="h-5 w-5" />
                                            <MessageCircle className="h-5 w-5" />
                                        </div>
                                    </>
                                )}
                                {previewNetwork === 'facebook' && (
                                    <div className="w-full flex justify-between items-center text-blue-600 font-bold text-xl">
                                        <span>facebook</span>
                                        <div className="flex gap-3 text-slate-600 cursor-pointer">
                                            <Search className="h-5 w-5" />
                                            <MessageCircle className="h-5 w-5" />
                                        </div>
                                    </div>
                                )}
                                {previewNetwork === 'twitter' && (
                                    <div className="w-full flex justify-center">
                                        <Twitter className="h-6 w-6 text-black dark:text-white fill-current" />
                                    </div>
                                )}
                                {previewNetwork === 'linkedin' && (
                                    <div className="w-full flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-sm bg-blue-700 flex items-center justify-center text-white font-bold text-xs">in</div>
                                        <div className="flex-1 bg-slate-100 h-7 rounded flex items-center px-2 text-muted-foreground text-xs">Search</div>
                                        <MessageCircle className="h-6 w-6 text-slate-500" />
                                    </div>
                                )}
                            </div>

                            {/* Scrollable App Content */}
                            <div className="flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-black">

                                {/* 1. INSTAGRAM */}
                                {previewNetwork === 'instagram' && (
                                    <div className="pb-4">
                                        <div className="flex items-center justify-between px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                                                    <div className="h-full w-full rounded-full border-2 border-white overflow-hidden relative bg-white">
                                                        <Image src={activeCampaign.companyLogo || '/placeholder.png'} alt="" fill className="object-cover" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-xs text-slate-900 dark:text-white">{activeCampaign.companyName}</span>
                                                    <span className="text-[10px] text-slate-500">{t('freelancer.composer.preview.sponsored')}</span>
                                                </div>
                                            </div>
                                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <div className="aspect-square bg-slate-100 relative w-full mb-2">
                                            <Image src={selectedImageUrl} alt="" fill className="object-cover" />
                                        </div>
                                        <div className="px-3 pb-2">
                                            <div className="flex justify-between mb-2">
                                                <div className="flex gap-3">
                                                    <Heart className="h-6 w-6 hover:text-red-500 transition-colors cursor-pointer" />
                                                    <MessageCircle className="h-6 w-6 -rotate-90 cursor-pointer" />
                                                    <Send className="h-6 w-6 -rotate-45 -mt-0.5 cursor-pointer" />
                                                </div>
                                                <Bookmark className="h-6 w-6 cursor-pointer" />
                                            </div>
                                            <div className="text-sm font-bold mb-1">2,845 likes</div>
                                            <div className="text-sm leading-snug">
                                                <span className="font-bold mr-2">{activeCampaign.companyName}</span>
                                                {currentText}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 2. FACEBOOK */}
                                {previewNetwork === 'facebook' && (
                                    <div className="bg-slate-100 dark:bg-slate-900 min-h-full">
                                        <div className="bg-white dark:bg-black mb-2 pb-2">
                                            <div className="flex items-start px-4 py-3 gap-2">
                                                <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden relative border">
                                                    <Image src={activeCampaign.companyLogo || '/placeholder.png'} alt="" fill className="object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm leading-tight text-slate-900 dark:text-white">{activeCampaign.companyName}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">{t('freelancer.composer.preview.sponsored')} <Globe className="h-2.5 w-2.5" /></div>
                                                </div>
                                                <MoreHorizontal className="h-5 w-5 text-slate-500" />
                                            </div>
                                            <div className="px-4 pb-2 text-sm text-slate-900 dark:text-white whitespace-pre-wrap">
                                                {currentText}
                                                <div className="text-blue-600 mt-1">{generatedLink}</div>
                                            </div>
                                            <div className="aspect-[4/5] bg-slate-100 relative w-full">
                                                <Image src={selectedImageUrl} alt="" fill className="object-cover" />
                                            </div>
                                            <div className="px-4 py-2 border-b flex items-center justify-between text-xs text-slate-500">
                                                <div className="flex items-center gap-1"><div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white"><ThumbsUp className="h-2 w-2" /></div> 482</div>
                                                <div>12 Comments • 4 Shares</div>
                                            </div>
                                            <div className="px-2 py-1 flex justify-between">
                                                <div className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-slate-50 rounded text-slate-600 font-medium text-xs cursor-pointer"><ThumbsUp className="h-4 w-4" /> {t('freelancer.composer.preview.like')}</div>
                                                <div className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-slate-50 rounded text-slate-600 font-medium text-xs cursor-pointer"><MessageCircle className="h-4 w-4" /> {t('freelancer.composer.preview.comment')}</div>
                                                <div className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-slate-50 rounded text-slate-600 font-medium text-xs cursor-pointer"><Share2 className="h-4 w-4" /> {t('freelancer.composer.preview.share')}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3. TWITTER */}
                                {previewNetwork === 'twitter' && (
                                    <div className="border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex gap-3 p-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 relative overflow-hidden shrink-0">
                                                <Image src={activeCampaign.companyLogo || '/placeholder.png'} alt="" fill className="object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1 text-[13px]">
                                                    <span className="font-bold text-slate-900 dark:text-white truncate">{activeCampaign.companyName}</span>
                                                    <span className="text-slate-500 truncate">@{activeCampaign.companyName.replace(/\s/g, '').toLowerCase()}</span>
                                                    <span className="text-slate-500">·</span>
                                                    <span className="text-slate-500">{t('freelancer.composer.preview.promoted')}</span>
                                                </div>
                                                <div className="text-[13px] text-slate-900 dark:text-white mt-0.5 whitespace-pre-wrap">
                                                    {currentText}
                                                    <span className="text-blue-500 ml-1">{generatedLink}</span>
                                                </div>
                                                <div className="mt-2 aspect-video rounded-xl overflow-hidden relative border border-slate-100 dark:border-slate-800">
                                                    <Image src={selectedImageUrl} alt="" fill className="object-cover" />
                                                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1 rounded">{t('freelancer.composer.preview.promoted')}</div>
                                                </div>
                                                <div className="flex justify-between mt-3 pr-8 text-slate-500 text-xs">
                                                    <div className="flex items-center gap-1 group cursor-pointer hover:text-blue-500"><MessageCircle className="h-3.5 w-3.5" /> 24</div>
                                                    <div className="flex items-center gap-1 group cursor-pointer hover:text-green-500"><Repeat className="h-3.5 w-3.5" /> 12</div>
                                                    <div className="flex items-center gap-1 group cursor-pointer hover:text-pink-500"><Heart className="h-3.5 w-3.5" /> 148</div>
                                                    <div className="flex items-center gap-1 group cursor-pointer hover:text-blue-500"><Share2 className="h-3.5 w-3.5" /></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 4. LINKEDIN */}
                                {previewNetwork === 'linkedin' && (
                                    <div className="bg-[#f3f2ef] dark:bg-slate-900 min-h-full pt-2">
                                        <div className="bg-white dark:bg-black mb-2 shadow-sm border border-slate-200 dark:border-slate-800">
                                            <div className="flex gap-2 px-3 py-2 mb-1">
                                                <div className="h-10 w-10 rounded-sm bg-slate-100 relative overflow-hidden">
                                                    <Image src={activeCampaign.companyLogo || '/placeholder.png'} alt="" fill className="object-cover" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-xs text-slate-900 dark:text-white">{activeCampaign.companyName}</div>
                                                    <div className="text-[10px] text-slate-500">{t('freelancer.composer.preview.promoted')}</div>
                                                </div>
                                                <div className="ml-auto flex items-start">
                                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                                </div>
                                            </div>

                                            <div className="px-3 text-xs text-slate-900 dark:text-white mb-2 leading-relaxed whitespace-pre-wrap">
                                                {currentText}
                                                <div className="text-blue-600 mt-1 font-semibold">{generatedLink}</div>
                                            </div>

                                            <div className="aspect-[1.91/1] w-full relative bg-slate-100">
                                                <Image src={selectedImageUrl} alt="" fill className="object-cover" />
                                            </div>
                                            <div className="bg-slate-50 px-3 py-2 border-b flex justify-between items-center">
                                                <div>
                                                    <div className="font-semibold text-xs truncate">{activeCampaign.companyName}.com</div>
                                                    <div className="text-[10px] text-slate-500">{t('freelancer.composer.preview.learn_more_about_us')}</div>
                                                </div>
                                                <div className="border border-blue-600 text-blue-600 rounded-full px-3 py-0.5 text-xs font-semibold">{t('freelancer.composer.preview.learn_more')}</div>
                                            </div>

                                            <div className="flex justify-between px-2 py-1">
                                                <div className="flex items-center gap-1 p-2 hover:bg-slate-100 rounded cursor-pointer text-slate-500">
                                                    <ThumbsUp className="h-4 w-4 -scale-x-100" />
                                                    <span className="text-xs font-medium">{t('freelancer.composer.preview.like')}</span>
                                                </div>
                                                <div className="flex items-center gap-1 p-2 hover:bg-slate-100 rounded cursor-pointer text-slate-500">
                                                    <MessageCircle className="h-4 w-4" />
                                                    <span className="text-xs font-medium">{t('freelancer.composer.preview.comment')}</span>
                                                </div>
                                                <div className="flex items-center gap-1 p-2 hover:bg-slate-100 rounded cursor-pointer text-slate-500">
                                                    <Share2 className="h-4 w-4" />
                                                    <span className="text-xs font-medium">{t('freelancer.composer.preview.share')}</span>
                                                </div>
                                                <div className="flex items-center gap-1 p-2 hover:bg-slate-100 rounded cursor-pointer text-slate-500">
                                                    <Send className="h-4 w-4 rotate-45 -mt-1" />
                                                    <span className="text-xs font-medium">{t('freelancer.composer.preview.send')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Home Indicator */}
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 dark:bg-white/20 rounded-full z-30 pointer-events-none"></div>
                        </div>
                    </div>

                    {/* NEW PROFIT DISPLAY BELOW PHONE */}
                    <div className="mt-8 w-full max-w-[320px] bg-white dark:bg-slate-900 rounded-xl p-5 shadow-lg border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-700 delay-200 shrink-0 mb-8 relative overflow-hidden">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{t('dashboard.promo.estimatedEarnings', 'Ganancia Estimada')}</div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-4xl font-bold text-[#16a34a] tracking-tight">€{currentTier.rate.toFixed(2)}</span>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 px-2 py-0.5 text-xs font-bold shadow-sm">
                                + €0.10 {t('dashboard.promo.trafficBonus', 'Bono Tráfico')}
                            </Badge>
                        </div>

                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-[#16a34a] transition-all duration-500" style={{ width: `${Math.min((currentText.length / 600) * 100, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            {currentText.length < 300
                                ? t('dashboard.promo.unlockBasePay', { chars: (300 - currentText.length), defaultValue: `Escribe ${(300 - currentText.length)} más car. para desbloquear el pago base.` })
                                : currentText.length < 600
                                    ? t('dashboard.promo.maximizeEarnings', { chars: (600 - currentText.length), defaultValue: `¡Buen trabajo! Escribe ${(600 - currentText.length)} más para maximizar a €0.40.` })
                                    : t('dashboard.promo.earningsMaximized', { defaultValue: "¡Excelente! Has maximizado tu tarifa base." })}
                        </p>
                    </div>
                </div>
            </PreviewPanelWrapper>
        </MainLayout>
    );
}

// ============================================================================
// RESPONSIVE LAYOUT WRAPPERS
// Extracted to prevent re-renders on every state change
// ============================================================================

// This component would require access to useTranslation hook, or pass strings as props.
// Since it's outside the main component, we'll wrap it or move it inside if needed.
// For now, let's assume we can modify MainLayout to accept translated strings or useTranslation inside if we move it or change it to not be a separate component file but defined in the same file.
// Actually, since these are defined in the same file, we can't easily use hooks unless they are components.
// Let's refactor MainLayout slightly to use translation if possible, or pass props.
// Ideally, `MainLayout` is a component so it can use hooks.

const MainLayout = ({ children, isMobile }: { children: React.ReactNode, isMobile: boolean }) => {
    // If we can't use hooks here easily without massive refactor (if it's not exported/used as component in a standard way), we might need to be careful.
    // However, it is a functional component.
    const { t } = useTranslation('common');

    if (isMobile) {
        return (
            <Tabs defaultValue="editor" className="flex flex-col h-full bg-background">
                <div className="border-b px-4 py-2 bg-white dark:bg-slate-950 shrink-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="editor">{t('freelancer.composer.layout.editor_tab')}</TabsTrigger>
                        <TabsTrigger value="preview">{t('freelancer.composer.layout.preview_tab')}</TabsTrigger>
                    </TabsList>
                </div>
                {children}
            </Tabs>
        );
    }
    return (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full rounded-lg border bg-background overflow-hidden relative">
            {children}
        </ResizablePanelGroup>
    );
};

const EditorPanelWrapper = ({ children, isMobile }: { children: React.ReactNode, isMobile: boolean }) => {
    if (isMobile) {
        return (
            <TabsContent value="editor" className="flex-1 overflow-hidden data-[state=inactive]:hidden mt-0">
                <div className="h-full overflow-y-auto bg-white dark:bg-slate-950">{children}</div>
            </TabsContent>
        );
    }
    // Editor Panel: Default to 60% width
    return <ResizablePanel defaultSize={60} minSize={40} maxSize={80} className="bg-white dark:bg-slate-950 flex flex-col border-r h-full overflow-hidden">{children}</ResizablePanel>;
};

const PreviewPanelWrapper = ({ children, isMobile }: { children: React.ReactNode, isMobile: boolean }) => {
    if (isMobile) {
        return (
            <TabsContent value="preview" className="flex-1 overflow-hidden data-[state=inactive]:hidden mt-0">
                {children}
            </TabsContent>
        );
    }
    // Preview Panel: Default to 40% width
    return <ResizablePanel defaultSize={40} className="bg-slate-100/50 dark:bg-black/40 relative flex flex-col h-full overflow-hidden">{children}</ResizablePanel>;
};
