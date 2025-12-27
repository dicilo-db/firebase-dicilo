'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Plus, Upload, Image as ImageIcon, X } from 'lucide-react';
import { createCampaign, getClientsForSelect, ClientOption } from '@/app/actions/campaigns';
import { uploadImage } from '@/app/actions/upload';
import { translateText } from '@/app/actions/translate';
import { correctText } from '@/app/actions/grammar';
import Image from 'next/image';
import { Sparkles, Languages, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AVAILABLE_LANGUAGES = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' }
];

const LANG_MAP: Record<string, string> = {
    'es': 'Spanish',
    'en': 'English',
    'de': 'German'
};

interface ContentBlock {
    title: string;
    description: string;
    suggestedText: string;
}

export function NetworkCampaignsManager({ onBack }: { onBack?: () => void }) {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const { toast } = useToast();
    const [view, setView] = useState<'list' | 'create'>('list');

    // Form State - v2.0 Refactor
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);

    const [formData, setFormData] = useState({
        clientId: '',
        budgetTotal: 1000,
        rewardPerAction: 0.20,
        dailyLimit: 10,
        startDate: '',
        endDate: '',
        allowedLanguages: ['es'] as string[],
        images: [] as string[],
    });

    const [content, setContent] = useState<Record<string, ContentBlock>>({
        es: { title: '', description: '', suggestedText: '' },
        en: { title: '', description: '', suggestedText: '' },
        de: { title: '', description: '', suggestedText: '' }
    });

    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // AI State
    const [aiLoading, setAiLoading] = useState<string | null>(null); // 'lang-field' identifier

    // Initial Load
    useEffect(() => {
        if (view === 'create' && user) {
            loadClients();
        }
    }, [view, user]);

    const loadClients = async () => {
        if (!user) return;
        setLoadingClients(true);
        try {
            const token = await user.getIdToken();
            const res = await getClientsForSelect(token);
            if (res.success && res.clients) {
                setClients(res.clients);
            } else {
                console.error("Load Clients Error:", res.error);
                toast({
                    title: 'Error',
                    description: res.error || t('networkCampaigns.form.loadError'),
                    variant: 'destructive'
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingClients(false);
        }
    };

    const handleLanguageToggle = (langCode: string) => {
        setFormData(prev => {
            const current = prev.allowedLanguages;
            if (current.includes(langCode)) {
                return { ...prev, allowedLanguages: current.filter(c => c !== langCode) };
            } else {
                return { ...prev, allowedLanguages: [...current, langCode] };
            }
        });
    };

    const handleContentChange = (lang: string, field: keyof ContentBlock, value: string) => {
        setContent(prev => ({
            ...prev,
            [lang]: { ...prev[lang], [field]: value }
        }));
    };

    // AI Actions
    const handleAITranslate = async (targetLang: string, field: keyof ContentBlock, sourceLang: string) => {
        const sourceText = content[sourceLang]?.[field];
        if (!sourceText) {
            toast({ title: "Source Empty", description: "No text to translate in source language.", variant: "destructive" });
            return;
        }

        const loaderKey = `${targetLang}-${field}`;
        setAiLoading(loaderKey);

        try {
            const res = await translateText(sourceText, LANG_MAP[targetLang] || targetLang);
            if (res.success && res.translation) {
                handleContentChange(targetLang, field, res.translation);
                toast({ title: t('networkCampaigns.form.ai.apply'), description: t('networkCampaigns.form.ai.translated', { lang: sourceLang.toUpperCase() }) });
            } else {
                toast({ title: "Error", description: res.error || "Translation failed", variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Translation failed", variant: "destructive" });
        } finally {
            setAiLoading(null);
        }
    };

    const handleAICorrect = async (lang: string, field: keyof ContentBlock) => {
        const currentText = content[lang]?.[field];
        if (!currentText) return;

        const loaderKey = `${lang}-${field}`;
        setAiLoading(loaderKey);

        try {
            const res = await correctText(currentText, LANG_MAP[lang] || lang);
            if (res.success && res.correctedText) {
                handleContentChange(lang, field, res.correctedText);
                toast({ title: t('networkCampaigns.form.ai.apply'), description: t('networkCampaigns.form.ai.autoFixed') });
            } else {
                toast({ title: "Error", description: "Correction failed", variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Correction failed", variant: "destructive" });
        } finally {
            setAiLoading(null);
        }
    };


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (formData.images.length >= 24) {
            toast({ title: 'Limit Reached', description: t('networkCampaigns.form.maxImages'), variant: 'destructive' });
            return;
        }

        setUploading(true);
        const data = new FormData();
        data.append('file', file);
        data.append('path', `campaigns/${Date.now()}_${file.name}`);

        try {
            const res = await uploadImage(data);
            if (res.success && res.url) {
                setFormData(prev => ({ ...prev, images: [...prev.images, res.url as string] }));
                toast({ title: 'Success', description: 'Image uploaded' });
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: t('networkCampaigns.form.uploading'), variant: 'destructive' });
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (formData.allowedLanguages.length === 0) {
            toast({ title: 'Validation', description: t('networkCampaigns.form.validation.lang'), variant: 'destructive' });
            return;
        }
        if (formData.images.length === 0) {
            toast({ title: 'Validation', description: t('networkCampaigns.form.validation.image'), variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            const token = await user.getIdToken();
            const relevantContent: any = {};
            formData.allowedLanguages.forEach(lang => {
                relevantContent[lang] = content[lang];
            });

            const payload = {
                ...formData,
                content: relevantContent
            };

            const res = await createCampaign(token, payload);
            if (res.success) {
                toast({ title: 'Success', description: t('networkCampaigns.form.success'), className: 'bg-green-600 text-white' });
                setView('list');
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }

        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to render AI-enhanced text area
    const renderContentField = (lang: string, field: keyof ContentBlock, label: string, placeholder: string, isTextarea = false) => {
        const textValue = content[lang]?.[field] || '';
        const isLoading = aiLoading === `${lang}-${field}`;
        const hasText = textValue.length > 0;

        // Target languages (Active ones)
        // If I am in 'es', I can translate to 'es', 'en', 'de'
        const targetLangs = formData.allowedLanguages;

        return (
            <div className="space-y-2 relative group">
                <div className="flex justify-between items-end">
                    <Label>{label} ({lang.toUpperCase()})</Label>

                    {/* AI Toolbar */}
                    <div className="flex gap-2">
                        {/* Translate TO ... */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50/50" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3 mr-1" />}
                                    {t('networkCampaigns.form.ai.translateTo')} <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {targetLangs.map(targetLang => (
                                    <DropdownMenuItem key={targetLang} onClick={() => handleAITranslate(targetLang, field, lang)}>
                                        {targetLang.toUpperCase()} {targetLang === lang ? '(Current)' : ''}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Grammar Correction (visible if text exists) */}
                        {hasText && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-purple-600 hover:text-purple-800 bg-purple-50/50"
                                onClick={() => handleAICorrect(lang, field)}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                {t('networkCampaigns.form.ai.improve')}
                            </Button>
                        )}
                    </div>
                </div>

                {isTextarea ? (
                    <Textarea
                        value={textValue}
                        onChange={e => handleContentChange(lang, field, e.target.value)}
                        placeholder={placeholder}
                        className={field === 'suggestedText' ? "h-24 bg-blue-50/50" : ""}
                        disabled={isLoading}
                    />
                ) : (
                    <Input
                        value={textValue}
                        onChange={e => handleContentChange(lang, field, e.target.value)}
                        placeholder={placeholder}
                        disabled={isLoading}
                    />
                )}
            </div>
        );
    };

    if (view === 'list') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{t('networkCampaigns.list.title')}</h2>
                        <p className="text-muted-foreground">{t('networkCampaigns.list.subtitle')}</p>
                    </div>
                    <div className="flex gap-2">
                        {onBack && <Button variant="outline" onClick={onBack}>{t('networkCampaigns.back')}</Button>}
                        <Button onClick={() => setView('create')}>
                            <Plus className="mr-2 h-4 w-4" /> {t('networkCampaigns.list.create')}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <p>{t('networkCampaigns.list.empty')}</p>
                        <p className="text-sm mt-2 opacity-70">{t('networkCampaigns.list.pending')}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4">
            <Button variant="ghost" onClick={() => setView('list')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t('networkCampaigns.back')}
            </Button>

            <form onSubmit={handleSubmit}>
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>{t('networkCampaigns.form.cardTitle')}</CardTitle>
                        <CardDescription>{t('networkCampaigns.form.cardDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">

                        {/* 1. Global Settings */}
                        {/* 1. Global Settings & Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.clientLabel')}</Label>
                                <Select
                                    value={formData.clientId}
                                    onValueChange={(val) => setFormData(p => ({ ...p, clientId: val }))}
                                    disabled={loadingClients}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingClients ? t('networkCampaigns.form.loading') : t('networkCampaigns.form.selectClient')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.startDate')}</Label>
                                <Input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.endDate')}</Label>
                                <Input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        {/* Financials & Limits */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.totalBudget')}</Label>
                                <Input type="number" value={formData.budgetTotal} onChange={e => setFormData(p => ({ ...p, budgetTotal: parseFloat(e.target.value) }))} step="0.01" min="0" />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.freelancerReward')}</Label>
                                <Input type="number" value={formData.rewardPerAction} onChange={e => setFormData(p => ({ ...p, rewardPerAction: parseFloat(e.target.value) }))} step="0.01" min="0" />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('networkCampaigns.form.dailyLimit')}</Label>
                                <Input type="number" value={formData.dailyLimit} onChange={e => setFormData(p => ({ ...p, dailyLimit: parseInt(e.target.value) }))} min={1} />
                            </div>
                        </div>

                        {/* 2. Languages */}
                        <div className="space-y-3">
                            <Label>{t('networkCampaigns.form.languages')}</Label>
                            <div className="flex gap-4 p-4 border rounded-lg bg-slate-50">
                                {AVAILABLE_LANGUAGES.map(lang => (
                                    <div key={lang.code} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`lang-${lang.code}`}
                                            checked={formData.allowedLanguages.includes(lang.code)}
                                            onCheckedChange={() => handleLanguageToggle(lang.code)}
                                        />
                                        <label htmlFor={`lang-${lang.code}`} className="text-sm font-medium leading-none cursor-pointer select-none">{lang.label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Visuals (Multiple Images) */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>{t('networkCampaigns.form.imagesLabel')}</Label>
                                <span className="text-xs text-muted-foreground">{formData.images.length} / 24</span>
                            </div>

                            <div className="border rounded-lg p-4 bg-slate-50">
                                {formData.images.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <ImageIcon className="h-10 w-10 mx-auto opacity-20 mb-2" />
                                        <p>{t('networkCampaigns.form.noImages')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        {formData.images.map((url, idx) => (
                                            <div key={idx} className="relative aspect-video bg-white rounded-md border overflow-hidden group">
                                                <Image src={url} alt={`Campaign ${idx}`} fill className="object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                {idx === 0 && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-1 text-center">
                                                        Main
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-4">
                                    <Label htmlFor="image-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors">
                                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        {t('networkCampaigns.form.addImage')}
                                    </Label>
                                    <Input
                                        id="image-upload"
                                        type="file"
                                        onChange={handleImageUpload}
                                        disabled={uploading || formData.images.length >= 24}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">{t('networkCampaigns.form.uploadHelp')}</p>
                                </div>
                            </div>
                        </div>

                        {/* 4. Content (Tabs) */}
                        <div className="space-y-2">
                            <Label>{t('networkCampaigns.form.content')}</Label>
                            <Tabs
                                key={formData.allowedLanguages.join(',')}
                                defaultValue={formData.allowedLanguages[0] || 'es'}
                                className="w-full"
                            >
                                <TabsList>
                                    {formData.allowedLanguages.map(lang => (
                                        <TabsTrigger key={lang} value={lang}>{lang.toUpperCase()}</TabsTrigger>
                                    ))}
                                </TabsList>
                                {formData.allowedLanguages.map(lang => (
                                    <TabsContent key={lang} value={lang} className="space-y-4 border p-4 rounded-lg mt-2">
                                        {renderContentField(lang, 'title', t('networkCampaigns.form.tabTitle'), t('networkCampaigns.form.placeholderTitle'))}
                                        {renderContentField(lang, 'description', t('networkCampaigns.form.tabDesc'), t('networkCampaigns.form.placeholderDesc'), true)}
                                        {renderContentField(lang, 'suggestedText', t('networkCampaigns.form.tabSuggest'), t('networkCampaigns.form.placeholderSuggest'), true)}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50 rounded-b-xl">
                        <Button type="button" variant="outline" onClick={() => setView('list')}>{t('networkCampaigns.form.cancel')}</Button>
                        <Button type="submit" disabled={submitting || uploading}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('networkCampaigns.form.submit')}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
