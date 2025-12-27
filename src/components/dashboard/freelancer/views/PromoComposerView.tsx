'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Instagram,
    Send,
    Copy,
    CheckCircle2,
    Plus,
    Loader2,
    MessageCircle,
    Share2,
    Languages,
    Info,
    Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { getCampaignById } from '@/app/actions/freelancer';
import { processCampaignPost } from '@/app/actions/campaign-engagement';
import { translateUserText } from '@/app/actions/translate';
import { correctText } from '@/app/actions/grammar';
import { Campaign } from '@/types/freelancer';
import { Skeleton } from '@/components/ui/skeleton';
import { FreelancerRules } from '@/components/dashboard/freelancer/FreelancerRules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PromoComposerView() {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const campaignId = searchParams.get('campaignId');

    const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    const [customText, setCustomText] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [visibleImagesCount, setVisibleImagesCount] = useState(4);
    const [generatedLink, setGeneratedLink] = useState('');
    const [isCopying, setIsCopying] = useState(false);

    // Pricing Tiers Configuration (Should come from backend/config)
    const PRICING_TIERS = [
        { chars: 600, rate: 0.16 },
        { chars: 1200, rate: 0.30 },
        { chars: 2000, rate: 0.50 }
    ];

    const currentTier = PRICING_TIERS.reduce((prev, curr) => {
        return customText.length >= curr.chars ? curr : prev;
    }, { chars: 0, rate: activeCampaign?.rate_per_click || 0.10 });

    useEffect(() => {
        async function loadCampaign() {
            if (!campaignId) return;
            setIsLoading(true);
            const campaign = await getCampaignById(campaignId);
            if (campaign) {
                // Generate mocked link on load
                setGeneratedLink(`https://dicilo.net/r/${campaign.id?.substring(0, 8)}`);

                // DEMO: Simulate more images
                if (campaign.images && campaign.images.length > 0) {
                    const rawImages = campaign.images;
                    let expandedImages = [...rawImages];
                    while (expandedImages.length < 12) {
                        expandedImages = [...expandedImages, ...rawImages];
                    }
                    campaign.images = expandedImages.slice(0, 24);
                }

                setActiveCampaign(campaign);
                setCustomText(campaign.description || '');
                setSelectedImageIndex(0);
                setVisibleImagesCount(4);
            }
            setIsLoading(false);
        }
        loadCampaign();
    }, [campaignId]);

    const [targetLanguage, setTargetLanguage] = useState('es');
    const [isCorrecting, setIsCorrecting] = useState(false);

    useEffect(() => {
        if (activeCampaign && activeCampaign.languages && activeCampaign.languages.length > 0) {
            setTargetLanguage(activeCampaign.languages[0]);
        }
    }, [activeCampaign]);

    const handleCorrectGrammar = async () => {
        if (!customText || customText.length < 5) return;
        setIsCorrecting(true);
        try {
            const result = await correctText(customText);
            if (result.success && result.correctedText) {
                setCustomText(result.correctedText);
                if (result.wasCorrected) {
                    toast({
                        title: "Texto Mejorado ✨",
                        description: "Hemos corregido la gramática y el estilo.",
                        className: "bg-purple-600 text-white"
                    });
                } else {
                    toast({ title: "¡Perfecto!", description: "Tu texto ya estaba excelente." });
                }
            }
        } catch (e) {
            toast({ title: "Error", description: "No se pudo conectar con el editor IA.", variant: "destructive" });
        } finally {
            setIsCorrecting(false);
        }
    };

    const handleTranslate = async () => {
        if (!activeCampaign || !customText) return;
        setIsTranslating(true);
        try {
            const result = await translateUserText(customText, targetLanguage);
            if (result.success && result.translation) {
                setCustomText(result.translation);
                toast({
                    title: "Traducido",
                    description: `Texto traducido a ${targetLanguage.toUpperCase()}.`,
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
        if (!customText) return;
        await navigator.clipboard.writeText(customText);
        toast({ title: t('campaign_explorer.copy_text') + " OK", description: "Texto copiado al portapapeles." });
        // Track intent?
    };

    const handleWhatsAppShare = async () => {
        if (!activeCampaign) return;
        setIsSharing(true);
        try {
            const postLang = (navigator.language || 'es').split('-')[0];
            const result = await processCampaignPost('demo_user_id', activeCampaign.id!, postLang);

            if (!result.success) {
                if (result.error?.includes('10 posts')) {
                    toast({
                        title: "Límite Diario Alcanzado",
                        description: "Has completado tus 10 posts de hoy para esta campaña.",
                        variant: "destructive"
                    });
                    return;
                }
                throw new Error(result.error);
            }

            const trackingLink = `https://dicilo.net/s/${result.reward ? 'paid' : 'ref'}`;
            const message = `${customText}\n\n${trackingLink} #${activeCampaign.companyName.replace(/[^a-zA-Z0-9]/g, '')}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');

            toast({
                title: "¡Publicando!",
                description: `Has ganado $${result.reward} por esta conexión.`,
                className: "bg-green-600 text-white"
            });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
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
                <p className="text-xs mt-4 opacity-50">Explora la pestaña "Campañas" para elegir una.</p>
            </div>
        );
    }

    const selectedImageUrl = activeCampaign.images && activeCampaign.images.length > 0
        ? activeCampaign.images[selectedImageIndex]
        : '/placeholder-product-1.jpg';

    return (
        <div className="flex flex-col xl:flex-row h-full overflow-hidden">
            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50 dark:bg-black/20 pb-20">
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-6">
                    {activeCampaign.companyLogo && activeCampaign.companyLogo !== '/placeholder-logo.png' ? (
                        <div className="h-16 w-16 rounded-full overflow-hidden border shrink-0 relative shadow-sm">
                            <Image src={activeCampaign.companyLogo} alt="Logo" fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-2xl shadow-sm">
                            {activeCampaign.companyName.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">{activeCampaign.companyName}</h1>
                        <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{activeCampaign.status}</Badge>
                            {activeCampaign.categories.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                        </div>
                    </div>
                    <div className="ml-auto text-right">
                        <div className="text-green-600 font-bold text-xl">${currentTier.rate.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">per valid click</div>
                    </div>
                </div>

                <Tabs defaultValue="templates" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="info">{t('campaign_explorer.tabs.info')}</TabsTrigger>
                        <TabsTrigger value="rules">{t('campaign_explorer.tabs.rules')}</TabsTrigger>
                        <TabsTrigger value="templates">{t('campaign_explorer.tabs.templates')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4">
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-semibold mb-2">Descripción de la Campaña</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{activeCampaign.description}</p>

                                <h3 className="font-semibold mt-6 mb-2">Detalles del Presupuesto</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted rounded-lg">
                                        <div className="text-xs text-muted-foreground">Pool Restante</div>
                                        <div className="font-mono text-lg font-bold text-green-700">84%</div>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <div className="text-xs text-muted-foreground">Pago Máximo</div>
                                        <div className="font-mono text-lg font-bold">€0.50 / click</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="rules">
                        <FreelancerRules />
                    </TabsContent>

                    <TabsContent value="templates" className="space-y-6">
                        {/* 1. Image Selector */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">{t('freelancer.composer.selectImage')}</label>
                                {activeCampaign.images && activeCampaign.images.length > visibleImagesCount && (
                                    <Button variant="ghost" size="sm" onClick={() => setVisibleImagesCount(prev => Math.min(prev + 4, 24))}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {activeCampaign.images?.slice(0, visibleImagesCount).map((img, i) => (
                                    <div key={i} onClick={() => setSelectedImageIndex(i)} className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${i === selectedImageIndex ? 'border-primary ring-2' : 'border-transparent'}`}>
                                        <Image src={img} alt="" fill className="object-cover bg-muted" />
                                        {i === selectedImageIndex && <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5"><CheckCircle2 className="h-4 w-4" /></div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Text Editor & Tools */}
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <label className="text-sm font-medium">Editor de Texto & Traducción</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={targetLanguage}
                                        onChange={(e) => setTargetLanguage(e.target.value)}
                                        className="h-8 text-xs rounded-md border bg-background px-2"
                                    >
                                        <option value="es">Español</option>
                                        <option value="en">English</option>
                                        <option value="de">Deutsch</option>
                                    </select>
                                    <Button size="sm" variant="secondary" onClick={handleTranslate} disabled={isTranslating} className="h-8 text-xs">
                                        {isTranslating ? <Loader2 className="animate-spin h-3 w-3" /> : <Languages className="h-3 w-3 mr-1" />}
                                        {t('campaign_explorer.translate_btn')}
                                    </Button>
                                </div>
                            </div>

                            <Card className="border-2 border-dashed shadow-none">
                                <CardContent className="p-4">
                                    <Textarea
                                        value={customText}
                                        onChange={(e) => setCustomText(e.target.value)}
                                        className="min-h-[160px] border-none resize-none focus-visible:ring-0 text-base"
                                        placeholder="Escribe tu recomendación auténtica aquí..."
                                    />
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleCorrectGrammar}
                                            disabled={isCorrecting}
                                            className="text-xs text-purple-600 hover:bg-purple-50"
                                        >
                                            {isCorrecting ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                                            {t('campaign_explorer.grammar_check_btn')}
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={handleCopyText} className="h-7 text-xs">
                                                <Copy className="h-3 w-3 mr-1" /> {t('campaign_explorer.copy_text')}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <Button onClick={handleWhatsAppShare} disabled={isSharing} className="h-12 bg-[#25D366] hover:bg-[#25D366]/90 text-white text-lg font-bold shadow-lg transition-transform active:scale-[0.98]">
                                    {isSharing ? <Loader2 className="animate-spin mr-2" /> : <MessageCircle className="mr-2" />}
                                    Compartir en WhatsApp
                                </Button>
                                <div className="space-y-1">
                                    <div className="flex gap-2 h-12">
                                        <Input readOnly value={generatedLink} className="h-full bg-slate-100 font-mono text-xs" />
                                        <Button variant="outline" size="icon" className="h-full w-12 shrink-0" onClick={() => { navigator.clipboard.writeText(generatedLink); toast({ description: "Link copiado" }); }}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground text-center">Este es tu enlace único de seguimiento.</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* PREVIEW SIDEBAR */}
            <div className="hidden xl:flex w-[380px] bg-slate-100 dark:bg-black/40 border-l p-6 flex-col items-center shrink-0">
                <div className="text-center mb-6">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{t('freelancer.composer.preview.title')}</h3>
                </div>

                {/* Phone Mockup Simplified */}
                <div className="w-[300px] bg-white dark:bg-black border-4 border-slate-800 rounded-[30px] overflow-hidden shadow-2xl relative h-[600px] flex flex-col">
                    <div className="h-6 bg-slate-800 w-1/2 mx-auto rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2 z-10"></div>
                    <div className="pt-10 px-4 pb-4 flex-1 overflow-y-auto no-scrollbar">
                        {/* Header Post */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden relative border">
                                {activeCampaign.companyLogo && <Image src={activeCampaign.companyLogo} alt="" fill className="object-cover" />}
                            </div>
                            <div>
                                <div className="text-xs font-bold">{activeCampaign.companyName}</div>
                                <div className="text-[10px] text-muted-foreground">Sponsored</div>
                            </div>
                        </div>
                        {/* Image */}
                        <div className="aspect-square bg-gray-100 relative rounded-md overflow-hidden mb-3">
                            <Image src={selectedImageUrl} alt="" fill className="object-cover" />
                        </div>
                        {/* Actions */}
                        <div className="flex gap-3 mb-3 text-slate-800 dark:text-slate-200">
                            <Share2 className="h-5 w-5" />
                            <MessageCircle className="h-5 w-5" />
                        </div>
                        {/* Caption */}
                        <div className="text-xs">
                            <span className="font-bold mr-1">You</span>
                            <span className="whitespace-pre-wrap">{customText || activeCampaign.description}</span>
                            <div className="mt-1 text-blue-500">{generatedLink}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-4 rounded-xl shadow mt-8 w-full border">
                    <p className="text-sm font-semibold mb-1">Ganancia Estimada</p>
                    <p className="text-2xl font-bold text-green-600">€{currentTier.rate.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Si obtienes un click válido.</p>
                </div>
            </div>
        </div>
    );
}
