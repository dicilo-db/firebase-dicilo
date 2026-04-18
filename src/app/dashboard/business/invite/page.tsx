'use client';

import React, { useState, useEffect } from 'react';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Share2, Mail, Link as LinkIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { sendBusinessDirectInvite, fetchBusinessInviteData, INVITATION_TEMPLATES } from '@/app/actions/business-invites';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BusinessInvitePage() {
    const { t } = useTranslation('common');
    const { businessId, clientId, isLoading: authLoading } = useBusinessAccess();
    const [clientData, setClientData] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [lang, setLang] = useState('es');
    const [isSending, setIsSending] = useState(false);

    const activeId = clientId || businessId;

    useEffect(() => {
        let mounted = true;
        if (!activeId) {
            setLoadingData(false);
            return;
        }

        async function fetchClient() {
            try {
                const result = await fetchBusinessInviteData(activeId as string);
                if (mounted && result.success) {
                    setClientData(result.clientData);
                }
            } catch (err) {
                console.error("Error fetching client for invite:", err);
            } finally {
                if (mounted) setLoadingData(false);
            }
        }

        fetchClient();
        return () => { mounted = false; };
    }, [activeId]);

    if (authLoading || loadingData) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <Skeleton className="w-full h-[500px] rounded-xl" />
            </div>
        );
    }

    if (!clientData || !clientData.uniqueCode) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
                    No se encontró el código de invitación (EMDC) para esta empresa. Por favor, contacta a soporte.
                </div>
            </div>
        );
    }

    const uniqueCode = clientData.uniqueCode;
    const businessName = clientData.clientName || 'Tu Empresa';
    const inviteLink = `https://dicilo.net/register?invite=${uniqueCode}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        toast({ title: '¡Enlace Copiado!', description: 'El enlace de invitación ha sido copiado al portapapeles.' });
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(uniqueCode);
        toast({ title: '¡Código Copiado!', description: 'El código ha sido copiado al portapapeles.' });
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || !inviteName) {
            toast({ title: 'Error', description: 'Por favor completa el nombre y el correo.', variant: 'destructive' });
            return;
        }

        setIsSending(true);
        try {
            const res = await sendBusinessDirectInvite({
                friendEmail: inviteEmail,
                friendName: inviteName,
                businessName: businessName,
                uniqueCode: uniqueCode,
                lang: lang
            });

            if (res.success) {
                toast({ title: '¡Invitación Enviada!', description: `El correo fue enviado exitosamente a ${inviteEmail}.` });
                setInviteEmail('');
                setInviteName('');
            } else {
                toast({ title: 'Error al enviar', description: res.message, variant: 'destructive' });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Ocurrió un error inesperado.', variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-0 animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white shadow-xl mb-4">
                <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <Gift className="w-8 h-8" />
                            Invitar a tu Red
                        </h1>
                        <p className="mt-2 text-blue-200 max-w-3xl text-lg">
                            Comparte tu código corporativo. Cuando otras empresas o clientes se unan usando tu enlace, recibirás recompensas y bonos directos en tu Wallet B2B.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1240px] mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Tarjeta de Código de Invitación */}
                    <Card className="border-2 border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                <Share2 className="w-6 h-6 text-blue-600" />
                                Tu Código Corporativo
                            </CardTitle>
                            <CardDescription>
                                Entrega este código a tus afiliados o clientes para que lo introduzcan al momento de registrarse en Dicilo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10">
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl text-center">
                                <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Código Exclusivo EMDC</p>
                                <p className="text-4xl font-extrabold tracking-widest text-slate-900">{uniqueCode}</p>
                                <Button variant="outline" size="sm" onClick={handleCopyCode} className="mt-4 bg-white">
                                    Copiar Código
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Enlace de Registro Rápido</Label>
                                <div className="flex gap-2">
                                    <Input value={inviteLink} readOnly className="bg-white font-mono text-xs" />
                                    <Button onClick={handleCopyLink} variant="secondary">
                                        <LinkIcon className="w-4 h-4 mr-2" /> Copiar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarjeta de Formulario de Email */}
                    <Card className="border-2 border-blue-100 shadow-lg relative overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Mail className="w-6 h-6 text-blue-600" />
                                Enviar Invitación Oficial
                            </CardTitle>
                            <CardDescription>
                                Utiliza esta herramienta para enviar un email corporativo pre-diseñado a tu prospecto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 relative z-10">
                            <form onSubmit={handleSendEmail} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="friendName">Nombre de la persona o contacto</Label>
                                    <Input 
                                        id="friendName" 
                                        placeholder="Ej: Carlos Díaz" 
                                        value={inviteName}
                                        onChange={(e) => setInviteName(e.target.value)}
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="friendEmail">Correo electrónico del destino</Label>
                                    <Input 
                                        id="friendEmail" 
                                        type="email" 
                                        placeholder="carlos@empresa.com" 
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        required 
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="lang">Idioma del Correo</Label>
                                    <Select value={lang} onValueChange={setLang}>
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Seleccione un idioma" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="es">🇪🇸 Español</SelectItem>
                                            <SelectItem value="en">🇬🇧 English</SelectItem>
                                            <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Preview Zone */}
                                <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                    <div className="bg-slate-200 p-2 text-xs font-semibold text-slate-600 flex justify-between items-center">
                                        <span>Vista Previa del Email ({lang.toUpperCase()})</span>
                                        <span className="text-[10px] bg-slate-300 px-2 py-0.5 rounded">Asunto: {INVITATION_TEMPLATES[lang]?.subject.replace('[Empresa]', businessName)}</span>
                                    </div>
                                    <div className="p-4 text-sm text-slate-700 bg-white">
                                        <p className="font-bold mb-2">{INVITATION_TEMPLATES[lang]?.greeting.replace('[Nombre]', inviteName || 'Carlos')}</p>
                                        <p className="mb-2" dangerouslySetInnerHTML={{ __html: INVITATION_TEMPLATES[lang]?.msg.replace('[Empresa]', businessName) }}></p>
                                        <p className="mb-3 text-slate-500 italic border-l-2 pl-2">{INVITATION_TEMPLATES[lang]?.benefits}</p>
                                        <p className="font-medium text-blue-600 max-w-full truncate">{INVITATION_TEMPLATES[lang]?.cta.replace('[Empresa]', businessName)} {uniqueCode}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100 mt-4 flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-500" />
                                    <p>El destinatario recibirá el email exacto que se muestra arriba, y el enlace de afiliación estará automáticamente configurado.</p>
                                </div>

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isSending}>
                                    {isSending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando envío...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4 mr-2" /> Enviar Invitación
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
