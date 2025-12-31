'use client';

import React, { useEffect, useState } from 'react';
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
    Sparkles,
    Smile,
    LucideIcon,
    ShoppingBasket,
    Landmark,
    Bed,
    Home,
    Plane,
    Leaf,
    Gamepad2,
    Dumbbell
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
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Category } from '@/types/category';
import { Skeleton } from '@/components/ui/skeleton';

// Mapping of category names/icons. 
// We now use the 'icon' field from Firestore which stores the string name.
const ICON_MAP: Record<string, LucideIcon> = {
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
    Sparkles,
    Smile,
    ShoppingBasket,
    Landmark,
    Bed,
    Home,
    Plane,
    Leaf,
    Gamepad2,
    Dumbbell
};

export const CategoryDirectory = () => {
    const { t, i18n } = useTranslation('directory');
    const currentLang = (i18n.language?.split('-')[0] || 'de') as 'de' | 'en' | 'es';
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            const db = getFirestore(app);
            try {
                const q = query(collection(db, 'categories'));
                const snap = await getDocs(q);
                const cats: Category[] = [];
                snap.forEach(d => cats.push(d.data() as Category));

                // Sort client-side to avoid missing index issues
                cats.sort((a, b) => {
                    const getName = (obj: any) => {
                        if (typeof obj.name === 'string') return obj.name;
                        return obj.name?.[currentLang] || obj.name?.de || '';
                    };
                    const nameA = getName(a);
                    const nameB = getName(b);
                    return nameA.localeCompare(nameB);
                });

                setCategories(cats);
            } catch (e) {
                console.error("Failed to load categories", e);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [currentLang]);

    // Helper to get translated name
    const getCatName = (cat: Category) => {
        if (typeof cat.name === 'string') return cat.name;
        return cat.name?.[currentLang] || cat.name?.de || '';
    };
    const getSubName = (sub: any) => {
        if (typeof sub.name === 'string') return sub.name;
        return sub.name?.[currentLang] || sub.name?.de || '';
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="h-48 flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat) => {
                const IconComponent = ICON_MAP[cat.icon] || HelpCircle;
                const title = getCatName(cat);

                return (
                    <Card key={cat.id} className="flex flex-col items-center text-center transition-shadow hover:shadow-lg">
                        <CardHeader className="pb-2 flex flex-col items-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <IconComponent className="h-8 w-8" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-primary">
                                {title}
                                {cat.businessCount > 0 && (
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        ({cat.businessCount})
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="w-full">
                            <Select>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('selectOption', 'Select Subcategory')} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {cat.subcategories?.map((sub) => {
                                        const subTitle = getSubName(sub);
                                        return (
                                            <SelectItem key={sub.id} value={sub.id}>
                                                {subTitle}
                                                {sub.businessCount !== undefined && sub.businessCount > 0 && (
                                                    <span className="ml-1 text-muted-foreground">({sub.businessCount})</span>
                                                )}
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
