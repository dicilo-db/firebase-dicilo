'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Recommendation } from '@/types/recommendation';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Film } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MediaLightbox } from '@/components/community/MediaLightbox';

interface NeighborhoodFeedProps {
    neighborhood: string;
}

import { useTranslation } from 'react-i18next';

export default function NeighborhoodFeed({ neighborhood }: NeighborhoodFeedProps) {
    const { t } = useTranslation('common');
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedPostMedia, setSelectedPostMedia] = useState<any[]>([]);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

    // Capitalize for display
    const displayNeighborhood = neighborhood.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

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
            } catch (error: any) {
                console.error("Error loading feed:", error);
                if (error.code === 'failed-precondition') {
                    console.error("Missing Index? Check Firestore console.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (neighborhood) {
            fetchFeed();
        }
    }, [neighborhood]);

    if (loading) return <div className="text-center py-10">{t('community.feed.loading', 'Cargando actividad...')}</div>;

    if (posts.length === 0) {
        return (
            <div className="bg-white rounded-lg p-10 text-center shadow-sm border border-dashed border-gray-200">
                <p className="text-gray-500 text-lg">{t('community.feed.empty', `Aún no hay actividad reciente en ${displayNeighborhood}.`, { name: displayNeighborhood })}</p>
                <p className="text-gray-400 text-sm mt-2">{t('community.feed.be_first', '¡Sé el primero en recomendar un lugar!')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 cursor-pointer" onClick={() => {
                        const media = post.media && post.media.length > 0 ? post.media : (post.photoUrl ? [{ type: 'image', url: post.photoUrl }] : []);
                        if (media.length > 0) {
                            setSelectedPostMedia(media);
                            setSelectedMediaIndex(0);
                            setLightboxOpen(true);
                        }
                    }}>
                        {post.media && post.media.length > 0 ? (
                            post.media[0].type === 'image' ? (
                                <Image
                                    src={post.media[0].url}
                                    alt={`Foto por ${post.userName}`}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <video
                                    src={post.media[0].url}
                                    controls
                                    className="w-full h-full object-contain bg-black"
                                />
                            )
                        ) : post.photoUrl ? (
                            <Image
                                src={post.photoUrl}
                                alt={`Foto por ${post.userName}`}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Film className="h-10 w-10 opacity-20" />
                            </div>
                        )}
                        {post.media && post.media.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                                +{post.media.length - 1}
                            </div>
                        )}
                    </div>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-gray-900">{post.userName}</span>
                            <span className="text-xs text-gray-400">
                                {post.createdAt?.seconds ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : 'Reciente'}
                            </span>
                        </div>
                        {post.comment && (
                            <p className="text-gray-700 text-sm italic">&quot;{post.comment}&quot;</p>
                        )}
                        {/* Optional: Show business name linked */}
                    </div>
                </div>
            ))}
            
            <MediaLightbox 
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                media={selectedPostMedia}
                initialIndex={selectedMediaIndex}
            />
        </div>
    );
}
