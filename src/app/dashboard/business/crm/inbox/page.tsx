'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Send, Phone, User, Globe, MessageCircleHeart, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function OmnichannelInboxPage() {
    const { t } = useTranslation('common');
    const { role, plan, isLoading } = useBusinessAccess();
    const { toast } = useToast();
    
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [activeUser, setActiveUser] = useState<string | null>(null);

    // Escuchar el Webhook Omnicanal en tiempo real
    useEffect(() => {
        const q = query(
            collection(db, 'crm_communications'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: any[] = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() });
            });
            setMessages(msgs);
            setLoadingData(false);
            
            // Auto-select first user if none selected
            if(msgs.length > 0 && !activeUser) {
                setActiveUser(msgs[msgs.length - 1].senderId);
            }
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoadingData(false);
        });

        return () => unsubscribe();
    }, [activeUser]);

    if (isLoading) return <div className="p-8"><Skeleton className="w-full h-96" /></div>;

    // Solo Admin y Team Office
    if (!['admin', 'superadmin', 'team_office'].includes(role) && plan !== 'premium') {
        return (
            <div className="p-8 text-center text-rose-600 font-bold">
                Acceso Restringido. Bandeja Unificada exclusiva para Gestión Operativa.
            </div>
        );
    }

    // Agrupar mensajes por remitente
    const conversationGroups = messages.reduce((acc, msg) => {
        const id = msg.senderId || 'unknown';
        if (!acc[id]) acc[id] = [];
        acc[id].push(msg);
        return acc;
    }, {} as Record<string, any[]>);

    const activeConversation = activeUser ? conversationGroups[activeUser] || [] : [];
    const sourceIcon = (source: string) => {
        if(source === 'whatsapp') return <MessageCircleHeart className="w-4 h-4 text-emerald-500" />;
        if(source === 'telegram') return <Send className="w-4 h-4 text-blue-500" />;
        return <Globe className="w-4 h-4 text-slate-500" />;
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !activeUser) return;
        setSending(true);

        try {
            // Buscamos cuál fue el último canal que usó el cliente para responderle por ahí
            const lastMsg = activeConversation[activeConversation.length - 1];
            const targetChannel = lastMsg?.source_channel || 'whatsapp';

            // 1. Guardar en Base de Datos
            await addDoc(collection(db, 'crm_communications'), {
                source_channel: targetChannel,
                senderId: activeUser, // El mismo hilo
                senderName: 'Team Office DICILO',
                content: replyText,
                direction: 'outbound',
                timestamp: new Date().toISOString(),
                read: true
            });

            // 2. Aquí iría el POST a tu API real de WhatsApp o Bot
            /*
            await fetch('/api/webhooks/send_whatsapp', {
                method: 'POST',
                body: JSON.stringify({ to: activeUser, message: replyText })
            });
            */

            setReplyText('');
            toast({ title: 'Mensaje Enviado', description: `Enviado vía ${targetChannel}` });

        } catch (error) {
            console.error(error);
            toast({ title: 'Error al enviar', variant: 'destructive' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in zoom-in duration-500 h-[calc(100vh-80px)] flex flex-col">
            <div className="pb-4 border-b border-slate-200 text-left mb-6 shrink-0">
                <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-900">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                    Bandeja Omnicanal Central
                </h1>
                <p className="mt-2 text-slate-500 text-lg">
                    Comunícate con leads de WhatsApp, Telegram y la Web sin salir de Dicilo.
                </p>
            </div>

            <div className="flex-1 overflow-hidden flex gap-6 pb-8">
                {/* Lista de Chats */}
                <Card className="w-1/3 border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="bg-slate-100 p-4 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                        <User className="w-5 h-5"/> Contactos Activos
                    </div>
                    <div className="flex-1 overflow-y-auto w-full">
                        {loadingData ? (
                            <div className="p-4 space-y-4"><Skeleton className="h-12 w-full"/><Skeleton className="h-12 w-full"/></div>
                        ) : Object.keys(conversationGroups).length === 0 ? (
                            <div className="p-8 text-center text-slate-400">No hay mensajes recientes.</div>
                        ) : (
                            Object.keys(conversationGroups).map((id) => {
                                const msgs = conversationGroups[id];
                                const last = msgs[msgs.length - 1];
                                const unread = msgs.filter(m => !m.read && m.direction === 'inbound').length;
                                return (
                                    <button 
                                        key={id}
                                        onClick={() => setActiveUser(id)}
                                        className={`w-full text-left p-4 border-b border-slate-100 flex gap-3 hover:bg-slate-50 transition-colors ${activeUser === id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                                    >
                                        <div className="mt-1">{sourceIcon(last.source_channel)}</div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="font-semibold text-sm truncate text-slate-800">{last.senderName || id}</div>
                                            <div className="text-xs text-slate-500 truncate">{last.content}</div>
                                        </div>
                                        {unread > 0 && <div className="bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold ml-2 shrink-0">{unread}</div>}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </Card>

                {/* Panel de Conversación */}
                <Card className="flex-1 border-slate-200 shadow-sm flex flex-col overflow-hidden bg-slate-50/50 relative">
                    {activeUser ? (
                        <>
                            <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                        {(activeConversation[0]?.senderName || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{activeConversation[0]?.senderName || activeUser}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            {sourceIcon(activeConversation[activeConversation.length - 1]?.source_channel)}
                                            Vía {activeConversation[activeConversation.length - 1]?.source_channel}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2 text-slate-600"><Phone className="w-4 h-4"/> Ver Ficha CRM</Button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {activeConversation.map((msg, i) => {
                                    const isOutbound = msg.direction === 'outbound';
                                    return (
                                        <div key={i} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-3 rounded-2xl ${isOutbound ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-bl-sm'}`}>
                                                <div className="text-sm">{msg.content}</div>
                                                <div className={`text-[10px] mt-1 flex items-center gap-1 justify-end opacity-70 ${isOutbound ? 'text-blue-100' : 'text-slate-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    {isOutbound && <CheckCircle2 className="w-3 h-3" />}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
                                <Input 
                                    className="flex-1 bg-slate-50"
                                    placeholder={`Responder vía ${activeConversation[activeConversation.length - 1]?.source_channel || 'canal'}...`}
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                                />
                                <Button className="bg-blue-600 hover:bg-blue-700 w-12 shrink-0 p-0" onClick={handleSendReply} disabled={sending}>
                                    <Send className="w-5 h-5 ml-1" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
                            <p>Selecciona una conversación para empezar a chatear.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
