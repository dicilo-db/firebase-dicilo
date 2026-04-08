'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Loader2, Star, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { submitQuickHighlight } from '@/app/actions/quick-highlight';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Label } from '@/components/ui/label';

export function QuickHighlightForm({ neighborhood, onSuccess }: { neighborhood: string, onSuccess: () => void }) {
    const { t } = useTranslation('common');
    const { currentUser, userProfile } = useAuthGuard();
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Form State
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(4);
    const [media, setMedia] = useState<File[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!neighborhood || !isExpanded) return;
        const fetchLocalBusinesses = async () => {
            setLoading(true);
            try {
                const db = getFirestore(app);
                // Para evitar problemas con índices de Firebase o campos "city" y "neighborhood" no creados explícitamente, 
                // bajamos la colección y filtramos de forma robusta con Javascript (similar al buscador principal)
                const colNames = ['businesses', 'clients'];
                const map = new Map();
                const searchStr = neighborhood.toLowerCase();

                for (const col of colNames) {
                    const snap = await getDocs(collection(db, col));

                    snap.docs.forEach(d => {
                        const data = d.data();
                        
                        // Solo aceptamos aprobados o activos
                        if (data.status !== 'approved' && data.status !== 'active' && data.active !== true) return;

                        const cityField = (data.city || data.address?.city || '').toLowerCase();
                        const neighField = (data.neighborhood || data.address?.neighborhood || '').toLowerCase();
                        const locField = (data.location || data.address?.street || '').toLowerCase();

                        // Verificamos si la zona (ej. "Hamburg") está en alguno de esos campos
                        const isMatch = cityField.includes(searchStr) || 
                                        neighField.includes(searchStr) || 
                                        locField.includes(searchStr) ||
                                        (String(data.country || '').toLowerCase().includes(searchStr) && cityField === ''); // fall back

                        if (isMatch) {
                            map.set(d.id, { id: d.id, ...data });
                        }
                    });
                }

                // Normalizamos el nombre a mostrar (usado en businesses y clients)
                setBusinesses(Array.from(map.values()).sort((a, b) => {
                    const nameA = a.companyName || a.clientName || a.name || 'A';
                    const nameB = b.companyName || b.clientName || b.name || 'B';
                    return nameA.localeCompare(nameB);
                }).map(b => ({
                    ...b,
                    companyName: b.companyName || b.clientName || b.name || 'Sin Nombre'
                })));
            } catch (err) {
                console.error("Error fetching local businesses", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLocalBusinesses();
    }, [neighborhood, isExpanded]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBusiness || !comment || !currentUser) return;

        setSubmitting(true);
        const form = new FormData();
        form.append('businessId', selectedBusiness);
        const bName = businesses.find(b => b.id === selectedBusiness)?.companyName || 'Empresa';
        form.append('businessName', bName);
        form.append('neighborhood', neighborhood);
        form.append('userId', currentUser.uid);
        form.append('userName', userProfile?.name || userProfile?.firstName || currentUser.displayName || 'Usuario');
        form.append('comments', comment);
        form.append('rating', rating.toString());
        
        media.forEach(m => form.append('media', m));

        const res = await submitQuickHighlight(form);
        setSubmitting(false);

        if (res.success) {
            setSuccessMessage(res.message || 'Reseña enviada con éxito');
            setTimeout(() => {
                setIsExpanded(false);
                setComment('');
                setRating(4);
                setMedia([]);
                setSelectedBusiness('');
                setSuccessMessage('');
                onSuccess(); // Refresh feed
            }, 3000);
        } else {
            alert(res.error || 'Hubo un error');
        }
    };

    if (successMessage) {
        return (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-6 text-center animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold">¡Genial!</h3>
                <p>{successMessage}</p>
            </div>
        );
    }

    if (!isExpanded) {
        return (
            <div 
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 cursor-text transition-all hover:shadow-md"
                onClick={() => setIsExpanded(true)}
            >
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Star className="text-amber-500 fill-amber-500 w-5 h-5" />
                    </div>
                    <span className="text-lg">¿Qué empresa local quieres destacar hoy?</span>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md border border-slate-200 p-5 space-y-4 animate-in slide-in-from-top-2 fade-in">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Star className="text-amber-500 fill-amber-500 w-5 h-5" />
                Destacar una Empresa en {neighborhood}
            </h3>
            
            <div className="space-y-2">
                <Label>Selecciona el negocio local</Label>
                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500 p-2 bg-slate-50 rounded">
                        <Loader2 className="animate-spin w-4 h-4" /> Cargando negocios del barrio...
                    </div>
                ) : businesses.length === 0 ? (
                    <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                        No encontramos empresas registradas en este barrio para destacar. Usa el botón verde arriba para crear una nueva.
                    </div>
                ) : (
                    <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={selectedBusiness}
                        onChange={(e) => setSelectedBusiness(e.target.value)}
                        required
                    >
                        <option value="">-- Elige una empresa --</option>
                        {businesses.map(b => (
                            <option key={b.id} value={b.id}>{b.companyName}</option>
                        ))}
                    </select>
                )}
            </div>

            {selectedBusiness && (
                <>
                    <div className="space-y-2">
                        <Label>Puntuación</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star className={`w-8 h-8 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Escribe una reseña corta</Label>
                        <Textarea 
                            placeholder="Ej. ¡Me solucionaron el problema enseguida! Super recomendados."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex items-center gap-2 relative overflow-hidden"
                        >
                            <ImageIcon className="w-4 h-4" />
                            {media.length > 0 ? `${media.length} foto(s) lista(s)` : 'Subir Foto (Opcional)'}
                            <input 
                                type="file" 
                                accept="image/*" 
                                multiple 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    if(e.target.files) setMedia(Array.from(e.target.files));
                                }}
                            />
                        </Button>
                        <div className="flex-1"></div>
                        <Button type="button" variant="ghost" onClick={() => setIsExpanded(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting || !comment || businesses.length === 0}>
                            {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Publicar'}
                        </Button>
                    </div>
                </>
            )}
        </form>
    );
}
