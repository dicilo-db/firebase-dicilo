'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Business } from '@/components/dicilo-search-page'; // Reusing type definition
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Dynamically import map to avoid SSR issues
const DiciloMap = dynamic(() => import('@/components/dicilo-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
});

const db = getFirestore(app);

interface AlliesMapProps {
    userInterests: string[]; // Array of category names
    onNavigateToSettings: () => void;
}

export function AlliesMap({ userInterests, onNavigateToSettings }: AlliesMapProps) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([51.1657, 10.4515]); // Default Germany center
    const [mapZoom, setMapZoom] = useState(6);

    // Filters & Sort
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'category'>('name');
    const [showAllInterests, setShowAllInterests] = useState(false);

    // Fetch Data
    useEffect(() => {
        const fetchBusinesses = async () => {
            setIsLoading(true);
            try {
                const clientsRef = collection(db, 'clients');
                // Fetch active clients (all)
                const q = query(clientsRef);
                const snapshot = await getDocs(q);

                const results: Business[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data() as any;
                    results.push({
                        id: doc.id,
                        ...data
                    } as Business);
                });

                setBusinesses(results);
            } catch (error) {
                console.error("Error fetching allies:", error);
                toast({
                    title: "Error",
                    description: "Failed to load map data.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchBusinesses();
    }, []);


    // Derived State: Filtered & Sorted Businesses
    const filteredBusinesses = useMemo(() => {
        let result = [...businesses];

        // 0. Filter by Interests
        if (!showAllInterests && userInterests && userInterests.length > 0) {
            const normalizedInterests = userInterests.map(i => (i || '').toLowerCase().trim());
            result = result.filter(b => {
                if (!b.category) return false;
                return normalizedInterests.includes(b.category.toLowerCase().trim());
            });
        }

        // 1. Filter by Name Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(b =>
                b.name.toLowerCase().includes(lowerTerm) ||
                b.description?.toLowerCase().includes(lowerTerm)
            );
        }

        // 2. Filter by Country (Client-side, utilizing location string or address if available)
        // If we don't have a structured 'country' field, we rely on 'location'.
        if (selectedCountry !== 'all') {
            result = result.filter(b => b.location?.includes(selectedCountry) || b.address?.includes(selectedCountry));
        }

        // 3. Filter by Specific Category (Subset of Interests)
        if (selectedCategory !== 'all') {
            result = result.filter(b => b.category === selectedCategory);
        }

        // 4. Sort
        result.sort((a, b) => {
            if (sortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            } else {
                return (a.category || '').localeCompare(b.category || '');
            }
        });

        return result;
    }, [businesses, searchTerm, selectedCountry, selectedCategory, sortBy, showAllInterests, userInterests]);

    // Extract unique countries and categories for filters
    const availableCountries = useMemo(() => {
        const countries = new Set<string>();
        businesses.forEach(b => {
            // Rough extraction if structured country missing. 
            // Ideally we'd have a country field. 
            // For now, let's assume 'location' might contain it or skip country filter if data too messy
            if (b.location) countries.add(b.location.split(',').pop()?.trim() || '');
        });
        return Array.from(countries).filter(Boolean).sort();
    }, [businesses]);

    // Available categories (subset of user interests found in data)
    const availableCategories = useMemo(() => {
        const cats = new Set<string>();
        businesses.forEach(b => {
            if (b.category) cats.add(b.category);
        });
        return Array.from(cats).sort();
    }, [businesses]);


    // Handlers
    const handleCardClick = (business: Business) => {
        if (business.coords) {
            setMapCenter(business.coords);
            setMapZoom(13);
            setSelectedBusinessId(business.id);
        }
    };

    // Render Methods
    if (!userInterests || userInterests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[500px] border rounded-xl bg-slate-50">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <Filter className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                    {t('dashboard.alliesMap.noInterestsTitle', 'Personalize Your Experience')}
                </h3>
                <p className="text-muted-foreground max-w-md mb-6">
                    {t('dashboard.alliesMap.noInterestsDesc', 'Por favor, escoja sus intereses para que disfrute de una lista con los mismos.')}
                </p>
                <div className="flex gap-4">
                    <Button onClick={onNavigateToSettings}>
                        {t('dashboard.alliesMap.goToSettings', 'Select Interests')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAllInterests(true)}>
                        {t('dashboard.alliesMap.showAll', 'Show All Anyway')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] rounded-xl overflow-hidden border bg-background shadow-sm md:flex-row">
            {/* LEFT PANEL: LIST & FILTERS */}
            <div className="w-full md:w-1/3 min-w-[320px] flex flex-col border-r bg-white">
                <div className="p-4 border-b space-y-3 bg-slate-50/50">
                    <div>
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            {t('dashboard.alliesMap.title', 'Mapa de Aliados')}
                            <span className="text-xs font-normal text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                                {filteredBusinesses.length}
                            </span>

                        </h2>
                        {/* Toggle for Interests */}
                        {userInterests && userInterests.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="showAll"
                                    checked={showAllInterests}
                                    onChange={(e) => setShowAllInterests(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="showAll" className="text-xs text-muted-foreground cursor-pointer select-none">
                                    {t('dashboard.alliesMap.showAllDesc', 'Mostrar todos (ignorar mis intereses)')}
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('dashboard.alliesMap.searchPlaceholder', 'Buscar por nombre...')}
                            className="pl-8 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex gap-2">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="flex-1 bg-white">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {availableCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="icon"
                            className="bg-white"
                            onClick={() => setSortBy(prev => prev === 'name' ? 'category' : 'name')}
                            title="Sort by Name/Category"
                        >
                            <ArrowUpDown className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* COUPONS BUTTON */}
                    <Button
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm"
                        onClick={() => {
                            toast({ title: "Buscando Cupones", description: "Filtrando aliados con ofertas activas..." });
                        }}
                    >
                        Ticket / Cupones
                    </Button>
                </div>

                {/* List Area */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-2">
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="flex gap-3 p-3 border rounded-lg">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))
                        ) : filteredBusinesses.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                                No se encontraron aliados con estos filtros.
                            </div>
                        ) : (
                            filteredBusinesses.map(business => (
                                <div
                                    key={business.id}
                                    onClick={() => handleCardClick(business)}
                                    className={cn(
                                        "flex gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-50",
                                        selectedBusinessId === business.id ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "bg-white"
                                    )}
                                >
                                    <div className="shrink-0">
                                        {business.imageUrl ? (
                                            <div className="relative h-10 w-10 overflow-hidden rounded-full border">
                                                <Image
                                                    src={business.imageUrl}
                                                    alt={business.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-sm truncate">{business.name}</h4>
                                        <p className="text-xs text-muted-foreground truncate">{business.category}</p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{business.location || 'Ubicación no disponible'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* RIGHT PANEL: MAP */}
            <div className="flex-1 relative bg-slate-100">
                <DiciloMap
                    center={mapCenter}
                    zoom={mapZoom}
                    businesses={filteredBusinesses}
                    selectedBusinessId={selectedBusinessId}
                />
            </div>
        </div >
    );
}
