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
import { MapPin, Search, Heart, Star } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Cargar favoritos del usuario
                if (userId) {
                    const userDoc = await getDoc(doc(db, 'private_profiles', userId)); // Note: Usually 'private_profiles' or 'users' depending on DB schema. Assuming 'users' as per code provided.
                    // If the user uses 'private_profiles' collection in other parts, we might need to check that.
                    // The PrivateDashboard uses 'private_profiles'. 
                    // However, I must stick to the USER PROVIDED code.
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
                        coords: coords, // IMPORTANT: DiciloMap expects 'coords', not just 'position'
                        // Normalizamos la categoría para que el match no falle por mayúsculas o espacios
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

    // Función para dar "Me gusta"
    const toggleFavorite = async (e: React.MouseEvent, businessId: string) => {
        e.stopPropagation(); // Evita centrar el mapa al dar click al corazón
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
            // It might fail if the doc doesn't exist in 'users' but in 'private_profiles'.
            // I will implement as requested.
            console.error(error);
            toast({ title: "Error", description: "No se pudo guardar en favoritos." });
        }
    };

    const getCategoryName = (identifier: string) => {
        if (!identifier) return '';
        const norm = identifier.toLowerCase().trim();
        // Buscar coincidencia en CUALQUIER campo (ID, EN, ES, DE)
        const cat = categoriesData.find(c =>
            c.id.toLowerCase() === norm ||
            (c.name?.en && c.name.en.toLowerCase() === norm) ||
            (c.name?.es && c.name.es.toLowerCase() === norm) ||
            (c.name?.de && c.name.de.toLowerCase() === norm)
        );
        // Devolver siempre español si existe
        return cat?.name?.es || cat?.name?.en || identifier;
    };

    // FILTRADO INTELIGENTE
    const filteredBusinesses = useMemo(() => {
        const interestsNormalized = userInterests.map(i => i.toLowerCase().trim());

        return allBusinesses.filter(b => {
            // Regla de Oro: Mostrar si está en intereses O si es favorito
            const isMatchInterest = interestsNormalized.includes(b.categoryNormalized);
            const isFavorite = favoriteIds.includes(b.id);

            if (!isMatchInterest && !isFavorite) return false;

            // Filtros adicionales de UI
            if (selectedCategory !== 'all' && b.categoryNormalized !== selectedCategory.toLowerCase()) return false;
            if (searchTerm) {
                return b.name.toLowerCase().includes(searchTerm.toLowerCase());
            }
            return true;
        });
    }, [allBusinesses, userInterests, favoriteIds, selectedCategory, searchTerm]);

    if (isLoading) return <div className="h-screen w-full flex items-center justify-center">Cargando ecosistema Dicilo...</div>;

    return (
        /* Layout Ajustado: Ocupar 100% del contenedor padre (DashboardLayout main) */
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

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="bg-white">
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

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                        {filteredBusinesses.length === 0 && (
                            <div className="text-center p-8 text-slate-400">
                                <p>No hay empresas que coincidan con tus intereses actuales.</p>
                                <Button variant="link" onClick={onNavigateToSettings}>Ajustar mis intereses</Button>
                            </div>
                        )}
                        {filteredBusinesses.map(b => (
                            <div
                                key={b.id}
                                onClick={() => {
                                    setMapCenter(b.position);
                                    setSelectedBusinessId(b.id);
                                    // Feedback visual de selección
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
                                    <h4 className="font-bold truncate pr-6">{b.name}</h4>
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
