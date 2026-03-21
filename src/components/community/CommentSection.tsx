'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { addComment } from '@/app/actions/community';
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    content: string;
    createdAt: any;
}

interface CommentSectionProps {
    postId: string;
    currentUserId: string;
    currentUserAvatar?: string;
}

const db = getFirestore(app);

const COMMON_EMOJIS = ['😊', '😂', '😍', '🙌', '👍', '🔥', '❤️', '👏', '🏠', '🌆', '💼', '🚀', '✨', '🤝'];

export function CommentSection({ postId, currentUserId, currentUserAvatar }: CommentSectionProps) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const q = query(
            collection(db, 'community_posts', postId, 'comments'),
            orderBy('createdAt', 'asc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedComments: Comment[] = [];
            snapshot.forEach((doc) => {
                loadedComments.push({ id: doc.id, ...doc.data() } as Comment);
            });
            setComments(loadedComments);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [postId]);

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setIsSubmitting(true);

        const result = await addComment(postId, newComment, currentUserId);

        if (result.success) {
            setNewComment('');
        } else {
            toast({
                title: "Error",
                description: "No se pudo enviar el comentario.",
                variant: "destructive"
            });
        }
        setIsSubmitting(false);
    };

    const addEmoji = (emoji: string) => {
        setNewComment(prev => prev + emoji);
    };

    return (
        <div className="bg-slate-100/30 dark:bg-slate-900/40 p-5 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold mb-5 text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {t('community.comments', 'Comentarios')} ({comments.length})
            </h3>

            {/* List */}
            <div className="space-y-5 mb-8">
                {loading ? (
                    <div className="flex justify-center p-6">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <p className="text-sm text-slate-400 italic">
                            {t('community.no_comments', 'Sé el primero en comentar e iniciar la conversación.')}
                        </p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <Avatar className="h-10 w-10 shrink-0 border-2 border-white dark:border-slate-800 shadow-sm">
                                <AvatarImage src={comment.userAvatar} />
                                <AvatarFallback className="bg-slate-100 font-bold">{comment.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-900 dark:text-white text-sm">{comment.userName}</span>
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-500 font-medium">
                                        {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { locale: es, addSuffix: true }) : ''}
                                    </span>
                                </div>
                                <div className="text-slate-700 dark:text-slate-200 text-base leading-relaxed prose prose-slate dark:prose-invert max-w-none prose-p:my-0 prose-a:text-purple-600 prose-a:no-underline prose-a:font-bold hover:prose-a:underline">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({ node, ...props }) => {
                                                const originalUrl = props.href || '';
                                                // Create a safe redirect link
                                                const safeUrl = `/redirect?url=${encodeURIComponent(originalUrl)}`;
                                                return <a {...props} href={safeUrl} title="Abrir enlace seguro" target="_blank" rel="noopener noreferrer" />;
                                            }
                                        }}
                                    >
                                        {comment.content.replace(/\n/g, '  \n')}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Form */}
            <div className="flex gap-4 items-start bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700">
                <Avatar className="h-10 w-10 shrink-0 border-2 border-slate-50 dark:border-slate-900">
                    <AvatarImage src={currentUserAvatar} />
                    <AvatarFallback className="bg-purple-100 text-purple-700 font-bold">YO</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col gap-2">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribe algo positivo o comparte un enlace..."
                        className="min-h-[60px] border-0 focus-visible:ring-0 p-0 text-base md:text-lg bg-transparent resize-none placeholder:text-slate-400"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700">
                        <div className="flex items-center gap-1">
                            {/* Emoji Picker */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors gap-2 px-2">
                                        <Smile className="h-5 w-5" />
                                        <span className="text-xs font-medium">Emoji</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="start" className="w-64 p-3 rounded-2xl shadow-2xl border-0 ring-1 ring-slate-100">
                                    <div className="grid grid-cols-7 gap-1">
                                        {COMMON_EMOJIS.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => addEmoji(emoji)}
                                                className="text-xl hover:bg-slate-100 p-2 rounded-lg transition-colors leading-none"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 h-9 rounded-xl shadow-md shadow-purple-200 dark:shadow-none transition-all hover:scale-105 active:scale-95"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !newComment.trim()}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                            <span>{t('community.comment_verb', 'Comentar')}</span>
                        </Button>
                    </div>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 px-4 text-center">
                Los enlaces externos serán verificados por nuestro sistema de seguridad.
            </p>
        </div>
    );
}

