'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, getDocs, orderBy, doc, updateDoc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, LayoutDashboard, CheckCircle, XCircle, Eye, RefreshCw, LifeBuoy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { approveApoyoSocialRequest, sendApoyoSocialInvite } from '@/app/actions/apoyo-social';

const db = getFirestore(app);

export default function ApoyoSocialAdminPage() {
    const { user: currentUser } = useAuthGuard(['superadmin', 'admin'], 'access_admin_panel');
    const { t } = useTranslation(['admin', 'common']);
    const { toast } = useToast();
    
    const [requests, setRequests] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [detailDialogUser, setDetailDialogUser] = useState<any>(null);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch requests
            const qReq = query(collection(db, 'apoyo_social_requests'), orderBy('createdAt', 'desc'));
            const snapReq = await getDocs(qReq);
            const dataReq = snapReq.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(dataReq);

            // Fetch invites
            const qInv = query(collection(db, 'apoyo_social_invites'), orderBy('lastSentAt', 'desc'));
            const snapInv = await getDocs(qInv);
            const dataInv = snapInv.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInvites(dataInv);
        } catch (error: any) {
            console.error('Error fetching data:', error);
            toast({ title: 'Error', description: 'No se pudieron cargar los datos.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (request: any) => {
        if (!confirm(`¿Estás seguro de APROBAR a ${request.name} para Apoyo Social?`)) return;
        
        try {
            const res = await approveApoyoSocialRequest(request.id);
            if (res.success) {
                toast({ title: 'Aprobado', description: res.message });
                fetchData();
            } else {
                toast({ title: 'Error Backend', description: res.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('¿Rechazar esta solicitud?')) return;
        try {
            await updateDoc(doc(db, 'apoyo_social_requests', id), {
                status: 'rejected',
                rejectedAt: new Date()
            });
            toast({ title: 'Rechazada', description: 'Solicitud rechazada.' });
            fetchData();
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        }
    };

    const handleSendInvite = async () => {
        if (!inviteEmail || !inviteName) {
            toast({ title: 'Error', description: 'Por favor completa nombre y correo.', variant: 'destructive' });
            return;
        }
        setIsInviting(true);
        try {
            const res = await sendApoyoSocialInvite(inviteEmail, inviteName);
            if (res.success) {
                toast({ title: 'Invitación Enviada', description: `Se ha enviado el enlace seguro a ${inviteEmail}` });
                setIsInviteOpen(false);
                setInviteEmail('');
                setInviteName('');
                fetchData();
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
            <main className="container mx-auto flex-grow p-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-green-700">
                        <LifeBuoy className="h-8 w-8" /> Moderación: Apoyo Social
                    </h1>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" /> Volver al Dashboard
                            </Link>
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setIsInviteOpen(true)}>
                            Invitar Organización
                        </Button>
                        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
                        </Button>
                    </div>
                </div>

                <Card className="border-green-200 shadow-sm">
                    <CardHeader className="bg-green-50/50 border-b border-green-100 pb-4">
                        <CardTitle className="text-green-800">Solicitudes Pendientes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        <TableHead>Causa / Proyecto</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Email de Alta</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium text-slate-900">
                                                {req.name || 'Sin Nombre'}
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                                                    {req.category || 'General'}
                                                </span>
                                            </TableCell>
                                            <TableCell>{req.email}</TableCell>
                                            <TableCell>
                                                {req.status === 'pending' && <span className="text-amber-600 font-bold text-sm">Pendiente</span>}
                                                {req.status === 'approved' && <span className="text-green-600 font-bold text-sm">Aprobado</span>}
                                                {req.status === 'rejected' && <span className="text-red-600 font-bold text-sm">Rechazado</span>}
                                            </TableCell>
                                            <TableCell>
                                                {req.createdAt?.seconds 
                                                    ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() 
                                                    : 'Desconocida'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setDetailDialogUser(req)} title="Ver Detalles y PDF">
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <Button variant="ghost" size="sm" onClick={() => handleApprove(req)} title="Aprobar">
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleReject(req.id)} title="Rechazar">
                                                                <XCircle className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {requests.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                                No hay solicitudes de Apoyo Social por el momento.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-blue-200 shadow-sm mt-8">
                    <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                        <CardTitle className="text-blue-800">Invitaciones Enviadas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        <TableHead>Organización</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Último Envío</TableHead>
                                        <TableHead>Nº Envíos</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invites.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-medium text-slate-900">
                                                {inv.organizationName || 'Sin Nombre'}
                                            </TableCell>
                                            <TableCell>{inv.email}</TableCell>
                                            <TableCell>
                                                {inv.lastSentAt?.seconds 
                                                    ? new Date(inv.lastSentAt.seconds * 1000).toLocaleDateString() + ' ' + new Date(inv.lastSentAt.seconds * 1000).toLocaleTimeString()
                                                    : 'Desconocida'}
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold">
                                                    {inv.sentCount || 1}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={async () => {
                                                    if (!confirm(`¿Reenviar invitación a ${inv.email}?`)) return;
                                                    setIsLoading(true);
                                                    try {
                                                        const res = await sendApoyoSocialInvite(inv.email, inv.organizationName);
                                                        if (res.success) {
                                                            toast({ title: 'Reenviado', description: `Se reenvió la invitación a ${inv.email}` });
                                                            fetchData();
                                                        } else {
                                                            toast({ title: 'Error', description: res.error, variant: 'destructive' });
                                                            setIsLoading(false);
                                                        }
                                                    } catch (e: any) {
                                                        toast({ title: 'Error', description: e.message, variant: 'destructive' });
                                                        setIsLoading(false);
                                                    }
                                                }} title="Reenviar Invitación">
                                                    <RefreshCw className="mr-2 h-4 w-4 text-blue-600" /> Reenviar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {invites.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                                No hay invitaciones registradas por el momento.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Modal de Detalles Técnicos */}
            <Dialog open={!!detailDialogUser} onOpenChange={(open) => !open && setDetailDialogUser(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl text-green-700">
                            <LifeBuoy className="h-5 w-5" /> Revisión Documental
                        </DialogTitle>
                    </DialogHeader>
                    {detailDialogUser && (
                        <div className="space-y-4 py-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Proyecto / Nombre</h4>
                                <p className="font-medium text-lg">{detailDialogUser.name}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Historia</h4>
                                <p className="bg-slate-50 p-3 rounded border text-sm text-slate-700 mt-1 italic">
                                    "{detailDialogUser.story || 'No proporcionó historia.'}"
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Email</h4>
                                    <p className="text-sm">{detailDialogUser.email}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Enlace Redes/WhatsApp</h4>
                                    <p className="text-sm">
                                        {detailDialogUser.helpLink ? (
                                            <a href={detailDialogUser.helpLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                Abrir Enlace
                                            </a>
                                        ) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Comprobante (apoyo_social_docs)</h4>
                                {detailDialogUser.documentUrl ? (
                                    <div className="flex items-center gap-3">
                                        <Button asChild variant="secondary" className="w-full bg-green-50 text-green-700 hover:bg-green-100">
                                            <a href={detailDialogUser.documentUrl} target="_blank" rel="noopener noreferrer">
                                                Ver PDF/JPG Adjunto
                                            </a>
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded border border-red-100">
                                        No se proporcionó ningún documento verificador.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="border-t pt-4">
                        <Button variant="outline" onClick={() => setDetailDialogUser(null)}>Cerrar</Button>
                        {detailDialogUser?.status === 'pending' && (
                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                                handleApprove(detailDialogUser);
                                setDetailDialogUser(null);
                            }}>
                                Aprobar Causa
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl text-green-700 font-bold">Enviar Invitación Protegida</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre de la Organización</Label>
                            <Input placeholder="Ej: Protectora de Animales ABC" value={inviteName} onChange={e => setInviteName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Correo Electrónico (El token se vinculará a este coreo)</Label>
                            <Input placeholder="contacto@protectora.org" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">
                            Al enviar esta invitación, el destinatario recibirá un enlace único y ofuscado que le permitirá acceder exclusivamente al formulario de registro seguro.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancelar</Button>
                        <Button className="bg-green-600 text-white" onClick={handleSendInvite} disabled={isInviting}>
                            {isInviting ? 'Enviando...' : 'Enviar Invitación por Correo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
