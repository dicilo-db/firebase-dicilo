import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface CategorySelectorProps {
    selectedCategories: string[];
    onChange: (categories: string[]) => void;
}

export const CATEGORIES = [
    'Consulting',
    'Education',
    'Finance',
    'Gastronomy',
    'Health',
    'Hospitality',
    'Real Estate',
    'Food',
    'Music',
    'Social',
    'Sports',
    'Travel',
    'Technology',
    'Textile',
    'Animals',
    'Transport',
    'Environment',
    'Entertainment',
    'Beauty & Wellness', // New
    'Lifestyle', // New
];

import { useTranslation } from 'react-i18next';

// ... (interface remains same)

export function CategorySelector({ selectedCategories, onChange }: CategorySelectorProps) {
    const { t } = useTranslation('common');

    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            onChange(selectedCategories.filter((c) => c !== category));
        } else {
            onChange([...selectedCategories, category]);
        }
    };

    const getCategoryLabel = (cat: string) => {
        const keyMap: Record<string, string> = {
            'Consulting': 'consulting',
            'Education': 'education',
            'Finance': 'finance',
            'Gastronomy': 'gastronomy',
            'Health': 'health',
            'Hospitality': 'hotels',
            'Real Estate': 'real_estate',
            'Food': 'food',
            'Music': 'music',
            'Social': 'social',
            'Sports': 'sports',
            'Travel': 'travel',
            'Technology': 'technology',
            'Textile': 'textile',
            'Animals': 'animals',
            'Transport': 'transport',
            'Environment': 'environment',
            'Entertainment': 'entertainment',
            'Beauty & Wellness': 'beauty',
            'Lifestyle': 'lifestyle',
        };
        const key = keyMap[cat];
        return key ? t(`form.categories.${key}`, cat) : cat;
    };

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                    <Card
                        key={category}
                        className={cn(
                            'cursor-pointer border-2 p-4 transition-all hover:border-primary/50',
                            isSelected ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary/50'
                        )}
                        onClick={() => toggleCategory(category)}
                    >
                        <div className="flex flex-col items-center justify-center gap-2 text-center">
                            <div
                                className={cn(
                                    'flex h-6 w-6 items-center justify-center rounded-full border',
                                    isSelected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-muted-foreground/30'
                                )}
                            >
                                {isSelected && <Check className="h-4 w-4" />}
                            </div>
                            <span className="text-sm font-medium">{getCategoryLabel(category)}</span>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
