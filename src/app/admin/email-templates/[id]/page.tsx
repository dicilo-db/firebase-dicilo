'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getTemplate, saveTemplate, translateText, EmailTemplate } from '@/actions/email-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Languages, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

export default function EditTemplatePage() {
    useAuthGuard(['admin', 'superadmin', 'team_office'], 'access_admin_panel');
    const { t } = useTranslation('admin');
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const isNew = id === 'new';
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const searchParams = useSearchParams();
    const defaultCategory = searchParams.get('category') || 'email_marketing';

    const [template, setTemplate] = useState<EmailTemplate>({
        name: '',
        category: (defaultCategory as any),
        versions: {
            'es': { subject: '', body: '' },
            'en': { subject: '', body: '' },
            'de': { subject: '', body: '' },
        },
        variables: []
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadingImage(true);
            try {
                const storageRef = ref(storage, `email-templates/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                handleChange('imageUrl', url);
                toast({ title: t("emailTemplates.editor.imageUploaded"), description: t("emailTemplates.editor.imageSuccess") });
            } catch (error) {
                console.error("Upload error:", error);
                toast({ title: t("emailTemplates.editor.error"), description: t("emailTemplates.editor.imageError"), variant: "destructive" });
            } finally {
                setUploadingImage(false);
            }
        }
    };

    useEffect(() => {
        if (!isNew && typeof id === 'string') {
            const fetchTpl = async () => {
                try {
                    const data = await getTemplate(id);
                    if (data) setTemplate(data);
                    else {
                        toast({ title: t("emailTemplates.editor.error"), description: t("emailTemplates.editor.notFound"), variant: "destructive" });
                        router.push('/admin/email-templates');
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            };
            fetchTpl();
        }
    }, [id, isNew, router, toast, t]);

    const handleChange = (field: string, value: any) => {
        setTemplate(prev => ({ ...prev, [field]: value }));
    };

    const handleVersionChange = (lang: string, field: 'subject' | 'body', value: string) => {
        setTemplate(prev => ({
            ...prev,
            versions: {
                ...prev.versions,
                [lang]: {
                    ...prev.versions[lang],
                    [field]: value
                }
            }
        }));
    };

    const handleSave = async () => {
        if (!template.name) {
            toast({ title: t("emailTemplates.editor.error"), description: t("emailTemplates.editor.nameRequired"), variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            await saveTemplate(isNew ? template : { ...template, id: id as string });
            toast({ title: t("emailTemplates.editor.success"), description: t("emailTemplates.editor.saved") });
            if (isNew) router.push('/admin/email-templates');
        } catch (e) {
            toast({ title: t("emailTemplates.editor.error"), description: t("emailTemplates.editor.saveError"), variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const autoTranslate = async (sourceLang: string = 'es') => {
        const source = template.versions[sourceLang];
        if (!source.subject && !source.body) return;

        const targetLangs = ['en', 'de'].filter(l => l !== sourceLang);

        setSaving(true); // blocking UI with saving state for simplicity
        try {
            const newVersions = { ...template.versions };

            for (const target of targetLangs) {
                if (source.subject) {
                    newVersions[target].subject = await translateText(source.subject, target);
                }
                if (source.body) {
                    newVersions[target].body = await translateText(source.body, target);
                }
            }
            setTemplate(prev => ({ ...prev, versions: newVersions }));
            toast({ title: t("emailTemplates.editor.translationComplete"), description: t("emailTemplates.editor.translationCheck") });
        } catch (e) {
            toast({ title: t("emailTemplates.editor.error"), description: t("emailTemplates.editor.translationError"), variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">{t('emailTemplates.loading')}</div>;

    // Get localized category name
    const categoryName = t(`emailTemplates.categories.${template.category}.title`);

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
                <Link href={`/admin/email-templates${template.category ? `?category=${template.category}` : ''}`}>
                    <Button variant="ghost" size="icon"><ArrowLeft /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{isNew ? t('emailTemplates.newTemplate') : t('emailTemplates.edit')}</h1>
                    <p className="text-muted-foreground">{template.name || t('emailTemplates.editor.noName')}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" onClick={() => autoTranslate('es')} disabled={saving}>
                        <Languages className="mr-2 h-4 w-4" />
                        {t('emailTemplates.editor.autoTranslate')}
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('emailTemplates.editor.save')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="space-y-2">
                        <Label>{t('emailTemplates.editor.internalName')}</Label>
                        <Input value={template.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Ej. Promo Verano 2025" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('emailTemplates.editor.category')}</Label>
                        {/* Locked Category UI */}
                        <div className="p-3 bg-muted/50 border rounded-md text-sm font-medium flex items-center justify-between">
                            <span>{categoryName}</span>
                            <Badge variant="outline" className="text-xs">Locked</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('emailTemplates.editor.categoryLocked')}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('emailTemplates.editor.headerImage')}</Label>
                        <div className="flex flex-col gap-4">
                            {template.imageUrl && (
                                <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden border">
                                    <img src={template.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => handleChange('imageUrl', '')}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage}
                                />
                                {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
                            </div>
                            <Input
                                placeholder={t('emailTemplates.editor.imageUrlPlaceholder')}
                                value={template.imageUrl || ''}
                                onChange={(e) => handleChange('imageUrl', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <Tabs defaultValue="es" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="es">Español (ES)</TabsTrigger>
                            <TabsTrigger value="en">English (EN)</TabsTrigger>
                            <TabsTrigger value="de">Deutsch (DE)</TabsTrigger>
                        </TabsList>

                        {['es', 'en', 'de'].map((lang) => (
                            <TabsContent key={lang} value={lang} className="space-y-4 mt-4 border p-4 rounded-md">
                                <div className="space-y-2">
                                    <Label>{t('emailTemplates.editor.subject')} ({lang.toUpperCase()})</Label>
                                    <Input
                                        value={template.versions[lang]?.subject || ''}
                                        onChange={(e) => handleVersionChange(lang, 'subject', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('emailTemplates.editor.body')} ({lang.toUpperCase()})</Label>
                                    <Textarea
                                        className="min-h-[300px] font-mono text-sm"
                                        value={template.versions[lang]?.body || ''}
                                        onChange={(e) => handleVersionChange(lang, 'body', e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">{t('emailTemplates.editor.htmlSupport')}</p>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
