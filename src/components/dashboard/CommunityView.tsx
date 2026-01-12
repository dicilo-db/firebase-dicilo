'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarometerVisual } from '@/app/barrio/components/BarometerVisual';
import NeighborhoodFeed from '@/app/barrio/components/NeighborhoodFeed';
import { RecommendationFormContent } from '@/components/RecommendationForm';
import { ALL_NEIGHBORHOODS } from '@/data/neighborhoods';
import { PlusCircle, MapPin, Trophy, ChevronRight, MessageSquare } from 'lucide-react';

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

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommunityFeed } from '../community/CommunityFeed';
import { User } from 'firebase/auth';

export function CommunityView({ defaultNeighborhood = 'Hamburg', currentUser }: { defaultNeighborhood?: string, currentUser: User }) {
    const [neighborhoodName, setNeighborhoodName] = useState(defaultNeighborhood);
    const [stats, setStats] = useState<BarometerStats>({ score: 0, level: 'low', weeklyPosts: 0, activeUsers: 0 });
    const [trending, setTrending] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [validationError, setValidationError] = useState('');
    const [open, setOpen] = useState(false);

    const neighborhoodConfig = getNeighborhood(neighborhoodName);
    const isCity = neighborhoodConfig ? neighborhoodConfig.name === neighborhoodConfig.city : false;
    const subNeighborhoods = isCity && neighborhoodConfig ? getCityNeighborhoods(neighborhoodConfig.city) : [];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Trending Businesses
                const isCitySearch = neighborhoodName === 'Hamburg';
                let constraints: any[] = [];
                if (isCitySearch) {
                    constraints.push(where('city', '==', neighborhoodName));
                } else {
                    constraints.push(where('neighborhood', '==', neighborhoodName));
                }

                const qBusinesses = query(
                    collection(db, 'clients'),
                    ...constraints,
                    limit(20)
                );
                const snapBiz = await getDocs(qBusinesses);
                const businesses = snapBiz.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
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

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Tu Comunidad: {neighborhoodName}</h2>
                    <p className="text-muted-foreground text-lg mt-1">Explora lo que sucede en tu barrio y conecta con tus vecinos.</p>
                </div>

                {/* Create Recommendation Action */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-md transition-all hover:scale-105">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Nueva Recomendación
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Nueva Recomendación</DialogTitle>
                            <DialogDescription>
                                Comparte un lugar, servicio o experiencia con tus vecinos de {neighborhoodName}.
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
                        neighborhoodName={neighborhoodName}
                        activityLevel={stats.level}
                        score={stats.score}
                        weeklyPostCount={stats.weeklyPosts}
                        activeUsersCount={stats.activeUsers}
                    />

                    {/* Sub-neighborhoods Filter */}
                    {isCity && subNeighborhoods.length > 0 && (
                        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-blue-500" />
                                    Barrios de {neighborhoodName}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {subNeighborhoods.map(nb => (
                                        <Badge
                                            key={nb.id}
                                            variant="secondary"
                                            className="hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-colors px-3 py-1 text-sm"
                                            onClick={() => setNeighborhoodName(nb.name)}
                                        >
                                            {nb.name}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!isCity && neighborhoodConfig?.city && (
                        <Button
                            variant="outline"
                            className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => setNeighborhoodName(neighborhoodConfig.city)}
                        >
                            <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
                            Volver a {neighborhoodConfig.city}
                        </Button>
                    )}

                    {/* Ranking */}
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardHeader className="bg-slate-50/50 pb-4 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Top Empresas
                            </CardTitle>
                            <CardDescription>Negocios más recomendados</CardDescription>
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
                                        No hay suficientes datos para el ranking aún.
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
                                    Muro Social
                                </TabsTrigger>
                                <TabsTrigger value="recommendations">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Recomendaciones
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="wall" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <CommunityFeed
                                neighborhood={neighborhoodName}
                                userId={currentUser.uid}
                            />
                        </TabsContent>

                        <TabsContent value="recommendations" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    Lo que se comenta en {neighborhoodName}
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
