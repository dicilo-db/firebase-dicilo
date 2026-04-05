'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Home, Sparkles, RefreshCw, Loader2, MessageCircle, MapPin, Languages, Trash2, Share2, Send, Facebook, Twitter, Mail, Copy } from 'lucide-react';
import { deleteTrustBoardPost } from '@/app/actions/trustboard';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrustBoardPostForm } from './TrustBoardPostForm';
import { Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { translateText } from '@/app/actions/translate';

const db = getFirestore(app);

export function TrustBoardFeed({ neighborhood, activeCategory }: { neighborhood: string, activeCategory: string }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [indexError, setIndexError] = useState<string | null>(null);
    const [translatingId, setTranslatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingPost, setEditingPost] = useState<any | null>(null);
    const [viewingPost, setViewingPost] = useState<any | null>(null);
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
        setIndexError(null);
        const postsRef = collection(db, 'trustboard_posts');
        
        let q;
        if (activeCategory === 'all') {
            q = query(
                postsRef,
                where('neighborhood', '==', neighborhood),
                where('status', '==', 'approved'),
                limit(50)
            );
        } else {
            q = query(
                postsRef,
                where('neighborhood', '==', neighborhood),
                where('category', '==', activeCategory),
                where('status', '==', 'approved'),
                limit(50)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = Date.now();
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter((doc: any) => {
                if (!doc.endDate) return true;
                const end = doc.endDate._seconds ? doc.endDate._seconds * 1000 : doc.endDate.toMillis();
                return end > now;
            });
            data.sort((a: any, b: any) => {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA;
            });
            setPosts(data);
            setLoading(false);
        }, (err: any) => {
            console.error('Error fetching trustboard posts:', err);
            setIndexError(err.message);
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

    const handleSocialShare = async (platform: string, post: any) => {
        const domain = window.location.origin;
        // The router link would be what we want, currently just generic domain/post/id
        const url = `${domain}/trustboard/${post.id}?hood=${encodeURIComponent(neighborhood)}`;
        const title = post.title?.[currentLang] || post.title?.es || 'Anuncio';
        const text = `Mira este anuncio en Dicilo TrustBoard: ${title} - ${post.neighborhood}`;
        const textWithUrl = `${text} ${url}`;

        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(textWithUrl)}`, '_blank');
                break;
            case 'telegram':
                window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent(title + ' en Dicilo')}&body=${encodeURIComponent(textWithUrl)}`;
                break;
            case 'native':
                if (navigator.share) {
                    navigator.share({ title: 'Dicilo', text: text, url: url }).catch(console.error);
                } else {
                    toast({ description: "No soportado en este dispositivo.", variant: "destructive" });
                }
                break;
            case 'copy':
                try {
                    await navigator.clipboard.writeText(url);
                    toast({ description: t('community.link_copied', 'Enlace copiado al portapapeles') });
                } catch (err) {}
                break;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleDelete = async (postId: string) => {
        if (!user) return;
        if (!confirm('¿Estás seguro de que quieres eliminar este anuncio?')) return;
        
        setDeletingId(postId);
        const res = await deleteTrustBoardPost(postId, user.uid);
        setDeletingId(null);
        
        if (res.success) {
            toast({ title: 'Anuncio eliminado', description: 'El anuncio ha sido retirado existosamente.' });
        } else {
            toast({ title: 'Error', description: res.error || 'No se pudo eliminar.', variant: 'destructive' });
        }
    };

    if (indexError) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mt-6 border border-red-200 text-sm">
                <p className="font-bold mb-2">Error de Base de Datos:</p>
                <p>{indexError}</p>
                <p className="mt-2 text-xs">Si la base de datos está construyendo los índices, esto desaparecerá en unos minutos.</p>
            </div>
        );
    }

    if (!loading && posts.length === 0) {
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
        <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => {
                const title = post.title?.[currentLang] || post.title?.es || t('community.trustboard.untitled', 'Sin Título');
                const description = post.description?.[currentLang] || post.description?.es || '';
                
                const createdAt = post.createdAt?.toMillis() || Date.now();
                const canEdit = (Date.now() - createdAt) < 12 * 60 * 60 * 1000;

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
                            <div 
                                className="relative w-full h-48 bg-slate-100 overflow-hidden border-b border-slate-100 cursor-pointer"
                                onClick={() => setViewingPost(post)}
                            >
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
                        
                        <CardContent 
                            className="p-4 flex-1 cursor-pointer group"
                            onClick={() => setViewingPost(post)}
                        >
                            <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed group-hover:text-slate-900 transition-colors">
                                {description}
                            </p>
                            
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <img src={`https://ui-avatars.com/api/?name=${post.authorName}&background=random`} alt={post.authorName} />
                                    </Avatar>
                                    <span className="text-xs font-medium text-slate-700">{post.authorName}</span>
                                </div>
                                <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Ver más...</span>
                            </div>
                        </CardContent>
                        
                        <CardFooter className="p-3 bg-slate-50 border-t flex flex-wrap justify-between items-center gap-2">
                            <div className="flex items-center text-xs text-slate-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                {post.neighborhood}
                            </div>
                            
                            <div className="flex flex-wrap justify-end gap-2 isolate">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 flex gap-2 hover:text-green-600 bg-white border border-slate-200">
                                            <Share2 className="h-4 w-4" />
                                            <span className="text-xs">{t('community.share', 'Compartir')}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem onClick={() => handleSocialShare('whatsapp', post)} className="cursor-pointer gap-2">
                                            <MessageCircle className="h-4 w-4 text-green-500" />
                                            <span>WhatsApp</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('telegram', post)} className="cursor-pointer gap-2">
                                            <Send className="h-4 w-4 text-blue-400" />
                                            <span>Telegram</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('facebook', post)} className="cursor-pointer gap-2">
                                            <Facebook className="h-4 w-4 text-blue-600" />
                                            <span>Facebook</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('twitter', post)} className="cursor-pointer gap-2">
                                            <Twitter className="h-4 w-4 text-black dark:text-white" />
                                            <span>X (Twitter)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('email', post)} className="cursor-pointer gap-2">
                                            <Mail className="h-4 w-4 text-gray-600" />
                                            <span>Email</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleSocialShare('copy', post)} className="cursor-pointer gap-2">
                                            <Copy className="h-4 w-4" />
                                            <span>{t('community.copy_link', 'Copiar Enlace')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('native', post)} className="cursor-pointer gap-2">
                                            <Share2 className="h-4 w-4" />
                                            <span>... Más opciones...</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

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
                                <div className="flex flex-wrap justify-end gap-2">
                                    {user && post.authorId === user.uid && canEdit && (
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="h-8 text-xs font-medium border-slate-200 hover:bg-slate-50"
                                            onClick={() => setEditingPost(post)}
                                        >
                                            <Edit2 className="h-3 w-3 mr-1" />
                                            {t('common.edit', 'Editar')}
                                        </Button>
                                    )}
                                    {user && post.authorId === user.uid && (
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="h-8 text-xs font-medium border-red-200 text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(post.id)}
                                            disabled={deletingId === post.id}
                                        >
                                            {deletingId === post.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                                            {t('common.delete', 'Eliminar')}
                                        </Button>
                                    )}
                                    {user && post.authorId !== user.uid ? (
                                        <Button size="sm" variant="outline" className="h-8 text-xs font-medium border-primary/20 text-primary hover:bg-primary/5">
                                            <MessageCircle className="h-3 w-3 mr-1" />
                                            {t('community.trustboard.connect', 'Conectar')}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </CardFooter>
                    </Card>
                );
            })}
            </div>

            <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Anuncio</DialogTitle>
                        <DialogDescription>
                            Realiza los cambios necesarios en tu anuncio. Será revisado nuevamente.
                        </DialogDescription>
                    </DialogHeader>
                    {editingPost && (
                        <TrustBoardPostForm 
                            neighborhood={neighborhood} 
                            onSuccess={() => setEditingPost(null)} 
                            onCancel={() => setEditingPost(null)} 
                            postToEdit={editingPost}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingPost} onOpenChange={(open) => !open && setViewingPost(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none bg-white">
                    {viewingPost?.imageUrl && (
                        <div className="relative w-full h-64 sm:h-96 bg-black flex justify-center items-center">
                            <img src={viewingPost.imageUrl} className="w-full h-full object-contain" alt="Ad Full Media" />
                        </div>
                    )}
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <Badge variant="outline" className={`flex items-center gap-1 ${getCategoryColor(viewingPost?.category)}`}>
                                {getCategoryIcon(viewingPost?.category)}
                                <span className="capitalize">{viewingPost?.category}</span>
                            </Badge>
                            <span className="text-slate-500 flex items-center text-sm font-medium">
                                <MapPin className="w-4 h-4 mr-1" />
                                {viewingPost?.neighborhood}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900">
                            {viewingPost?.title?.[currentLang] || viewingPost?.title?.es}
                        </h2>
                        
                        <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-[15px]">
                            {viewingPost?.description?.[currentLang] || viewingPost?.description?.es}
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border">
                                    <img src={`https://ui-avatars.com/api/?name=${viewingPost?.authorName}&background=random`} alt={viewingPost?.authorName} />
                                </Avatar>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{viewingPost?.authorName}</p>
                                    <p className="text-xs text-slate-500">
                                        Publicado el {viewingPost?.createdAt ? new Date(viewingPost.createdAt.toMillis()).toLocaleDateString() : 'Reciente'}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                onClick={() => handleSocialShare('native', viewingPost)}
                                variant="outline" 
                                className="flex gap-2"
                            >
                                <Share2 className="h-4 w-4" />
                                Compartir Anuncio
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
