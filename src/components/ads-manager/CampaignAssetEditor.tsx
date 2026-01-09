'use client';

import React, { useState } from 'react';
import { CampaignAsset } from '@/types/freelancer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Plus, X, Trash2, Edit2, Sparkles, Languages as LangIcon } from 'lucide-react';
import Image from 'next/image';
import { uploadImage } from '@/app/actions/upload';
import { translateText } from '@/app/actions/translate';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

interface CampaignAssetEditorProps {
    assets: CampaignAsset[];
    onAssetsChange: (assets: CampaignAsset[]) => void;
    allowedLanguages: string[];
    defaultText?: string;
}

const LANG_LABELS: Record<string, string> = {
    es: 'Español',
    en: 'English',
    de: 'Deutsch'
};

const LANG_MAP_AI: Record<string, string> = {
    'es': 'Spanish',
    'en': 'English',
    'de': 'German'
};

export function CampaignAssetEditor({ assets, onAssetsChange, allowedLanguages, defaultText = '' }: CampaignAssetEditorProps) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

    // Editor State
    const [currentImage, setCurrentImage] = useState<string>('');
    const [baseText, setBaseText] = useState('');
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [uploading, setUploading] = useState(false);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [activeLangTab, setActiveLangTab] = useState<string>(allowedLanguages[0] || 'es');
    const [aiTranslating, setAiTranslating] = useState(false);

    const resetEditor = () => {
        setCurrentImage('');
        setBaseText(defaultText);
        setTranslations({});
        setEditingAssetId(null);
        setActiveLangTab(allowedLanguages[0] || 'es');
    };

    const handleOpenCreate = () => {
        resetEditor();
        // Initialize translations with default text for allowed langs if available
        const initialTrans: Record<string, string> = {};
        allowedLanguages.forEach(lang => initialTrans[lang] = defaultText);
        setTranslations(initialTrans);
        setIsDialogOpen(true);
    };

    const handleEdit = (asset: CampaignAsset) => {
        setCurrentImage(asset.imageUrl);
        setBaseText(asset.baseText);
        setTranslations({ ...asset.translations });
        setEditingAssetId(asset.id);
        setActiveLangTab(asset.sourceLanguage || allowedLanguages[0]);
        setIsDialogOpen(true);
    };

    const handleDelete = (assetId: string) => {
        onAssetsChange(assets.filter(a => a.id !== assetId));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', file);
        data.append('path', `campaigns/assets/${Date.now()}_${file.name}`);

        try {
            const res = await uploadImage(data);
            if (res.success && res.url) {
                setCurrentImage(res.url as string);
            } else {
                toast({ title: 'Upload Failed', description: res.error, variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Upload error', variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = 60 - assets.length;
        if (files.length > remainingSlots) {
            toast({
                title: 'Limit Exceeded',
                description: `You can only add ${remainingSlots} more assets.`,
                variant: 'destructive'
            });
            return;
        }

        setBulkUploading(true);
        const newAssets: CampaignAsset[] = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const data = new FormData();
            data.append('file', file);
            data.append('path', `campaigns/assets/${Date.now()}_${i}_${file.name}`);

            try {
                const res = await uploadImage(data);
                if (res.success && res.url) {
                    // Create Asset with Default Text
                    const initialTrans: Record<string, string> = {};
                    allowedLanguages.forEach(lang => initialTrans[lang] = defaultText);

                    newAssets.push({
                        id: crypto.randomUUID(),
                        imageUrl: res.url as string,
                        baseText: defaultText,
                        sourceLanguage: allowedLanguages[0] || 'es',
                        translations: initialTrans
                    });
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (e) {
                failCount++;
            }
        }

        onAssetsChange([...assets, ...newAssets]);
        setBulkUploading(false);
        e.target.value = ''; // Reset input

        if (successCount > 0) {
            toast({ title: 'Bulk Upload', description: `Successfully uploaded ${successCount} photos.${failCount > 0 ? ` (${failCount} failed)` : ''}` });
        } else if (failCount > 0) {
            toast({ title: 'Bulk Upload Failed', description: 'Could not upload selected photos.', variant: 'destructive' });
        }
    };

    const handleSave = () => {
        if (!currentImage) {
            toast({ title: 'Validation', description: 'Image is required', variant: 'destructive' });
            return;
        }
        // Removing strict text validation for better UX - user can add text later
        // But warning is good? No, let's allow saving image only if they want.
        // Actually, let's just ensure baseText is at least synchronized.

        const newAsset: CampaignAsset = {
            id: editingAssetId || crypto.randomUUID(),
            imageUrl: currentImage,
            baseText: translations[activeLangTab] || baseText || '', // Use current edited text or base
            sourceLanguage: activeLangTab,
            translations: translations
        };

        if (editingAssetId) {
            onAssetsChange(assets.map(a => a.id === editingAssetId ? newAsset : a));
        } else {
            onAssetsChange([...assets, newAsset]);
        }
        setIsDialogOpen(false);
    };

    const handleAutoTranslate = async () => {
        const sourceText = translations[activeLangTab];
        if (!sourceText) return;

        setAiTranslating(true);
        const targets = allowedLanguages.filter(l => l !== activeLangTab);
        const newTranslations = { ...translations };
        let successCount = 0;

        for (const target of targets) {
            try {
                const res = await translateText(sourceText, LANG_MAP_AI[target] || target);
                if (res.success && res.translation) {
                    newTranslations[target] = res.translation;
                    successCount++;
                }
            } catch (e) {
                console.error(`Translation to ${target} failed`);
            }
        }

        setTranslations(newTranslations);
        setAiTranslating(false);
        if (successCount > 0) {
            toast({ title: 'AI Translation', description: `Translated to ${successCount} languages.` });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                <div>
                    <Label className="text-lg font-semibold">Campaign Assets</Label>
                    <p className="text-xs text-muted-foreground">Upload photos and add text for freelancers to use. (Max 60)</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-sm font-medium mr-2">{assets.length} / 60</div>

                    {/* Bulk Upload Button */}
                    <div className="relative">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            onChange={handleBulkUpload}
                            disabled={bulkUploading || assets.length >= 60}
                        />
                        <Button variant="outline" size="sm" disabled={bulkUploading || assets.length >= 60}>
                            {bulkUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Bulk Upload
                        </Button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {assets.map(asset => (
                    <div key={asset.id} className="group relative bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="aspect-square relative cursor-pointer" onClick={() => handleEdit(asset)}>
                            <Image src={asset.imageUrl} alt="" fill className="object-cover transition-transform group-hover:scale-105" />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                        <div className="p-2 bg-white">
                            <p className="text-[10px] text-muted-foreground line-clamp-2 min-h-[2.5em] mb-1">
                                {asset.translations[asset.sourceLanguage] || asset.translations[allowedLanguages[0]] || 'No text'}
                            </p>
                            <div className="flex justify-between gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(asset)}>
                                    <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={() => handleDelete(asset.id)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                {assets.length < 60 && (
                    <div
                        onClick={handleOpenCreate}
                        className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <Plus className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-500">Add Asset</span>
                    </div>
                )}
            </div>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingAssetId ? 'Edit Asset' : 'Create New Asset'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* Left: Image */}
                        <div className="space-y-4">
                            <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border flex items-center justify-center group">
                                {currentImage ? (
                                    <Image src={currentImage} alt="Preview" fill className="object-cover" />
                                ) : (
                                    <div className="text-center text-muted-foreground p-4">
                                        <p className="text-sm">No image selected</p>
                                    </div>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-center w-full">
                                <Label htmlFor="single-asset-upload" className="w-full cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-3 rounded-md text-sm font-medium transition-colors text-center flex items-center justify-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    {currentImage ? 'Change Image' : 'Select Image'}
                                </Label>
                                <Input
                                    id="single-asset-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </div>
                        </div>

                        {/* Right: Text & Translations */}
                        <div className="space-y-4 flex flex-col h-full">
                            <div className="flex items-center justify-between">
                                <Label className="font-semibold text-lg">Post Text</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAutoTranslate}
                                    disabled={aiTranslating || !translations[activeLangTab]}
                                    className="text-xs h-7 gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                >
                                    {aiTranslating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                    Auto-Translate
                                </Button>
                            </div>

                            <Tabs value={activeLangTab} onValueChange={setActiveLangTab} className="flex-1 flex flex-col">
                                <TabsList className="grid w-full grid-cols-3 mb-2">
                                    {allowedLanguages.map(lang => (
                                        <TabsTrigger key={lang} value={lang} className="text-xs">
                                            {LANG_LABELS[lang] || lang.toUpperCase()}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                <div className="flex-1 bg-slate-50 rounded-lg p-1 border">
                                    {allowedLanguages.map(lang => (
                                        <TabsContent key={lang} value={lang} className="mt-0 h-full min-h-[250px]">
                                            <Textarea
                                                placeholder={`Enter text for ${LANG_LABELS[lang]}...`}
                                                className="h-full resize-none border-0 bg-transparent focus-visible:ring-0 text-base"
                                                value={translations[lang] || ''}
                                                onChange={e => setTranslations(prev => ({ ...prev, [lang]: e.target.value }))}
                                            />
                                        </TabsContent>
                                    ))}
                                </div>
                            </Tabs>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={!currentImage}>
                            {editingAssetId ? 'Update Asset' : 'Add Asset'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
