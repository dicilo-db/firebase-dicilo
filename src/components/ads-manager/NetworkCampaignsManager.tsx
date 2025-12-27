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
import { Loader2, ArrowLeft, Plus, Upload, Image as ImageIcon } from 'lucide-react';
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
    const { user } = useAuth();
    const { toast } = useToast();
    const [view, setView] = useState<'list' | 'create'>('list'); // Start with list (placeholder) or create immediate

    // Form State
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);

    const [formData, setFormData] = useState({
        clientId: '',
        budgetTotal: 1000,
        costPerAction: 0.60,
        rewardPerAction: 0.20,
        dailyLimit: 10,
        allowedLanguages: ['es'] as string[],
        imageUrl: '',
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
            if (res.success && res.clients) setClients(res.clients);
            else toast({ title: 'Error', description: 'Failed to load clients', variant: 'destructive' });
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
                // Prevent removing the last one? No, valid to clear but valid form needs 1
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

        setUploading(true);
        const data = new FormData();
        data.append('file', file);
        data.append('path', `campaigns/${Date.now()}_${file.name}`);

        try {
            const res = await uploadImage(data);
            if (res.success && res.url) {
                setFormData(prev => ({ ...prev, imageUrl: res.url as string }));
                toast({ title: 'Success', description: 'Image uploaded' });
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (formData.allowedLanguages.length === 0) {
            toast({ title: 'Validation', description: 'Select at least one language.', variant: 'destructive' });
            return;
        }
        if (!formData.imageUrl) {
            toast({ title: 'Validation', description: 'Main image is required.', variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            const token = await user.getIdToken();
            // Filter content to only include allowed languages
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
                toast({ title: 'Success', description: 'Campaign created successfully.', className: 'bg-green-600 text-white' });
                setView('list'); // Go back to list
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
                        <h2 className="text-2xl font-bold tracking-tight">Network Campaigns</h2>
                        <p className="text-muted-foreground">Manage your social product campaigns.</p>
                    </div>
                    <div className="flex gap-2">
                        {onBack && <Button variant="outline" onClick={onBack}>Back to Dashboard</Button>}
                        <Button onClick={() => setView('create')}>
                            <Plus className="mr-2 h-4 w-4" /> Create Campaign
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <p>Select "Create Campaign" to start a new Social Product Campaign.</p>
                        <p className="text-sm mt-2 opacity-70">(Campaign list view implementation pending)</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4">
            <Button variant="ghost" onClick={() => setView('list')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Button>

            <form onSubmit={handleSubmit}>
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Create Network Campaign</CardTitle>
                        <CardDescription>Configure a new campaign for the freelancer network.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">

                        {/* 1. Global Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Client / Company</Label>
                                <Select
                                    value={formData.clientId}
                                    onValueChange={(val) => setFormData(p => ({ ...p, clientId: val }))}
                                    disabled={loadingClients}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingClients ? "Loading..." : "Select Client"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Daily Limit (per user)</Label>
                                <Input type="number" value={formData.dailyLimit} onChange={e => setFormData(p => ({ ...p, dailyLimit: parseInt(e.target.value) }))} min={1} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>Total Budget (€)</Label>
                                <Input type="number" value={formData.budgetTotal} onChange={e => setFormData(p => ({ ...p, budgetTotal: parseFloat(e.target.value) }))} step="0.01" />
                            </div>
                            <div className="space-y-2">
                                <Label>Cost to Client (€/action)</Label>
                                <Input type="number" value={formData.costPerAction} onChange={e => setFormData(p => ({ ...p, costPerAction: parseFloat(e.target.value) }))} step="0.01" />
                            </div>
                            <div className="space-y-2">
                                <Label>Freelancer Reward (€/action)</Label>
                                <Input type="number" value={formData.rewardPerAction} onChange={e => setFormData(p => ({ ...p, rewardPerAction: parseFloat(e.target.value) }))} step="0.01" />
                            </div>
                        </div>

                        {/* 2. Languages */}
                        <div className="space-y-3">
                            <Label>Available Languages</Label>
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

                        {/* 3. Visuals */}
                        <div className="space-y-2">
                            <Label>Main Campaign Image</Label>
                            <div className="flex items-center gap-4">
                                <div className="relative h-32 w-32 border rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                                    {formData.imageUrl ? (
                                        <Image src={formData.imageUrl} alt="Campaign" fill className="object-cover" />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 opacity-20" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <Input type="file" onChange={handleImageUpload} disabled={uploading} className="max-w-xs mb-2" accept="image/*" />
                                    <p className="text-xs text-muted-foreground">Upload the main graphic that freelancers will share.</p>
                                    {uploading && <div className="text-xs text-blue-600 flex items-center mt-1"><Loader2 className="h-3 w-3 animate-spin mr-1" /> Uploading...</div>}
                                </div>
                            </div>
                        </div>

                        {/* 4. Content (Tabs) */}
                        <div className="space-y-2">
                            <Label>Campaign Content</Label>
                            <Tabs defaultValue={formData.allowedLanguages[0] || 'es'} className="w-full">
                                <TabsList>
                                    {formData.allowedLanguages.map(lang => (
                                        <TabsTrigger key={lang} value={lang}>{lang.toUpperCase()}</TabsTrigger>
                                    ))}
                                </TabsList>
                                {formData.allowedLanguages.map(lang => (
                                    <TabsContent key={lang} value={lang} className="space-y-4 border p-4 rounded-lg mt-2">
                                        <div className="space-y-2">
                                            <Label>Title ({lang.toUpperCase()})</Label>
                                            <Input
                                                value={content[lang].title}
                                                onChange={e => handleContentChange(lang, 'title', e.target.value)}
                                                placeholder="e.g. Summer Sale 2025"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description ({lang.toUpperCase()})</Label>
                                            <Textarea
                                                value={content[lang].description}
                                                onChange={e => handleContentChange(lang, 'description', e.target.value)}
                                                placeholder="Internal description for freelancers..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Suggested Post Text (Copy) ({lang.toUpperCase()})</Label>
                                            <Textarea
                                                value={content[lang].suggestedText}
                                                onChange={e => handleContentChange(lang, 'suggestedText', e.target.value)}
                                                placeholder="The text that freelancers will copy-paste..."
                                                className="h-24 bg-blue-50/50"
                                            />
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50 rounded-b-xl">
                        <Button type="button" variant="outline" onClick={() => setView('list')}>Cancel</Button>
                        <Button type="submit" disabled={submitting || uploading}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Campaign
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
