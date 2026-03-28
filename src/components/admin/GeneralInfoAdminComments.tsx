import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore(app);

export function GeneralInfoAdminComments({ infoId }: { infoId: string }) {
    const [comments, setComments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!infoId) return;
        const fetchComments = async () => {
            try {
                const q = query(
                    collection(db, 'general_info', infoId, 'comments'),
                    orderBy('createdAt', 'desc')
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

    const handleDelete = async (commentId: string) => {
        try {
            await deleteDoc(doc(db, 'general_info', infoId, 'comments', commentId));
            setComments(prev => prev.filter(c => c.id !== commentId));
            toast({ title: 'Eliminado', description: 'Comentario eliminado.' });
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast({ title: 'Error', description: 'No se pudo eliminar.', variant: 'destructive' });
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-teal-500" /></div>;

    if (comments.length === 0) {
        return <div className="p-8 text-center text-slate-500">Nadie ha comentado en esta publicación todavía.</div>;
    }

    return (
        <div className="flex flex-col gap-3 p-4 max-h-[60vh] overflow-y-auto">
            {comments.map(c => (
                <div key={c.id} className="bg-slate-50 border p-3 rounded-lg relative group">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="font-semibold text-slate-800">{c.userName}</span>
                            <span className="text-xs text-slate-400 ml-2">
                                {c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleString() : 'Reciente'}
                            </span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                                if (window.confirm('¿Seguro que deseas eliminar este comentario?')) {
                                    handleDelete(c.id);
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{c.text}</p>
                </div>
            ))}
        </div>
    );
}
