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
import { SuggestLocationDialog } from '@/components/community/SuggestLocationDialog';
import { SocialPanel } from './social/SocialPanel';
import { TrustBoardGuard } from '../community/trustboard/TrustBoardGuard';
import { TrustBoardView } from '../community/trustboard/TrustBoardView';
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

export function CommunityView({ defaultNeighborhood = 'Hamburg', currentUser }: { defaultNeighborhood?: string, currentUser: User | null }) {
    const isReadOnly = !currentUser;
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlNeighborhood = searchParams?.get('neighborhood');

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
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set('neighborhood', name);
        router.push(`?${params.toString()}`, { scroll: false });
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

    const currentCity = useMemo(() => {
        return isCity ? neighborhoodName : (neighborhoodConfig?.city || 'Hamburg');
    }, [isCity, neighborhoodName, neighborhoodConfig]);

    const [selectedCityFilter, setSelectedCityFilter] = useState(currentCity);

    // Sync selectedCityFilter when currentCity changes
    useEffect(() => {
        setSelectedCityFilter(currentCity);
    }, [currentCity]);

    // Unique active cities in the system
    const activeCities = useMemo(() => {
        const cities = new Set<string>();
        ALL_NEIGHBORHOODS.forEach(n => {
            if (n.city) cities.add(n.city);
        });
        dbNeighborhoods.forEach(n => {
            const cityVal = n.city || (n.type === 'ciudad' ? n.name : null);
            if (cityVal) cities.add(cityVal);
        });
        return Array.from(cities).sort((a, b) => a.localeCompare(b));
    }, [dbNeighborhoods]);

    // Country list for registration modal
    const [countries, setCountries] = useState<any[]>([]);

    useEffect(() => {
        const loadCountries = async () => {
            const { getLocations } = await import('@/app/actions/admin-locations');
            const res = await getLocations();
            if (res.success && res.data) {
                setCountries(res.data);
                if (res.data.length > 0) {
                    const defaultCountry = res.data.find(d => d.countryCode === 'DE' || d.countryName === 'Alemania') || res.data[0];
                    setNewCountryName(defaultCountry.countryName);
                }
            }
        };
        if (registerOpen && countries.length === 0) {
            loadCountries();
        }
    }, [registerOpen, countries.length]);

    // Autocomplete search results
    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.trim().toLowerCase();
        
        // 1. Match cities
        const cityMatches = activeCities
            .filter(c => c.toLowerCase().includes(term))
            .map(c => ({ id: `city-${c}`, name: c, type: 'ciudad' }));
            
        // 2. Match neighborhoods
        const neighborhoodMatches: any[] = [];
        const seenNames = new Set<string>();
        
        ALL_NEIGHBORHOODS.forEach(n => {
            if (n.name.toLowerCase().includes(term)) {
                const key = `${n.name.toLowerCase()}-${n.city.toLowerCase()}`;
                if (!seenNames.has(key)) {
                    seenNames.add(key);
                    neighborhoodMatches.push({
                        id: `nb-${n.id}`,
                        name: n.name,
                        city: n.city,
                        type: 'barrio'
                    });
                }
            }
        });
        
        dbNeighborhoods.forEach(n => {
            if (n.name.toLowerCase().includes(term) && n.type !== 'pais' && n.type !== 'ciudad') {
                const key = `${n.name.toLowerCase()}-${(n.city || '').toLowerCase()}`;
                if (!seenNames.has(key)) {
                    seenNames.add(key);
                    neighborhoodMatches.push({
                        id: `nb-${n.id}`,
                        name: n.name,
                        city: n.city,
                        type: 'barrio'
                    });
                }
            }
        });
        
        return [...cityMatches, ...neighborhoodMatches];
    }, [searchTerm, activeCities, dbNeighborhoods]);



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
                    
                    // Push Country itself
                    if (data.name) {
                        newSystemDocs.push({
                            id: data.name,
                            name: data.name,
                            city: data.name,
                            type: 'pais',
                            location: null
                        });
                    }

                    // Flatten Country -> Cities -> Districts
                    if (data.cities) {
                        data.cities.forEach((cityObj: any) => {
                            // Enlazar datos de /admin/locations: Mostrar ciudades en la lista
                            newSystemDocs.push({
                                id: cityObj.name,
                                name: cityObj.name,
                                city: cityObj.name,
                                type: 'ciudad',
                                location: null
                            });

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
        const cityToFilter = selectedCityFilter;

        // Base list from static config (filtered by selected city)
        const base = ALL_NEIGHBORHOODS.filter(n => n.city === cityToFilter && n.name !== cityToFilter);

        const merged = [...base];

        dbNeighborhoods.forEach(dbN => {
            const isSameCity = dbN.city === cityToFilter;
            if (isSameCity) {
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
                    let nLat = n.lat;
                    let nLng = n.lng;

                    if (n.location) {
                        nLat = n.location.lat || n.location.latitude || nLat;
                        nLng = n.location.lng || n.location.longitude || nLng;
                    }

                    if (nLat && nLng) {
                        return { ...n, distance: getDistance(userLocation.lat, userLocation.lng, nLat, nLng) };
                    }
                    return { ...n, distance: 999999 };
                })
                .sort((a, b) => a.distance - b.distance);
        }

        return merged.sort((a, b) => a.name.localeCompare(b.name));

    }, [selectedCityFilter, dbNeighborhoods, userLocation]);

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

    const [favoriteNeighborhood, setFavoriteNeighborhoodName] = useState<string | null>(null);

    // Listen for favorite status
    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(doc(db, 'private_profiles', currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const favName = data.favoriteNeighborhood || null;
                setFavoriteNeighborhoodName(favName);

                const currentNorm = neighborhoodName.toLowerCase();
                const favNorm = (favName || '').toLowerCase();
                setIsFavorite(currentNorm === favNorm && favNorm !== '');
            }
        });
        return () => unsub();
    }, [neighborhoodName, currentUser]);

    // Handle Favorite Toggle
    const handleToggleFavorite = async () => {
        if (isReadOnly) {
            toast({ title: t('common:login.required', 'Inicio de sesión requerido'), description: 'Regístrate para guardar tu barrio favorito.' });
            return;
        }
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
                // 1. Trending Businesses (Fetch both City and Neighborhood matches for robustness)
                const qCityBiz = query(collection(db, 'clients'), where('city', '==', neighborhoodName), limit(20));
                const qNeighBiz = query(collection(db, 'clients'), where('neighborhood', '==', neighborhoodName), limit(20));

                const [snapCityBiz, snapNeighBiz] = await Promise.all([
                    getDocs(qCityBiz),
                    getDocs(qNeighBiz)
                ]);

                const bizMap = new Map();
                snapCityBiz.docs.forEach(d => bizMap.set(d.id, { id: d.id, ...d.data() }));
                snapNeighBiz.docs.forEach(d => bizMap.set(d.id, { id: d.id, ...d.data() }));
                
                const businesses = Array.from(bizMap.values()) as any[];

                // Simple client-side sort for demo (better DB index `orderBy` in prod)
                const sortedBiz = businesses
                    .sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0))
                    .slice(0, 5);

                setTrending(sortedBiz);

                // 2. Barometer Stats (Using Community Posts + Recommendations)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                // Query 1: Recommendations (City or Neighborhood)
                const qRecsCity = query(collection(db, 'recommendations'), where('city', '==', neighborhoodName), where('createdAt', '>=', sevenDaysAgo));
                const qRecsNeigh = query(collection(db, 'recommendations'), where('neighborhood', '==', neighborhoodName), where('createdAt', '>=', sevenDaysAgo));

                // Query 2: Community Posts
                const qPostsCity = query(collection(db, 'community_posts'), where('city', '==', neighborhoodName), where('createdAt', '>=', sevenDaysAgo));
                const qPostsNeigh = query(collection(db, 'community_posts'), where('neighborhood', '==', neighborhoodName), where('createdAt', '>=', sevenDaysAgo));
                
                const [snapRecsCity, snapRecsNeigh, snapPostsCity, snapPostsNeigh] = await Promise.all([
                    getDocs(qRecsCity), getDocs(qRecsNeigh),
                    getDocs(qPostsCity), getDocs(qPostsNeigh)
                ]);

                const recsMap = new Map();
                snapRecsCity.docs.forEach(d => recsMap.set(d.id, d.data()));
                snapRecsNeigh.docs.forEach(d => recsMap.set(d.id, d.data()));

                const postsMap = new Map();
                snapPostsCity.docs.forEach(d => postsMap.set(d.id, d.data()));
                snapPostsNeigh.docs.forEach(d => postsMap.set(d.id, d.data()));

                const totalPosts = recsMap.size + postsMap.size;
                const uniqueAuthors = new Set([
                    ...Array.from(recsMap.values()).map((d: any) => d.userId),
                    ...Array.from(postsMap.values()).map((d: any) => d.userId)
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
        if (!newNeighborhoodName.trim() || !currentUser) return;
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
                    updateNeighborhood(result.name); // Redirect using proper Name, NOT Slug
                } else if (result.created) {
                    toast({
                        title: "¡Barrio creado!",
                        description: result.message,
                        className: "bg-green-50 border-green-200"
                    });
                    setRegisterOpen(false);
                    setNewNeighborhoodName('');
                    setNewCountryName('');
                    updateNeighborhood(result.name); // Redirect using proper Name, NOT Slug
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

    const urlTab = searchParams?.get('tab');
    const [activeTab, setActiveTab] = useState(urlTab || "social");

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set('tab', value);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    // Hide sidebar for both Social Panel (Chats) and Wall (Feed) to provide full width space
    const isFullWidthTab = activeTab === 'social' || activeTab === 'wall' || activeTab === 'trustboard';

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
                            className={`rounded-full transition-all h-11 w-11 lg:h-10 lg:w-10 ${isFavorite ? 'text-pink-500 bg-pink-50 hover:bg-pink-100' : 'text-slate-400 hover:text-pink-400 hover:bg-slate-100'}`}
                            title={isFavorite ? t('community.actions.is_favorite', 'Es mi Barrio') : t('community.actions.set_favorite', 'Marcar como mi Barrio')}
                        >
                            <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                        </Button>
                    </div>
                    <p className="text-muted-foreground text-lg mt-1">{t('community.explore_desc', 'Explora lo que sucede en tu barrio y conecta con tus vecinos.')}</p>
                </div>

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
                                    {t('community.search_global', 'Explorar Comunidades')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                
                                {/* City Tabs Pills Selector */}
                                {activeCities.length > 0 && (
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 dark:border-slate-800">
                                        {activeCities.map(city => (
                                            <Button
                                                key={city}
                                                variant={selectedCityFilter === city ? "default" : "outline"}
                                                size="sm"
                                                className="rounded-full px-4 py-1 text-xs font-semibold whitespace-nowrap h-11 lg:h-7"
                                                onClick={() => {
                                                    setSelectedCityFilter(city);
                                                    updateNeighborhood(city);
                                                }}
                                            >
                                                <Building2 className="h-3 w-3 mr-1" />
                                                {city}
                                            </Button>
                                        ))}
                                    </div>
                                )}

                                {/* Search Bar & Autocomplete Popover */}
                                <div className="relative">
                                    <Input
                                        placeholder={t('community.search_neighborhoods_global', 'Buscar ciudad, barrio...')}
                                        className="pl-9 h-10 shadow-sm border-slate-200 dark:border-slate-800 focus-visible:ring-primary focus-visible:border-primary"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    
                                    {searchTerm.trim().length > 0 && (
                                        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                            
                                            {/* Cities Results */}
                                            {searchResults.filter(r => r.type === 'ciudad').length > 0 && (
                                                <div className="p-2 space-y-1">
                                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Ciudades</div>
                                                    {searchResults.filter(r => r.type === 'ciudad').map(city => (
                                                        <Button
                                                            key={city.id}
                                                            variant="ghost"
                                                            className="w-full justify-start text-left text-sm font-normal py-1.5 px-2.5 min-h-[44px] lg:min-h-0 h-auto text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                                            onClick={() => {
                                                                updateNeighborhood(city.name);
                                                                setSelectedCityFilter(city.name);
                                                                setSearchTerm('');
                                                            }}
                                                        >
                                                            <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                                                            <span>{city.name}</span>
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Neighborhoods Results */}
                                            {searchResults.filter(r => r.type === 'barrio').length > 0 && (
                                                <div className="p-2 space-y-1">
                                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Barrios</div>
                                                    {searchResults.filter(r => r.type === 'barrio').map(nb => (
                                                        <Button
                                                            key={nb.id}
                                                            variant="ghost"
                                                            className="w-full justify-start text-left text-sm font-normal py-1.5 px-2.5 min-h-[44px] lg:min-h-0 h-auto text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                                            onClick={() => {
                                                                updateNeighborhood(nb.name);
                                                                setSelectedCityFilter(nb.city);
                                                                setSearchTerm('');
                                                            }}
                                                        >
                                                            <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                                                            <div className="flex flex-col text-left">
                                                                <span>{nb.name}</span>
                                                                <span className="text-[10px] text-slate-400">{nb.city}</span>
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Founder Register Call-to-action */}
                                            {!isReadOnly && currentUser && (
                                                <div className="p-2">
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start text-left text-sm font-medium py-2 px-2.5 min-h-[44px] lg:min-h-0 h-auto text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                                        onClick={() => {
                                                            setNewNeighborhoodName(searchTerm);
                                                            setRegisterOpen(true);
                                                            setSearchTerm('');
                                                        }}
                                                    >
                                                        <PlusCircle className="h-4 w-4 mr-2 text-blue-500" />
                                                        <span>{t('community.search_dropdown.register_btn', { name: searchTerm })}</span>
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Empty Search State */}
                                            {searchResults.length === 0 && (
                                                <div className="p-4 text-center text-sm text-slate-500">
                                                    {t('community.search_dropdown.no_results', { term: searchTerm })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Quick Jump to Favorite Neighborhood */}
                                {favoriteNeighborhood && favoriteNeighborhood.toLowerCase() !== neighborhoodName.toLowerCase() && (
                                    <Button
                                        variant="outline"
                                        className="w-full text-pink-600 hover:text-pink-800 hover:bg-pink-50 dark:hover:bg-pink-950/20 mb-1 border-pink-200 dark:border-pink-900 text-xs h-11 lg:h-auto lg:py-1.5"
                                        onClick={() => updateNeighborhood(favoriteNeighborhood)}
                                    >
                                        <Heart className="h-3.5 w-3.5 mr-2 fill-current flex-shrink-0" />
                                        {t('community.jump_favorite', 'Ir a mi favorito:')} {favoriteNeighborhood}
                                    </Button>
                                )}

                                {/* Link back to City if in a neighborhood */}
                                {!isCity && (
                                    <Button
                                        variant="outline"
                                        className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 mb-1 text-xs h-11 lg:h-auto lg:py-1.5"
                                        onClick={() => updateNeighborhood(neighborhoodConfig?.city || 'Hamburg')}
                                    >
                                        <ChevronRight className="h-3.5 w-3.5 rotate-180 mr-2 flex-shrink-0" />
                                        {t('back', 'Volver a')} {neighborhoodConfig?.city || 'Hamburg'}
                                    </Button>
                                )}

                                {/* Compact Neighborhood List filtered by Active City */}
                                {subNeighborhoods.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                            <span className="flex items-center gap-1.5">
                                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                {selectedCityFilter}
                                            </span>
                                            <span className="font-normal lowercase">
                                                ({subNeighborhoods.length} barrios)
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-1 max-h-[260px] overflow-y-auto pr-1 border border-slate-100 dark:border-slate-800 rounded-lg p-1.5 bg-slate-50/50 dark:bg-slate-900/30">
                                            {subNeighborhoods.map(nb => {
                                                const isActive = nb.name.toLowerCase() === neighborhoodName.toLowerCase();
                                                const isFav = favoriteNeighborhood && favoriteNeighborhood.toLowerCase() === nb.name.toLowerCase();
                                                
                                                return (
                                                    <Button
                                                        key={nb.id}
                                                        variant={isActive ? "secondary" : "ghost"}
                                                        className={`
                                                            justify-start h-auto min-h-[44px] lg:min-h-0 py-1.5 px-2.5 text-xs font-normal
                                                            ${isActive
                                                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-l-4 border-slate-900 dark:border-slate-100 font-semibold shadow-sm"
                                                                : "hover:bg-white dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:shadow-sm"}
                                                        `}
                                                        onClick={() => updateNeighborhood(nb.name)}
                                                    >
                                                        <div className="flex w-full justify-between items-center">
                                                            <span className="flex items-center gap-1.5 truncate">
                                                                {nb.name}
                                                                {isFav && <Heart className="h-3 w-3 text-pink-500 fill-current flex-shrink-0" />}
                                                            </span>
                                                            {nb.distance && nb.distance < 100 && (
                                                                <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                                                                    {nb.distance < 1 ? `${Math.round(nb.distance * 1000)}m` : `${nb.distance.toFixed(1)}km`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Actions Trigger Footer */}
                                {!isReadOnly && currentUser && (
                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Button 
                                            variant="outline" 
                                            className="w-full text-xs text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 h-11 lg:h-9"
                                            onClick={() => {
                                                setNewNeighborhoodName('');
                                                setRegisterOpen(true);
                                            }}
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4 text-blue-500" />
                                            {t('community.register_neighborhood_btn', 'Registrar Barrio')}
                                        </Button>
                                        <SuggestLocationDialog currentUser={currentUser} />
                                    </div>
                                )}
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
                                                <Button variant="ghost" size="icon" className="h-11 w-11 lg:h-8 lg:w-8 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <TabsList className="flex overflow-x-auto scrollbar-none w-full lg:w-[600px] h-12 lg:h-auto p-1 gap-1 items-stretch justify-start lg:grid lg:grid-cols-4">
                                <TabsTrigger value="social" className="py-2 text-xs sm:text-sm whitespace-nowrap min-w-[90px] lg:min-w-0 h-full flex-shrink-0">
                                    <Users className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                    <span className="hidden sm:inline">{t('navigation.social_network', 'Mi Círculo')}</span>
                                    <span className="sm:hidden">Círculo</span>
                                </TabsTrigger>
                                <TabsTrigger value="recommendations" className="py-2 text-xs sm:text-sm whitespace-nowrap min-w-[90px] lg:min-w-0 h-full flex-shrink-0">
                                    <MapPin className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                    <span className="hidden sm:inline">{t('community.feed.recommendations', 'Recomendados')}</span>
                                    <span className="sm:hidden">Recoms</span>
                                </TabsTrigger>
                                <TabsTrigger value="wall" className="py-2 text-xs sm:text-sm whitespace-nowrap min-w-[90px] lg:min-w-0 h-full flex-shrink-0">
                                    <MessageSquare className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                    <span className="hidden sm:inline">{t('community.feed.wall', 'Muro Social')}</span>
                                    <span className="sm:hidden">Muro</span>
                                </TabsTrigger>
                                <TabsTrigger value="trustboard" className="py-2 text-xs sm:text-sm whitespace-nowrap min-w-[90px] lg:min-w-0 h-full flex-shrink-0 text-blue-700 bg-blue-50/50">
                                    <Search className="h-4 w-4 mr-1 sm:mr-2 text-blue-600 flex-shrink-0" />
                                    <span className="font-semibold">{t('navigation.trustboard', 'Pizarra')}</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="wall" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            {/* Pass selected neighborhood to feed */}
                            <CommunityFeed
                                neighborhood={neighborhoodName}
                                userId={currentUser?.uid || ''}
                            />
                        </TabsContent>

                        <TabsContent value="recommendations" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {t('community.feed.whats_happening', { name: displayNeighborhood })}
                                </h3>
                            </div>
                            <NeighborhoodFeed neighborhood={neighborhoodName} currentUser={currentUser} />
                        </TabsContent>

                        <TabsContent value="social" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {t('navigation.social_network', 'Mi Círculo')}
                                </h3>
                            </div>
                            {isReadOnly ? (
                                <div className="p-8 text-center bg-white rounded-xl border shadow-sm">
                                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Acceso a Círculo Privado</h4>
                                    <p className="text-slate-600 mb-4">Inicia sesión para conectar con personas en tu barrio.</p>
                                    <Button asChild><Link href="/registrieren">Crear Cuenta</Link></Button>
                                </div>
                            ) : (
                                <SocialPanel neighborhood={neighborhoodName} />
                            )}
                        </TabsContent>

                        <TabsContent value="trustboard" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Search className="h-5 w-5 text-blue-600" />
                                    {t('community.trustboard.tab_title', 'Mercado Local & Servicios')}
                                </h3>
                            </div>
                            <TrustBoardView neighborhood={neighborhoodName} readOnly={isReadOnly} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            
            {/* Modal de Registro de Barrio */}
            {!isReadOnly && currentUser && (
                <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle>{t('community.register_dialog.title', 'Registrar Nuevo Barrio')}</DialogTitle>
                            <DialogDescription>
                                {t('community.register_dialog.desc', 'Registra un barrio nuevo a través de Google Maps. Como creador, serás nombrado Fundador y recibirás una medalla especial.')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="register-neighborhood-name">{t('community.register_dialog.name_label', 'Nombre del Barrio / Distrito')}</Label>
                                <Input 
                                    id="register-neighborhood-name"
                                    placeholder="Ej. Sternschanze" 
                                    value={newNeighborhoodName} 
                                    onChange={e => setNewNeighborhoodName(e.target.value)} 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="register-country">{t('community.register_dialog.country_label', 'País')}</Label>
                                <select 
                                    id="register-country"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    value={newCountryName}
                                    onChange={e => setNewCountryName(e.target.value)}
                                >
                                    <option value="" disabled>Selecciona un país</option>
                                    {countries.map(loc => (
                                        <option key={loc.id} value={loc.countryName}>{loc.countryName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <DialogFooter className="mt-4 border-t pt-4 gap-2 sm:gap-0">
                            <Button variant="outline" className="h-11 lg:h-10" onClick={() => setRegisterOpen(false)}>{t('cancel', 'Cancelar')}</Button>
                            <Button 
                                onClick={handleRegisterNeighborhood} 
                                disabled={isRegistering || !newNeighborhoodName.trim() || !newCountryName}
                                className="h-11 lg:h-10"
                            >
                                {isRegistering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
                                {t('community.register_dialog.submit_btn', 'Verificar y Crear con Google Maps')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
