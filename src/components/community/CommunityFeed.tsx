'use client';

import React, { useEffect, useState } from 'react';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { CommunityPost } from '@/types/community';
import { getFirestore, collection, query, where, orderBy, onSnapshot, limit, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

const db = getFirestore(app);

interface CommunityFeedProps {
    neighborhood: string;
    userId: string;
    mode?: 'public' | 'private';
    friendIds?: string[];
}

import { useTranslation } from 'react-i18next';

export function CommunityFeed({ neighborhood, userId, mode = 'public', friendIds = [] }: CommunityFeedProps) {
    const { t } = useTranslation('common');
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);

    // Simple Title Case Helper
    const displayNeighborhood = React.useMemo(() => {
        return neighborhood.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }, [neighborhood]);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fetchPosts = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            let q;

            if (mode === 'public') {
                if (!neighborhood) return;
                // Public Wall: Location Based
                q = query(
                    collection(db, 'community_posts'),
                    where('neighborhood', '==', neighborhood),
                    // where('visibility', '!=', 'private'), // Optional: if index exists. 
                    // For now, we assume neighborhood-linked posts are public.
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
            } else {
                // Private Circle: Friend Graph Based
                // Logic: Visibility 'private' AND Author in [friends + self]

                // Initialize with friends or empty array
                const safeFriendIds = friendIds ? friendIds.slice(0, 30) : [];

                // ALWAYS include MY own posts in my private feed
                if (userId && !safeFriendIds.includes(userId)) {
                    safeFriendIds.push(userId);
                }

                q = query(
                    collection(db, 'community_posts'),
                    where('visibility', '==', 'private'),
                    where('userId', 'in', safeFriendIds),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );

                // Also include MY own posts
                if (userId && !safeFriendIds.includes(userId)) {
                    safeFriendIds.push(userId);
                }

                q = query(
                    collection(db, 'community_posts'),
                    where('visibility', '==', 'private'),
                    where('userId', 'in', safeFriendIds),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
            }

            const snapshot = await getDocs(q);
            const fetchedPosts: CommunityPost[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Client-side safety double-check
                if (mode === 'public' && data.visibility === 'private') return;

                fetchedPosts.push({ id: doc.id, ...data } as CommunityPost);
            });
            setPosts(fetchedPosts);
        } catch (error: any) {
            console.error("Error fetching community posts:", error);
            if (error.code === 'failed-precondition') {
                setErrorMsg(`Falta el índice. Copia este enlace: ${error.message}`);
            } else {
                setErrorMsg(`Error: ${error.message} (Code: ${error.code})`);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [neighborhood, mode, JSON.stringify(friendIds)]);

    // Expose fetchPosts to CreatePost for refresh
    const handlePostCreated = () => {
        fetchPosts();
    };

    if (errorMsg) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-6">
                <CreatePost
                    userId={userId}
                    neighborhood={displayNeighborhood}
                    neighborhoodId={neighborhood} // Pass original for ID
                    onPostCreated={handlePostCreated}
                />
                <div className="bg-red-50 text-red-800 p-4 rounded-md border border-red-200">
                    <p className="font-bold">Error de Configuración</p>
                    <p>{errorMsg}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <CreatePost
                userId={userId}
                neighborhood={displayNeighborhood}
                neighborhoodId={neighborhood} // Pass strict ID for backend
                onPostCreated={handlePostCreated}
                mode={mode}
            />

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
                        <p>{t('community.feed.empty', `Aún no hay actividad reciente en ${displayNeighborhood}.`, { name: displayNeighborhood })}</p>
                        <p className="text-sm">{t('community.feed.be_first', '¡Sé el primero en compartir algo!')}</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={userId}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
