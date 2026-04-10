'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
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

import { approveApoyoSocialRequest, sendApoyoSocialInvite } from '@/app/actions/apoyo-social';
// The new ApoyoSocialInviteForm component provides the form. We can render it if needed, or stick to the dialog for backward compatibility but using the hook form.
import { ApoyoSocialInviteForm } from '@/components/dashboard/apoyo-social/ApoyoSocialInviteForm';


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

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch requests and sort client-side to avoid index composite requirement error
            const qReq = query(collection(db, 'apoyo_social_requests'));
            const snapReq = await getDocs(qReq);
            let dataReq = snapReq.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dataReq.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setRequests(dataReq);

            // Fetch invites
            const qInv = query(collection(db, 'apoyo_social_invites'));
            const snapInv = await getDocs(qInv);
            let dataInv = snapInv.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dataInv.sort((a: any, b: any) => (b.lastSentAt?.seconds || 0) - (a.lastSentAt?.seconds || 0));
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
        if (!confirm(`¿Estás seguro de que deseas aprobar a ${request.name}?`)) return;
        
        try {
            const res = await approveApoyoSocialRequest(request.id);
            if (res.success) {
                toast({ title: t('apoyo_social.statusApproved'), description: res.message });
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
            toast({ title: t('apoyo_social.statusRejected'), description: 'Solicitud rechazada.' });
            fetchData();
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        }
    };


    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
            <main className="container mx-auto flex-grow p-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-green-700">
                        <LifeBuoy className="h-8 w-8" /> {t('apoyo_social.title', 'Moderación: Apoyo Social')}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" /> {t('apoyo_social.backToDashboard')}
                            </Link>
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setIsInviteOpen(true)}>
                            {t('apoyo_social.inviteOrg')}
                        </Button>
                        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> {t('apoyo_social.refresh')}
                        </Button>
                    </div>
                </div>

                <Card className="border-green-200 shadow-sm">
                    <CardHeader className="bg-green-50/50 border-b border-green-100 pb-4">
                        <CardTitle className="text-green-800">{t('apoyo_social.pendingRequests')}</CardTitle>
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
                                        <TableHead>{t('apoyo_social.causeProject')}</TableHead>
                                        <TableHead>{t('apoyo_social.category')}</TableHead>
                                        <TableHead>{t('apoyo_social.email')}</TableHead>
                                        <TableHead>{t('apoyo_social.status')}</TableHead>
                                        <TableHead>{t('apoyo_social.date')}</TableHead>
                                        <TableHead className="text-right">{t('apoyo_social.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium text-slate-900">
                                                {req.name || t('apoyo_social.noName')}
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                                                    {req.category || t('apoyo_social.general')}
                                                </span>
                                            </TableCell>
                                            <TableCell>{req.email}</TableCell>
                                            <TableCell>
                                                {req.status === 'pending' && <span className="text-amber-600 font-bold text-sm">{t('apoyo_social.statusPending')}</span>}
                                                {req.status === 'approved' && <span className="text-green-600 font-bold text-sm">{t('apoyo_social.statusApproved')}</span>}
                                                {req.status === 'rejected' && <span className="text-red-600 font-bold text-sm">{t('apoyo_social.statusRejected')}</span>}
                                            </TableCell>
                                            <TableCell>
                                                {req.createdAt?.seconds 
                                                    ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() 
                                                    : t('apoyo_social.unknownDate')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setDetailDialogUser(req)} title={t('apoyo_social.viewDetails')}>
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <Button variant="ghost" size="sm" onClick={() => handleApprove(req)} title={t('apoyo_social.approve')}>
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleReject(req.id)} title={t('apoyo_social.reject')}>
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
                                                {t('apoyo_social.noRequests')}
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
                        <CardTitle className="text-blue-800">{t('apoyo_social.sentInvites')}</CardTitle>
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
                                        <TableHead>{t('apoyo_social.organization')}</TableHead>
                                        <TableHead>{t('apoyo_social.email')}</TableHead>
                                        <TableHead>{t('apoyo_social.lastSent')}</TableHead>
                                        <TableHead>{t('apoyo_social.sentCount')}</TableHead>
                                        <TableHead className="text-right">{t('apoyo_social.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invites.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-medium text-slate-900">
                                                {inv.organizationName || t('apoyo_social.noName')}
                                            </TableCell>
                                            <TableCell>{inv.email}</TableCell>
                                            <TableCell>
                                                {inv.lastSentAt?.seconds 
                                                    ? new Date(inv.lastSentAt.seconds * 1000).toLocaleDateString() + ' ' + new Date(inv.lastSentAt.seconds * 1000).toLocaleTimeString()
                                                    : t('apoyo_social.unknownDate')}
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
                                                        const res = await sendApoyoSocialInvite(inv.email, inv.organizationName, 'es');
                                                        if (res.success) {
                                                            toast({ title: t('apoyo_social.resend'), description: `Se reenvió la invitación a ${inv.email}` });
                                                            fetchData();
                                                        } else {
                                                            toast({ title: 'Error', description: res.error, variant: 'destructive' });
                                                            setIsLoading(false);
                                                        }
                                                    } catch (e: any) {
                                                        toast({ title: 'Error', description: e.message, variant: 'destructive' });
                                                        setIsLoading(false);
                                                    }
                                                }} title={t('apoyo_social.resend')}>
                                                    <RefreshCw className="mr-2 h-4 w-4 text-blue-600" /> {t('apoyo_social.resend')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {invites.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                                {t('apoyo_social.noInvites')}
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
                            <LifeBuoy className="h-5 w-5" /> {t('apoyo_social.docReview')}
                        </DialogTitle>
                    </DialogHeader>
                    {detailDialogUser && (
                        <div className="space-y-4 py-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{t('apoyo_social.causeProject')}</h4>
                                <p className="font-medium text-lg">{detailDialogUser.name}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{t('apoyo_social.story')}</h4>
                                <p className="bg-slate-50 p-3 rounded border text-sm text-slate-700 mt-1 italic">
                                    "{detailDialogUser.story || t('apoyo_social.noStory')}"
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Email</h4>
                                    <p className="text-sm">{detailDialogUser.email}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{t('apoyo_social.helpLink')}</h4>
                                    <p className="text-sm">
                                        {detailDialogUser.helpLink ? (
                                            <a href={detailDialogUser.helpLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {t('apoyo_social.openLink')}
                                            </a>
                                        ) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('apoyo_social.proofDoc')}</h4>
                                {detailDialogUser.documentUrl ? (
                                    <div className="flex items-center gap-3">
                                        <Button asChild variant="secondary" className="w-full bg-green-50 text-green-700 hover:bg-green-100">
                                            <a href={detailDialogUser.documentUrl} target="_blank" rel="noopener noreferrer">
                                                {t('apoyo_social.viewDoc')}
                                            </a>
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded border border-red-100">
                                        {t('apoyo_social.noDoc')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="border-t pt-4">
                        <Button variant="outline" onClick={() => setDetailDialogUser(null)}>{t('apoyo_social.close')}</Button>
                        {detailDialogUser?.status === 'pending' && (
                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                                handleApprove(detailDialogUser);
                                setDetailDialogUser(null);
                            }}>
                                {t('apoyo_social.approveCause')}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent>
                    <ApoyoSocialInviteForm />
                </DialogContent>
            </Dialog>
        </div>
    );
}
