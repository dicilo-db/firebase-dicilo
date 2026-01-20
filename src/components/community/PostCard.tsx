'use client';

import React, { useState } from 'react';
import { CommunityPost } from '@/types/community';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Globe, Loader2, Download, Facebook, Mail, Copy, Twitter, Send } from 'lucide-react';
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
import { toggleLike, translateText } from '@/app/actions/community';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { CommentSection } from './CommentSection';
import { useFriends } from '@/hooks/useFriends';
import { UserPlus, Check } from 'lucide-react';

interface PostCardProps {
    post: CommunityPost;
    currentUserId: string;
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

export function PostCard({ post, currentUserId }: PostCardProps) {
    const { t, i18n } = useTranslation(['common', 'admin']);
    const { toast } = useToast();
    const [likes, setLikes] = useState<string[]>(post.likes || []);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [showTranslated, setShowTranslated] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [currentTranslationLang, setCurrentTranslationLang] = useState<string | null>(null);
    const { friends, sendFriendRequest } = useFriends();
    const [requestSent, setRequestSent] = useState(false);

    const isMe = currentUserId === post.userId;
    const isFriend = friends.some(f => f.uid === post.userId);

    const handleConnect = async () => {
        if (requestSent) return;

        // Optimistic UI
        setRequestSent(true);
        await sendFriendRequest(post.userId);
        toast({
            title: "Solicitud enviada",
            description: `Has invitado a ${post.userName} a tu círculo.`
        });
    };

    const isLiked = likes.includes(currentUserId);
    const commentCount = post.commentCount || 0;

    const handleLike = async () => {
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
                description: t('community.translation_error', 'Traducción fallida. Inténtalo más tarde.'),
                variant: "destructive"
            });
        }
    };

    const handleSocialShare = async (platform: string) => {
        // Construct a cleaner URL if possible, or use current
        const url = window.location.href;
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

    const date = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt);

    return (
        <Card className="border-none shadow-sm mb-4 overflow-hidden bg-white dark:bg-card">
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
                                disabled={requestSent}
                                className="text-purple-600 hover:bg-purple-50 p-1 rounded-full transition-colors"
                                title={requestSent ? "Solicitud enviada" : "Conectar / Agregar a mi Círculo"}
                            >
                                {requestSent ? <Check size={16} className="text-green-600" /> : <UserPlus size={16} />}
                            </button>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(date, { addSuffix: true, locale: es })} • {post.neighborhood}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {showTranslated ? translatedContent : post.content}
                </p>

                {post.imageUrl && (
                    <div className="relative group">
                        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 mt-2">
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
                            onClick={handleDownload}
                            title={t('community.download', 'Descargar')}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                )}

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
                        onClick={() => setShowComments(!showComments)}
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
