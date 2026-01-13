'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getFirestore, collection, query, where, getDocs, limit, addDoc, onSnapshot, doc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarometerVisual } from '@/app/barrio/components/BarometerVisual';
import NeighborhoodFeed from '@/app/barrio/components/NeighborhoodFeed';
import { RecommendationFormContent } from '@/components/RecommendationForm';
import { ALL_NEIGHBORHOODS } from '@/data/neighborhoods';
import { PlusCircle, MapPin, Trophy, ChevronRight, MessageSquare, Building2, Loader2, Heart, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";

interface BarometerStats {
    score: number;
    level: 'low' | 'medium' | 'high' | 'fire';
    weeklyPosts: number;
    activeUsers: number;
}

const db = getFirestore(app);

// Helper to find neighborhood/city
function getCityNeighborhoods(city: string) {
    return ALL_NEIGHBORHOODS.filter(n => n.city === city && n.name !== city);
}

// Helper to get Neighborhood config
function getNeighborhood(slugOrName: string) {
    const normalized = slugOrName.toLowerCase();
    return ALL_NEIGHBORHOODS.find(n => n.id.toLowerCase() === normalized || n.name.toLowerCase() === normalized);
}

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommunityFeed } from '../community/CommunityFeed';
import { User } from 'firebase/auth';

export function CommunityView({ defaultNeighborhood = 'Hamburg', currentUser }: { defaultNeighborhood?: string, currentUser: User }) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlNeighborhood = searchParams.get('neighborhood');

    // Initialize state from URL param or default prop
    const [neighborhoodName, setNeighborhoodName] = useState(urlNeighborhood || defaultNeighborhood);
    const [stats, setStats] = useState<BarometerStats>({ score: 0, level: 'low', weeklyPosts: 0, activeUsers: 0 });
    const [trending, setTrending] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [open, setOpen] = useState(false); // Recommendation Dialog
    const [registerOpen, setRegisterOpen] = useState(false); // Register Neighborhood Dialog
    const [newNeighborhoodName, setNewNeighborhoodName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Favorite Logic
    const [isFavorite, setIsFavorite] = useState(false);

    // Sync state with URL when it changes
    const updateNeighborhood = (name: string) => {
        setNeighborhoodName(name);
        router.push(`?neighborhood=${encodeURIComponent(name)}`, { scroll: false });
    };

    const neighborhoodConfig = getNeighborhood(neighborhoodName);
    const isCity = neighborhoodConfig ? neighborhoodConfig.name === neighborhoodConfig.city : false;
    const [dbNeighborhoods, setDbNeighborhoods] = useState<any[]>([]);

    useEffect(() => {
        // Fetch neighborhoods from DB
        const fetchNeighborhoods = async () => {
            // We want all neighborhoods in the current city
            const currentCity = isCity ? neighborhoodName : neighborhoodConfig?.city || 'Hamburg';

            try {
                const q = query(
                    collection(db, 'neighborhoods'),
                    where('city', '==', currentCity)
                );

                // Real-time listener for new registrations
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const fetched = snapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().name,
                        city: doc.data().city
                    }));
                    setDbNeighborhoods(fetched);
                });

                return () => unsubscribe();
            } catch (e) {
                console.error("Error fetching neighborhoods", e);
            }
        };

        const cleanup = fetchNeighborhoods();
        // Since fetchNeighborhoods is async but returns a cleanup function via promise... 
        // effectively we need to handle the unsubscription differently or simplified.
        // Simplified approach below:
    }, [isCity, neighborhoodName, neighborhoodConfig]);

    // Correct simplified useEffect for fetching neighborhoods
    useEffect(() => {
        const currentCity = isCity ? neighborhoodName : neighborhoodConfig?.city || 'Hamburg';
        if (!currentCity) return;

        const q = query(
            collection(db, 'neighborhoods'),
            where('city', '==', currentCity)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                city: doc.data().city
            }));
            setDbNeighborhoods(fetched);
        });

        return () => unsubscribe();
    }, [isCity, neighborhoodName, neighborhoodConfig]);


    // Combined Neighborhoods
    const subNeighborhoods = useMemo(() => {
        // Base list
        let base = [];
        if (isCity && neighborhoodConfig) {
            base = getCityNeighborhoods(neighborhoodConfig.city);
        } else if (isCity) {
            // Fallback if config is missing but we are in a 'city' like mode (e.g. from DB)
            // For now, assume static config is source of truth for "City" definition
            base = ALL_NEIGHBORHOODS.filter(n => n.city === neighborhoodName);
        }

        // Merge with DB (deduplicating by name)
        const merged = [...base];
        dbNeighborhoods.forEach(dbN => {
            if (!merged.find(m => m.name.toLowerCase() === dbN.name.toLowerCase())) {
                merged.push(dbN);
            }
        });

        return merged;
    }, [neighborhoodConfig, isCity, dbNeighborhoods, neighborhoodName]);

    // Helper for formatting
    const displayNeighborhood = React.useMemo(() => {
        // Check dynamic list first if config not found
        const dynamicMatch = dbNeighborhoods.find(n => n.name.toLowerCase() === neighborhoodName.toLowerCase() || n.id === neighborhoodName);
        if (dynamicMatch) return dynamicMatch.name;

        // If config exists, use official name. otherwise title case the input
        if (neighborhoodConfig) return neighborhoodConfig.name;
        // Simple Title Case
        return neighborhoodName.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }, [neighborhoodName, neighborhoodConfig, dbNeighborhoods]);

    // Listen for favorite status
    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(doc(db, 'private_profiles', currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Compare loosely or exactly? normalize for comparison
                const currentNorm = neighborhoodName.toLowerCase();
                const favNorm = (data.favoriteNeighborhood || '').toLowerCase();
                setIsFavorite(currentNorm === favNorm);
            }
        });
        return () => unsub();
    }, [neighborhoodName, currentUser]);

    // Handle Favorite Toggle
    const handleToggleFavorite = async () => {
        const newStatus = !isFavorite;
        // Optimistic UI handled by listener mostly, but we can force it if slow
        try {
            const { setFavoriteNeighborhood } = await import('@/app/actions/private-users');
            await setFavoriteNeighborhood(currentUser.uid, newStatus ? neighborhoodName : null);

            if (newStatus) {
                toast({
                    title: t('community.actions.is_favorite', 'Es mi Barrio'),
                    description: `${displayNeighborhood} ${t('saved', 'Guardado')}.`,
                    className: "bg-pink-50 border-pink-200 text-pink-800"
                });
            }
        } catch (error) {
            console.error("Error setting favority", error);
            toast({ title: "Error", variant: "destructive" });
        }
    };

    useEffect(() => {
        // If URL changes, update state
        if (urlNeighborhood && urlNeighborhood !== neighborhoodName) {
            setNeighborhoodName(urlNeighborhood);
        }
    }, [urlNeighborhood]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Trending Businesses
                const isCitySearch = neighborhoodName === 'Hamburg'; // Or dynamic check

                let constraints: any[] = [];
                if (isCitySearch) {
                    constraints.push(where('city', '==', neighborhoodName));
                } else {
                    // Check if it matches city prop or neighborhood prop
                    constraints.push(where('neighborhood', '==', neighborhoodName));
                }

                // ... (rest of fetch logic remains same)

                const qBusinesses = query(
                    collection(db, 'clients'),
                    ...constraints,
                    limit(20)
                );
                const snapBiz = await getDocs(qBusinesses);
                const businesses = snapBiz.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

                // Simple client-side sort for demo (better DB index `orderBy` in prod)
                const sortedBiz = businesses
                    .sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0))
                    .slice(0, 5);

                setTrending(sortedBiz);

                // 2. Barometer Stats (Using Community Posts + Recommendations for activity?)
                // For now keeping logic on recommendations, but could expand.
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                let statConstraints: any[] = [];
                if (isCitySearch) {
                    statConstraints.push(where('city', '==', neighborhoodName));
                } else {
                    statConstraints.push(where('neighborhood', '==', neighborhoodName));
                }

                const qStats = query(
                    collection(db, 'recommendations'),
                    ...statConstraints,
                    where('createdAt', '>=', sevenDaysAgo)
                );
                const snapStats = await getDocs(qStats);
                const weeklyPosts = snapStats.size;
                const uniqueAuthors = new Set(snapStats.docs.map(d => d.data().userId));
                const activeUsers = uniqueAuthors.size;

                let score = (weeklyPosts * 5) + (activeUsers * 10);
                if (score > 100) score = 100;

                let level: BarometerStats['level'] = 'low';
                if (score >= 80) level = 'fire';
                else if (score >= 50) level = 'high';
                else if (score >= 20) level = 'medium';

                setStats({ score, level, weeklyPosts, activeUsers });

            } catch (error) {
                console.error("Error fetching community data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [neighborhoodName]);

    const handleRegisterNeighborhood = async () => {
        if (!newNeighborhoodName.trim()) return;
        setIsRegistering(true);
        try {
            const { registerNeighborhood } = await import('@/app/actions/neighborhoods');
            const result = await registerNeighborhood(newNeighborhoodName, currentUser.uid);

            if (result.success) {
                if (result.exists) {
                    toast({
                        title: "¡Barrio existente!",
                        description: `Redirigiendo a ${result.name}...`,
                        className: "bg-blue-50 border-blue-200"
                    });
                    setRegisterOpen(false);
                    setNewNeighborhoodName('');
                    updateNeighborhood(result.slug || result.name); // Redirect
                } else if (result.created) {
                    toast({
                        title: "¡Barrio creado!",
                        description: result.message,
                        className: "bg-green-50 border-green-200"
                    });
                    setRegisterOpen(false);
                    setNewNeighborhoodName('');
                    updateNeighborhood(result.slug || result.name); // Redirect
                }
            } else {
                toast({
                    title: "No se pudo registrar",
                    description: result.error,
                    variant: 'destructive'
                });
            }

        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Ocurrió un error inesperado.",
                variant: 'destructive'
            });
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {t('community.your_community', 'Tu Comunidad')}: <span className="text-primary">{displayNeighborhood}</span>
                        </h2>
                        {/* Favorite Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleToggleFavorite}
                            className={`rounded-full transition-all ${isFavorite ? 'text-pink-500 bg-pink-50 hover:bg-pink-100' : 'text-slate-400 hover:text-pink-400 hover:bg-slate-100'}`}
                            title={isFavorite ? t('community.actions.is_favorite', 'Es mi Barrio') : t('community.actions.set_favorite', 'Marcar como mi Barrio')}
                        >
                            <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                        </Button>
                    </div>
                    <p className="text-muted-foreground text-lg mt-1">{t('community.explore_desc', 'Explora lo que sucede en tu barrio y conecta con tus vecinos.')}</p>
                </div>

                {/* Create Recommendation Action */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-md transition-all hover:scale-105">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            {t('community.new_recommendation', 'Nueva Recomendación')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{t('community.new_recommendation', 'Nueva Recomendación')}</DialogTitle>
                            <DialogDescription>
                                {t('community.share_place', 'Comparte un lugar, servicio o experiencia con tus vecinos.', { name: displayNeighborhood })}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                            <RecommendationFormContent
                                onSuccess={() => setOpen(false)}
                                onCancel={() => setOpen(false)}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Stats & Meta (Sticky Sidebar style) */}
                <div className="lg:col-span-4 space-y-8">
                    <BarometerVisual
                        neighborhoodName={displayNeighborhood}
                        activityLevel={stats.level}
                        score={stats.score}
                        weeklyPostCount={stats.weeklyPosts}
                        activeUsersCount={stats.activeUsers}
                    />

                    {/* Sub-neighborhoods Filter */}
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-500" />
                                {t('community.neighborhoods_of', 'Barrios de')} {isCity ? displayNeighborhood : neighborhoodConfig?.city || 'Hamburg'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>

                            {/* Neighborhood Search & List */}
                            {(isCity || (neighborhoodConfig && neighborhoodConfig.city)) && (
                                <div className="space-y-4 mb-4">
                                    {/* Search Input - Only show if there are subneighborhoods or we are in a city view */}
                                    {isCity && subNeighborhoods.length > 0 && (
                                        <div className="relative">
                                            <Input
                                                placeholder={t('community.search_neighborhoods', 'Buscar barrios...')}
                                                className="pl-9"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}

                                    {/* Link back to City if in a neighborhood */}
                                    {!isCity && neighborhoodConfig?.city && (
                                        <Button
                                            variant="outline"
                                            className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 mb-2"
                                            onClick={() => updateNeighborhood(neighborhoodConfig.city)}
                                        >
                                            <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
                                            {t('back', 'Volver a')} {neighborhoodConfig.city}
                                        </Button>
                                    )}

                                    {/* List Display */}
                                    {isCity && subNeighborhoods.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                {/* Filter and limit to 20 */}
                                                {subNeighborhoods
                                                    .filter(nb => nb.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    .slice(0, 20)
                                                    .map(nb => (
                                                        <Badge
                                                            key={nb.id}
                                                            variant="secondary"
                                                            className="hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-colors px-3 py-1 text-sm"
                                                            onClick={() => updateNeighborhood(nb.name)}
                                                        >
                                                            {nb.name}
                                                        </Badge>
                                                    ))}
                                            </div>
                                            {/* Show message if filtered results are empty but total is not */}
                                            {searchTerm && subNeighborhoods.filter(nb => nb.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center py-2">No se encontraron barrios.</p>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* Register Neighborhood Button */}
                            <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary border-t pt-4 mt-2">
                                        <Building2 className="mr-2 h-3 w-3" />
                                        {t('community.register_neighborhood_btn', 'Registrar Barrio')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t('community.register_neighborhood', 'Registrar Barrio')}</DialogTitle>
                                        <DialogDescription>
                                            {t('community.register_neighborhood_desc', '¿No encuentras tu barrio? Regístralo aquí para empezar a conectar con tus vecinos.')}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>{t('form.neighborhoodName', 'Nombre del Barrio')}</Label>
                                            <Input
                                                placeholder="Ej. Sternschanze"
                                                value={newNeighborhoodName}
                                                onChange={(e) => setNewNeighborhoodName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleRegisterNeighborhood} disabled={!newNeighborhoodName || isRegistering}>
                                            {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isRegistering ? t('community.verifying', 'Verificando...') : t('community.verify_create', 'Verificar y Crear')}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>


                    {/* Ranking */}
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardHeader className="bg-slate-50/50 pb-4 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                {t('community.ranking.title', 'Top Empresas')}
                            </CardTitle>
                            <CardDescription>{t('community.ranking.subtitle', 'Negocios más recomendados')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y">
                                {trending.length > 0 ? trending.map((biz: any, i) => (
                                    <li key={biz.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors group cursor-pointer">
                                        <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
                                        ${i === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                i === 1 ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                                    i === 2 ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-white text-slate-500 border'}
                                    `}>
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold truncate text-slate-800 group-hover:text-blue-600 transition-colors">{biz.clientName || biz.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                {biz.category}
                                                {biz.reputationScore && <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-green-50 text-green-700">{biz.reputationScore} pts</Badge>}
                                            </div>
                                        </div>
                                        <Link href={`/client/${biz.slug || biz.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </li>
                                )) : (
                                    <div className="p-8 text-center text-slate-500 text-sm italic">
                                        {t('community.ranking.no_data', 'No hay suficientes datos para el ranking aún.')}
                                    </div>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Feed (Tabs) */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="wall" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                                <TabsTrigger value="wall">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    {t('community.feed.wall', 'Muro Social')}
                                </TabsTrigger>
                                <TabsTrigger value="recommendations">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {t('community.feed.recommendations', 'Recomendaciones')}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="wall" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            {/* Pass selected neighborhood to feed */}
                            <CommunityFeed
                                neighborhood={neighborhoodName}
                                userId={currentUser.uid}
                            />
                        </TabsContent>

                        <TabsContent value="recommendations" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {t('community.feed.whats_happening', { name: displayNeighborhood })}
                                </h3>
                            </div>
                            <NeighborhoodFeed neighborhood={neighborhoodName} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
