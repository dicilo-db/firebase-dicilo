'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Home, Sparkles, RefreshCw, Loader2, MessageCircle, MapPin, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { translateText } from '@/app/actions/translate';

const db = getFirestore(app);

export function TrustBoardFeed({ neighborhood, activeCategory }: { neighborhood: string, activeCategory: string }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [translatingId, setTranslatingId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const { t, i18n } = useTranslation('common');
    const { user } = useAuth();
    const { toast } = useToast();
    const currentLang = i18n.language.substring(0, 2);

    useEffect(() => {
        if (!neighborhood) return;

        // Check if user is admin
        if (user) {
            getDoc(doc(db, 'private_profiles', user.uid)).then(snap => {
                if (snap.exists()) {
                    const r = snap.data().role;
                    if (r === 'admin' || r === 'superadmin' || user.email === 'superadmin@dicilo.net') {
                        setIsAdmin(true);
                    }
                }
            });
        }

        setLoading(true);
        const postsRef = collection(db, 'trustboard_posts');
        
        let q;
        if (activeCategory === 'all') {
            q = query(
                postsRef,
                where('neighborhood', '==', neighborhood),
                where('status', '==', 'approved'),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
        } else {
            q = query(
                postsRef,
                where('neighborhood', '==', neighborhood),
                where('category', '==', activeCategory),
                where('status', '==', 'approved'),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPosts(data);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching trustboard posts:', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [neighborhood, activeCategory]);

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'jobs': return <Briefcase className="h-4 w-4" />;
            case 'living': return <Home className="h-4 w-4" />;
            case 'talent': return <Sparkles className="h-4 w-4" />;
            case 'swap': return <RefreshCw className="h-4 w-4" />;
            default: return null;
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'jobs': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'living': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'talent': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'swap': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const handleForceTranslate = async (post: any) => {
        setTranslatingId(post.id);
        try {
            const spanishTitle = post.title?.es || post.title?.en;
            const spanishDesc = post.description?.es || post.description?.en;
            
            // Translate to English and German using the AI action as an example
            // In a production environment, this might call multiple languages
            const titleEn = await translateText(spanishTitle, 'English');
            const titleDe = await translateText(spanishTitle, 'German');
            const descEn = await translateText(spanishDesc, 'English');
            const descDe = await translateText(spanishDesc, 'German');

            const postRef = doc(db, 'trustboard_posts', post.id);
            await updateDoc(postRef, {
                'title.en': titleEn.translation || post.title.en,
                'title.de': titleDe.translation || post.title.de,
                'description.en': descEn.translation || post.description.en,
                'description.de': descDe.translation || post.description.de,
            });

            toast({ title: t('community.trustboard.admin.translated', 'Traducción Forzada Completada') });
        } catch (error) {
            toast({ title: t('community.trustboard.admin.translate_error', 'Error en Traducción'), variant: 'destructive' });
        } finally {
            setTranslatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-slate-50/50 mt-6">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <Sparkles className="w-12 h-12 mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                        {activeCategory === 'all' 
                            ? t('community.trustboard.empty_title', 'Comienza a construir el ecosistema local')
                            : t(`community.trustboard.empty_${activeCategory}_title`, '')}
                    </h3>
                    <p className="max-w-md mx-auto text-sm">
                        {activeCategory === 'all'
                            ? t('community.trustboard.empty_desc', 'Agrega anuncios de empleo, busca compañeros de cuarto, ofrece tus mentorías o regala cosas que ya no uses. Este tablón es exclusivo para residentes verificados de {{name}}.', { name: neighborhood })
                            : t(`community.trustboard.empty_${activeCategory}_desc`, '')}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {posts.map((post) => {
                const title = post.title?.[currentLang] || post.title?.es || t('community.trustboard.untitled', 'Sin Título');
                const description = post.description?.[currentLang] || post.description?.es || '';
                
                return (
                    <Card key={post.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                        <CardHeader className="p-4 pb-2 border-b bg-slate-50/50">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className={`flex items-center gap-1 ${getCategoryColor(post.category)}`}>
                                    {getCategoryIcon(post.category)}
                                    <span className="capitalize">{post.category}</span>
                                </Badge>
                                <span className="text-xs text-muted-foreground">Local</span>
                            </div>
                            <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight">
                                {title}
                            </h3>
                        </CardHeader>
                        
                        {post.imageUrl && (
                            <div className="relative w-full h-48 bg-slate-100 overflow-hidden border-b border-slate-100">
                                <img 
                                    src={post.imageUrl} 
                                    alt="TrustBoard Ad" 
                                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                                />
                                {post.media && post.media.length > 1 && (
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                                        1 / {post.media.length}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <CardContent className="p-4 flex-1">
                            <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed">
                                {description}
                            </p>
                            
                            <div className="mt-4 flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <img src={`https://ui-avatars.com/api/?name=${post.authorName}&background=random`} alt={post.authorName} />
                                </Avatar>
                                <span className="text-xs font-medium text-slate-700">{post.authorName}</span>
                            </div>
                        </CardContent>
                        
                        <CardFooter className="p-3 bg-slate-50 border-t flex justify-between items-center gap-2">
                            <div className="flex items-center text-xs text-slate-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                {post.neighborhood}
                            </div>
                            
                            <div className="flex gap-2 isolate">
                                {isAdmin && (
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-8 text-xs font-medium border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                                        disabled={translatingId === post.id}
                                        onClick={() => handleForceTranslate(post)}
                                    >
                                        {translatingId === post.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Languages className="h-3 w-3 mr-1" />}
                                        {t('community.trustboard.admin.translate_btn', 'Traducir (Admin)')}
                                    </Button>
                                )}
                                {user && post.authorId !== user.uid ? (
                                    <Button size="sm" variant="outline" className="h-8 text-xs font-medium border-primary/20 text-primary hover:bg-primary/5">
                                        <MessageCircle className="h-3 w-3 mr-1" />
                                        {t('community.trustboard.connect', 'Conectar')}
                                    </Button>
                                ) : null}
                            </div>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
