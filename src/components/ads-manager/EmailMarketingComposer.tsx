'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

// UI Components
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Icons
import {
    Check,
    Sparkles,
    ArrowLeft,
    Plus,
    Loader2,
    Languages,
    Copy,
    Calendar as CalendarIcon,
    Send,
    Share2,
    MessageCircle,
    Facebook,
    Mail,
    Search,
    Smartphone,
    ThumbsUp,
    Globe,
    Instagram,
    Linkedin,
    Youtube,
    Twitter,
    MoreHorizontal
} from 'lucide-react';

// Context & Actions
import { useAuth } from '@/context/AuthContext';
import { translateText, EmailTemplate, saveTemplate } from '@/actions/email-templates';
import { correctText } from '@/app/actions/grammar';
import { awardMarketingSharePoints } from '@/app/actions/dicipoints';

interface EmailMarketingComposerProps {
    template: EmailTemplate;
    onBack?: () => void;
    uniqueCode?: string;
    referrerName?: string;
}

export function EmailMarketingComposer({ template, onBack, uniqueCode: propUniqueCode, referrerName: propReferrerName }: EmailMarketingComposerProps) {
    const { t } = useTranslation(['common', 'admin']);
    const { toast } = useToast();
    const { user } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isCorrecting, setIsCorrecting] = useState(false);

    // Multi-language Text State
    const [texts, setTexts] = useState<{ [key: string]: { subject: string, body: string } }>({
        es: { subject: '', body: '' },
        en: { subject: '', body: '' },
        de: { subject: '', body: '' },
        fr: { subject: '', body: '' },
        pt: { subject: '', body: '' },
        it: { subject: '', body: '' }
    });
    const [activeLangTab, setActiveLangTab] = useState('es');
    const [targetLanguage, setTargetLanguage] = useState('en');

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [visibleImagesCount, setVisibleImagesCount] = useState(6);

    const [previewNetwork, setPreviewNetwork] = useState('instagram');
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
    const [rewardAmount, setRewardAmount] = useState<number>(template.rewardAmount || 10);

    // Shortener / Link Logic
    const generatedLink = `https://dicilo.net?ref=${propUniqueCode || user?.uid || 'promo'}`;

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load template data
    useEffect(() => {
        if (template) {
            const initialTexts = { ...texts };
            Object.keys(template.versions).forEach(lang => {
                if (initialTexts[lang]) {
                    initialTexts[lang] = {
                        subject: template.versions[lang].subject || '',
                        body: template.versions[lang].body || ''
                    };
                }
            });
            setTexts(initialTexts);
            
            // Set first available lang as active if 'es' not present
            if (!template.versions['es']) {
                const firstLang = Object.keys(template.versions)[0];
                if (firstLang) setActiveLangTab(firstLang);
            }
        }
    }, [template]);

    // Get unique code from user doc would be better, but for now we use UID if not available
    // (Actual implementation in MarketingShareCard fetched private_profiles)
    // We'll keep it simple for the composer and let the parent provide or fetch it.

    const currentData = texts[activeLangTab] || { subject: '', body: '' };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedTemplate: EmailTemplate = {
                ...template,
                versions: {
                    ...template.versions,
                    ...Object.keys(texts).reduce((acc, lang) => {
                        if (texts[lang].subject || texts[lang].body) {
                            acc[lang] = {
                                subject: texts[lang].subject,
                                body: texts[lang].body
                            };
                        }
                        return acc;
                    }, {} as { [key: string]: { subject: string, body: string } })
                },
                images: allImages, // Save current images state if needed
                rewardAmount: rewardAmount
            };

            await saveTemplate(updatedTemplate);
            toast({
                title: "Cambios guardados",
                description: "La plantilla ha sido actualizada correctamente.",
                className: "bg-green-600 text-white"
            });
        } catch (error) {
            toast({
                title: "Error al guardar",
                description: "No se pudieron guardar los cambios en la plantilla.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTranslate = async () => {
        const sourceText = texts[activeLangTab].body;
        const sourceSubject = texts[activeLangTab].subject;
        if (!sourceText && !sourceSubject) return;

        if (activeLangTab === targetLanguage) {
            toast({ title: "Info", description: "Selecciona un idioma diferente al actual." });
            return;
        }

        setIsTranslating(true);
        try {
            // Translate both subject and body
            const [translatedSubject, translatedBody] = await Promise.all([
                sourceSubject ? translateText(sourceSubject, targetLanguage) : '',
                sourceText ? translateText(sourceText, targetLanguage) : ''
            ]);

            setTexts(prev => ({
                ...prev,
                [targetLanguage]: {
                    subject: translatedSubject,
                    body: translatedBody
                }
            }));
            
            setActiveLangTab(targetLanguage);
            toast({
                title: "Traducido",
                description: `Contenido traducido al ${targetLanguage.toUpperCase()}.`,
            });
        } catch (error) {
            toast({ title: "Error", description: "Fallo al traducir.", variant: "destructive" });
        } finally {
            setIsTranslating(false);
        }
    };

    const handleCorrectGrammar = async () => {
        const textToCorrect = texts[activeLangTab].body;
        if (!textToCorrect || textToCorrect.length < 5) return;
        
        setIsCorrecting(true);
        try {
            const result = await correctText(textToCorrect);
            if (result.success && result.correctedText) {
                setTexts(prev => ({
                    ...prev,
                    [activeLangTab]: {
                        ...prev[activeLangTab],
                        body: result.correctedText || ''
                    }
                }));
                
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

    const handleCopyText = async () => {
        if (!currentData.body) return;
        const fullMessage = `${currentData.subject}\n\n${currentData.body}\n\n👉 ${generatedLink}`;
        await navigator.clipboard.writeText(fullMessage);
        toast({ title: "Copiado", description: "Texto y enlace copiados al portapapeles." });
    };

    const allImages = template.images && template.images.length > 0 
        ? template.images 
        : (template.imageUrl ? [template.imageUrl] : ['https://placehold.co/600x400/png?text=No+Image']);
    
    const selectedImageUrl = allImages[selectedImageIndex] || allImages[0];

    const handleShare = async (platform: string) => {
        const inviteUrl = generatedLink;
        const subject = currentData.subject;
        const genericName = activeLangTab === 'es' ? 'Empresa' : activeLangTab === 'de' ? 'Unternehmen' : 'Company';
        
        let processedBody = currentData.body
            .replace(/\[Name\]|\[Nombre\]|\{\{Nombre\}\}|\{\{Name\}\}/g, genericName)
            .replace(/\[Tu Nombre\]|\{\{Tu Nombre\}\}|\{\{Your Name\}\}|\{\{Dein Name\}\}/g, user?.displayName || 'Tu Contacto');

        const fullShareText = `*${subject}*\n\n${processedBody}\n\n👉 ${inviteUrl}`;

        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`, '_blank');
                break;
            case 'telegram':
                window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(fullShareText)}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(subject)}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(processedBody + '\n\n' + inviteUrl)}`;
                break;
            case 'copy':
                await navigator.clipboard.writeText(inviteUrl);
                toast({ title: "Enlace copiado" });
                return;
        }

        // Award points
        if (user && platform !== 'copy') {
            try {
                await awardMarketingSharePoints(user.uid, template.id || '');
                toast({ title: "+10 DP", description: "Puntos otorgados por compartir." });
            } catch (e) {
                console.error("Points error", e);
            }
        }
    };


    return (
        <div className="w-full px-4 py-8 animate-in fade-in slide-in-from-right-4">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onBack} 
                            className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> 
                            {t('adsManager.back', 'Volver a la Lista')}
                        </Button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{template.name}</h2>
                        <p className="text-muted-foreground flex items-center gap-2">
                             <Badge variant="secondary" className="text-[10px] uppercase">{template.category.replace('_', ' ')}</Badge>
                             <span>ID: {template.id?.slice(0, 8)}</span>
                        </p>
                    </div>
                </div>
                
                {!isMobile && (
                    <div className="flex gap-3">
                         <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100">
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
                )}
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 items-start pb-24">
                {/* Main Form Area */}
                <div className="lg:col-span-7 space-y-6 w-full min-w-0">
                    {/* 1. Multimedia Card */}
                    <Card className="shadow-sm border-slate-200 overflow-hidden">
                        <div className="bg-slate-50/50 px-6 py-4 border-b flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">1. Multimedia</h3>
                                <p className="text-xs text-muted-foreground">Selecciona la imagen para tu mensaje</p>
                            </div>
                            <Badge variant="outline" className="bg-white">{allImages.length} Imágenes</Badge>
                        </div>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {allImages.map((img, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedImageIndex(i)} 
                                        className={cn(
                                            "relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 active:scale-95",
                                            i === selectedImageIndex ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md" : "border-slate-100 grayscale-[0.3] opacity-70 hover:opacity-100 hover:grayscale-0"
                                        )}
                                    >
                                        <Image src={img} alt="" fill className="object-cover" />
                                        {i === selectedImageIndex && (
                                            <div className="absolute top-1.5 right-1.5 bg-purple-500 text-white rounded-full p-1 shadow-md">
                                                <Check className="h-2.5 w-2.5" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-colors cursor-pointer group">
                                    <Plus className="h-6 w-6 text-slate-300 group-hover:text-purple-400" />
                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-purple-500 mt-1">AÑADIR</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Contenido & Traducción Card */}
                    <Card className="shadow-sm border-slate-200">
                        <div className="bg-slate-50/50 px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-purple-100 rounded-lg">
                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">2. Contenido & AI</h3>
                                    <p className="text-[10px] text-muted-foreground">Escribe y traduce con inteligencia artificial</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                                    <SelectTrigger className="w-[100px] h-7 text-[10px] bg-white border-slate-200">
                                        <SelectValue placeholder="Traducir a" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="es">Español</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="de">Deutsch</SelectItem>
                                        <SelectItem value="fr">Français</SelectItem>
                                        <SelectItem value="pt">Português</SelectItem>
                                        <SelectItem value="it">Italiano</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleTranslate} 
                                    disabled={isTranslating} 
                                    className="h-7 text-[10px] px-3 bg-white hover:bg-purple-50 hover:text-purple-600 transition-colors border-slate-200"
                                >
                                    {isTranslating ? <Loader2 className="animate-spin h-3 w-3" /> : <Languages className="h-3 w-3 mr-1.5" />}
                                    TRADUCIR
                                </Button>
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <Tabs value={activeLangTab} onValueChange={setActiveLangTab} className="w-full">
                                <div className="border-b px-2 bg-slate-50/30">
                                    <TabsList className="bg-transparent h-12 gap-0 overflow-x-auto no-scrollbar justify-start">
                                        {['es', 'en', 'de', 'fr', 'pt', 'it'].map(lang => (
                                            <TabsTrigger
                                                key={lang}
                                                value={lang}
                                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-12 px-6 text-xs font-bold text-slate-500 data-[state=active]:text-purple-600 transition-all uppercase tracking-tighter"
                                            >
                                                {lang === 'es' ? 'ES' : lang === 'en' ? 'EN' : lang === 'de' ? 'DE' : lang === 'fr' ? 'FR' : lang === 'pt' ? 'PT' : 'IT'}
                                                {texts[lang]?.body && <div className="h-1.5 w-1.5 rounded-full bg-green-500 ml-2" />}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>

                                <div className="p-6 space-y-6">
                                    {['es', 'en', 'de', 'fr', 'pt', 'it'].map(lang => (
                                        <TabsContent key={lang} value={lang} className="mt-0 space-y-6 animate-in fade-in duration-300">
                                            <div className="grid gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500 uppercase">Asunto del Email</Label>
                                                    <Input 
                                                        value={texts[lang]?.subject || ''}
                                                        onChange={(e) => setTexts(prev => ({ ...prev, [lang]: { ...prev[lang], subject: e.target.value } }))}
                                                        placeholder="Escribe un asunto atractivo..."
                                                        className="bg-white border-slate-200 focus-visible:ring-purple-500 h-11 text-base shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2 relative">
                                                    <Label className="text-xs font-bold text-slate-500 uppercase">Cuerpo de la promoción</Label>
                                                    <div className="relative group">
                                                        <Textarea
                                                            value={texts[lang]?.body || ''}
                                                            onChange={(e) => setTexts(prev => ({ ...prev, [lang]: { ...prev[lang], body: e.target.value } }))}
                                                            className="min-h-[300px] resize-none focus-visible:ring-purple-500 bg-white border-slate-200 text-sm leading-relaxed p-5 shadow-sm rounded-xl transition-shadow hover:shadow-md"
                                                            placeholder="Describe tu oferta de forma persuasiva..."
                                                        />
                                                        <div className="absolute top-4 right-4 flex flex-col gap-2 scale-90 md:group-hover:scale-100 transition-transform">
                                                            <Button
                                                                size="icon"
                                                                variant="secondary"
                                                                onClick={handleCorrectGrammar}
                                                                disabled={isCorrecting || !texts[lang]?.body}
                                                                className="h-10 w-10 text-purple-600 hover:bg-purple-100 rounded-full shadow-lg bg-white/90 backdrop-blur-sm border"
                                                                title="Mejorar con IA"
                                                            >
                                                                {isCorrecting ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4 animate-pulse-slow" />}
                                                            </Button>
                                                            <Button 
                                                                size="icon" 
                                                                variant="secondary" 
                                                                onClick={handleCopyText} 
                                                                className="h-10 w-10 text-slate-500 hover:bg-slate-100 rounded-full shadow-lg bg-white/90 backdrop-blur-sm border" 
                                                                title="Copiar Texto"
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    ))}
                                </div>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* 3. Programación & Enlace Card */}
                    <Card className="shadow-sm border-slate-200">
                        <div className="bg-slate-50/50 px-6 py-4 border-b">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">3. Configuración del Enlace</h3>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex flex-col xl:flex-row gap-4">
                                <div className="flex-1 space-y-2 min-w-0">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Tu enlace de afiliado</Label>
                                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-inner group transition-colors hover:border-purple-200 overflow-hidden">
                                        <div className="px-4 text-xs font-mono text-slate-600 select-all truncate flex-1 h-9 flex items-center">
                                            {generatedLink}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 hover:bg-purple-50 hover:text-purple-600 rounded-lg shrink-0"
                                            onClick={() => handleShare('copy')}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground px-1 italic">Este enlace trackeará todas las conversiones automáticamente.</p>
                                </div>
                                <div className="space-y-2 xl:w-[220px] shrink-0">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Programar envío (Opcional)</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                className={cn(
                                                    "w-full h-12 justify-start font-normal bg-white rounded-xl border-slate-200 transition-all hover:bg-slate-50 shadow-sm", 
                                                    !scheduledDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 opacity-50 text-purple-500" />
                                                {scheduledDate ? format(scheduledDate, "PPP") : "Ahora mismo"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-2xl border shadow-xl" align="end">
                                            <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} disabled={(date) => date < new Date()} initialFocus className="rounded-2xl" />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Preview Area */}
                <div className="lg:col-span-5 space-y-6 w-full min-w-0">
                    <div className="sticky top-8">
                         <div className="mb-4 flex items-center justify-between px-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Vista Previa Real</h3>
                            <div className="flex gap-1">
                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">EN VIVO</Badge>
                            </div>
                        </div>

                        {/* Integrated Preview Frame (Compact Version) */}
                        <div className="bg-slate-900 rounded-[3rem] p-2 shadow-2xl border-2 border-slate-800/30 max-w-[380px] mx-auto mb-8 relative">
                             {/* Speaker/Camera Notch */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-b-xl z-20"></div>
                            
                            <div className="w-full aspect-[9/18.5] bg-slate-50 rounded-[2.5rem] overflow-hidden relative flex flex-col shadow-inner border border-slate-200">
                                {/* Preview Scrollable Area */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {/* App-like status bar */}
                                    <div className="h-10 flex items-center justify-between px-6 pt-3 text-[10px] font-bold text-slate-900 bg-white">
                                        <span>9:41</span>
                                        <div className="flex gap-1.5 items-center">
                                            <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200"></div>
                                            <div className="w-3.5 h-2.5 bg-slate-200 rounded-sm"></div>
                                        </div>
                                    </div>

                                    {/* App Header Bar (New) */}
                                    <div className="bg-slate-100 border-b px-4 py-2 flex items-center justify-between shadow-sm z-10 sticky top-0">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-slate-500" />
                                            <span className="text-[10px] font-bold text-slate-700">App de Correo</span>
                                        </div>
                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                    </div>

                                    {/* Mail Subject/Sender Mockup */}
                                    <div className="p-4 border-b flex items-center justify-between bg-white">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-purple-100 flex-shrink-0">D</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <div className="text-[11px] font-bold text-slate-900 truncate">Dicilo Ofertas</div>
                                                    <div className="text-[9px] text-slate-400">10:42 AM</div>
                                                </div>
                                                <div className="text-[9px] text-slate-500 truncate">Para: mis_amigos@red.com</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-5 bg-white flex-1">
                                        <h2 className="text-base font-bold leading-tight text-slate-900 border-b pb-3">{currentData.subject || "Nueva Promoción Especial"}</h2>
                                        
                                        <div className="aspect-[4/3] relative rounded-lg overflow-hidden shadow-sm bg-slate-100">
                                            <Image src={selectedImageUrl} alt="" fill className="object-cover transition-all" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                        </div>

                                        <div className="text-[11px] leading-relaxed whitespace-pre-wrap text-slate-700">
                                            {currentData.body || "Tu mensaje promocional aparecerá aquí..."}
                                        </div>

                                        <div className="py-2">
                                            <div className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-center text-[10px] font-bold shadow-lg shadow-purple-200 cursor-pointer hover:opacity-90 active:scale-95 transition-all">
                                                VER DETALLES DE LA OFERTA
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100 my-4" />

                                        <div className="text-center pt-2 pb-6">
                                            <p className="text-[8px] text-slate-400 font-medium">© 2026 Dicilo Network • Connecting World</p>
                                            <p className="text-[7px] text-purple-400 mt-2">Gestionar suscripción • Ayuda</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extra stats in sidebar */}
                        <div className="mt-6 p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    <Send className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-800">Prepárate para compartir</div>
                                    <div className="text-[10px] text-purple-600">Alcanza a miles de usuarios</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-t z-[40] flex items-center">
                <div className="w-full px-6 flex items-center justify-between">
                    <div className="hidden md:block">
                        <p className="text-sm font-bold text-slate-700">{template.name}</p>
                        <p className="text-xs text-muted-foreground">Última edición hoy a las {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button variant="ghost" className="flex-1 md:flex-none h-11 px-6 rounded-xl hover:bg-slate-100" onClick={onBack}>
                            {t('common:cancel', 'Cancelar')}
                        </Button>
                        <div className="flex gap-2 flex-1 md:flex-none">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button disabled={!currentData.body} variant="outline" className="h-11 px-6 rounded-xl border-slate-200">
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Compartir
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border">
                                    <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer rounded-xl gap-3 py-3">
                                        <MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleShare('telegram')} className="cursor-pointer rounded-xl gap-3 py-3">
                                        <Send className="h-5 w-5 text-sky-500" /> Telegram
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer rounded-xl gap-3 py-3">
                                        <Facebook className="h-5 w-5 text-blue-600" /> Facebook
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleShare('email')} className="cursor-pointer rounded-xl gap-3 py-3">
                                        <Mail className="h-5 w-5 text-slate-500" /> Vía Email
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleShare('copy')} className="cursor-pointer rounded-xl gap-3 py-3 font-bold text-purple-600">
                                        <Copy className="h-5 w-5" /> Copiar Enlace
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="flex-1 md:flex-none h-11 px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
                .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }
                .hide-arrows::-webkit-outer-spin-button,
                .hide-arrows::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .hide-arrows[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
        </div>
    );
}

