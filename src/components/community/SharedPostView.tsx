'use client';

import React, { useEffect, useState } from 'react';
import { CommunityPost } from '@/types/community';
import { PostCard } from './PostCard';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SharedPostViewProps {
    post: CommunityPost;
}

export function SharedPostView({ post }: SharedPostViewProps) {
    const { t } = useTranslation('common');
    const auth = getAuth(app);
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUserId(user?.uid || null);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [auth]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-4">
            {/* Back Button */}
            <Button 
                variant="ghost" 
                className="mb-2" 
                onClick={() => userId ? router.push('/dashboard') : router.push('/')}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {userId ? t('back_to_dashboard', 'Volver al Dashboard') : t('back_to_home', 'Volver al Inicio')}
            </Button>

            {/* The Post */}
            <PostCard 
                post={post} 
                currentUserId={userId || ""} 
                readOnly={!userId} 
            />

            {/* Guest CTA */}
            {!userId && (
                <Card className="border-dashed border-2 bg-slate-50 dark:bg-slate-900 border-primary/20">
                    <CardContent className="p-6 text-center space-y-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {t('community.join_to_discuss', '¿Te gusta lo que ves? Únete a la comunidad.')}
                        </h3>
                        <p className="text-muted-foreground">
                            {t('community.cta_desc', 'Inicia sesión para dar Like, comentar y conectar con tus vecinos de ' + post.neighborhood + '.')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            <Button size="lg" onClick={() => router.push('/login')}>
                                <LogIn className="mr-2 h-4 w-4" />
                                {t('login.title', 'Iniciar Sesión')}
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => router.push('/registrieren')}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                {t('login.registerPrefix', 'Registrarse')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
