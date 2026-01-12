'use client';

import React, { useState } from 'react';
import { CommunityPost } from '@/types/community';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Globe, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { toggleLike, translateText } from '@/app/actions/community';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
    post: CommunityPost;
    currentUserId: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
    const { toast } = useToast();
    const [likes, setLikes] = useState<string[]>(post.likes || []);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [showTranslated, setShowTranslated] = useState(false);

    const isLiked = likes.includes(currentUserId);

    const handleLike = async () => {
        // Optimistic update
        const newLikes = isLiked
            ? likes.filter(id => id !== currentUserId)
            : [...likes, currentUserId];

        setLikes(newLikes);

        const result = await toggleLike(post.id, currentUserId);
        if (!result.success) {
            setLikes(likes); // Revert on failure
            toast({
                title: "Error",
                description: "No se pudo dar like.",
                variant: "destructive"
            });
        }
    };

    const handleTranslate = async () => {
        if (translatedContent) {
            setShowTranslated(!showTranslated);
            return;
        }

        setIsTranslating(true);
        // Assuming we want to translate to Spanish if user language is not Spanish, 
        // or to user's language. For MVP, let's hardcode 'es' or 'en' based on browser? 
        // The requirement said "Translate feature". I'll default to Spanish for now or toggle.
        // Actually, better to translate to a "Standard" language or just English?
        // Let's assume the user wants to read in their language.
        // For now, I'll translate to 'Spanish' as a demo or 'English' if it's already Spanish?
        // A simple logic: if post.language is not 'es', translate to 'es'. Else 'en'.
        // But post.language is default 'es'. 
        // Let's translate to English for demo purposes if the post is likely Spanish.

        const targetLang = 'Spanish'; // Or detected user preference

        const result = await translateText(post.content, targetLang);
        setIsTranslating(false);

        if (result.success && result.translatedText) {
            setTranslatedContent(result.translatedText);
            setShowTranslated(true);
        } else {
            toast({
                title: "Error",
                description: "Traducción fallida.",
                variant: "destructive"
            });
        }
    };

    const date = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt);

    return (
        <Card className="border-none shadow-sm mb-4 overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={post.userAvatar} alt={post.userName} />
                    <AvatarFallback>{post.userName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">{post.userName}</span>
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
                    <div className="relative w-full h-64 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 mt-2">
                        <Image
                            src={post.imageUrl}
                            alt="Post image"
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                {/* Translation Control */}
                {(translatedContent || post.content.length > 10) && (
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-purple-600 hover:text-purple-700 p-0 hover:bg-transparent"
                            onClick={handleTranslate}
                            disabled={isTranslating}
                        >
                            {isTranslating ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                                <Globe className="h-3 w-3 mr-1" />
                            )}
                            {showTranslated ? 'Ver original' : 'Traducir con AI'}
                        </Button>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-2 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-muted-foreground">
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn("flex gap-2 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10", isLiked && "text-red-500")}
                    onClick={handleLike}
                >
                    <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                    <span className="text-xs">{likes.length > 0 ? likes.length : 'Me gusta'}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex gap-2 hover:text-blue-500">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">Comentar</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex gap-2">
                    <Share2 className="h-4 w-4" />
                    <span className="text-xs">Compartir</span>
                </Button>
            </CardFooter>
        </Card>
    );
}
