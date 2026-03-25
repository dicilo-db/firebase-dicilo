import React, { useEffect, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useTranslation } from 'react-i18next';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

interface CategorySelectorProps {
    selectedCategories: string[];
    onChange: (categories: string[]) => void;
}

// Old map for backwards compatibility so existing users don't lose their settings
const LEGACY_MAP: Record<string, string> = {
    'Consulting': 'beratung-coaching',
    'Education': 'bildung-karriere',
    'Finance': 'finanzdienstleistung-vorsorge',
    'Gastronomy': 'gastronomie-kulinarik',
    'Health': 'gesundheit-wellness',
    'Hospitality': 'hotellerie-gastgewerbe',
    'Real Estate': 'immobilien-wohnraum',
    'Food': 'lebensmittel-feinkost',
    'Music': 'musik-events',
    'Social': 'soziales-engagement',
    'Sports': 'sport-fitness', 
    'Travel': 'reisen-tourismus',
    'Technology': 'technologie-it', 
    'Textile': 'textil-mode',
    'Animals': 'tiere-haustiere', 
    'Transport': 'transport-logistik',
    'Environment': 'umwelt-nachhaltigkeit', 
    'Entertainment': 'unterhaltung-freizeit',
    'Beauty & Wellness': 'schonheit-wellness',
    'Lifestyle': 'lifestyle', 
};

export function CategorySelector({ selectedCategories, onChange }: CategorySelectorProps) {
    const { t, i18n } = useTranslation(['common', 'admin']);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const db = getFirestore(app);
    const currentLang = (i18n.language?.split('-')[0] || 'es') as 'de' | 'en' | 'es';

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const q = query(collection(db, 'categories'));
                const snap = await getDocs(q);
                const cats: any[] = [];
                snap.forEach(d => cats.push({ id: d.id, ...d.data() }));
                
                // Sort by name
                cats.sort((a, b) => {
                    const nameA = a.name?.[currentLang] || a.name?.de || '';
                    const nameB = b.name?.[currentLang] || b.name?.de || '';
                    return nameA.localeCompare(nameB);
                });
                
                setCategories(cats);
            } catch (e) {
                console.error("Error fetching categories", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, [db, currentLang]);

    const isCategorySelected = (catId: string, legacyName?: string) => {
        return selectedCategories.includes(catId) || 
               (legacyName && selectedCategories.includes(legacyName)) ||
               Object.keys(LEGACY_MAP).some(k => LEGACY_MAP[k] === catId && selectedCategories.includes(k));
    };

    const toggleCategory = (catId: string, legacyName?: string) => {
        let newSelection = [...selectedCategories];
        
        // Remove old legacy name if present
        const legacyKey = Object.keys(LEGACY_MAP).find(k => LEGACY_MAP[k] === catId);
        
        if (isCategorySelected(catId, legacyName)) {
            // Unselect: remove ID and any legacy representations
            newSelection = newSelection.filter(c => c !== catId && c !== legacyName && c !== legacyKey);
        } else {
            // Select: add native firebase ID
            newSelection.push(catId);
        }
        onChange(newSelection);
    };

    const toggleSubcategory = (subId: string) => {
        if (selectedCategories.includes(subId)) {
            onChange(selectedCategories.filter(c => c !== subId));
        } else {
            onChange([...selectedCategories, subId]);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 animate-pulse">
                {Array(10).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-secondary/50 rounded-lg border-2 border-transparent"></div>
                ))}
            </div>
        );
    }

    // Identify which main categories are currently selected
    const selectedMainCategories = categories.filter(c => isCategorySelected(c.id));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {categories.map((category) => {
                    const isSelected = isCategorySelected(category.id);
                    const name = category.name?.[currentLang] || category.name?.de || category.id;
                    
                    return (
                        <Card
                            key={category.id}
                            className={cn(
                                'cursor-pointer border-2 p-4 transition-all hover:border-primary/50',
                                isSelected ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary/50'
                            )}
                            onClick={() => toggleCategory(category.id)}
                        >
                            <div className="flex flex-col items-center justify-center gap-2 text-center h-full">
                                <div
                                    className={cn(
                                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                                        isSelected
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-muted-foreground/30'
                                    )}
                                >
                                    {isSelected && <Check className="h-4 w-4" />}
                                </div>
                                <span className="text-sm font-medium line-clamp-2">{name}</span>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {selectedMainCategories.length > 0 && (
                <div className="rounded-xl border bg-card mt-6 shadow-sm border-primary/20 bg-primary/5">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="subcategories" className="border-none">
                            <AccordionTrigger className="hover:no-underline px-5 py-4 rounded-t-xl hover:bg-primary/10 transition-colors relative group">
                                <span className="flex items-center text-lg font-semibold tracking-tight text-primary text-left">
                                    Subcategorías (Opcional)
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 px-5 pb-6">
                                <p className="text-sm text-foreground/80 mb-6">
                                    {t('settings.interests.subcategories_desc', 'Afina tus intereses seleccionando subcategorías específicas para recibir ofertas más precisas.')}
                                </p>
                                
                                <div className="space-y-6">
                                    {selectedMainCategories.map(mainCat => {
                                        if (!mainCat.subcategories || mainCat.subcategories.length === 0) return null;
                                        const mainName = mainCat.name?.[currentLang] || mainCat.name?.de || mainCat.id;
                                        
                                        // Sort subcategories alphabetically
                                        const sortedSubs = [...mainCat.subcategories].sort((a, b) => {
                                            const sa = a.name?.[currentLang] || a.name?.de || a.id;
                                            const sb = b.name?.[currentLang] || b.name?.de || b.id;
                                            return sa.localeCompare(sb);
                                        });

                                        return (
                                            <div key={mainCat.id} className="space-y-3 bg-background p-4 rounded-lg border">
                                                <h5 className="text-sm font-bold text-foreground tracking-wider">{mainName}</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {sortedSubs.map((sub: any) => {
                                                        const subName = sub.name?.[currentLang] || sub.name?.de || sub.id;
                                                        const isSubSelected = selectedCategories.includes(sub.id);
                                                        
                                                        return (
                                                            <Badge 
                                                                key={sub.id}
                                                                variant={isSubSelected ? "default" : "outline"}
                                                                className={cn(
                                                                    "cursor-pointer px-3 py-1.5 transition-colors select-none font-normal",
                                                                    !isSubSelected && "hover:bg-secondary text-secondary-foreground",
                                                                    isSubSelected && "font-medium"
                                                                )}
                                                                onClick={() => toggleSubcategory(sub.id)}
                                                            >
                                                                {isSubSelected && <Check className="h-3 w-3 mr-1.5" />}
                                                                {subName}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            )}
        </div>
    );
}

// Export empty array for backwards compat if used directly anywhere
export const CATEGORIES = [];
