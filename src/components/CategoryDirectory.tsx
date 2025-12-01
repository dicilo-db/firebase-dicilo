'use client';

import React from 'react';
import categoriesData from '@/data/categories.json';
import {
    Briefcase,
    GraduationCap,
    Wallet,
    Utensils,
    Heart,
    Hotel,
    Building,
    Fish,
    Music,
    Users,
    Trophy,
    Bot,
    Shirt,
    PawPrint,
    Bus,
    Trees,
    Tv,
    HelpCircle,
    LucideIcon
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

import categoryTranslationsData from '@/data/category_translations.json';

// Mapping of category names to Lucide icons
const iconMapping: Record<string, LucideIcon> = {
    'Beratung': Briefcase,
    'Bildung': GraduationCap,
    'Finanzen': Wallet,
    'Gastronomie': Utensils,
    'Gesundheit': Heart,
    'Hotellerie': Hotel,
    'Immobilien': Building,
    'Lebensmittel': Fish,
    'Musik': Music,
    'Soziales': Users,
    'Sport': Trophy,
    'Reise': Bus, // Using Bus as generic travel icon if Plane not available, or import Plane
    'Technologie': Bot,
    'Textil': Shirt,
    'Tier': PawPrint,
    'Transport': Bus,
    'Umwelt': Trees,
    'Unterhaltung': Tv,
};

interface Category {
    categoria: string;
    subcategorias: string[];
}

import subcategoryTranslationsData from '@/data/subcategory_translations.json';

// ... (existing imports and iconMapping)

// Type for translations
type Translations = Record<string, { de: string; en: string; es: string }>;
const categoryTranslations = categoryTranslationsData as Translations;
const subcategoryTranslations = subcategoryTranslationsData as Translations;

export const CategoryDirectory = () => {
    const { t, i18n } = useTranslation('directory');
    const currentLang = (i18n.language?.split('-')[0] || 'de') as 'de' | 'en' | 'es';

    // Cast the imported data to the correct type
    const categories: Category[] = categoriesData as Category[];

    // Sort categories alphabetically based on the current language
    const sortedCategories = [...categories].sort((a, b) => {
        const titleA = categoryTranslations[a.categoria]?.[currentLang] || a.categoria;
        const titleB = categoryTranslations[b.categoria]?.[currentLang] || b.categoria;
        return titleA.localeCompare(titleB, currentLang);
    });

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedCategories.map((cat, index) => {
                const IconComponent = iconMapping[cat.categoria] || HelpCircle;
                // Get translation or fallback to original category name (German)
                const translatedTitle = categoryTranslations[cat.categoria]?.[currentLang] || cat.categoria;

                return (
                    <Card key={index} className="flex flex-col items-center text-center transition-shadow hover:shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <IconComponent className="h-8 w-8" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-primary">
                                {translatedTitle}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="w-full">
                            <Select>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('selectOption', 'Wählen Sie eine Option')} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {cat.subcategorias.map((sub, subIndex) => {
                                        // Get translation for subcategory or fallback to original
                                        const translatedSub = subcategoryTranslations[sub]?.[currentLang] || sub;
                                        return (
                                            <SelectItem key={subIndex} value={sub}>
                                                {translatedSub}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
