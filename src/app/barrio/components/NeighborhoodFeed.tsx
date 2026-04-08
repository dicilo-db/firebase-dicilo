'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Recommendation } from '@/types/recommendation';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Film, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MediaLightbox } from '@/components/community/MediaLightbox';
import { QuickHighlightForm } from '@/components/community/QuickHighlightForm';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface NeighborhoodFeedProps {
    neighborhood: string;
}

export default function NeighborhoodFeed({ neighborhood }: NeighborhoodFeedProps) {
    const { t } = useTranslation('common');
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedPostMedia, setSelectedPostMedia] = useState<any[]>([]);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(3);

    const displayNeighborhood = neighborhood.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const fetchFeed = async () => {
        setLoading(true);
        const db = getFirestore(app);
        try {
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (neighborhood) {
            fetchFeed();
        }
    }, [neighborhood]);

    const renderStars = (rating: number = 4) => {
        return (
            <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} 
                    />
                ))}
            </div>
        );
    };

    const visiblePosts = posts.slice(0, visibleCount);

    return (
        <div className="space-y-6">
            {/* Quick Highlight Form on top */}
            <QuickHighlightForm neighborhood={neighborhood} onSuccess={fetchFeed} />

            {loading ? (
                <div className="text-center py-10">{t('community.feed.loading', 'Cargando actividad...')}</div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-lg p-10 text-center shadow-sm border border-dashed border-gray-200">
                    <p className="text-gray-500 text-lg">{t('community.feed.empty_businesses', 'Aún no hay empresas destacadas recientemente en {{city}}.', { city: displayNeighborhood })}</p>
                    <p className="text-gray-400 text-sm mt-2">{t('community.feed.empty_businesses_prompt', '¡Utiliza la caja de arriba para ser el primero en destacar un negocio local!')}</p>
                </div>
            ) : (
                <>
                    <div className="space-y-6 max-h-[850px] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200">
                        {visiblePosts.map((post) => (
                            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                                {(post.media?.length > 0 || post.photoUrl) && (
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
                                )}
                                
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            {post.companyName && (
                                                <h4 className="font-bold text-lg text-slate-900 border-b border-dashed border-slate-200 pb-1 inline-block mb-2">
                                                    {post.companyName}
                                                </h4>
                                            )}
                                            {renderStars(post.rating || 4)}
                                        </div>
                                        <div className="text-right">
                                            <span className="font-semibold text-slate-700 block text-sm">{post.userName}</span>
                                            <span className="text-xs text-slate-400">
                                                {post.createdAt?.seconds ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : 'Reciente'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {(post.comment || post.comments) && (
                                        <p className="text-slate-600 text-sm whitespace-pre-wrap pt-2 border-t border-slate-50">&quot;{post.comment || post.comments}&quot;</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {posts.length > visibleCount && (
                        <div className="text-center pt-2">
                            <Button variant="outline" onClick={() => setVisibleCount(v => v + 3)} className="w-full sm:w-auto">
                                Cargar más reseñas de {displayNeighborhood}
                            </Button>
                        </div>
                    )}
                </>
            )}
            
            <MediaLightbox 
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                media={selectedPostMedia}
                initialIndex={selectedMediaIndex}
            />
        </div>
    );
}
