'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { format } from 'date-fns';

// UI Components
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Icons
import {
    Instagram,
    Facebook,
    MessageCircle,
    Send,
    Share2,
    Twitter,
    Mail,
    Sparkles,
    Languages,
    Check,
    Trash2,
    Save,
    Globe,
    Copy,
    ExternalLink,
    Loader2,
    CheckCircle2,
    Smartphone,
    TrendingUp
} from 'lucide-react';

// Context & Actions
import { useAuth } from '@/context/AuthContext';
import { getCampaignById } from '@/app/actions/freelancer';
import { processCampaignPost } from '@/app/actions/campaign-engagement';
import { translateUserText } from '@/app/actions/translate';
import { correctText } from '@/app/actions/grammar';
import { updateScheduledPostAction, deleteScheduledPostAction, CalendarEvent } from '@/app/actions/mkt-plan';
import { Campaign } from '@/types/freelancer';
import { cn } from '@/lib/utils';

interface CampaignPrepModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: CalendarEvent | null;
    onSuccess: () => void;
}

const PLATFORMS = [
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-500 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800', hoverColor: 'hover:bg-green-100/50' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800', hoverColor: 'hover:bg-pink-100/50' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', hoverColor: 'hover:bg-blue-100/50' },
    { id: 'telegram', name: 'Telegram', icon: Send, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800', hoverColor: 'hover:bg-sky-100/50' },
    { id: 'twitter', name: 'Twitter / X', icon: Twitter, color: 'text-slate-800 bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800', hoverColor: 'hover:bg-slate-100' },
    { id: 'email', name: 'Email', icon: Mail, color: 'text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800', hoverColor: 'hover:bg-red-100/50' },
    { id: 'clipboard', name: 'Otros (Portapapeles)', icon: Copy, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800', hoverColor: 'hover:bg-purple-100/50' },
];

export function CampaignPrepModal({ isOpen, onClose, event, onSuccess }: CampaignPrepModalProps) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const { user } = useAuth();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    // States for custom modifications
    const [selectedPlatform, setSelectedPlatform] = useState('instagram');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [activeLangTab, setActiveLangTab] = useState('es');
    const [targetLanguage, setTargetLanguage] = useState('en');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isCorrecting, setIsCorrecting] = useState(false);

    // Texts Map
    const [texts, setTexts] = useState<{ [key: string]: string }>({
        es: '', en: '', de: '', fr: '', pt: '', it: ''
    });

    // Links state
    const [selectedTargetUrl, setSelectedTargetUrl] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [draftLinkId, setDraftLinkId] = useState('');
    const debounceTimer = useRef<NodeJS.Timeout>();

    const currentText = texts[activeLangTab] || '';
    const isCompleted = event?.status === 'completed';

    // Pricing estimation
    const PRICING_TIERS = [
        { chars: 300, rate: 0.20 },
        { chars: 600, rate: 0.40 }
    ];
    const currentTier = PRICING_TIERS.reduce((prev, curr) => {
        return currentText.length >= curr.chars ? curr : prev;
    }, { chars: 0, rate: 0.00 });

    const rewardPerAction = campaign?.reward_per_action || 0.40;

    // Load Campaign & Pre-fill fields
    useEffect(() => {
        if (!event || !isOpen) return;

        async function loadCampaign() {
            setIsLoadingCampaign(true);
            try {
                const camp = await getCampaignById(event!.campaignId);
                if (camp) {
                    setCampaign(camp);
                    
                    // Initialize default states based on whether there's saved event data or asset data
                    setSelectedPlatform(event!.platform || 'instagram');
                    
                    // Pre-fill text translations map
                    const initialTexts = { es: '', en: '', de: '', fr: '', pt: '', it: '' };

                    // Load saved text or fallbacks
                    if (event!.text) {
                        initialTexts[activeLangTab] = event!.text;
                    }

                    // 1. Resolve asset from saved event
                    let matchedAssetIndex = 0;
                    if (camp.assets && camp.assets.length > 0) {
                        const foundIdx = camp.assets.findIndex(a => a.id === event!.assetId);
                        if (foundIdx !== -1) {
                            matchedAssetIndex = foundIdx;
                        }
                        
                        const activeAsset = camp.assets[matchedAssetIndex];
                        setSelectedAssetId(activeAsset.id);
                        setSelectedImageIndex(matchedAssetIndex);

                        // Fill translations from asset if event text is empty
                        Object.keys(activeAsset.translations).forEach(lang => {
                            if (!initialTexts[lang]) {
                                initialTexts[lang] = activeAsset.translations[lang] || '';
                            }
                        });
                        if (activeAsset.sourceLanguage && !initialTexts[activeAsset.sourceLanguage]) {
                            initialTexts[activeAsset.sourceLanguage] = activeAsset.baseText;
                        }
                    } else {
                        setSelectedAssetId(null);
                        // If legacy campaign images are used
                        const imageIndex = camp.images?.findIndex(img => img === event!.selectedImageUrl) ?? 0;
                        setSelectedImageIndex(imageIndex >= 0 ? imageIndex : 0);
                    }

                    setTexts(initialTexts);

                    // Set target url
                    if (event!.targetUrl) {
                        setSelectedTargetUrl(event!.targetUrl);
                    } else if (camp.target_urls?.[activeLangTab]?.[0]) {
                        setSelectedTargetUrl(camp.target_urls[activeLangTab][0]);
                    } else {
                        setSelectedTargetUrl(camp.targetUrl || '');
                    }
                }
            } catch (err) {
                console.error("Error loading campaign for modal:", err);
            } finally {
                setIsLoadingCampaign(false);
            }
        }
        loadCampaign();
    }, [event, isOpen, activeLangTab]);

    // Handle Asset/Image Selection
    const handleAssetSelection = (index: number) => {
        setSelectedImageIndex(index);
        if (campaign?.assets && campaign.assets[index]) {
            const asset = campaign.assets[index];
            setSelectedAssetId(asset.id);

            setTexts(prev => {
                const newTexts = { ...prev };
                Object.entries(asset.translations).forEach(([lang, txt]) => {
                    if (txt) newTexts[lang] = txt;
                });
                if (asset.sourceLanguage && !newTexts[asset.sourceLanguage]) {
                    newTexts[asset.sourceLanguage] = asset.baseText;
                }
                return newTexts;
            });
        } else {
            setSelectedAssetId(null);
        }
    };

    // Shorten Link logic (Debounced)
    useEffect(() => {
        if (!campaign || !user || !isOpen) return;

        const updateLink = async () => {
            try {
                const res = await fetch('/api/shorten', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        campaignId: campaign.id,
                        freelancerId: user.uid,
                        targetUrl: selectedTargetUrl || campaign.target_urls?.[activeLangTab]?.[0] || campaign.targetUrl,
                        selectedImageUrl: campaign.assets?.length
                            ? campaign.assets[selectedImageIndex].imageUrl
                            : (campaign.images?.[selectedImageIndex] || campaign.companyLogo),
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
                console.error("Shortener failed in modal", e);
            }
        };

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(updateLink, 1000);

        return () => clearTimeout(debounceTimer.current);
    }, [campaign, activeLangTab, selectedTargetUrl, selectedImageIndex, texts, user, selectedAssetId, draftLinkId, isOpen]);

    // Reset draft ID when event changes
    useEffect(() => {
        setDraftLinkId('');
        setGeneratedLink('');
    }, [event?.id]);

    // AI correction
    const handleCorrectGrammar = async () => {
        if (!currentText || currentText.length < 5) return;
        setIsCorrecting(true);
        try {
            const result = await correctText(currentText);
            if (result.success && result.correctedText) {
                setTexts(prev => ({ ...prev, [activeLangTab]: result.correctedText || '' }));
                toast({
                    title: t('freelancer.composer.grammar_success_title', 'Corrección Lista'),
                    description: t('freelancer.composer.grammar_success_desc', 'La gramática de tu texto ha sido perfeccionada.'),
                    className: "bg-purple-600 text-white"
                });
            }
        } catch (e) {
            toast({ title: "Error", description: "No se pudo conectar con el editor IA.", variant: "destructive" });
        } finally {
            setIsCorrecting(false);
        }
    };

    // AI translation
    const handleTranslate = async () => {
        if (!currentText) return;
        if (activeLangTab === targetLanguage) return;

        setIsTranslating(true);
        try {
            const result = await translateUserText(currentText, targetLanguage);
            if (result.success && (result as any).translation) {
                setTexts(prev => ({ ...prev, [targetLanguage]: (result as any).translation }));
                setActiveLangTab(targetLanguage);
                toast({
                    title: t('freelancer.composer.translation_success_title', 'Traducido con Éxito'),
                    description: `Traducido correctamente al ${targetLanguage.toUpperCase()}`,
                });
            }
        } catch (error) {
            toast({ title: "Error", description: "Fallo al traducir.", variant: "destructive" });
        } finally {
            setIsTranslating(false);
        }
    };

    // Copy Prepared content
    const handleCopyContent = async () => {
        const trackingLink = generatedLink || `https://dicilo.net/r/${campaign?.id?.substring(0, 8)}`;
        const message = `${currentText}\n\n${trackingLink} #${campaign?.companyName.replace(/[^a-zA-Z0-9]/g, '')}`;
        await navigator.clipboard.writeText(message);
        toast({
            title: "Contenido Copiado",
            description: "El mensaje y tu enlace acortado se copiaron al portapapeles.",
            className: "bg-green-600 text-white"
        });
    };

    // Save prepared plan to calendar
    const handleSavePlan = async () => {
        if (!user || !event) return;
        setIsSaving(true);
        try {
            const dateObj = new Date(event.date);
            const selectedImageUrl = campaign?.assets?.length
                ? campaign.assets[selectedImageIndex].imageUrl
                : (campaign?.images?.[selectedImageIndex] || campaign?.companyLogo || '');

            const result = await updateScheduledPostAction(user.uid, event.id, {
                platform: selectedPlatform,
                text: currentText,
                assetId: selectedAssetId || '',
                selectedImageUrl: selectedImageUrl,
                targetUrl: selectedTargetUrl || campaign?.targetUrl || '',
                date: dateObj
            });

            if (result.success) {
                toast({
                    title: "Plan Guardado",
                    description: "Se han guardado los detalles de tu publicación.",
                    className: "bg-green-600 text-white"
                });
                onSuccess();
                onClose();
            } else {
                toast({ title: "Error", description: result.error || "No se pudo guardar el plan.", variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // Delete plan from calendar
    const handleDeletePlan = async () => {
        if (!user || !event) return;
        setIsDeleting(true);
        try {
            const result = await deleteScheduledPostAction(user.uid, event.id);
            if (result.success) {
                toast({
                    title: "Plan Eliminado",
                    description: "Se ha removido el evento del calendario.",
                });
                onSuccess();
                onClose();
            } else {
                toast({ title: "Error", description: result.error || "No se pudo eliminar el plan.", variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    // Publish campaign post & earn reward
    const handlePublishAndEarn = async () => {
        if (!user || !event || !campaign) return;
        setIsPublishing(true);
        try {
            const selectedImageUrl = campaign.assets?.length
                ? campaign.assets[selectedImageIndex].imageUrl
                : (campaign.images?.[selectedImageIndex] || campaign.companyLogo || '');

            // 1. Process Campaign Post (marks as active link, deducts budget, pays freelancer)
            const result = await processCampaignPost(
                user.uid,
                campaign.id,
                activeLangTab,
                currentText.length,
                selectedImageUrl,
                selectedAssetId || '',
                draftLinkId || '',
                selectedTargetUrl || campaign.targetUrl || '',
                rewardPerAction
            );

            if (result.success) {
                // Open Share popup based on platform
                const trackingLink = generatedLink || result.linkId;
                const message = `${currentText}\n\n${trackingLink} #${campaign.companyName.replace(/[^a-zA-Z0-9]/g, '')}`;

                if (selectedPlatform === 'whatsapp') {
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                } else if (selectedPlatform === 'telegram') {
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(trackingLink)}&text=${encodeURIComponent(currentText)}`, '_blank');
                } else if (selectedPlatform === 'twitter') {
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
                } else if (selectedPlatform === 'facebook') {
                    await navigator.clipboard.writeText(message);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackingLink)}`, '_blank');
                } else if (selectedPlatform === 'email') {
                    window.open(`mailto:?subject=${encodeURIComponent(campaign.companyName)}&body=${encodeURIComponent(message)}`, '_self');
                }

                // 2. Delete the scheduled post event, since it's now completed (and processCampaignPost generated a completed action)
                await deleteScheduledPostAction(user.uid, event.id);

                toast({
                    title: "¡Campaña Publicada con Éxito!",
                    description: `Has recibido €${rewardPerAction.toFixed(2)} por completar tu campaña.`,
                    className: "bg-green-600 text-white"
                });

                onSuccess();
                onClose();
            } else {
                toast({ title: "Error", description: result.error || "No se pudo procesar la publicación.", variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsPublishing(false);
        }
    };

    const activeImageUrl = campaign?.assets?.length
        ? campaign.assets[selectedImageIndex].imageUrl
        : (campaign?.images?.[selectedImageIndex] || campaign?.companyLogo || 'https://placehold.co/600x400/png');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 border-0 rounded-3xl shadow-2xl">
                
                {/* Header */}
                <DialogHeader className="p-6 pb-4 border-b bg-white dark:bg-card flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <span>Prepara tu Campaña: {event?.companyName}</span>
                            {isCompleted ? (
                                <Badge className="bg-green-500 text-white">Completada</Badge>
                            ) : (
                                <Badge className="bg-blue-500 text-white">Planificada</Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Personaliza tu publicación, acorta tus links y compártela para ganar dinero.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {/* Content body */}
                {isLoadingCampaign ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Cargando recursos de la campaña...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* LEFT COLUMN: EDITOR */}
                        <div className="lg:col-span-7 space-y-6">
                            
                            {/* Platform selector */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Selecciona el Canal de Publicación</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {PLATFORMS.map((platform) => {
                                        const Icon = platform.icon;
                                        const isSelected = selectedPlatform === platform.id;
                                        return (
                                            <button
                                                key={platform.id}
                                                onClick={() => !isCompleted && setSelectedPlatform(platform.id)}
                                                disabled={isCompleted}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all group relative",
                                                    isSelected 
                                                        ? `${platform.color} ring-2 ring-purple-600 scale-[0.98] font-bold shadow-md` 
                                                        : "bg-white dark:bg-slate-900 hover:border-slate-300 hover:scale-[1.02] text-slate-500",
                                                    isCompleted && "opacity-75 cursor-not-allowed"
                                                )}
                                            >
                                                <Icon className="h-5 w-5 mb-1.5 transition-transform group-hover:scale-110" />
                                                <span className="text-[10px] truncate max-w-full">{platform.name}</span>
                                                {isSelected && (
                                                    <span className="absolute top-1.5 right-1.5 h-3 w-3 bg-purple-600 text-white rounded-full flex items-center justify-center p-0.5 shadow-sm animate-in zoom-in">
                                                        <Check className="h-2.5 w-2.5" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Graphic Selector */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Selecciona la Imagen / Plantilla</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {campaign?.assets && campaign.assets.length > 0 ? (
                                        campaign.assets.map((asset, i) => (
                                            <div
                                                key={asset.id}
                                                onClick={() => !isCompleted && handleAssetSelection(i)}
                                                className={cn(
                                                    "relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group",
                                                    i === selectedImageIndex ? "ring-2 ring-purple-600 scale-[0.96] shadow-md" : "opacity-80 hover:opacity-100 hover:scale-[1.02]",
                                                    isCompleted && "cursor-not-allowed"
                                                )}
                                            >
                                                <Image src={asset.imageUrl} alt="" fill className="object-cover" />
                                                {i === selectedImageIndex && (
                                                    <div className="absolute top-1.5 right-1.5 bg-purple-600 text-white rounded-full p-0.5 shadow-md">
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        campaign?.images?.map((img, i) => (
                                            <div
                                                key={i}
                                                onClick={() => !isCompleted && handleAssetSelection(i)}
                                                className={cn(
                                                    "relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group",
                                                    i === selectedImageIndex ? "ring-2 ring-purple-600 scale-[0.96] shadow-md" : "opacity-80 hover:opacity-100 hover:scale-[1.02]",
                                                    isCompleted && "cursor-not-allowed"
                                                )}
                                            >
                                                <Image src={img} alt="" fill className="object-cover" />
                                                {i === selectedImageIndex && (
                                                    <div className="absolute top-1.5 right-1.5 bg-purple-600 text-white rounded-full p-0.5 shadow-md">
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Copywriting Editor */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Mensaje de Acompañamiento</h3>
                                    {!isCompleted && (
                                        <div className="flex gap-2">
                                            {/* AI corrector */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCorrectGrammar}
                                                disabled={isCorrecting || !currentText}
                                                className="h-7 text-[10px] px-2 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 hover:bg-purple-100 border border-purple-100"
                                            >
                                                {isCorrecting ? (
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                ) : (
                                                    <Sparkles className="h-3 w-3 mr-1 text-purple-500" />
                                                )}
                                                Corregir IA
                                            </Button>

                                            {/* Translator */}
                                            <div className="flex items-center gap-1">
                                                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                                                    <SelectTrigger className="h-7 text-[10px] w-14 rounded-lg bg-slate-100 border-none">
                                                        <SelectValue placeholder="ES" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="es">ES</SelectItem>
                                                        <SelectItem value="en">EN</SelectItem>
                                                        <SelectItem value="de">DE</SelectItem>
                                                        <SelectItem value="fr">FR</SelectItem>
                                                        <SelectItem value="pt">PT</SelectItem>
                                                        <SelectItem value="it">IT</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleTranslate}
                                                    disabled={isTranslating || !currentText || activeLangTab === targetLanguage}
                                                    className="h-7 text-[10px] px-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border"
                                                >
                                                    {isTranslating ? (
                                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                    ) : (
                                                        <Languages className="h-3 w-3 mr-1" />
                                                    )}
                                                    Traducir
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Language Selector Tabs */}
                                <Tabs value={activeLangTab} onValueChange={setActiveLangTab} className="w-full">
                                    <TabsList className="grid grid-cols-6 h-8 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 gap-1">
                                        {['es', 'en', 'de', 'fr', 'pt', 'it'].map((lang) => (
                                            <TabsTrigger 
                                                key={lang} 
                                                value={lang} 
                                                className="text-[10px] uppercase font-bold rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all h-6"
                                            >
                                                {lang}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>

                                <div className="relative">
                                    <Textarea
                                        value={currentText}
                                        onChange={(e) => !isCompleted && setTexts(prev => ({ ...prev, [activeLangTab]: e.target.value }))}
                                        disabled={isCompleted}
                                        placeholder="Escribe tu recomendación de la marca aquí..."
                                        rows={4}
                                        className="resize-none rounded-2xl bg-white dark:bg-slate-900 shadow-inner text-sm p-4 border border-slate-200 focus-visible:ring-purple-500"
                                    />
                                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                            {currentText.length} chars
                                        </span>
                                    </div>
                                </div>

                                {/* Target landing url select */}
                                {campaign?.target_urls && Object.keys(campaign.target_urls).length > 0 && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Landing Page Destino</label>
                                        <Select 
                                            value={selectedTargetUrl} 
                                            onValueChange={(val) => !isCompleted && setSelectedTargetUrl(val)}
                                            disabled={isCompleted}
                                        >
                                            <SelectTrigger className="h-9 rounded-xl bg-white text-xs border-slate-200">
                                                <SelectValue placeholder="Seleccionar URL destino" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(campaign.target_urls[activeLangTab] || campaign.target_urls['es'] || []).map((url, uidx) => (
                                                    <SelectItem key={uidx} value={url} className="text-xs">
                                                        {url}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: LIVE MOCKUP PREVIEW */}
                        <div className="lg:col-span-5 flex flex-col justify-between items-center bg-white dark:bg-slate-900/40 p-6 rounded-3xl border shadow-sm">
                            
                            {/* Device Frame */}
                            <div className="w-full max-w-[270px] aspect-[9/16] bg-slate-900 rounded-[36px] p-2.5 shadow-xl border-4 border-slate-800 ring-4 ring-slate-950 flex flex-col overflow-hidden relative shrink-0 scale-95 lg:scale-100">
                                
                                {/* Notch */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-between px-4 text-[9px] text-white">
                                    <span>9:41</span>
                                    <div className="h-1 w-1 bg-white rounded-full"></div>
                                </div>

                                {/* Screen Content */}
                                <div className="flex-1 bg-slate-100 dark:bg-black rounded-[26px] overflow-hidden flex flex-col pt-5">
                                    
                                    {/* Mockup Header depending on platform */}
                                    <div className={cn(
                                        "py-2 px-3 text-[10px] text-white font-bold flex items-center justify-between z-10 shrink-0",
                                        selectedPlatform === 'whatsapp' ? "bg-[#075E54]" :
                                        selectedPlatform === 'instagram' ? "bg-gradient-to-r from-purple-600 to-pink-500" :
                                        selectedPlatform === 'facebook' ? "bg-[#1877F2]" :
                                        selectedPlatform === 'telegram' ? "bg-[#0088cc]" :
                                        selectedPlatform === 'twitter' ? "bg-black border-b border-slate-800" :
                                        "bg-purple-600"
                                    )}>
                                        <div className="flex items-center gap-1.5">
                                            {selectedPlatform === 'whatsapp' && <MessageCircle className="h-3 w-3" />}
                                            {selectedPlatform === 'instagram' && <Instagram className="h-3 w-3" />}
                                            {selectedPlatform === 'facebook' && <Facebook className="h-3 w-3" />}
                                            {selectedPlatform === 'telegram' && <Send className="h-3 w-3" />}
                                            {selectedPlatform === 'twitter' && <Twitter className="h-3 w-3" />}
                                            <span className="capitalize">{selectedPlatform} Preview</span>
                                        </div>
                                        <span className="opacity-70 text-[8px]">Live</span>
                                    </div>

                                    {/* Social Content Post Wrapper */}
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2 text-[10px] no-scrollbar">
                                        
                                        {/* Post Box */}
                                        <div className="bg-white dark:bg-slate-950 rounded-xl p-2.5 shadow-sm border border-slate-200/60 dark:border-slate-800 space-y-2">
                                            
                                            {/* Top user header */}
                                            <div className="flex items-center gap-2">
                                                <div className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[8px] relative overflow-hidden shrink-0">
                                                    {campaign?.companyLogo ? (
                                                        <Image src={campaign.companyLogo} alt="" fill className="object-cover" />
                                                    ) : (
                                                        'D'
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold truncate text-[9px] dark:text-white leading-tight">
                                                        {campaign?.companyName || 'Campaign'}
                                                    </p>
                                                    <p className="text-[7px] text-muted-foreground leading-none">Sponsored</p>
                                                </div>
                                            </div>

                                            {/* Graphic representation */}
                                            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-50 border shrink-0">
                                                <Image src={activeImageUrl} alt="" fill className="object-cover" />
                                            </div>

                                            {/* Message text */}
                                            <p className="text-slate-700 dark:text-slate-300 leading-normal line-clamp-4 font-normal whitespace-pre-line text-[9px]">
                                                {currentText || 'Planifica tu copia para verlo aquí...'}
                                            </p>

                                            {/* Link Preview box */}
                                            <div className="border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 flex items-center justify-between gap-2 shadow-inner">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-[8px] truncate dark:text-white leading-tight">
                                                        {campaign?.companyName}
                                                    </p>
                                                    <p className="text-[7px] text-purple-600 truncate font-mono mt-0.5 leading-none">
                                                        {generatedLink || 'dicilo.net/r/short-link'}
                                                    </p>
                                                </div>
                                                <ExternalLink className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                            </div>
                                        </div>

                                    </div>
                                    
                                    {/* Virtual Keyboard mockup */}
                                    <div className="bg-slate-300/80 dark:bg-slate-900 p-2 text-center text-[7px] text-slate-500 font-bold border-t shrink-0 select-none">
                                        Virtual Keyboard
                                    </div>
                                </div>
                            </div>

                            {/* Affiliate Link display & details */}
                            <div className="w-full space-y-3 mt-4">
                                <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-2xl p-4 text-center">
                                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest block mb-1">
                                        Recompensa por Creación
                                    </span>
                                    <div className="text-2xl font-black text-purple-700 dark:text-purple-300">
                                        +{rewardPerAction.toFixed(2)}€
                                    </div>
                                    <span className="text-[9px] text-purple-600/80 dark:text-purple-400/80 font-medium mt-0.5 block">
                                        Se ingresa a tu balance al publicar
                                    </span>
                                </div>

                                <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl border flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0 font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate">
                                        {generatedLink || 'dicilo.net/r/...'}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCopyContent}
                                        disabled={!generatedLink}
                                        className="h-8 w-8 rounded-xl bg-white dark:bg-slate-800 shrink-0 shadow-sm border border-slate-200"
                                    >
                                        <Copy className="h-3.5 w-3.5 text-slate-600" />
                                    </Button>
                                </div>
                            </div>

                        </div>

                    </div>
                )}

                {/* Footer buttons */}
                <DialogFooter className="p-6 bg-white dark:bg-card border-t flex flex-row items-center justify-between gap-4">
                    <div className="flex gap-2">
                        {/* Destructive Delete Button */}
                        {!isCompleted && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeletePlan}
                                disabled={isDeleting || isSaving || isPublishing || isLoadingCampaign}
                                className="h-10 px-4 rounded-xl font-bold flex items-center gap-1.5"
                            >
                                {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">Eliminar Plan</span>
                            </Button>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        {/* Close button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="h-10 px-4 rounded-xl border font-bold"
                        >
                            Cerrar
                        </Button>

                        {/* Save Draft button */}
                        {!isCompleted && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSavePlan}
                                disabled={isSaving || isDeleting || isPublishing || isLoadingCampaign || !currentText}
                                className="h-10 px-4 rounded-xl border border-slate-300 font-bold bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 text-slate-500" />
                                )}
                                Guardar Plan
                            </Button>
                        )}

                        {/* Publish & Earn button */}
                        {!isCompleted && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handlePublishAndEarn}
                                disabled={isPublishing || isSaving || isDeleting || isLoadingCampaign || !currentText}
                                className="h-10 px-6 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none"
                            >
                                {isPublishing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                                Publicar y Ganar {rewardPerAction.toFixed(2)}€
                            </Button>
                        )}
                    </div>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
