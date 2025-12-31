'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Edit, Mail, Users, Megaphone, ArrowLeft, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';
import { getTemplates, EmailTemplate } from '@/actions/email-templates';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useTranslation } from 'react-i18next';

type CategoryType = 'network_campaigns' | 'email_marketing' | 'referrals';

const CATEGORIES: { id: CategoryType; icon: any; color: string }[] = [
    {
        id: 'network_campaigns',
        icon: Megaphone,
        color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10 border-blue-200'
    },
    {
        id: 'email_marketing',
        icon: Mail,
        color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10 border-purple-200'
    },
    {
        id: 'referrals',
        icon: Users,
        color: 'text-green-500 bg-green-50 dark:bg-green-900/10 border-green-200'
    }
];

export default function EmailTemplatesPage() {
    useAuthGuard(['admin', 'superadmin', 'team_office'], 'access_admin_panel');
    const { t } = useTranslation('admin');
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar las plantillas",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = selectedCategory
        ? templates.filter(t => t.category === selectedCategory)
        : [];

    const categoriesData = CATEGORIES.map(cat => ({
        ...cat,
        title: t(`emailTemplates.categories.${cat.id}.title`),
        description: t(`emailTemplates.categories.${cat.id}.description`)
    }));

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('emailTemplates.title')}</h1>
                    <p className="text-muted-foreground">
                        {selectedCategory
                            ? t('emailTemplates.managing', {
                                category: categoriesData.find(c => c.id === selectedCategory)?.title
                            })
                            : t('emailTemplates.subtitle')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedCategory ? (
                        <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('emailTemplates.backToModules')}
                        </Button>
                    ) : (
                        <Link href="/admin/dashboard">
                            <Button variant="outline">
                                {t('emailTemplates.backToDashboard')}
                            </Button>
                        </Link>
                    )}

                    {selectedCategory && filteredTemplates.length > 0 && (
                        <Link href={`/admin/email-templates/new?category=${selectedCategory}`}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('emailTemplates.newTemplate')}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Module Selection (Overview) */}
            {!selectedCategory && (
                <div className="grid gap-6 md:grid-cols-3">
                    {categoriesData.map((cat) => {
                        const Icon = cat.icon;
                        const count = templates.filter(t => t.category === cat.id).length;
                        return (
                            <Card
                                key={cat.id}
                                className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 ${cat.color} border-transparent hover:border-current`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-lg font-bold">{cat.title}</CardTitle>
                                    <Icon className="h-6 w-6 opacity-75" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mt-2 mb-4">
                                        {cat.description}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <Badge variant="secondary" className="bg-white/50 backdrop-blur-sm">
                                            {t('emailTemplates.templateCount', { count })}
                                        </Badge>
                                        <Button size="sm" variant="ghost" className="hover:bg-white/20">
                                            {t('emailTemplates.manage')} <LayoutTemplate className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Template List (Filtered) */}
            {selectedCategory && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <div className="col-span-full py-10 text-center">
                            <p>{t('emailTemplates.loading')}</p>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="col-span-full text-center py-16 border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Plus className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-medium mb-2">{t('emailTemplates.noTemplates')}</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                {t('emailTemplates.createDescription', {
                                    category: categoriesData.find(c => c.id === selectedCategory)?.title
                                })}
                            </p>
                            <Link href={`/admin/email-templates/new?category=${selectedCategory}`}>
                                <Button size="lg">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('emailTemplates.firstTemplate')}
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        filteredTemplates.map((template) => (
                            <Card key={template.id} className="hover:shadow-md transition-shadow group">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                            {template.name}
                                        </CardTitle>
                                        <Badge variant="outline">
                                            {template.versions['es']?.subject ? 'ES' : ''}
                                            {template.versions['en']?.subject ? ' EN' : ''}
                                            {template.versions['de']?.subject ? ' DE' : ''}
                                        </Badge>
                                    </div>
                                    <CardDescription className="line-clamp-1">
                                        {template.versions['es']?.subject || template.versions['en']?.subject || 'Sin asunto'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2 justify-end mt-4">
                                        <Link href={`/admin/email-templates/${template.id}`} className="w-full">
                                            <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                                                <Edit className="mr-2 h-4 w-4" />
                                                {t('emailTemplates.edit')}
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
