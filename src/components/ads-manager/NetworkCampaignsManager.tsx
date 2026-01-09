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
import { Loader2, ArrowLeft, Plus, Upload, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import { createCampaign, getClientsForSelect, getCampaigns, updateCampaign, deleteCampaign, ClientOption } from '@/app/actions/campaigns';
import { CampaignAsset } from '@/types/freelancer';
import { CampaignAssetEditor } from './CampaignAssetEditor';
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

    // List & Edit State
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        clientId: '',
        budgetTotal: 1000,
        rewardPerAction: 0.20,
        dailyLimit: 10,
        startDate: '',
        endDate: '',
        allowedLanguages: ['es'] as string[],
        targetUrls: {} as Record<string, string[]>,
        images: [] as string[],
        assets: [] as CampaignAsset[],
    });

    const [content, setContent] = useState<Record<string, ContentBlock>>({
        es: { title: '', description: '', suggestedText: '' },
        en: { title: '', description: '', suggestedText: '' },
        de: { title: '', description: '', suggestedText: '' }
    });

    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Temp state for adding target URLs
    const [tempTargetLang, setTempTargetLang] = useState<string>('');
    const [tempTargetUrl, setTempTargetUrl] = useState<string>('');

    // AI State
    const [aiLoading, setAiLoading] = useState<string | null>(null); // 'lang-field' identifier

    // Initial Load
    useEffect(() => {
        if (view === 'create' && user) {
            loadClients();
        } else if (view === 'list' && user) {
            loadCampaigns();
            // Reset editing state when entering list view
            setEditingId(null);
            resetForm();
        }
    }, [view, user]);

    const resetForm = () => {
        setFormData({
            clientId: '',
            budgetTotal: 1000,
            rewardPerAction: 0.20,
            dailyLimit: 10,
            startDate: '',
            endDate: '',
            allowedLanguages: ['es', 'en', 'de'], // Default to all 3
            targetUrls: {} as Record<string, string[]>,
            images: [] as string[],
            assets: [] as CampaignAsset[],
        });
        setContent({
            es: { title: '', description: '', suggestedText: '' },
            en: { title: '', description: '', suggestedText: '' },
            de: { title: '', description: '', suggestedText: '' }
        });
        setEditingId(null);
    };

    const loadCampaigns = async () => {
        if (!user) return;
        setLoadingCampaigns(true);
        const token = await user.getIdToken();
        const res = await getCampaigns(token);
        if (res.success && res.campaigns) {
            setCampaigns(res.campaigns);
        } else {
            toast({ title: 'Error', description: 'Failed to load campaigns', variant: 'destructive' });
        }
        setLoadingCampaigns(false);
    };

    const handleEdit = (campaign: any) => {
        setEditingId(campaign.id);

        // Map backend snake_case to frontend camelCase
        let initialAssets: CampaignAsset[] = campaign.assets || [];

        // Migration Logic: If no assets but we have legacy images, create assets from them
        if (initialAssets.length === 0 && campaign.images && campaign.images.length > 0) {
            initialAssets = campaign.images.map((imgUrl: string) => ({
                id: crypto.randomUUID(),
                imageUrl: imgUrl,
                baseText: campaign.description || campaign.content_map?.es?.description || '', // Pre-fill with campaign desc
                sourceLanguage: campaign.languages?.[0] || 'es',
                translations: {
                    es: campaign.content_map?.es?.description || campaign.description || '',
                    en: campaign.content_map?.en?.description || '',
                    de: campaign.content_map?.de?.description || ''
                }
            }));
            // Ensure we use valid property names from CampaignAsset type
        }

        // Ensure we have at least the stored languages, but default to all 3 if missing or logic dictates
        const campaignLangs = campaign.languages && campaign.languages.length > 0 ? campaign.languages : ['es', 'en', 'de'];

        // Per user request: "We handle 3 languages", so let's encourage it by merging defaults if they want
        // But strictly speaking, we should respect what was saved. 
        // However, user says "English is missing", implies they want it added now.
        // Let's ensure 'en' is present if it's missing but 'es' is there, or just trust the campaign.
        // Actually, if I just modify the state here to include them, it will show up.
        // Let's force all 3 for now as per "manejamos tres idiomas" implication, or at least union.
        const mergedLangs = Array.from(new Set([...campaignLangs, 'es', 'en', 'de']));

        setFormData({
            clientId: campaign.clientId || campaign.client_id || '',
            budgetTotal: campaign.budget_total || 0,
            rewardPerAction: campaign.reward_per_action || 0,
            dailyLimit: campaign.daily_limit_per_user || 10,
            startDate: campaign.start_date || '',
            endDate: campaign.end_date || '',
            allowedLanguages: mergedLangs, // Force all 3 available for editing
            targetUrls: (function () {
                const raw = campaign.target_urls || {};
                const normalized: Record<string, string[]> = {};
                Object.keys(raw).forEach(key => {
                    const val = raw[key];
                    if (Array.isArray(val)) normalized[key] = val;
                    else if (typeof val === 'string') normalized[key] = [val];
                });
                return normalized;
            })(),
            images: campaign.images || [],
            assets: initialAssets
        });

        // Map content
        const newContent = { ...content };
        if (campaign.content_map) {
            Object.keys(campaign.content_map).forEach(lang => {
                // @ts-ignore
                newContent[lang] = campaign.content_map[lang];
            });
        }
        setContent(newContent);

        setView('create');
    };

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




    const handleDelete = async (campaignId: string) => {
        if (!confirm(t('networkCampaigns.form.deleteConfirm', 'Are you sure you want to delete this campaign?'))) return;
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const res = await deleteCampaign(token, campaignId);
            if (res.success) {
                toast({ title: 'Success', description: 'Campaign deleted' });
                loadCampaigns(); // Reload list
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
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

        if (formData.images.length >= 60) {
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

        // 4. Validate
        if (!formData.clientId) {
            toast({ title: 'Validation', description: t('networkCampaigns.form.validation.client'), variant: 'destructive' });
            return;
        }
        if (formData.allowedLanguages.length === 0) {
            toast({ title: 'Validation', description: t('networkCampaigns.form.validation.lang'), variant: 'destructive' });
            return;
        }
        if (formData.assets.length === 0 && formData.images.length === 0) {
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
                content: relevantContent,
                // Ensure images array is populated from assets for backward compat if needed (but we use assets primarily now)
                images: formData.assets.length > 0 ? formData.assets.map(a => a.imageUrl) : formData.images
            };

            let res;
            if (editingId) {
                res = await updateCampaign(token, editingId, payload);
            } else {
                res = await createCampaign(token, payload);
            }

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
                        className={field === 'suggestedText' ? "hidden" : ""} // Hide suggestedText as it is replaced by Assets
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

                <div className="grid gap-4">
                    {loadingCampaigns ? (
                        <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
                    ) : campaigns.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                <p>{t('networkCampaigns.list.empty')}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {campaigns.map(campaign => (
                                <Card key={campaign.id} className="flex flex-row items-center p-4 gap-4 hover:shadow-md transition-shadow">
                                    <div className="h-16 w-24 relative bg-slate-100 rounded-md overflow-hidden shrink-0">
                                        {campaign.images?.[0] ? (
                                            <Image src={campaign.images[0]} alt="" fill className="object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full"><ImageIcon className="h-6 w-6 text-slate-300" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold truncate">{campaign.content_map?.es?.title || campaign.title || 'Untitled Campaign'}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${new Date(campaign.end_date) < new Date() ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {new Date(campaign.end_date) < new Date() ? 'Ended' : 'Active'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                            <span>📅 {campaign.start_date} - {campaign.end_date}</span>
                                            <span>💰 {campaign.budget_total}€</span>
                                            <span>Reward: {campaign.reward_per_action}€</span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                                        Edit
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(campaign.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
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
                        <CardTitle>{editingId ? 'Kampagne bearbeiten' : t('networkCampaigns.form.cardTitle')}</CardTitle>
                        <CardDescription>{editingId ? 'Bearbeiten Sie die Details der Kampagne.' : t('networkCampaigns.form.cardDesc')}</CardDescription>
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

                        {/* 2.5 Target URLs (Ziel des Kampagne) - Dynamic List */}
                        <div className="space-y-4 p-5 border border-orange-200 rounded-lg bg-orange-50/30">
                            <div>
                                <Label className="text-lg font-semibold flex items-center gap-2 text-orange-900">
                                    🎯 {t('networkCampaigns.form.targetUrls', 'Ziel der Kampagnen')}
                                </Label>
                                <p className="text-sm text-balance text-muted-foreground mt-1 mb-4">
                                    {t('networkCampaigns.form.targetUrlsDesc', 'Definieren Sie spezifische Zielseiten für jede Sprache. Wenn keine URL definiert ist, wird standardmäßig die Webseite des Unternehmens verwendet.')}
                                </p>
                            </div>

                            {/* List of Added URLs */}
                            <div className="space-y-3 mb-4">
                                {Object.entries(formData.targetUrls).flatMap(([lang, urls]) =>
                                    (Array.isArray(urls) ? urls : []).map((url, idx) => {
                                        const langLabel = AVAILABLE_LANGUAGES.find(l => l.code === lang)?.label || lang.toUpperCase();
                                        return (
                                            <div key={`${lang}-${idx}`} className="flex items-center gap-3 bg-white p-2 rounded border shadow-sm animate-in fade-in slide-in-from-left-2">
                                                <div className="w-28 font-medium text-sm flex items-center gap-2 px-2">
                                                    <span className={`fi fi-${lang === 'en' ? 'gb' : lang} rounded-sm`} />
                                                    {langLabel}
                                                </div>
                                                <div className="flex-1 text-sm truncate text-blue-600 underline" title={url}>
                                                    {url}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => {
                                                        setFormData(prev => {
                                                            const newUrls = { ...prev.targetUrls };
                                                            newUrls[lang] = newUrls[lang].filter((_, i) => i !== idx);
                                                            if (newUrls[lang].length === 0) delete newUrls[lang];
                                                            return { ...prev, targetUrls: newUrls };
                                                        });
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                                {Object.keys(formData.targetUrls).length === 0 && (
                                    <div className="text-sm text-muted-foreground italic px-2">
                                        {t('networkCampaigns.form.noTargetUrls', 'Keine spezifischen Ziele definiert. Standard-Unternehmens-URL wird verwendet.')}
                                    </div>
                                )}
                            </div>

                            {/* Add New URL Input */}
                            <div className="flex flex-col md:flex-row gap-3 items-end bg-white/50 p-3 rounded-md border border-dashed border-orange-200">
                                <div className="space-y-2 min-w-[140px]">
                                    <Label className="text-xs text-muted-foreground">Sprache</Label>
                                    <Select
                                        value={tempTargetLang}
                                        onValueChange={setTempTargetLang}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Auswählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formData.allowedLanguages.map(langCode => {
                                                const l = AVAILABLE_LANGUAGES.find(al => al.code === langCode);
                                                const currentCount = formData.targetUrls[langCode]?.length || 0;
                                                return (
                                                    <SelectItem key={langCode} value={langCode} disabled={currentCount >= 10}>
                                                        <div className="flex items-center gap-2 justify-between w-full">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`fi fi-${langCode === 'en' ? 'gb' : langCode} rounded-sm`} />
                                                                {l?.label}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">({currentCount}/10)</span>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 flex-1 w-full">
                                    <Label className="text-xs text-muted-foreground">Ziel-URL (https://...)</Label>
                                    <Input
                                        placeholder="https://beispiel.de/landing-page"
                                        className="h-9"
                                        value={tempTargetUrl}
                                        onChange={e => setTempTargetUrl(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (tempTargetLang && tempTargetUrl) {
                                                    setFormData(prev => {
                                                        const currentUrls = prev.targetUrls[tempTargetLang] || [];
                                                        if (currentUrls.length >= 10) {
                                                            toast({ title: "Limit erreicht", description: "Max 10 URLs pro Sprache.", variant: "destructive" });
                                                            return prev;
                                                        }
                                                        return {
                                                            ...prev,
                                                            targetUrls: { ...prev.targetUrls, [tempTargetLang]: [...currentUrls, tempTargetUrl] }
                                                        };
                                                    });
                                                    setTempTargetUrl('');
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    className="h-9 w-9 shrink-0 bg-green-600 hover:bg-green-700 text-white"
                                    disabled={!tempTargetLang || !tempTargetUrl}
                                    onClick={() => {
                                        if (tempTargetLang && tempTargetUrl) {
                                            setFormData(prev => {
                                                const currentUrls = prev.targetUrls[tempTargetLang] || [];
                                                if (currentUrls.length >= 10) {
                                                    toast({ title: "Limit erreicht", description: "Max 10 URLs pro Sprache.", variant: "destructive" });
                                                    return prev;
                                                }
                                                return {
                                                    ...prev,
                                                    targetUrls: { ...prev.targetUrls, [tempTargetLang]: [...currentUrls, tempTargetUrl] }
                                                };
                                            });
                                            setTempTargetUrl('');
                                        }
                                    }}
                                >
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>
                            {formData.allowedLanguages.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                    Bitte wählen Sie zuerst oben Sprachen aus.
                                </p>
                            )}
                        </div>

                        {/* 3. Assets (V2) */}
                        <div className="space-y-4 pt-4 border-t">
                            {/* Sync Assets with Legacy Images for now if needed, but Editor manages assets independently */}
                            <CampaignAssetEditor
                                assets={formData.assets}
                                onAssetsChange={newAssets => setFormData(p => ({ ...p, assets: newAssets }))}
                                allowedLanguages={formData.allowedLanguages}
                            />
                        </div>

                        {/* Legacy Image Upload (Hidden/Removed in favor of Asset Editor) */}
                        {/* We keep the state for compatibility, but UI is replaced */}

                        {/* 4. Content (Campaign Details Only) */}
                        <div className="space-y-2 pt-4 border-t">
                            <Label className="text-lg font-semibold">{t('networkCampaigns.form.content')} (Listing Details)</Label>
                            <Tabs
                                key={formData.allowedLanguages.join(',')}
                                defaultValue={formData.allowedLanguages[0] || 'es'}
                                className="w-full"
                            >
                                <TabsList>
                                    {formData.allowedLanguages.map(lang => (
                                        <TabsTrigger key={lang} value={lang} className="flex items-center gap-2">
                                            <span className={`fi fi-${lang === 'en' ? 'gb' : lang} rounded-sm`} />
                                            {AVAILABLE_LANGUAGES.find(l => l.code === lang)?.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {formData.allowedLanguages.map(lang => (
                                    <TabsContent key={lang} value={lang} className="space-y-4 pt-4">
                                        {renderContentField(lang, 'title', t('networkCampaigns.form.title'), 'Campaign Title')}
                                        {renderContentField(lang, 'description', t('networkCampaigns.form.description'), 'Short description for the dashboard card', true)}
                                        {/* Suggested Text Field is now HIDDEN via renderContentField logic above */}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 sticky bottom-0 bg-white p-4 border-t shadow-inner z-10">
                        <Button type="button" variant="outline" onClick={() => setView('list')}>
                            {t('common:cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingId ? t('common:update', 'Update Campaign') : t('common:create', 'Create Campaign')}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
