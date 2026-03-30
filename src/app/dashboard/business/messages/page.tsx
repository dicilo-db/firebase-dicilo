'use client';

import React, { useEffect, useState } from 'react';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { MessageSquare, MailWarning, User, Calendar, Trash2, Reply } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BusinessMessage {
    id: string;
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    subject: string;
    message: string;
    createdAt: any;
    read: boolean;
}

export default function MessagesPage() {
    const { businessId, plan, isLoading } = useBusinessAccess();
    const { toast } = useToast();
    const [messages, setMessages] = useState<BusinessMessage[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        async function fetchMessages() {
            if (!businessId) return;
            setLoadingData(true);
            try {
                const q = query(collection(db, 'business_messages'), where('businessId', '==', businessId), orderBy('createdAt', 'desc'));
                const snap = await getDocs(q);
                const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessMessage));
                setMessages(msgs);
            } catch (error) {
                console.error("Error fetching messages:", error);
            } finally {
                setLoadingData(false);
            }
        }
        if (!isLoading && businessId) {
            fetchMessages();
        }
    }, [businessId, isLoading]);

    const markAsRead = async (id: string, currentStatus: boolean) => {
        if (currentStatus) return;
        try {
            await updateDoc(doc(db, 'business_messages', id), { read: true });
            setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
        } catch (e) {
            console.error(e);
        }
    };

    const deleteMessage = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este mensaje de forma permanente?')) return;
        try {
            await deleteDoc(doc(db, 'business_messages', id));
            setMessages(prev => prev.filter(m => m.id !== id));
            toast({ title: 'Mensaje eliminado' });
        } catch (e) {
            console.error(e);
            toast({ title: 'Error', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <Skeleton className="w-full h-80 rounded-xl" />
            </div>
        );
    }

    if (plan === 'basic' || !businessId) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-4 text-sm font-medium mt-6">
                    <p>El módulo de Consultas requiere plan Starter o superior.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="pb-4 border-b border-slate-200 text-left">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-8 h-8 text-emerald-600" />
                    Bandeja de Entrada <span className="text-emerald-600">B2C</span>
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Centraliza la comunicación local y recibe los leads o consultas enviados desde tu Ficha Dicilo.</p>
            </div>

            {loadingData ? (
                <div className="space-y-4">
                     <Skeleton className="w-full h-32 rounded-xl" />
                     <Skeleton className="w-full h-32 rounded-xl" />
                </div>
            ) : messages.length === 0 ? (
                <div className="bg-slate-50/80 rounded-2xl p-16 text-center border shadow-sm">
                    <MailWarning className="w-16 h-16 mx-auto text-slate-300 mb-6" />
                    <h2 className="text-2xl font-bold text-slate-700 mb-2">Bandeja Vacía</h2>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Aún no tienes mensajes nuevos de clientes. Cuando un visitante use el formulario de contacto de tu perfil público, aparecerá aquí.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map(msg => (
                        <Card 
                            key={msg.id} 
                            className={`border-l-4 transition-all ${!msg.read ? 'border-l-emerald-500 bg-white' : 'border-l-slate-200 bg-slate-50/50'}`}
                            onClick={() => markAsRead(msg.id, msg.read)}
                        >
                            <CardHeader className="pb-2 flex flex-row items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <CardTitle className="text-lg text-slate-800">{msg.subject || 'Consulta General'}</CardTitle>
                                        {!msg.read && <Badge className="bg-emerald-500">Nuevo</Badge>}
                                    </div>
                                    <CardDescription className="flex items-center gap-3 text-sm">
                                        <span className="flex items-center gap-1 font-medium text-slate-700"><User className="w-3 h-3"/> {msg.senderName}</span>
                                        <span className="text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full"><MessageSquare className="w-3 h-3"/> {msg.senderEmail}</span>
                                        {msg.senderPhone && <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{msg.senderPhone}</span>}
                                    </CardDescription>
                                </div>
                                <div className="text-sm text-slate-400 flex items-center gap-1 shrink-0">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'Reciente'}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed mt-2 border-l-2 pl-4 border-slate-200">
                                    {msg.message}
                                </p>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 justify-end">
                                    <a href={`mailto:${msg.senderEmail}?subject=Re: ${msg.subject || 'Consulta Dicilo'}`}>
                                        <Button variant="outline" size="sm" className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200">
                                            <Reply className="w-4 h-4 mr-2" /> Responder
                                        </Button>
                                    </a>
                                    <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}>
                                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
