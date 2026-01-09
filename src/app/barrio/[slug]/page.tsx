import { getFirestore, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { Neighborhood } from '@/data/neighborhoods'; // Asumiendo que existe o lo creamos
import { HAMBURG_NEIGHBORHOODS } from '@/data/neighborhoods';
// Importar componentes de UI (Feed, Ranking) que crearemos

const db = getFirestore(app);

// Helper para buscar el barrio por slug o ID
function getNeighborhood(slug: string) {
    // Normalizar slug
    const normalized = slug.toLowerCase();
    return HAMBURG_NEIGHBORHOODS.find(n => n.id.toLowerCase() === normalized || n.name.toLowerCase() === normalized);
}

// 1. Ranking: Empresas con más recomendaciones aprobadas recientemente (o total)
async function getTrendingBusinesses(neighborhoodName: string) {
    try {
        const q = query(
            collection(db, 'businesses'),
            where('neighborhood', '==', neighborhoodName),
            limit(10)
        );
        // Nota: Para un ranking real por "puntos" necesitaríamos un campo indexado 'reputationScore' o similar.
        // Por ahora traemos los del barrio.
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error("Error fetching trending", e);
        return [];
    }
}

// 2. Feed: Recomendaciones recientes aprobadas en este barrio
// Esto es complejo porque las recomendaciones tienen businessId, no barrio directo.
// Opción A: Guardar 'neighborhood' en la recomendación (Denormalización - RECOMENDADO).
// Opción B: Query de businesses del barrio -> Query de recomendaciones (Inificiente).
// Vamos a asumir Opción A para el futuro, pero por ahora mostramos un placeholder o todas.

export default async function NeighborhoodPage({ params }: { params: { slug: string } }) {
    const neighborhood = getNeighborhood(params.slug);

    if (!neighborhood) {
        // Fallback o 404
        notFound();
    }

    const trending = await getTrendingBusinesses(neighborhood.name);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="bg-primary text-primary-foreground py-12">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-2">{neighborhood.name}</h1>
                    <p className="text-xl opacity-90">El pulso del barrio en tiempo real</p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Trending / Ranking */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">🏆 Tendencias en {neighborhood.name}</h2>
                        <ul>
                            {trending.length > 0 ? trending.map((biz: any, i) => (
                                <li key={biz.id} className="border-b last:border-0 py-3 flex items-center gap-3">
                                    <span className="font-bold text-slate-400 w-6">#{i + 1}</span>
                                    <div>
                                        <div className="font-bold">{biz.name}</div>
                                        <div className="text-xs text-slate-500">{biz.category}</div>
                                    </div>
                                </li>
                            )) : (
                                <p className="text-sm text-slate-500">Aún no hay tendencias.</p>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Right/Center Col: Live Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Lo que está pasando</h2>

                    {/* Placeholder for Feed Component */}
                    <div className="bg-white p-8 text-center rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">Las fotos y recomendaciones de la comunidad aparecerán aquí.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
