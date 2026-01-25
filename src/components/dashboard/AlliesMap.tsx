'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Search, Heart, Star, Ticket } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getAllCoupons } from '@/app/actions/coupons';

const DiciloMap = dynamic(() => import('@/components/dicilo-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
});

const db = getFirestore(app);

interface AlliesMapProps {
    userInterests: string[];
    userId: string; // Necesario para guardar favoritos
    onNavigateToSettings: () => void;
}

export function AlliesMap({ userInterests, userId, onNavigateToSettings }: AlliesMapProps) {
    const { toast } = useToast();
    const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
    const [categoriesData, setCategoriesData] = useState<any[]>([]);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([51.1657, 10.4515]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Coupon Search Logic
    const [showCouponsOnly, setShowCouponsOnly] = useState(false);
    const [couponBusinessIds, setCouponBusinessIds] = useState<string[]>([]);
    const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Cargar favoritos del usuario
                if (userId) {
                    const userDoc = await getDoc(doc(db, 'private_profiles', userId));
                    if (userDoc.exists()) setFavoriteIds(userDoc.data().favorites || []);
                }

                // 2. Cargar Categorías
                const catSnapshot = await getDocs(collection(db, 'categories'));
                setCategoriesData(catSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

                // 3. Cargar Clientes con limpieza de datos profunda
                const snapshot = await getDocs(collection(db, 'clients'));
                const results = snapshot.docs.map(doc => {
                    const data = doc.data();
                    let coords: [number, number] = [51.505, -0.09]; // Fallback
                    if (data.coordinates) {
                        coords = Array.isArray(data.coordinates)
                            ? [Number(data.coordinates[0]), Number(data.coordinates[1])]
                            : [Number(data.coordinates.lat), Number(data.coordinates.lng)];
                    }
                    return {
                        id: doc.id,
                        ...data,
                        name: data.clientName || data.name || 'Empresa sin nombre',
                        position: coords,
                        coords: coords,
                        categoryNormalized: String(data.category || '').toLowerCase().trim()
                    };
                });
                setAllBusinesses(results);
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    // Función para manejar el filtro de cupones
    const toggleCouponFilter = async () => {
        const newValue = !showCouponsOnly;
        setShowCouponsOnly(newValue);

        if (newValue && couponBusinessIds.length === 0) {
            setIsLoadingCoupons(true);
            toast({ description: "Buscando aliados con cupones activos..." });
            try {
                const res = await getAllCoupons({ status: 'active' });
                if (res.success && res.coupons) {
                    // Extract unique company IDs from active coupons
                    const ids = Array.from(new Set(res.coupons.map((c: any) => c.companyId)));
                    setCouponBusinessIds(ids as string[]);
                    if (ids.length === 0) {
                        toast({ description: "No se encontraron cupones activos en este momento." });
                    } else {
                        toast({ description: `Se encontraron ${ids.length} aliados con ofertas.` });
                    }
                }
            } catch (error) {
                console.error("Error fetching coupons:", error);
                toast({ title: "Error", description: "No se pudieron cargar los cupones.", variant: "destructive" });
            } finally {
                setIsLoadingCoupons(false);
            }
        }
    };

    // Función para dar "Me gusta"
    const toggleFavorite = async (e: React.MouseEvent, businessId: string) => {
        e.stopPropagation();
        if (!userId) return;

        const isFavorite = favoriteIds.includes(businessId);
        const userRef = doc(db, 'private_profiles', userId);

        try {
            if (isFavorite) {
                await updateDoc(userRef, { favorites: arrayRemove(businessId) });
                setFavoriteIds(prev => prev.filter(id => id !== businessId));
            } else {
                await updateDoc(userRef, { favorites: arrayUnion(businessId) });
                setFavoriteIds(prev => [...prev, businessId]);
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo guardar en favoritos." });
        }
    };

    const getCategoryName = (identifier: string) => {
        if (!identifier) return '';
        const norm = identifier.toLowerCase().trim();
        const cat = categoriesData.find(c =>
            c.id.toLowerCase() === norm ||
            (c.name?.en && c.name.en.toLowerCase() === norm) ||
            (c.name?.es && c.name.es.toLowerCase() === norm) ||
            (c.name?.de && c.name.de.toLowerCase() === norm)
        );
        return cat?.name?.es || cat?.name?.en || identifier;
    };

    // FILTRADO INTELIGENTE
    const filteredBusinesses = useMemo(() => {
        const interestsNormalized = userInterests.map(i => i.toLowerCase().trim());

        return allBusinesses.filter(b => {
            // 0. Filtro de Cupones (Prioridad Alta)
            if (showCouponsOnly) {
                if (!couponBusinessIds.includes(b.id)) return false;
            }

            // Regla de Oro: Mostrar si está en intereses O si es favorito (Solo si NO estamos filtrando por cupones exclusivamente)
            // Si estamos en modo cupones, ya filtramos arriba. Si queremos que respete intereses DENTRO de cupones, descomentar logica.
            // Asumo que "Buscar Cupones" es un modo global "Ver ofertas".

            if (!showCouponsOnly) {
                const isMatchInterest = interestsNormalized.includes(b.categoryNormalized);
                const isFavorite = favoriteIds.includes(b.id);
                if (!isMatchInterest && !isFavorite) return false;
            }

            // Filtros adicionales de UI
            if (selectedCategory !== 'all' && b.categoryNormalized !== selectedCategory.toLowerCase()) return false;
            if (searchTerm) {
                return b.name.toLowerCase().includes(searchTerm.toLowerCase());
            }
            return true;
        });
    }, [allBusinesses, userInterests, favoriteIds, selectedCategory, searchTerm, showCouponsOnly, couponBusinessIds]);

    if (isLoading) return <div className="h-screen w-full flex items-center justify-center">Cargando ecosistema Dicilo...</div>;

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-white overflow-hidden relative">

            {/* LISTA LATERAL */}
            <div className="w-full md:w-[400px] flex flex-col border-r bg-white z-10 shadow-2xl">
                <div className="p-4 bg-slate-50 border-b space-y-3">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        Mi Selección <Star className="fill-yellow-400 text-yellow-400 h-5 w-5" />
                    </h2>

                    <Input
                        placeholder="Buscar en mis favoritos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white"
                    />

                    <div className="flex gap-2">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="bg-white flex-1">
                                <SelectValue placeholder="Filtrar por interés" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos mis intereses</SelectItem>
                                {userInterests.map(cat => (
                                    <SelectItem key={cat} value={cat}>{getCategoryName(cat)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* BUTTON RESTORED */}
                    <Button
                        variant={showCouponsOnly ? "default" : "secondary"}
                        className={cn(
                            "w-full shadow-sm transition-all",
                            showCouponsOnly
                                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                                : "bg-white border hover:bg-slate-50 text-slate-700"
                        )}
                        onClick={toggleCouponFilter}
                        disabled={isLoadingCoupons}
                    >
                        <Ticket className={cn("mr-2 h-4 w-4", showCouponsOnly && "fill-current")} />
                        {isLoadingCoupons ? "Buscando..." : (showCouponsOnly ? "Viendo Ofertas Activas" : "Ticket / Cupones")}
                    </Button>

                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                        {filteredBusinesses.length === 0 && (
                            <div className="text-center p-8 text-slate-400">
                                {showCouponsOnly ? (
                                    <p>No se encontraron aliados con cupones activos.</p>
                                ) : (
                                    <>
                                        <p>No hay empresas que coincidan con tus intereses actuales.</p>
                                        <Button variant="link" onClick={onNavigateToSettings}>Ajustar mis intereses</Button>
                                    </>
                                )}
                            </div>
                        )}
                        {filteredBusinesses.map(b => (
                            <div
                                key={b.id}
                                onClick={() => {
                                    setMapCenter(b.position);
                                    setSelectedBusinessId(b.id);
                                    toast({ description: `Ubicando: ${b.name}` });
                                }}
                                className={cn(
                                    "relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md flex gap-4",
                                    selectedBusinessId === b.id ? "border-primary bg-primary/5" : "border-slate-100"
                                )}
                            >
                                <div className="relative h-12 w-12 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-100">
                                    {(b.clientLogoUrl || b.imageUrl) ? (
                                        <Image
                                            src={b.clientLogoUrl || b.imageUrl}
                                            alt={b.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <MapPin className="m-auto h-6 w-6 text-slate-400 mt-3" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold truncate pr-6 flex items-center gap-2">
                                        {b.name}
                                        {/* Badge de Oferta si aplica */}
                                        {showCouponsOnly && <Ticket className="h-3 w-3 text-amber-500 fill-amber-500" />}
                                    </h4>
                                    <p className="text-xs text-primary font-semibold">{getCategoryName(b.category)}</p>
                                </div>
                                <button
                                    onClick={(e) => toggleFavorite(e, b.id)}
                                    className="absolute top-4 right-4"
                                >
                                    <Heart className={cn("h-5 w-5 transition-colors", favoriteIds.includes(b.id) ? "fill-red-500 text-red-500" : "text-slate-300")} />
                                </button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* MAPA FULL WIDTH */}
            <div className="flex-1 h-full w-full relative">
                <DiciloMap
                    center={mapCenter}
                    zoom={14}
                    businesses={filteredBusinesses}
                    selectedBusinessId={selectedBusinessId}
                    onMarkerClick={(id) => setSelectedBusinessId(id)}
                />
            </div>
        </div>
    );
}
