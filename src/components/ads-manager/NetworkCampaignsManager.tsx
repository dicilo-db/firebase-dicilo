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
import Image from 'next/image';

const AVAILABLE_LANGUAGES = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' }
];

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
                                        <div className="space-y-2">
                                            <Label>{t('networkCampaigns.form.tabTitle')} ({lang.toUpperCase()})</Label>
                                            <Input
                                                value={content[lang].title}
                                                onChange={e => handleContentChange(lang, 'title', e.target.value)}
                                                placeholder={t('networkCampaigns.form.placeholderTitle')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('networkCampaigns.form.tabDesc')} ({lang.toUpperCase()})</Label>
                                            <Textarea
                                                value={content[lang].description}
                                                onChange={e => handleContentChange(lang, 'description', e.target.value)}
                                                placeholder={t('networkCampaigns.form.placeholderDesc')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('networkCampaigns.form.tabSuggest')} ({lang.toUpperCase()})</Label>
                                            <Textarea
                                                value={content[lang].suggestedText}
                                                onChange={e => handleContentChange(lang, 'suggestedText', e.target.value)}
                                                placeholder={t('networkCampaigns.form.placeholderSuggest')}
                                                className="h-24 bg-blue-50/50"
                                            />
                                        </div>
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
