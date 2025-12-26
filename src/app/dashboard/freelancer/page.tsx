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
    Clock,
    CheckCircle2,
    Plus,
    Check,
    Loader2,
    MessageCircle,
    Share2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { getCampaignById, createPromotion } from '@/app/actions/freelancer';
import { Campaign } from '@/types/freelancer';
import { Skeleton } from '@/components/ui/skeleton';


export default function FreelancerPromoComposerPage() {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const campaignId = searchParams.get('campaignId');

    const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const [customText, setCustomText] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [visibleImagesCount, setVisibleImagesCount] = useState(4);
    const [generatedLink, setGeneratedLink] = useState('');
    const [isCopying, setIsCopying] = useState(false);

    // Pricing Tiers Configuration
    const PRICING_TIERS = [
        { chars: 600, rate: 0.16 },
        { chars: 1200, rate: 0.30 },
        { chars: 2000, rate: 0.50 }
    ];

    const currentTier = PRICING_TIERS.reduce((prev, curr) => {
        return customText.length >= curr.chars ? curr : prev;
    }, { chars: 0, rate: activeCampaign?.rate_per_click || 0.10 }); // Default base rate

    useEffect(() => {
        async function loadCampaign() {
            if (!campaignId) return;
            setIsLoading(true);
            const campaign = await getCampaignById(campaignId);
            if (campaign) {
                // DEMO: Simulate more images to demonstrate the 'Load More' feature
                if (campaign.images && campaign.images.length > 0) {
                    // Repeat images to fill at least 12 items for demo purposes if there are few
                    const rawImages = campaign.images;
                    let expandedImages = [...rawImages];
                    while (expandedImages.length < 12) {
                        expandedImages = [...expandedImages, ...rawImages];
                    }
                    campaign.images = expandedImages.slice(0, 24);
                }

                setActiveCampaign(campaign);
                // Reset form state when campaign changes
                setCustomText(campaign.description || ''); // Default to description or empty
                setSelectedImageIndex(0);
                setVisibleImagesCount(4);
                setGeneratedLink(''); // Reset link
            }
            setIsLoading(false);
        }
        loadCampaign();
    }, [campaignId]);

    const handleCopyLink = async () => {
        if (!activeCampaign) return;
        setIsCopying(true);

        try {
            let linkToCopy = generatedLink;

            if (!linkToCopy) {
                const selectedImg = activeCampaign.images && activeCampaign.images.length > 0
                    ? activeCampaign.images[selectedImageIndex]
                    : '/placeholder-product-1.jpg';

                const result = await createPromotion({
                    campaignId: activeCampaign.id!,
                    freelancerId: 'current_user_id',
                    customText: customText,
                    selectedImage: selectedImg,
                    platform: 'clipboard', // internal flag
                    status: 'published',
                    trackingLink: '',
                } as any);

                if (result.success && result.promotion) {
                    linkToCopy = result.promotion.trackingLink;
                    setGeneratedLink(linkToCopy);
                } else {
                    throw new Error(result.error || "Failed to generate link");
                }
            }

            await navigator.clipboard.writeText(linkToCopy);
            toast({
                title: t('common:copied') || "Copiado",
                description: "Enlace de seguimiento copiado al portapapeles.",
            });

        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo copiar el enlace.",
                variant: "destructive"
            });
        } finally {
            setIsCopying(false);
        }
    };

    const handleWhatsAppShare = async () => {
        if (!activeCampaign) return;

        setIsSharing(true);
        try {
            // 1. Create Promotion Record in Firestore
            const selectedImg = activeCampaign.images && activeCampaign.images.length > 0
                ? activeCampaign.images[selectedImageIndex]
                : '/placeholder-product-1.jpg';

            const result = await createPromotion({
                campaignId: activeCampaign.id!,
                freelancerId: 'current_user_id', // TODO: Get real user ID from auth context
                customText: customText,
                selectedImage: selectedImg,
                platform: 'whatsapp',
                status: 'published',
                trackingLink: '', // It's generated on server
                // Save the calculated rate/tier as well if backend supports it
            } as any);

            if (result.success && result.promotion) {
                // 2. Construct WhatsApp Message
                const trackingLink = result.promotion.trackingLink;
                // Update UI state with this new link too
                setGeneratedLink(trackingLink);

                const message = `${customText}\n\n${trackingLink} #${activeCampaign.companyName.replace(/[^a-zA-Z0-9]/g, '')}`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

                // 3. Open WhatsApp
                window.open(whatsappUrl, '_blank');

                toast({
                    title: t('freelancer.composer.toasts.linkGenerated'),
                    description: t('freelancer.composer.toasts.openingWhatsapp'),
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error: any) {
            toast({
                title: t('freelancer.composer.toasts.shareError'),
                description: error.message || t('freelancer.composer.toasts.shareErrorDesc'),
                variant: 'destructive'
            });
        } finally {
            setIsSharing(false);
        }
    };

    // Initial loading or changing selected campaign
    if (isLoading) {
        return (
            <div className="flex flex-col xl:flex-row h-screen">
                <div className="flex-1 p-8 space-y-4">
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (!activeCampaign) {
        return (
            <div className="flex flex-col h-screen items-center justify-center text-center p-8 text-muted-foreground">
                <div className="max-w-md space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">{t('freelancer.composer.selectCampaign.title')}</h2>
                    <p>{t('freelancer.composer.selectCampaign.description')}</p>
                </div>
            </div>
        );
    }

    const selectedImageUrl = activeCampaign.images && activeCampaign.images.length > 0
        ? activeCampaign.images[selectedImageIndex]
        : '/placeholder-product-1.jpg'; // Fallback if no images found in real data

    return (
        <div className="flex flex-col xl:flex-row h-full overflow-hidden">
            {/* CENTRAL AREA: EDITOR */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 pb-32 bg-slate-50 dark:bg-black/20">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('freelancer.composer.title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('freelancer.composer.subtitle', { company: activeCampaign.companyName })}
                    </p>
                </div>

                {/* Campaign Selector / Active Campaign Header */}
                <div className="flex items-center gap-4 bg-card border p-4 rounded-xl shadow-sm">
                    {activeCampaign.companyLogo && activeCampaign.companyLogo !== '/placeholder-logo.png' ? (
                        <div className="h-12 w-12 rounded-full overflow-hidden border shrink-0 relative">
                            <Image src={activeCampaign.companyLogo} alt="Logo" fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl shrink-0">
                            {activeCampaign.companyName.substring(0, 2).toUpperCase()}
                        </div>
                    )}

                    <div>
                        <h2 className="font-semibold text-lg">{activeCampaign.companyName}</h2>
                        <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline" className={activeCampaign.status === 'active' ? "text-xs bg-green-50 text-green-700 border-green-200" : "text-xs"}>
                                {activeCampaign.status === 'active' ? t('freelancer.composer.activeCampaign') : t('freelancer.composer.grayMode')}
                            </Badge>
                            {activeCampaign.categories.map(c => (
                                <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                            ))}
                        </div>
                    </div>
                    <div className="ml-auto text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">{t('freelancer.composer.payPerClick')}</p>
                        <p className="font-bold text-green-600 text-lg">${currentTier.rate.toFixed(2)}</p>
                    </div>
                </div>

                {/* Image Gallery Selector */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">{t('freelancer.composer.selectImage')}</label>
                        {activeCampaign.images && activeCampaign.images.length > visibleImagesCount && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 rounded-full p-0"
                                onClick={() => setVisibleImagesCount(prev => Math.min(prev + 4, 24))}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {activeCampaign.images && activeCampaign.images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in duration-500">
                            {activeCampaign.images.slice(0, visibleImagesCount).map((img, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedImageIndex(i)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${i === selectedImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-300'}`}
                                >
                                    <Image
                                        src={img}
                                        alt={`Asset ${i}`}
                                        fill
                                        className="object-cover bg-muted"
                                    />
                                    {i === selectedImageIndex && <div className="absolute top-2 right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center text-white"><CheckCircle2 className="h-4 w-4" /></div>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">{t('freelancer.composer.noImages')}</p>
                    )}
                </div>

                {/* Text Editor */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">{t('freelancer.composer.customRecommendation')}</label>
                    </div>

                    {/* Pricing Tiers Visualization */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        {PRICING_TIERS.map((tier) => {
                            const isActive = customText.length >= tier.chars;
                            return (
                                <div
                                    key={tier.chars}
                                    className={`
                                        flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all duration-300
                                        ${isActive ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-70'}
                                    `}
                                >
                                    <span className={`text-xs font-semibold ${isActive ? 'text-green-700' : 'text-gray-500'}`}>$ C= {tier.chars}</span>
                                    <div className={`mt-1 h-3 w-3 rounded-full border ${isActive ? 'bg-green-500 border-green-600' : 'bg-white border-gray-300'}`}></div>
                                    <span className="text-[10px] text-muted-foreground mt-1 font-mono">${tier.rate.toFixed(2)}</span>
                                </div>
                            )
                        })}
                    </div>

                    <Card className="border-dashed border-2 shadow-none bg-muted/20">
                        <CardContent className="p-4">
                            <Textarea
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                                className="min-h-[120px] bg-transparent border-none resize-none focus-visible:ring-0 text-base"
                                placeholder={t('freelancer.composer.placeholder', { company: activeCampaign.companyName })}
                            />
                            <div className="flex justify-between items-center mt-2 border-t pt-2">
                                <div className="flex gap-2">
                                    <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-muted">{t('freelancer.composer.generateAI')}</Badge>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-muted-foreground font-mono">{customText.length} chars</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Link Generator */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">{t('freelancer.composer.trackingLink')}</label>
                    <div className="flex gap-2">
                        <Input
                            value={generatedLink || `dicilo.net/r/${activeCampaign.id.substring(0, 6)}...`}
                            readOnly
                            className={`font-mono text-sm ${generatedLink ? 'bg-green-50 border-green-200 text-green-800' : 'bg-muted'}`}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyLink}
                            disabled={isCopying}
                            className={generatedLink ? "border-green-200 hover:bg-green-50 hover:text-green-700" : ""}
                        >
                            {isCopying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : generatedLink ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Social Share & Schedule */}
                <div className="space-y-3 py-4 border-t">
                    <label className="text-sm font-medium block mb-3">{t('freelancer.composer.connectSchedule')}</label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            onClick={handleWhatsAppShare}
                            disabled={isSharing}
                            className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white gap-2 h-12 text-lg font-semibold"
                        >
                            {isSharing ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
                            {t('freelancer.composer.shareWhatsapp')}
                        </Button>
                        <div className="flex gap-2">
                            <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white gap-2">
                                <Instagram className="h-4 w-4" /> Instagram
                            </Button>
                            <Button className="flex-1 bg-[#0088cc] text-white gap-2">
                                <Send className="h-4 w-4" /> Telegram
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT AREA: MOBILE PREVIEW */}
            <div className="hidden xl:flex w-[400px] bg-slate-100 dark:bg-black/40 border-l p-8 flex-col items-center shrink-0 relative overflow-y-auto py-12">
                <div className="absolute top-6 left-1/2 -translate-x-1/2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest bg-background/50 px-3 py-1 rounded-full backdrop-blur-sm">{t('freelancer.composer.preview.title')}</h3>
                </div>

                {/* Phone Mockup */}
                <div className="relative w-[360px] h-[800px] bg-black rounded-[50px] shadow-2xl border-[8px] border-slate-900 mt-8 overflow-hidden shrink-0">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-slate-900 rounded-b-xl z-20"></div>

                    {/* Screen Content */}
                    <div className="w-full h-full bg-white dark:bg-black text-foreground pt-14 relative overflow-hidden flex flex-col">

                        {/* App Header Mock */}
                        <div className="px-4 py-2 flex justify-between items-center border-b border-white/10">
                            <span className="font-bold flex items-center gap-1"><span className="text-primary">Dicilo</span>.net</span>
                        </div>

                        {/* Post Header */}
                        <div className="p-3 flex items-center gap-2">
                            {activeCampaign.companyLogo && activeCampaign.companyLogo !== '/placeholder-logo.png' ? (
                                <div className="h-8 w-8 rounded-full overflow-hidden border shrink-0 relative">
                                    <Image src={activeCampaign.companyLogo} alt="Logo" fill className="object-cover" />
                                </div>
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0 text-black">
                                    {activeCampaign.companyName.substring(0, 1)}
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="text-xs font-semibold">{activeCampaign.companyName}</p>
                                <p className="text-[10px] text-muted-foreground">{t('freelancer.composer.preview.sponsored')}</p>
                            </div>
                            <div className="text-muted-foreground">•••</div>
                        </div>

                        {/* Post Image */}
                        <div className="aspect-square bg-muted relative">
                            <Image
                                src={selectedImageUrl}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Actions */}
                        <div className="px-3 py-2 flex gap-4">
                            <Share2 className="h-5 w-5" />
                            <MessageCircle className="h-5 w-5" />
                            <Send className="h-5 w-5 ml-auto" />
                        </div>

                        {/* Caption */}
                        <div className="px-3 pb-4">
                            <p className="text-xs leading-relaxed">
                                <span className="font-semibold mr-1">{t('freelancer.composer.preview.you')}</span>
                                {customText || activeCampaign.description}
                            </p>
                            <p className="text-[10px] text-blue-500 mt-1">dicilo.net/r/LZ378... #{activeCampaign.companyName.replace(/[^a-zA-Z0-9]/g, '')}</p>
                        </div>

                    </div>
                </div>

                {/* Estimated Earnings Card */}
                <div className="mt-8 bg-green-600 text-white p-4 rounded-xl shadow-lg w-full max-w-[300px] text-center animate-in slide-in-from-bottom-4 fade-in">
                    <p className="text-xs font-medium opacity-90 mb-1">{t('freelancer.composer.earnings.title')}</p>
                    <p className="text-sm opacity-90">{t('freelancer.composer.earnings.subtitle')}</p>
                    <p className="text-3xl font-bold mt-1">${currentTier.rate.toFixed(2)} <span className="text-sm font-normal opacity-75">{t('freelancer.composer.earnings.perClick')}</span></p>
                </div>
            </div>
        </div>
    );
}
