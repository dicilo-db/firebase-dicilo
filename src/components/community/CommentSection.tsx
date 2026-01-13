'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { addComment } from '@/app/actions/community';
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

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
            orderBy('createdAt', 'asc'), // Oldest first for chat-like flow? Or desc? Usually comments are asc.
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

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
                {t('community.comments', 'Comentarios')}
            </h3>

            {/* List */}
            <div className="space-y-4 mb-6">
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                        {t('community.no_comments', 'Sé el primero en comentar.')}
                    </p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 text-sm">
                            <Avatar className="h-8 w-8 mt-1">
                                <AvatarImage src={comment.userAvatar} />
                                <AvatarFallback>{comment.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-slate-900 dark:text-white">{comment.userName}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { locale: es }) : ''}
                                    </span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <div className="flex gap-3 items-start">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUserAvatar} />
                    <AvatarFallback>yo</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('community.write_comment', 'Escribe un comentario...')}
                        className="min-h-[2.5rem] py-2 text-sm bg-white dark:bg-slate-800 resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        className="h-9 w-9 shrink-0 bg-purple-600 hover:bg-purple-700"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !newComment.trim()}
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
