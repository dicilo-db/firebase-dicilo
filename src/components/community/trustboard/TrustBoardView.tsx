'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Home, Sparkles, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TrustBoardViewProps {
    neighborhood: string;
}

export function TrustBoardView({ neighborhood }: TrustBoardViewProps) {
    const { t } = useTranslation('common');
    const [activeCategory, setActiveCategory] = useState<'all' | 'jobs' | 'living' | 'talent' | 'swap'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = [
        { id: 'all', label: 'Todo', icon: Search, color: 'bg-slate-100 text-slate-700' },
        { id: 'jobs', label: 'Dicilo Jobs', icon: Briefcase, color: 'bg-blue-100 text-blue-700' },
        { id: 'living', label: 'Dicilo Living', icon: Home, color: 'bg-orange-100 text-orange-700' },
        { id: 'talent', label: 'Dicilo Talent', icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
        { id: 'swap', label: 'Gift/Swap', icon: RefreshCw, color: 'bg-green-100 text-green-700' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                <div className="flex-1 w-full relative">
                    <Input 
                        placeholder={t('community.trustboard.search', 'Buscar en el muro de confianza...')} 
                        className="pl-10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
                <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white shadow-sm font-semibold">
                    + Nuevo Anuncio
                </Button>
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

            <Card className="border-dashed border-2 bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <Sparkles className="w-12 h-12 mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Comienza a construir el ecosistema local</h3>
                    <p className="max-w-md mx-auto text-sm">
                        Agrega anuncios de empleo, busca compañeros de cuarto, ofrece tus mentorías o regala cosas que ya no uses. 
                        Este tablón es exclusivo para residentes verificados de {neighborhood}.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
