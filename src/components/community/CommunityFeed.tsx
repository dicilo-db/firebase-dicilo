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
}

export function CommunityFeed({ neighborhood, userId }: CommunityFeedProps) {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fetchPosts = async () => {
        if (!neighborhood) return;
        setLoading(true);
        setErrorMsg(null);
        try {
            const q = query(
                collection(db, 'community_posts'),
                where('neighborhood', '==', neighborhood),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
            const snapshot = await getDocs(q);
            const fetchedPosts: CommunityPost[] = [];
            snapshot.forEach((doc) => {
                fetchedPosts.push({ id: doc.id, ...doc.data() } as CommunityPost);
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
    }, [neighborhood]);

    // Expose fetchPosts to CreatePost for refresh
    const handlePostCreated = () => {
        fetchPosts();
    };

    if (errorMsg) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-6">
                <CreatePost
                    userId={userId}
                    neighborhood={neighborhood}
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
                neighborhood={neighborhood}
                onPostCreated={handlePostCreated}
            />

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
                        <p>No hay publicaciones aún en {neighborhood}.</p>
                        <p className="text-sm">¡Sé el primero en compartir algo!</p>
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
