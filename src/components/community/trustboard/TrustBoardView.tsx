'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Home, Sparkles, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrustBoardPostForm } from './TrustBoardPostForm';
import { TrustBoardFeed } from './TrustBoardFeed';

interface TrustBoardViewProps {
    neighborhood: string;
    readOnly?: boolean;
}

export function TrustBoardView({ neighborhood, readOnly }: TrustBoardViewProps) {
    const { t } = useTranslation('common');
    const [activeCategory, setActiveCategory] = useState<'all' | 'jobs' | 'living' | 'talent' | 'swap'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const categories = [
        { id: 'all', label: t('community.trustboard.cat_all', 'Todo'), icon: Search, color: 'bg-slate-100 text-slate-700' },
        { id: 'jobs', label: t('community.trustboard.cat_jobs', 'Dicilo Jobs'), icon: Briefcase, color: 'bg-blue-100 text-blue-700' },
        { id: 'living', label: t('community.trustboard.cat_living', 'Dicilo Living'), icon: Home, color: 'bg-orange-100 text-orange-700' },
        { id: 'talent', label: t('community.trustboard.cat_talent', 'Dicilo Talent'), icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
        { id: 'swap', label: t('community.trustboard.cat_swap', 'Gift/Swap'), icon: RefreshCw, color: 'bg-green-100 text-green-700' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                <div className="flex-1 w-full relative">
                    <Input 
                        placeholder={t('community.trustboard.search_ph', 'Buscar en el muro de confianza...')} 
                        className="pl-10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
                {!readOnly && (
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white shadow-sm font-semibold">
                                + {t('community.trustboard.new_post', 'Nuevo Anuncio')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t('community.trustboard.form.dialog_title', 'Crear Anuncio Local')}</DialogTitle>
                                <DialogDescription>
                                    {t('community.trustboard.form.dialog_desc', 'Publica tu anuncio en {{name}}. Sé claro y profesional.', { name: neighborhood })}
                                </DialogDescription>
                            </DialogHeader>
                            <TrustBoardPostForm 
                                neighborhood={neighborhood} 
                                onSuccess={() => setIsFormOpen(false)} 
                                onCancel={() => setIsFormOpen(false)} 
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                {categories.map(cat => (
                    <Button 
                        key={cat.id} 
                        variant={activeCategory === cat.id ? 'default' : 'outline'}
                        className={`whitespace-nowrap rounded-full ${activeCategory === cat.id ? cat.color : 'text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => setActiveCategory(cat.id as any)}
                    >
                        <cat.icon className="w-4 h-4 mr-2" />
                        {cat.label}
                    </Button>
                ))}
            </div>

            <TrustBoardFeed neighborhood={neighborhood} activeCategory={activeCategory} />
        </div>
    );
}
