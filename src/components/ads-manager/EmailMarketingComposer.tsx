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
    CheckCircle2,
    Copy,
    Facebook,
    Globe,
    Instagram,
    Languages,
    Linkedin,
    Loader2,
    Mail,
    MessageCircle,
    MoreHorizontal,
    Plus,
    Search,
    Send,
    Share2,
    Smartphone,
    ThumbsUp,
    Twitter,
    Youtube,
    Calendar as CalendarIcon,
    ArrowLeft,
    Check
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
                images: allImages // Save current images state if needed
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

    const EditorContent = (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6 bg-white dark:bg-slate-950">
            {/* Header */}
            <div className="flex items-center gap-4">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">{template.name}</h1>
                    <Badge variant="secondary" className="text-[10px] uppercase">{template.category.replace('_', ' ')}</Badge>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        size={isMobile ? "icon" : "default"}
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {!isMobile && "Guardar Cambios"}
                    </Button>
                </div>
            </div>

            {/* Image Selector */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">1. Selecciona la imagen</label>
                    {allImages.length > visibleImagesCount && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setVisibleImagesCount(prev => prev + 6)}>
                            <Plus className="h-3 w-3 mr-1" /> Más
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {allImages.slice(0, visibleImagesCount).map((img, i) => (
                        <div 
                            key={i} 
                            onClick={() => setSelectedImageIndex(i)} 
                            className={cn(
                                "relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                                i === selectedImageIndex ? "border-purple-500 ring-2 ring-purple-500/20" : "border-transparent hover:border-slate-300"
                            )}
                        >
                            <Image src={img} alt="" fill className="object-cover bg-slate-100" />
                            {i === selectedImageIndex && (
                                <div className="absolute inset-0 bg-purple-500/10 flex items-center justify-center">
                                    <div className="bg-purple-500 text-white rounded-full p-1 shadow-sm">
                                        <Check className="h-3 w-3" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Translation & Editor */}
            <div className="space-y-4">
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Contenido & Traducción</label>
                    
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium ml-1">Traducir a:</span>
                            <select
                                value={targetLanguage}
                                onChange={(e) => setTargetLanguage(e.target.value)}
                                className="h-8 text-xs rounded-md border-slate-200 bg-white dark:bg-slate-800 focus:ring-purple-500 font-medium py-0 pl-2 pr-8 cursor-pointer"
                            >
                                <option value="es">Español</option>
                                <option value="en">English</option>
                                <option value="de">Deutsch</option>
                                <option value="fr">Français</option>
                                <option value="pt">Português</option>
                                <option value="it">Italiano</option>
                            </select>
                        </div>
                        <Button size="sm" onClick={handleTranslate} disabled={isTranslating} className="h-8 text-xs px-4 bg-purple-600 hover:bg-purple-700">
                            {isTranslating ? <Loader2 className="animate-spin h-3 w-3" /> : <Languages className="h-3 w-3 mr-2" />}
                            Traducir
                        </Button>
                    </div>
                </div>

                <Tabs value={activeLangTab} onValueChange={setActiveLangTab} className="w-full">
                    <TabsList className="mb-0 w-full justify-start h-10 bg-transparent p-0 border-b rounded-none gap-6 overflow-x-auto no-scrollbar">
                        {['es', 'en', 'de', 'fr', 'pt', 'it'].map(lang => (
                            <TabsTrigger
                                key={lang}
                                value={lang}
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-10 px-1 text-xs font-semibold text-muted-foreground data-[state=active]:text-purple-600 shrink-0 transition-all"
                            >
                                {lang === 'es' ? 'Español' : lang === 'en' ? 'English' : lang === 'de' ? 'Deutsch' : lang === 'fr' ? 'Français' : lang === 'pt' ? 'Português' : 'Italiano'}
                                {texts[lang]?.body && <div className="h-1.5 w-1.5 rounded-full bg-green-500 ml-2" />}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {['es', 'en', 'de', 'fr', 'pt', 'it'].map(lang => (
                        <TabsContent key={lang} value={lang} className="mt-4 space-y-4 animate-in fade-in duration-300">
                            <div className="space-y-2">
                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Asunto del Email</Label>
                                <Input 
                                    value={texts[lang]?.subject || ''}
                                    onChange={(e) => setTexts(prev => ({ ...prev, [lang]: { ...prev[lang], subject: e.target.value } }))}
                                    placeholder="Escribe el asunto..."
                                    className="bg-slate-50/50 focus-visible:ring-purple-500"
                                />
                            </div>
                            <div className="relative space-y-2">
                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Cuerpo del Mensaje</Label>
                                <Textarea
                                    value={texts[lang]?.body || ''}
                                    onChange={(e) => setTexts(prev => ({ ...prev, [lang]: { ...prev[lang], body: e.target.value } }))}
                                    className="min-h-[250px] resize-none focus-visible:ring-purple-500 bg-slate-50/50 text-sm leading-relaxed p-4"
                                    placeholder="Escribe el contenido de la promoción..."
                                />
                                <div className="absolute bottom-3 right-3 flex gap-2">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        onClick={handleCorrectGrammar}
                                        disabled={isCorrecting || !texts[lang]?.body}
                                        className="h-8 w-8 text-purple-600 hover:bg-purple-100 rounded-full shadow-sm"
                                        title="Corregir Gramática con IA"
                                    >
                                        {isCorrecting ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    </Button>
                                    <Button size="icon" variant="secondary" onClick={handleCopyText} className="h-8 w-8 text-slate-500 hover:bg-slate-100 rounded-full shadow-sm" title="WhatsApp Share">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* Actions Bar */}
            <div className="pt-6 border-t mt-auto">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-xl border p-1 h-12 flex-1 min-w-[200px] overflow-hidden relative">
                        <div className="px-4 py-1 text-xs font-mono text-muted-foreground select-all truncate flex-1 leading-10">
                            {generatedLink}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 absolute right-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                            onClick={() => handleShare('copy')}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("h-12 px-4 justify-start font-normal bg-white dark:bg-slate-900 rounded-xl border-slate-200", !scheduledDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                {scheduledDate ? format(scheduledDate, "PPP") : "Programar envío"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} disabled={(date) => date < new Date()} initialFocus />
                        </PopoverContent>
                    </Popover>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={!currentData.body} className="h-12 px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95">
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartir
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                            <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer rounded-lg gap-3 py-2.5">
                                <MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare('telegram')} className="cursor-pointer rounded-lg gap-3 py-2.5">
                                <Send className="h-5 w-5 text-sky-500" /> Telegram
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer rounded-lg gap-3 py-2.5">
                                <Facebook className="h-5 w-5 text-blue-600" /> Facebook
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer rounded-lg gap-3 py-2.5">
                                <Twitter className="h-5 w-5 text-slate-900 dark:text-white" /> X (Twitter)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare('email')} className="cursor-pointer rounded-lg gap-3 py-2.5">
                                <Mail className="h-5 w-5 text-slate-500" /> Email
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );

    const PreviewContent = (
        <div className="h-full relative overflow-hidden flex flex-col items-center justify-start p-6 md:p-12">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Preview Controls */}
            <div className="mb-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-800 rounded-full px-5 py-1.5 flex items-center gap-4 z-10 transition-all hover:scale-105">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vista Previa</span>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                <Select value={previewNetwork} onValueChange={setPreviewNetwork}>
                    <SelectTrigger className="w-[140px] h-7 text-xs border-0 bg-transparent focus:ring-0 shadow-none px-0 gap-2 font-bold">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="instagram">Instagram Story</SelectItem>
                        <SelectItem value="facebook">Facebook Post</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp Status</SelectItem>
                        <SelectItem value="email">Email Mobile</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Device Frame */}
            <div className="relative z-10 w-[300px] sm:w-[340px] h-[600px] !sm:h-[680px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-800/50 transition-all duration-500">
                {/* Speaker/Camera Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20"></div>
                
                <div className="w-full h-full bg-white dark:bg-black rounded-[2.2rem] overflow-hidden relative flex flex-col">
                    {/* Status Bar */}
                    <div className="h-8 flex items-center justify-between px-6 pt-2 text-[10px] font-bold">
                        <span>9:41</span>
                        <div className="flex gap-1.5 items-center">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>
                            <div className="w-4 h-2.5 bg-slate-200 rounded-sm"></div>
                        </div>
                    </div>

                    {/* Content depends on network */}
                    {previewNetwork === 'email' ? (
                        <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900">
                            <div className="p-4 border-b bg-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">D</div>
                                    <div>
                                        <div className="text-[10px] font-bold">Dicilo News</div>
                                        <div className="text-[8px] text-slate-400">para: usuario@email.com</div>
                                    </div>
                                </div>
                                <div className="text-[8px] text-slate-400">9:41 AM</div>
                            </div>
                            <div className="p-4 space-y-4">
                                <h2 className="text-sm font-bold leading-tight">{currentData.subject || "Título de la Campaña"}</h2>
                                <div className="aspect-video relative rounded-lg overflow-hidden bg-slate-200">
                                    <Image src={selectedImageUrl} alt="" fill className="object-cover" />
                                </div>
                                <div className="text-[11px] leading-relaxed whitespace-pre-wrap">
                                    {currentData.body || "El contenido de tu email aparecerá aquí..."}
                                </div>
                                <div className="pt-4">
                                    <div className="w-full py-3 bg-purple-600 text-white rounded-lg text-center text-[10px] font-bold cursor-pointer">
                                        Explorar Oferta
                                    </div>
                                </div>
                                <div className="text-center pt-8 pb-4">
                                    <div className="text-[8px] text-slate-400">© 2026 Dicilo.net | connect your world</div>
                                    <div className="text-[8px] text-purple-600 hover:underline mt-1">Darse de baja</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 relative flex flex-col bg-slate-100">
                            {/* Header Mock */}
                            <div className="p-3 bg-white flex items-center gap-2 border-b">
                                <div className="w-7 h-7 rounded-full bg-slate-200 ring-1 ring-slate-100"></div>
                                <div className="space-y-0.5">
                                    <div className="w-16 h-2 bg-slate-200 rounded"></div>
                                    <div className="w-10 h-1.5 bg-slate-100 rounded"></div>
                                </div>
                            </div>
                            
                            {/* Image Mock */}
                            <div className="flex-1 bg-slate-200 relative group">
                                <Image src={selectedImageUrl} alt="" fill className="object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                
                                {/* Overlay Text for Social */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-400"></div>
                                        <span className="text-[10px] font-bold">@tu_nombre</span>
                                        <Badge className="bg-purple-500 scale-75 origin-left">Patrocinado</Badge>
                                    </div>
                                    <p className="text-[10px] line-clamp-3 leading-snug drop-shadow-md">
                                        {currentData.body || "Contenido del post..."}
                                    </p>
                                    <div className="mt-2 text-purple-300 text-[10px] font-bold">Ver más...</div>
                                </div>
                            </div>

                            {/* Footer Mock */}
                            <div className="p-3 bg-white flex items-center justify-between border-t gap-2">
                                <div className="flex gap-3">
                                    <div className="w-4 h-4 bg-slate-100 rounded-full"></div>
                                    <div className="w-4 h-4 bg-slate-100 rounded-full"></div>
                                    <div className="w-4 h-4 bg-slate-100 rounded-full"></div>
                                </div>
                                <div className="w-4 h-4 bg-slate-100 rounded"></div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-600 rounded-full opacity-30"></div>
            </div>

            {/* Desktop Reward Info */}
            {!isMobile && (
                <div className="mt-8 z-10 flex items-center gap-3 bg-white/80 dark:bg-purple-900/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-purple-200 dark:border-purple-800 animate-bounce-slow">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                        <ThumbsUp className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">+10 Dicipoints</div>
                        <div className="text-[10px] text-slate-500 dark:text-purple-300">Gana por compartir hoy</div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col animate-in fade-in duration-300">
            {isMobile ? (
                <Tabs defaultValue="editor" className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-hidden">
                        <TabsContent value="editor" className="h-full m-0 p-0 overflow-hidden">
                            {EditorContent}
                        </TabsContent>
                        <TabsContent value="preview" className="h-full m-0 p-0 bg-slate-50 dark:bg-slate-900">
                            {PreviewContent}
                        </TabsContent>
                    </div>
                    <div className="h-14 border-t bg-white dark:bg-slate-950 flex">
                        <TabsList className="grid grid-cols-2 w-full h-full bg-transparent p-1 gap-1">
                            <TabsTrigger value="editor" className="rounded-lg text-xs font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">
                                <Smartphone className="h-4 w-4 mr-2" /> Editor
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="rounded-lg text-xs font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">
                                <Search className="h-4 w-4 mr-2" /> Vista Previa
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </Tabs>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-1/2 min-w-[500px] border-r flex flex-col relative z-20">
                        {EditorContent}
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 relative z-10">
                        {PreviewContent}
                        {onBack && (
                            <Button variant="ghost" size="icon" onClick={onBack} className="absolute top-4 right-4 z-30 bg-white/50 hover:bg-white dark:bg-slate-800/50">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
            
            {/* Standard Desktop Header with Close if needed */}
            {!isMobile && onBack && (
                <Button 
                    variant="ghost" 
                    onClick={onBack} 
                    className="fixed top-4 left-4 z-[60] bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-sm border rounded-full pl-2 pr-4 h-10 hover:bg-slate-50 transition-all font-bold group"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                    Volver al Manager
                </Button>
            )}
        </div>
    );
}

