'use client';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { faqsData } from '@/data/faqs';

export function FaqsView() {
    const { t, i18n } = useTranslation('common');
    const [searchTerm, setSearchTerm] = useState('');

    // Determine current language ('es', 'en', 'de'), fallback to 'es'
    const currentLang = (i18n.language || 'es').substring(0, 2) as keyof typeof faqsData;
    const faqs = faqsData[currentLang] || faqsData['es'];

    // Group faqs by category
    const groupedFaqs = useMemo(() => {
        const filtered = faqs.filter(faq => 
            faq.pregunta.toLowerCase().includes(searchTerm.toLowerCase()) || 
            faq.respuesta.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.reduce((acc, faq) => {
            const cat = faq.categoria || 'General';
            if (!acc[cat]) {
                acc[cat] = [];
            }
            acc[cat].push(faq);
            return acc;
        }, {} as Record<string, typeof faqs>);
    }, [faqs, searchTerm]);

    // Custom preferred order for categories (includes ES, EN, DE names for safety)
    const categoryOrder = [
        "Visión y Futuro", "Vision and Future", "Vision und Zukunft",
        "Economía Circular", "Circular Economy", "Kreislaufwirtschaft",
        "General", "Allgemein", 
        "Cuenta", "Account", "Konto",
        "Empresas", "Companies", "Unternehmen",
        "Comunidad", "Community",
        "DP (DiciPoints)",
        "Finanzas", "Finance", "Finanzen",
        "Ingresos", "Income", "Einkommen",
        "Comisiones", "Commissions", "Provisionen",
        "Red", "Network", "Netzwerk",
        "Niveles", "Levels", "Ebenen",
        "Sorteos", "Draws", "Verlosungen",
        "Seguridad", "Security", "Sicherheit",
        "Tecnología", "Technology", "Technologie",
        "Soporte", "Support", 
        "Legal", "Rechtlich"
    ];

    const sortedCategories = Object.entries(groupedFaqs).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a[0]);
        const indexB = categoryOrder.indexOf(b[0]);
        
        if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0]);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    return (
        <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    {t('freelancer_menu.faqs', 'Preguntas Frecuentes')}
                </h1>
                <p className="text-muted-foreground">
                    Encuentra respuestas a las dudas más comunes sobre el ecosistema Dicilo.
                </p>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar en preguntas frecuentes..."
                    className="pl-9 h-10 w-full md:w-1/2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {sortedCategories.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border rounded-lg bg-slate-50">
                    No se encontraron resultados para tu búsqueda.
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedCategories.map(([category, questions]) => (
                        <div key={category} className="space-y-4">
                            <h2 className="text-xl font-semibold border-b pb-2 text-slate-800">
                                {category}
                            </h2>
                            <Accordion type="multiple" className="w-full">
                                {questions.map((faq) => (
                                    <AccordionItem key={faq.id} value={`item-${faq.id}`}>
                                        <AccordionTrigger className="text-left font-medium">
                                            {faq.pregunta}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                            {faq.respuesta}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
