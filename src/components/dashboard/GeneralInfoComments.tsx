import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore(app);
const auth = getAuth(app);

export function GeneralInfoComments({ infoId }: { infoId: string }) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!infoId) return;
        const fetchComments = async () => {
            try {
                const q = query(
                    collection(db, 'general_info', infoId, 'comments'),
                    orderBy('createdAt', 'asc')
                );
                const snap = await getDocs(q);
                setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching comments:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchComments();
    }, [infoId]);

    const handleSubmit = async () => {
        const user = auth.currentUser;
        if (!user) {
            toast({ title: 'Error', description: 'Debes iniciar sesión para comentar.', variant: 'destructive' });
            return;
        }
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const commentData = {
                text: newComment.trim(),
                userId: user.uid,
                userName: user.displayName || user.email || 'Usuario',
                createdAt: serverTimestamp(),
            };
            const docRef = await addDoc(collection(db, 'general_info', infoId, 'comments'), commentData);
            setComments(prev => [...prev, { id: docRef.id, ...commentData, createdAt: new Date() }]);
            setNewComment('');
            toast({ title: 'Enviado', description: 'Tu comentario ha sido publicado.' });
        } catch (error) {
            console.error("Error posting comment:", error);
            toast({ title: 'Error', description: 'No se pudo enviar el comentario.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin w-5 h-5 text-slate-400" /></div>;

    return (
        <div className="flex flex-col gap-4 mt-6 border-t pt-4">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Comentarios</h4>
            
            <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                {comments.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No hay comentarios aún. ¡Sé el primero!</p>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-sm">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-teal-700 dark:text-teal-400">{c.userName}</span>
                                <span className="text-xs text-slate-400">
                                    {c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : 'Justo ahora'}
                                </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 ml-1 whitespace-pre-line">{c.text}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="flex gap-2">
                <Textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario o pregunta..."
                    className="min-h-[40px] h-[40px] py-2 resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
                <Button onClick={handleSubmit} disabled={!newComment.trim() || isSubmitting} className="self-end bg-teal-600 hover:bg-teal-700">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    );
}
