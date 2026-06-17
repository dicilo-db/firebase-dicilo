'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Recommendation } from '@/types/recommendation';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Film, Star, MoreHorizontal, Edit, Trash2, Loader2, X, Camera } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MediaLightbox } from '@/components/community/MediaLightbox';
import { QuickHighlightForm } from '@/components/community/QuickHighlightForm';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface NeighborhoodFeedProps {
    neighborhood: string;
    currentUser?: any;
}

export default function NeighborhoodFeed({ neighborhood, currentUser }: NeighborhoodFeedProps) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedPostMedia, setSelectedPostMedia] = useState<any[]>([]);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(3);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Edit states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editComments, setEditComments] = useState('');
    const [editRating, setEditRating] = useState(4);
    const [editMedia, setEditMedia] = useState<{ type: 'image' | 'video', url: string }[]>([]);
    const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

    const displayNeighborhood = neighborhood.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const fetchFeed = async () => {
        setLoading(true);
        const db = getFirestore(app);
        try {
            const q = query(
                collection(db, 'recommendations'),
                where('neighborhood', '==', neighborhood),
                where('status', '==', 'approved'),
                orderBy('createdAt', 'desc'),
                limit(20)
            );

            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPosts(data);
        } catch (error: any) {
            console.error("Error loading feed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (neighborhood) {
            fetchFeed();
        }
    }, [neighborhood]);

    // Fetch user profile role to determine if admin
    useEffect(() => {
        if (currentUser) {
            const db = getFirestore(app);
            const ref = doc(db, 'private_profiles', currentUser.uid);
            getDoc(ref).then(snap => {
                if (snap.exists()) {
                    setUserProfile(snap.data());
                }
            }).catch(err => console.error("Error fetching user profile:", err));
        } else {
            setUserProfile(null);
        }
    }, [currentUser]);

    const renderStars = (rating: number = 4) => {
        return (
            <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} 
                    />
                ))}
            </div>
        );
    };

    const startEdit = (post: any) => {
        setEditingId(post.id);
        setEditComments(post.comments || post.comment || '');
        setEditRating(post.rating || 4);
        setEditMedia(post.media || (post.photoUrl ? [{ type: 'image', url: post.photoUrl }] : []));
        setNewMediaFiles([]);
    };

    const handleSaveEdit = async (postId: string) => {
        if (!currentUser) return;
        setIsSavingEdit(true);
        try {
            const formData = new FormData();
            formData.append('recommendationId', postId);
            formData.append('userId', currentUser.uid);
            formData.append('comments', editComments);
            formData.append('rating', editRating.toString());
            formData.append('existingMedia', JSON.stringify(editMedia));
            
            newMediaFiles.forEach(file => {
                formData.append('media', file);
            });

            const { editRecommendationAction } = await import('@/app/actions/recommendations');
            const result = await editRecommendationAction(formData);
            if (result.success) {
                toast({
                    title: t('editSuccessTitle', { defaultValue: "Recomendación actualizada" }),
                    description: t('editSuccessDesc', { defaultValue: "Los cambios se guardaron correctamente." })
                });
                setEditingId(null);
                fetchFeed(); // Refresh feed
            } else {
                toast({
                    title: "Error",
                    description: result.error || "No se pudo actualizar la recomendación.",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Error",
                description: err.message || "Ocurrió un error inesperado.",
                variant: "destructive"
            });
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!currentUser) return;
        if (!confirm(t('confirmDelete', { defaultValue: '¿Estás seguro de que deseas eliminar esta recomendación permanentemente? Esta acción no se puede deshacer.' }))) return;
        
        setIsDeletingId(postId);
        try {
            const { deleteRecommendationAction } = await import('@/app/actions/recommendations');
            const result = await deleteRecommendationAction(postId, currentUser.uid);
            if (result.success) {
                toast({
                    title: t('deletedSuccessTitle', { defaultValue: "Recomendación eliminada" }),
                    description: t('deletedSuccessDesc', { defaultValue: "La recomendación ha sido borrada permanentemente." })
                });
                fetchFeed(); // Refresh the list
            } else {
                toast({
                    title: "Error",
                    description: result.error || "No se pudo eliminar la recomendación.",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Error",
                description: err.message || "Ocurrió un error inesperado.",
                variant: "destructive"
            });
        } finally {
            setIsDeletingId(null);
        }
    };

    const visiblePosts = posts.slice(0, visibleCount);
    const isAdminOrSuperAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superadmin';

    return (
        <div className="space-y-6">
            {/* Quick Highlight Form on top */}
            <QuickHighlightForm neighborhood={neighborhood} onSuccess={fetchFeed} />

            {loading ? (
                <div className="text-center py-10">{t('community.feed.loading', 'Cargando actividad...')}</div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-lg p-10 text-center shadow-sm border border-dashed border-gray-200">
                    <p className="text-gray-500 text-lg">{t('community.feed.empty_businesses', 'Aún no hay empresas destacadas recientemente en {{city}}.', { city: displayNeighborhood })}</p>
                    <p className="text-gray-400 text-sm mt-2">{t('community.feed.empty_businesses_prompt', '¡Utiliza la caja de arriba para ser el primero en destacar un negocio local!')}</p>
                </div>
            ) : (
                <>
                    <div className="space-y-6 max-h-[850px] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200">
                        {visiblePosts.map((post) => {
                            const isOwner = currentUser && post.userId === currentUser.uid;
                            const date = post.createdAt?.toDate ? post.createdAt.toDate() : (post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000) : new Date(post.createdAt));
                            const isWithin12Hours = (Date.now() - date.getTime()) <= 12 * 60 * 60 * 1000;
                            const canEditOrDelete = isAdminOrSuperAdmin || (isOwner && isWithin12Hours);
                            const isDeleting = isDeletingId === post.id;

                            return (
                                <div key={post.id} className={`bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {/* Edit / Delete menu trigger (Only if permitted) */}
                                    {canEditOrDelete && !isDeleting && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="z-[1001]">
                                                    <DropdownMenuItem onClick={() => startEdit(post)} className="cursor-pointer gap-2">
                                                        <Edit className="h-4 w-4" />
                                                        <span>{isAdminOrSuperAdmin ? "Editar (Admin)" : "Editar"}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(post.id)} className="cursor-pointer text-red-600 focus:text-red-700 gap-2">
                                                        <Trash2 className="h-4 w-4" />
                                                        <span>{isAdminOrSuperAdmin && !isOwner ? "Eliminar (Admin)" : "Eliminar"}</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}

                                    {/* Card Media section (if not editing) */}
                                    {editingId !== post.id && (post.media?.length > 0 || post.photoUrl) && (
                                        <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 cursor-pointer" onClick={() => {
                                            const media = post.media && post.media.length > 0 ? post.media : (post.photoUrl ? [{ type: 'image', url: post.photoUrl }] : []);
                                            if (media.length > 0) {
                                                setSelectedPostMedia(media);
                                                setSelectedMediaIndex(0);
                                                setLightboxOpen(true);
                                            }
                                        }}>
                                            {post.media && post.media.length > 0 ? (
                                                post.media[0].type === 'image' ? (
                                                    <Image
                                                        src={post.media[0].url}
                                                        alt={`Foto por ${post.userName}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <video
                                                        src={post.media[0].url}
                                                        controls
                                                        className="w-full h-full object-contain bg-black"
                                                    />
                                                )
                                            ) : post.photoUrl ? (
                                                <Image
                                                    src={post.photoUrl}
                                                    alt={`Foto por ${post.userName}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Film className="h-10 w-10 opacity-20" />
                                                </div>
                                            )}
                                            {post.media && post.media.length > 1 && (
                                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                                                    +{post.media.length - 1}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="p-5">
                                        {editingId === post.id ? (
                                            /* Inline Edit Form */
                                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                <h4 className="font-bold text-slate-900 border-b pb-1 text-base flex items-center gap-2">
                                                    <Edit className="w-4 h-4 text-purple-600" />
                                                    Editar Recomendación: {post.companyName}
                                                </h4>
                                                
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-slate-500 block">Calificación</label>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onClick={() => setEditRating(star)}
                                                                className="focus:outline-none transition-transform hover:scale-110"
                                                            >
                                                                <Star className={`w-8 h-8 ${star <= editRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-slate-500 block">Comentarios</label>
                                                    <textarea 
                                                        value={editComments}
                                                        onChange={e => setEditComments(e.target.value)}
                                                        className="w-full min-h-[100px] p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                                        placeholder="Escribe tus comentarios..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-slate-500 block">Fotos/Vídeos Existentes</label>
                                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                                        {editMedia.map((m, idx) => (
                                                            <div key={idx} className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-slate-100 border">
                                                                {m.type === 'video' ? (
                                                                    <video src={m.url} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <img src={m.url} className="w-full h-full object-cover" />
                                                                )}
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setEditMedia(prev => prev.filter((_, i) => i !== idx))}
                                                                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                                                                    title="Eliminar foto"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {editMedia.length + newMediaFiles.length < 5 && (
                                                            <label className="w-16 h-16 flex flex-col items-center justify-center border border-dashed rounded-md cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
                                                                <span className="text-xs text-slate-400 font-bold">+</span>
                                                                <input 
                                                                    type="file" 
                                                                    className="hidden" 
                                                                    accept="image/*,video/*" 
                                                                    multiple 
                                                                    onChange={e => {
                                                                        if (e.target.files) {
                                                                            setNewMediaFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>

                                                {newMediaFiles.length > 0 && (
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-slate-500 block">Nuevas Fotos a Subir</label>
                                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                                            {newMediaFiles.map((file, idx) => (
                                                                <div key={idx} className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-slate-100 border flex items-center justify-center">
                                                                    {file.type.startsWith('video/') ? (
                                                                        <Film className="w-6 h-6 text-slate-400" />
                                                                    ) : (
                                                                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                                                    )}
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setNewMediaFiles(prev => prev.filter((_, i) => i !== idx))}
                                                                        className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex justify-end gap-2 pt-2 border-t">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => setEditingId(null)} 
                                                        disabled={isSavingEdit}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => handleSaveEdit(post.id)} 
                                                        disabled={isSavingEdit || (!editComments.trim() && editMedia.length === 0 && newMediaFiles.length === 0)}
                                                    >
                                                        {isSavingEdit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                        Guardar
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Normal Display View */
                                            <>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        {post.companyName && (
                                                            <h4 className="font-bold text-lg text-slate-900 border-b border-dashed border-slate-200 pb-1 inline-block mb-2">
                                                                {post.companyName}
                                                            </h4>
                                                        )}
                                                        {renderStars(post.rating || 4)}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-semibold text-slate-700 block text-sm">{post.userName}</span>
                                                        <span className="text-xs text-slate-400 block">
                                                            {post.createdAt?.seconds ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : 'Reciente'}
                                                        </span>
                                                        {post.updatedAt && (
                                                            <span className="text-[10px] text-muted-foreground italic block">(editado)</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {(post.comment || post.comments) && (
                                                    <p className="text-slate-600 text-sm whitespace-pre-wrap pt-2 border-t border-slate-50">&quot;{post.comment || post.comments}&quot;</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {posts.length > visibleCount && (
                        <div className="text-center pt-2">
                            <Button variant="outline" onClick={() => setVisibleCount(v => v + 3)} className="w-full sm:w-auto">
                                Cargar más reseñas de {displayNeighborhood}
                            </Button>
                        </div>
                    )}
                </>
            )}
            
            <MediaLightbox 
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                media={selectedPostMedia}
                initialIndex={selectedMediaIndex}
            />
        </div>
    );
}
