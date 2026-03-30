'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import { CommunityPost } from '@/types/community';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Globe, Loader2, Download, Facebook, Mail, Copy, Twitter, Send, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { toggleLike, translateText, deletePostAction, editPostAction } from '@/app/actions/community';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { CommentSection } from './CommentSection';
import { useFriends } from '@/hooks/useFriends';
import { UserPlus, Check } from 'lucide-react';
import { MediaLightbox } from './MediaLightbox';

interface PostCardProps {
    post: CommunityPost;
    currentUserId: string;
    readOnly?: boolean;
}

const LANGUAGES = [
    { code: 'es', name: 'Spanish', label: 'Español' },
    { code: 'en', name: 'English', label: 'English' },
    { code: 'de', name: 'German', label: 'Deutsch' },
    { code: 'fr', name: 'French', label: 'Français' },
    { code: 'it', name: 'Italian', label: 'Italiano' },
    { code: 'pt', name: 'Portuguese', label: 'Português' },
    { code: 'zh', name: 'Mandarin Chinese', label: 'Mandarin (中文)' },
    { code: 'ar', name: 'Arabic', label: 'Arabic (العربية)' },
    { code: 'hi', name: 'Hindi', label: 'Hindi' },
    { code: 'ru', name: 'Russian', label: 'Russian' },
    { code: 'ja', name: 'Japanese', label: 'Japanese' }
];

export function PostCard({ post, currentUserId, readOnly = false }: PostCardProps) {
    const { t, i18n } = useTranslation(['common', 'admin']);
    const { toast } = useToast();
    const router = useRouter();
    const [likes, setLikes] = useState<string[]>(post.likes || []);
    useEffect(() => {
        setLikes(post.likes || []);
    }, [post.likes]);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [showTranslated, setShowTranslated] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [currentTranslationLang, setCurrentTranslationLang] = useState<string | null>(null);
    const { friends, sendFriendRequest, sentRequests } = useFriends();
    const [requestSent, setRequestSent] = useState(false);
    const [liveCommentCount, setLiveCommentCount] = useState(post.commentCount || 0);
    
    // Live listener for likes and commentCount
    useEffect(() => {
        const db = getFirestore(app);
        const unsubscribe = onSnapshot(doc(db, 'community_posts', post.id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setLikes(data.likes || []);
                setLiveCommentCount(data.commentCount || 0);
            }
        });
        return () => unsubscribe();
    }, [post.id]);

    
    // Edit & Delete State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [editMedia, setEditMedia] = useState<{type: 'image'|'video', url: string}[]>(
        (post.media as {type: 'image'|'video', url: string}[]) || (post.imageUrl ? [{ type: 'image', url: post.imageUrl }] : [])
    );
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isMe = currentUserId === post.userId;
    const isFriend = friends.some(f => f.uid === post.userId);
    const hasSentPending = (sentRequests || []).some(req => req.toUserId === post.userId);
    const date = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
    const isWithin12Hours = (Date.now() - date.getTime()) <= 12 * 60 * 60 * 1000;

    const handleConnect = async () => {
        if (readOnly) {
            toast({ title: t('common:login.required', 'Inicio de sesión requerido'), description: t('common:community.login_to_interact', 'Regístrate para conectar con vecinos.') });
            return;
        }
        if (requestSent || hasSentPending) return;

        // Optimistic UI
        setRequestSent(true);
        await sendFriendRequest(post.userId);
        toast({
            title: "Solicitud enviada",
            description: `Has invitado a ${post.userName} a tu círculo.`
        });
    };

    const isLiked = likes.includes(currentUserId);
    const commentCount = liveCommentCount;

    const handleLike = async () => {
        if (readOnly) {
            toast({ title: t('common:login.required', 'Inicio de sesión requerido'), description: t('common:community.login_to_interact', 'Regístrate para dar Like.') });
            return;
        }
        const newLikes = isLiked
            ? likes.filter(id => id !== currentUserId)
            : [...likes, currentUserId];

        setLikes(newLikes);

        const result = await toggleLike(post.id, currentUserId);
        if (!result.success) {
            setLikes(likes);
            toast({
                title: "Error",
                description: "No se pudo dar like.",
                variant: "destructive"
            });
        }
    };

    const handleTranslate = async (targetLang: string) => {
        // If already showing this language, do nothing
        if (showTranslated && currentTranslationLang === targetLang) return;

        // If we have cached this translation (simplified: currently storing only one. 
        // ideally we store a map, but for now re-fetching is safer or we just clear if switching)
        // For this version let's re-fetch if language changes to be safe and simple

        setIsTranslating(true);
        const result = await translateText(post.content, targetLang);
        setIsTranslating(false);

        if (result.success && result.translatedText) {
            setTranslatedContent(result.translatedText);
            setCurrentTranslationLang(targetLang);
            setShowTranslated(true);
        } else {
            console.error("Translation failed:", result.error);
            toast({
                title: "Error",
                description: result.error ? `Error: ${result.error}` : t('community.translation_error', 'Traducción fallida. Inténtalo más tarde.'),
                variant: "destructive"
            });
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.")) return;
        
        setIsDeleting(true);
        const result = await deletePostAction(post.id, currentUserId);
        setIsDeleting(false);

        if (result.success) {
            toast({ title: "Publicación eliminada", description: "Tu publicación ha sido borrada." });
            // Ideally we should trigger a refresh here, but for now we reload or the parent handles it if we had a callback
            window.location.reload(); 
        } else {
            toast({ title: "Error", description: result.error || "No se pudo eliminar", variant: "destructive" });
        }
    };

    const handleSaveEdit = async () => {
        if (!editContent.trim() && editMedia.length === 0) return;

        setIsSavingEdit(true);
        const result = await editPostAction(post.id, editContent, currentUserId, editMedia);
        setIsSavingEdit(false);

        if (result.success) {
            toast({ title: "Publicación actualizada" });
            post.content = editContent; // Optimistic local update
            post.media = editMedia as any;
            if (editMedia.length === 0) post.imageUrl = undefined;
            else if (editMedia.length > 0 && editMedia[0].type === 'image') post.imageUrl = editMedia[0].url;
            setIsEditing(false);
        } else {
            toast({ title: "Error", description: result.error || "No se pudo editar", variant: "destructive" });
        }
    };

    const handleSocialShare = async (platform: string) => {
        // Unique post URL
        const domain = window.location.origin;
        const url = `${domain}/post/${post.id}`;
        const text = t('community.share_text', {
            user: post.userName,
            neighborhood: post.neighborhood
        });

        // Helper for platforms needing concatenated text
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
                window.location.href = `mailto:?subject=${encodeURIComponent(post.userName + ' en Dicilo')}&body=${encodeURIComponent(textWithUrl)}`;
                break;
            case 'native':
                if (navigator.share) {
                    navigator.share({
                        title: 'Dicilo Community',
                        text: text, // Native often appends URL automatically if `url` field is provided
                        url: url,
                    }).catch(console.error);
                } else {
                    toast({ description: "Sharing not supported on this device", variant: "destructive" });
                }
                break;
            case 'copy':
                try {
                    await navigator.clipboard.writeText(url);
                    toast({ description: t('community.link_copied', 'Enlace copiado al portapapeles') });
                } catch (err) {
                    console.error('Clipboard failed');
                }
                break;
        }
    };

    const handleDownload = async () => {
        if (!post.imageUrl) return;
        try {
            // Use proxy to avoid CORS
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(post.imageUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `dicilo-${post.id}.webp`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast({
                description: t('community.download_success', 'Foto descargada')
            });
        } catch (e) {
            console.error(e);
            toast({
                variant: "destructive",
                description: t('community.download_error', 'Error al descargar')
            });
        }
    };

    return (
        <Card className={`border-none shadow-sm mb-4 overflow-hidden bg-white dark:bg-card ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
            <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={post.userAvatar} alt={post.userName} />
                    <AvatarFallback>{post.userName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{post.userName}</span>
                        {/* Invite to Circle - Header Action */}
                        {!isMe && !isFriend && (
                            <button
                                onClick={handleConnect}
                                disabled={requestSent || hasSentPending}
                                className="text-purple-600 hover:bg-purple-50 p-1 rounded-full transition-colors"
                                title={(requestSent || hasSentPending) ? "Solicitud enviada" : "Conectar / Agregar a mi Círculo"}
                            >
                                {(requestSent || hasSentPending) ? <Check size={16} className="text-green-600" /> : <UserPlus size={16} />}
                            </button>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(date, { addSuffix: true, locale: es })} • {post.neighborhood}
                    </span>
                </div>
                
                {/* Options Menu for Post Owner */}
                {isMe && !readOnly && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                                onClick={() => setIsEditing(true)} 
                                disabled={!isWithin12Hours}
                                className="cursor-pointer gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                <span>{isWithin12Hours ? "Editar" : "Edición expirada (+12h)"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={handleDelete} 
                                className="cursor-pointer text-red-600 focus:text-red-700 gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Eliminar</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                {isEditing ? (
                    <div className="space-y-2 mt-2">
                        <Textarea 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full resize-y min-h-[100px]"
                            placeholder="Edita tu publicación..."
                        />
                        {editMedia.length > 0 && (
                            <div className="flex gap-2 mt-2 overflow-x-auto">
                                {editMedia.map((m, idx) => (
                                    <div key={idx} className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        {m.type === 'video' ? (
                                            <video src={m.url} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={m.url} className="w-full h-full object-cover" />
                                        )}
                                        <button 
                                            onClick={() => setEditMedia(prev => prev.filter((_, i) => i !== idx))}
                                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                                            title="Eliminar media"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                                setIsEditing(false);
                                setEditContent(post.content);
                                setEditMedia((post.media as {type: 'image'|'video', url: string}[]) || (post.imageUrl ? [{ type: 'image', url: post.imageUrl }] : []));
                            }} disabled={isSavingEdit}>
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleSaveEdit} disabled={isSavingEdit || (!editContent.trim() && editMedia.length === 0)} className="bg-purple-600 hover:bg-purple-700">
                                {isSavingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Guardar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-800 dark:text-slate-200 text-base leading-relaxed prose prose-slate dark:prose-invert max-w-none prose-p:mt-0 prose-p:mb-3 prose-a:text-blue-600 prose-a:no-underline prose-a:font-bold hover:prose-a:underline">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                a: ({ node, ...props }) => {
                                    const originalUrl = props.href || '';
                                    if (originalUrl.startsWith('/') || originalUrl.startsWith('#')) {
                                        return <a {...props} />;
                                    }
                                    const safeUrl = `/redirect?url=${encodeURIComponent(originalUrl)}`;
                                    return <a {...props} href={safeUrl} title="Abrir enlace seguro" target="_blank" rel="noopener noreferrer" />;
                                }
                            }}
                        >
                            {(showTranslated ? (translatedContent || '') : (post.content || '')).replace(/\n/g, '  \n')}
                        </ReactMarkdown>
                        {(post as any).updatedAt && !showTranslated && <span className="text-[10px] text-muted-foreground mt-1 inline-block">(Editado)</span>}
                    </div>
                )}

                {post.media && post.media.length > 0 ? (
                    <div className={cn(
                        "grid gap-2 mt-2",
                        post.media.length === 1 ? "grid-cols-1" : 
                        post.media.length === 2 ? "grid-cols-2" : 
                        "grid-cols-2" // We'll show first few or a scrollable list? For now simple grid
                    )}>
                        {post.media.map((item, index) => (
                            <div key={index} className={cn(
                                "relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group",
                                post.media!.length === 1 ? "h-80" : "h-48"
                            )} onClick={() => {
                                setSelectedMediaIndex(index);
                                setLightboxOpen(true);
                            }}>
                                {item.type === 'image' ? (
                                    <>
                                        <Image
                                            src={item.url}
                                            alt={`Post media ${index}`}
                                            fill
                                            className="object-cover"
                                        />
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white border-none"
                                            onClick={() => {
                                                // Existing handleDownload logic adapted for specific URL
                                                const handleSingleDownload = async (url: string) => {
                                                    try {
                                                        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
                                                        const response = await fetch(proxyUrl);
                                                        if (!response.ok) throw new Error('Download failed');
                                                        const blob = await response.blob();
                                                        const blobUrl = window.URL.createObjectURL(blob);
                                                        const link = document.createElement('a');
                                                        link.href = blobUrl;
                                                        link.download = `dicilo-${post.id}-${index}.webp`;
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                        window.URL.revokeObjectURL(blobUrl);
                                                    } catch (e) { console.error(e); }
                                                };
                                                handleSingleDownload(item.url);
                                            }}
                                            title={t('community.download', 'Descargar')}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <video
                                        src={item.url}
                                        controls
                                        className="w-full h-full object-contain bg-black"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ) : post.imageUrl ? (
                    <div className="relative group cursor-pointer" onClick={() => {
                        setSelectedMediaIndex(0);
                        setLightboxOpen(true);
                    }}>
                        <div className="relative w-full h-80 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 mt-2">
                            <Image
                                src={post.imageUrl}
                                alt="Post image"
                                fill
                                className="object-cover"
                            />
                        </div>
                        {/* Download Button Overlay */}
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white border-none"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload();
                            }}
                            title={t('community.download', 'Descargar')}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                ) : null}

                {/* Lightbox */}
                <MediaLightbox 
                    isOpen={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                    media={post.media && post.media.length > 0 ? post.media : (post.imageUrl ? [{ type: 'image', url: post.imageUrl }] : [])}
                    initialIndex={selectedMediaIndex}
                />

                {/* Translation Control */}
                {(translatedContent || post.content.length > 5) && (
                    <div className="flex justify-end items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{t('community.read_in', 'Leer en')}:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-purple-600 hover:text-purple-700 p-0 hover:bg-transparent"
                                    disabled={isTranslating}
                                >
                                    {isTranslating ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                        <Globe className="h-3 w-3 mr-1" />
                                    )}
                                    {showTranslated ? t('community.show_original', 'Ver original') : t('community.translate_ai', 'Traducir con AI')}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setShowTranslated(false)} disabled={!showTranslated}>
                                    Original ({post.language || 'Auto'})
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {LANGUAGES.map((lang) => (
                                    <DropdownMenuItem
                                        key={lang.code}
                                        onClick={() => handleTranslate(lang.name)}
                                    >
                                        {lang.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col p-0">
                <div className="w-full p-2 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-muted-foreground border-t border-slate-100 dark:border-slate-800">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex gap-2 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10", isLiked && "text-red-500")}
                        onClick={handleLike}
                    >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                        <span className="text-xs">{likes.length > 0 ? likes.length : t('community.like', 'Me gusta')}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex gap-2 hover:text-blue-500", showComments && "text-blue-600 bg-blue-50")}
                        onClick={() => {
                            if (readOnly) {
                                toast({ title: t('common:login.required', 'Inicio de sesión requerido'), description: t('common:community.login_to_interact', 'Regístrate para ver comentarios e interactuar.') });
                                return;
                            }
                            setShowComments(!showComments);
                        }}
                    >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">
                            {commentCount > 0 ? `${commentCount} ${t('community.comment', 'Coment.')}` : t('community.comment_verb', 'Comentar')}
                        </span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex gap-2 hover:text-green-600">
                                <Share2 className="h-4 w-4" />
                                <span className="text-xs">{t('community.share', 'Compartir')}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => handleSocialShare('whatsapp')} className="cursor-pointer gap-2">
                                <MessageCircle className="h-4 w-4 text-green-500" />
                                <span>WhatsApp</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSocialShare('telegram')} className="cursor-pointer gap-2">
                                <Send className="h-4 w-4 text-blue-400" />
                                <span>Telegram</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSocialShare('facebook')} className="cursor-pointer gap-2">
                                <Facebook className="h-4 w-4 text-blue-600" />
                                <span>Facebook</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSocialShare('twitter')} className="cursor-pointer gap-2">
                                <Twitter className="h-4 w-4 text-black dark:text-white" />
                                <span>X (Twitter)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSocialShare('email')} className="cursor-pointer gap-2">
                                <Mail className="h-4 w-4 text-gray-600" />
                                <span>Email</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSocialShare('copy')} className="cursor-pointer gap-2">
                                <Copy className="h-4 w-4" />
                                <span>{t('community.copy_link', 'Copiar Enlace')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSocialShare('native')} className="cursor-pointer gap-2">
                                <Share2 className="h-4 w-4" />
                                <span>{t('admin:invite.form.share_more', 'Más opciones...')}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {showComments && (
                    <div className="w-full animate-in slide-in-from-top-2 duration-200">
                        <CommentSection
                            postId={post.id}
                            currentUserId={currentUserId}
                        />
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
