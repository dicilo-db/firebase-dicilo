import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface CategorySelectorProps {
    selectedCategories: string[];
    onChange: (categories: string[]) => void;
}

const CATEGORIES = [
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

export function CategorySelector({ selectedCategories, onChange }: CategorySelectorProps) {
    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            onChange(selectedCategories.filter((c) => c !== category));
        } else {
            onChange([...selectedCategories, category]);
        }
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
                            <span className="text-sm font-medium">{category}</span>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
