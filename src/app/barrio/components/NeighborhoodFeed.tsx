'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Recommendation } from '@/types/recommendation';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NeighborhoodFeedProps {
    neighborhood: string;
}

export default function NeighborhoodFeed({ neighborhood }: NeighborhoodFeedProps) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            const db = getFirestore(app);
            try {
                // Query: Recommendations in this neighborhood, approved, sorted by date
                // Requires Composite Index in Firestore (neighborhood ASC, createdAt DESC)
                const q = query(
                    collection(db, 'recommendations'),
                    where('neighborhood', '==', neighborhood),
                    where('status', '==', 'approved'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );

                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setPosts(data);
            } catch (error) {
                console.error("Error loading feed:", error);
            } finally {
                setLoading(false);
            }
        };

        if (neighborhood) {
            fetchFeed();
        }
    }, [neighborhood]);

    if (loading) return <div className="text-center py-10">Cargando actividad...</div>;

    if (posts.length === 0) {
        return (
            <div className="bg-white rounded-lg p-10 text-center shadow-sm border border-dashed border-gray-200">
                <p className="text-gray-500 text-lg">Aún no hay actividad reciente en {neighborhood}.</p>
                <p className="text-gray-400 text-sm mt-2">¡Sé el primero en recomendar un lugar!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video relative bg-gray-100">
                        <Image
                            src={post.photoUrl}
                            alt={`Foto por ${post.userName}`}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-gray-900">{post.userName}</span>
                            <span className="text-xs text-gray-400">
                                {post.createdAt?.seconds ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : 'Reciente'}
                            </span>
                        </div>
                        {post.comment && (
                            <p className="text-gray-700 text-sm italic">"{post.comment}"</p>
                        )}
                        {/* Optional: Show business name linked */}
                    </div>
                </div>
            ))}
        </div>
    );
}
