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
import { PlusCircle, MapPin, Trophy, ChevronRight, MessageSquare, Building2, Loader2, Heart, Search, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";

interface BarometerStats {
    score: number;
    level: 'low' | 'medium' | 'high' | 'fire';
    weeklyPosts: number;
    activeUsers: number;
}

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommunityFeed } from '../community/CommunityFeed';
import { SocialPanel } from './social/SocialPanel';
import { User } from 'firebase/auth';

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
    const [newCountryName, setNewCountryName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [dbNeighborhoods, setDbNeighborhoods] = useState<any[]>([]);

    // Favorite Logic
    const [isFavorite, setIsFavorite] = useState(false);

    // Sync state with URL when it changes
    const updateNeighborhood = (name: string) => {
        setNeighborhoodName(name);
        router.push(`?neighborhood=${encodeURIComponent(name)}`, { scroll: false });
    };

    // Dynamic Neighborhood Config (merging Static + DB)
    const neighborhoodConfig = useMemo(() => {
        const staticConfig = getNeighborhood(neighborhoodName);
        if (staticConfig) return staticConfig;

        // Check dynamic list
        const dynamicMatch = dbNeighborhoods.find(n => n.name.toLowerCase() === neighborhoodName.toLowerCase() || n.id === neighborhoodName);
        if (dynamicMatch) return dynamicMatch;

        return null;
    }, [neighborhoodName, dbNeighborhoods]);

    const isCity = neighborhoodConfig ? neighborhoodConfig.name === neighborhoodConfig.city : false;



    // Simplified useEffect for fetching neighborhoods
    useEffect(() => {
        let isMounted = true;
        let unsubscribeNeighborhoods: (() => void) | undefined;
        let unsubscribeSystemLocations: (() => void) | undefined;

        const initContext = async () => {
            // ... existing logic to determine current city context ...
            let currentCity = 'Hamburg'; // Default fallback

            // 1. Is it a known city?
            if (neighborhoodName === 'Hamburg' || neighborhoodName === 'Berlin') {
                currentCity = neighborhoodName;
            }
            // 2. Is it a static neighborhood?
            else {
                const staticN = ALL_NEIGHBORHOODS.find(n => n.name.toLowerCase() === neighborhoodName.toLowerCase() || n.id === neighborhoodName);
                if (staticN) {
                    currentCity = staticN.city;
                } else {
                    // 3. Dynamic? Fetch specific Doc to get its City
                    try {
                        const qConfig = query(collection(db, 'neighborhoods'), where('slug', '==', neighborhoodName));
                        const snapConfig = await getDocs(qConfig);

                        if (!snapConfig.empty) {
                            const data = snapConfig.docs[0].data();
                            if (data.type === 'ciudad' || data.name === data.city) {
                                currentCity = data.name;
                            } else {
                                currentCity = data.city;
                            }
                        } else {
                            // Fallback: Try query by 'name'
                            const qName = query(collection(db, 'neighborhoods'), where('name', '==', neighborhoodName));
                            const snapName = await getDocs(qName);
                            if (!snapName.empty) {
                                const data = snapName.docs[0].data();
                                currentCity = data.city || data.name;
                            }
                        }
                    } catch (e) {
                        console.error("Error determining context city", e);
                    }
                }
            }

            if (!isMounted) return;

            // Parallel Data State
            let userDocs: any[] = [];
            let systemDocs: any[] = [];

            const mergeAndSet = () => {
                const combinedMap = new Map();

                // 1. Add System Locations (Base)
                systemDocs.forEach(item => combinedMap.set(item.name.toLowerCase(), item));

                // 2. Add User Neighborhoods (Rich Data - overwrites system if name collision)
                userDocs.forEach(item => combinedMap.set(item.name.toLowerCase(), item));

                setDbNeighborhoods(Array.from(combinedMap.values()));
            };

            // FETCH Source 1: 'neighborhoods' (User registered)
            const q = query(collection(db, 'neighborhoods'));
            unsubscribeNeighborhoods = onSnapshot(q, (snapshot) => {
                if (!isMounted) return;
                userDocs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    city: doc.data().city || currentCity,
                    location: doc.data().location,
                    // source: 'user'
                }));
                mergeAndSet();
            });

            // FETCH Source 2: 'system_locations' (Admin managed)
            const qSys = query(collection(db, 'system_locations'));
            unsubscribeSystemLocations = onSnapshot(qSys, (sysSnapshot) => {
                if (!isMounted) return;
                const newSystemDocs: any[] = [];

                sysSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    // Flatten Country -> Cities -> Districts
                    if (data.cities) {
                        data.cities.forEach((cityObj: any) => {
                            if (cityObj.districts) {
                                cityObj.districts.forEach((distName: string) => {
                                    newSystemDocs.push({
                                        id: distName,
                                        name: distName,
                                        city: cityObj.name,
                                        location: null,
                                        // source: 'admin'
                                    });
                                });
                            }
                        });
                    }
                });
                systemDocs = newSystemDocs;
                mergeAndSet();
            });
        };

        initContext();

        return () => {
            isMounted = false;
            if (unsubscribeNeighborhoods) unsubscribeNeighborhoods();
            if (unsubscribeSystemLocations) unsubscribeSystemLocations();
        };
    }, [neighborhoodName]);


    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Get User Location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    // console.log("Geolocation permission denied or error", error);
                },
                { timeout: 10000, maximumAge: 60000 } // Don't block too long, use cached if available
            );
        }
    }, []);

    // Helper: Haversine Distance in km
    function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg: number) {
        return deg * (Math.PI / 180);
    }


    // Combined Neighborhoods
    const subNeighborhoods = useMemo(() => {
        // Determine City Scope
        const currentCity = isCity ? neighborhoodName : (neighborhoodConfig?.city || 'Hamburg');

        // Base list from static config (filtered by current city)
        const base = ALL_NEIGHBORHOODS.filter(n => n.city === currentCity && n.name !== currentCity);

        // Merge with DB (deduplicating by name)
        // If searching, we want to broaden the scope potentially? 
        // For now, we still mostly respect the header "Barrios de [City]" but we should include matches if searchTerm is present
        const merged = [...base];

        dbNeighborhoods.forEach(dbN => {
            // Logic: 
            // 1. If we are NOT searching, strict filter by city to keep list clean.
            // 2. If we ARE searching, include anything matching the name, even from other cities? 
            // User requested: "si no esta hay registrado, lo busque en el modulo de la Gestion de paises"

            const isSameCity = dbN.city === currentCity;
            const matchesSearch = searchTerm && dbN.name.toLowerCase().includes(searchTerm.toLowerCase());

            if (isSameCity || matchesSearch) {
                const existingIndex = merged.findIndex(m => m.name.toLowerCase() === dbN.name.toLowerCase());
                if (existingIndex === -1) {
                    merged.push(dbN);
                }
            }
        });

        // SORTING: If we have user location, sort by distance
        if (userLocation) {
            return merged
                .map(n => {
                    // DB neighborhoods usually have location: { lat, lng } object from Firestore
                    // But might be GeoPoint { latitude, longitude } or Google { lat, lng }
                    // Static ones have lat, lng top level properties
                    let nLat = n.lat;
                    let nLng = n.lng;

                    // Check nested location object
                    if (n.location) {
                        nLat = n.location.lat || n.location.latitude || nLat;
                        nLng = n.location.lng || n.location.longitude || nLng;
                    }

                    if (nLat && nLng) {
                        return { ...n, distance: getDistance(userLocation.lat, userLocation.lng, nLat, nLng) };
                    }
                    return { ...n, distance: 999999 }; // Push to end if no coords
                })
                .sort((a, b) => a.distance - b.distance);
        }

        // Default sort (Validation: maybe alphabetical?)
        return merged.sort((a, b) => a.name.localeCompare(b.name));

    }, [neighborhoodConfig, isCity, dbNeighborhoods, neighborhoodName, userLocation]);

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
            // console.error("Error setting favority", error);
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

                // 2. Barometer Stats (Using Community Posts + Recommendations)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                // Query 1: Recommendations
                let recConstraints: any[] = [];
                if (isCitySearch) {
                    recConstraints.push(where('city', '==', neighborhoodName));
                } else {
                    recConstraints.push(where('neighborhood', '==', neighborhoodName));
                }

                const qRecs = query(
                    collection(db, 'recommendations'),
                    ...recConstraints,
                    where('createdAt', '>=', sevenDaysAgo)
                );

                // Query 2: Community Posts (Always uses 'neighborhood' field)
                const qPosts = query(
                    collection(db, 'community_posts'),
                    where('neighborhood', '==', neighborhoodName),
                    where('createdAt', '>=', sevenDaysAgo)
                );


                const [snapRecs, snapPosts] = await Promise.all([
                    getDocs(qRecs),
                    getDocs(qPosts)
                ]);

                const totalPosts = snapRecs.size + snapPosts.size;
                const uniqueAuthors = new Set([
                    ...snapRecs.docs.map(d => d.data().userId),
                    ...snapPosts.docs.map(d => d.data().userId)
                ]);
                const activeUsers = uniqueAuthors.size;

                let score = (totalPosts * 5) + (activeUsers * 10);
                if (score > 100) score = 100;

                let level: BarometerStats['level'] = 'low';
                if (score >= 80) level = 'fire';
                else if (score >= 50) level = 'high';
                else if (score >= 20) level = 'medium';

                setStats({ score, level, weeklyPosts: totalPosts, activeUsers });

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
            const result = await registerNeighborhood(newNeighborhoodName, currentUser.uid, newCountryName);

            if (result.success) {
                if (result.exists) {
                    toast({
                        title: "¡Barrio existente!",
                        description: `Redirigiendo a ${result.name}...`,
                        className: "bg-blue-50 border-blue-200"
                    });
                    setRegisterOpen(false);
                    setNewNeighborhoodName('');
                    setNewCountryName('');
                    updateNeighborhood(result.slug || result.name); // Redirect
                } else if (result.created) {
                    toast({
                        title: "¡Barrio creado!",
                        description: result.message,
                        className: "bg-green-50 border-green-200"
                    });
                    setRegisterOpen(false);
                    setNewNeighborhoodName('');
                    setNewCountryName('');
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

    const [activeTab, setActiveTab] = useState("wall");
    // Hide sidebar for both Social Panel (Chats) and Wall (Feed) to provide full width space
    const isFullWidthTab = activeTab === 'social' || activeTab === 'wall';

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
                {/* Hide Left Column if in Social Tab or Wall Tab to give full width */}
                {!isFullWidthTab && (
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
                                {(subNeighborhoods.length > 0 || isCity || (neighborhoodConfig && neighborhoodConfig.city)) && (
                                    <div className="space-y-4 mb-4">
                                        {/* Search Input - Show always if there are subneighborhoods */}
                                        {subNeighborhoods.length > 0 && (
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

                                        {/* List Display Grouped by City */}
                                        {subNeighborhoods.length > 0 ? (
                                            <div className="space-y-4">
                                                {/* Group by City (even if mostly one city, covers future expansion) */}
                                                {(() => {
                                                    const grouped = subNeighborhoods
                                                        .filter(nb => nb.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                        .reduce((acc, nb) => {
                                                            const city = nb.city || (isCity ? neighborhoodName : 'Hamburg');
                                                            if (!acc[city]) acc[city] = [];
                                                            acc[city].push(nb);
                                                            return acc;
                                                        }, {} as Record<string, typeof subNeighborhoods>);

                                                    return Object.entries(grouped).map(([city, places]) => (
                                                        <div key={city} className="space-y-2">
                                                            {/* City Header */}
                                                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
                                                                <Building2 className="h-3 w-3" />
                                                                {city}
                                                            </div>

                                                            {/* Neighborhoods List */}
                                                            <div className="grid grid-cols-1 gap-1">
                                                                {places.slice(0, 50).map(nb => (
                                                                    <Button
                                                                        key={nb.id}
                                                                        variant={nb.name === neighborhoodName ? "secondary" : "ghost"}
                                                                        className={`
                                                                            justify-start h-auto py-2 px-3 text-sm font-normal
                                                                            ${nb.name === neighborhoodName
                                                                                ? "bg-slate-100 text-slate-900 border-l-4 border-slate-900 font-medium"
                                                                                : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"}
                                                                        `}
                                                                        onClick={() => updateNeighborhood(nb.name)}
                                                                    >
                                                                        <div className="flex flex-col items-start gap-0.5 w-full">
                                                                            <div className="flex w-full justify-between items-center">
                                                                                <span>{nb.name}</span>
                                                                                {nb.distance && nb.distance < 100 && (
                                                                                    <span className="text-[10px] text-muted-foreground">
                                                                                        {nb.distance < 1 ? `${Math.round(nb.distance * 1000)}m` : `${nb.distance.toFixed(1)}km`}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}

                                                {/* Empty State */}
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
                                            <div className="space-y-2">
                                                <Label>{t('form.countryName', 'País (Opcional)')}</Label>
                                                <Input
                                                    placeholder="Ej. Alemania"
                                                    value={newCountryName}
                                                    onChange={(e) => setNewCountryName(e.target.value)}
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
                )}

                {/* Right Column: Feed (Tabs) */}
                <div className={isFullWidthTab ? "lg:col-span-12" : "lg:col-span-8"}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <TabsList className="grid w-full grid-cols-3 lg:w-[480px]">
                                <TabsTrigger value="wall">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    {t('community.feed.wall', 'Muro Social')}
                                </TabsTrigger>
                                <TabsTrigger value="recommendations">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {t('community.feed.recommendations', 'Recomendaciones')}
                                </TabsTrigger>
                                <TabsTrigger value="social">
                                    <Users className="h-4 w-4 mr-2" />
                                    {t('navigation.social_network', 'Mi Círculo')}
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

                        <TabsContent value="social" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {t('navigation.social_network', 'Mi Círculo')}
                                </h3>
                            </div>
                            <SocialPanel neighborhood={neighborhoodName} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
