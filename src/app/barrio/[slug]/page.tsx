import { getFirestore, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { Neighborhood, ALL_NEIGHBORHOODS } from '@/data/neighborhoods';

import { BarometerVisual } from '../components/BarometerVisual';
import NeighborhoodFeed from '../components/NeighborhoodFeed';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Helper types
interface BarometerStats {
    score: number;
    level: 'low' | 'medium' | 'high' | 'fire';
    weeklyPosts: number;
    activeUsers: number;
}

const db = getFirestore(app);

// Helper para buscar el barrio por slug o ID
function getNeighborhood(slug: string) {
    const normalized = slug.toLowerCase();
    return ALL_NEIGHBORHOODS.find(n => n.id.toLowerCase() === normalized || n.name.toLowerCase() === normalized);
}

function getCityNeighborhoods(city: string) {
    return ALL_NEIGHBORHOODS.filter(n => n.city === city && n.name !== city);
}

// 1. Ranking: Empresas con más recomendaciones aprobadas recientemente (o total)
async function getTrendingBusinesses(neighborhoodName: string) {
    try {
        // Determine search field based on context
        const isCitySearch = neighborhoodName === 'Hamburg';

        let constraints: any[] = [];

        if (isCitySearch) {
            constraints.push(where('city', '==', neighborhoodName));
        } else {
            constraints.push(where('neighborhood', '==', neighborhoodName));
        }

        const q = query(
            collection(db, 'clients'),
            ...constraints,
            limit(20)
        );

        const snap = await getDocs(q);
        const businesses = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        return businesses
            .sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0))
            .slice(0, 5);

    } catch (e) {
        console.error("Error fetching trending", e);
        return [];
    }
}

// 2. Calculate Barometer Stats
async function getBarometerStats(neighborhoodName: string): Promise<BarometerStats> {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let constraints: any[] = [];
        const isCitySearch = neighborhoodName === 'Hamburg';

        if (isCitySearch) {
            constraints.push(where('city', '==', neighborhoodName));
        } else {
            constraints.push(where('neighborhood', '==', neighborhoodName));
        }

        const q = query(
            collection(db, 'recommendations'),
            ...constraints,
            where('createdAt', '>=', sevenDaysAgo)
        );
        const snap = await getDocs(q);
        const weeklyPosts = snap.size;

        const uniqueAuthors = new Set(snap.docs.map(d => d.data().userId));
        const activeUsers = uniqueAuthors.size;

        let score = (weeklyPosts * 5) + (activeUsers * 10);
        if (score > 100) score = 100;

        let level: BarometerStats['level'] = 'low';
        if (score >= 80) level = 'fire';
        else if (score >= 50) level = 'high';
        else if (score >= 20) level = 'medium';

        return { score, level, weeklyPosts, activeUsers };

    } catch (e) {
        console.error("Error stats", e);
        return { score: 0, level: 'low', weeklyPosts: 0, activeUsers: 0 };
    }
}

export default async function NeighborhoodPage({ params }: { params: { slug: string } }) {
    const neighborhood = getNeighborhood(params.slug);

    if (!neighborhood) {
        notFound();
    }

    const isCity = neighborhood.name === neighborhood.city;
    const subNeighborhoods = isCity ? getCityNeighborhoods(neighborhood.city) : [];

    const trending = await getTrendingBusinesses(neighborhood.name);
    const stats = await getBarometerStats(neighborhood.name);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <div className="text-sm uppercase tracking-widest text-muted-foreground mb-1">Tu Comunidad</div>
                        <h1 className="text-3xl font-bold text-primary">{neighborhood.name}</h1>
                    </div>
                    <div className="flex gap-2">
                        {/* Actions could go here */}
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Col: Info & Ranking (4 cols) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* VISUAL BAROMETER */}
                    <BarometerVisual
                        neighborhoodName={neighborhood.name}
                        activityLevel={stats.level}
                        score={stats.score}
                        weeklyPostCount={stats.weeklyPosts}
                        activeUsersCount={stats.activeUsers}
                    />

                    {/* CITY: SUB-NEIGHBORHOODS FILTER */}
                    {isCity && subNeighborhoods.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border p-4">
                            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                                🗺️ Barrios de {neighborhood.city}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {subNeighborhoods.map(nb => (
                                    <Link key={nb.id} href={`/barrio/${nb.id}`}>
                                        <Badge variant="secondary" className="hover:bg-primary hover:text-white cursor-pointer transition-colors">
                                            {nb.name}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RANKING CARD */}
                    <div className="bg-white rounded-lg shadow-sm border p-0 overflow-hidden">
                        <div className="p-4 border-b bg-slate-50">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                🏆 Top Empresas
                            </h2>
                            <p className="text-xs text-muted-foreground">Negocios más recomendados</p>
                        </div>
                        <ul className="divide-y">
                            {trending.length > 0 ? trending.map((biz: any, i) => (
                                <li key={biz.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                    <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                    ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            i === 1 ? 'bg-slate-100 text-slate-700' :
                                                i === 2 ? 'bg-orange-100 text-orange-800' : 'text-slate-500'}
                                `}>
                                        #{i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate">{biz.clientName || biz.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            {biz.category}
                                            {biz.reputationScore && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{biz.reputationScore} pts</Badge>}
                                        </div>
                                    </div>
                                    <Link href={`/client/${biz.slug || biz.id}`}>
                                        <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">Ver</Badge>
                                    </Link>
                                </li>
                            )) : (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No hay suficientes datos para el ranking aún.
                                </div>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Right/Center Col: Live Feed (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-800">Lo que está pasando</h2>
                        <Link href="/verzeichnis">
                            <Badge className="cursor-pointer">Nueva Recomendación +</Badge>
                        </Link>
                    </div>

                    <NeighborhoodFeed neighborhood={neighborhood.name} />
                </div>
            </div>
        </div>
    );
}
