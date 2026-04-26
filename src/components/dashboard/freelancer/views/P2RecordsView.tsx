'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { FreelanceRecord, claimRecordPackage, getAssignedRecords } from '@/app/actions/freelance-records';
import { Loader2, Plus, Edit2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { sendRecordToClient } from '@/app/actions/freelance-records';

export function P2RecordsView() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [records, setRecords] = useState<FreelanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClaiming, setIsClaiming] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);

    const loadRecords = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await getAssignedRecords(user.uid);
            if (res.success && res.data) {
                setRecords(res.data);
            } else {
                toast({ title: 'Error cargando', description: res.error || 'Error desconocido', variant: 'destructive' });
            }
        } catch (e: any) {
            console.error(e);
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRecords();
    }, [user]);

    const handleClaimPackage = async () => {
        if (!user) return;
        setIsClaiming(true);
        try {
            const res = await claimRecordPackage(user.uid);
            if (res.success) {
                toast({ title: 'Éxito', description: res.message });
                loadRecords();
            } else {
                toast({ title: 'Aviso', description: res.message, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsClaiming(false);
        }
    };

    const handleSendToClient = async (recordId: string) => {
        setSendingId(recordId);
        try {
            const res = await sendRecordToClient(recordId);
            if (res.success) {
                toast({ title: 'Éxito', description: 'Registro enviado a validación.' });
                loadRecords();
            } else {
                toast({ title: 'Aviso', description: res.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setSendingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const hasPendingRecords = records.length > 0;

    return (
        <div className="p-4 md:p-8 space-y-8 min-h-full w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Registros (P2)</h1>
                    <p className="text-muted-foreground mt-1">
                        Solicita paquetes de empresas para completar sus datos y enviarlos a validación.
                    </p>
                </div>
                <Button 
                    onClick={handleClaimPackage} 
                    disabled={isClaiming || hasPendingRecords}
                    className="gap-2"
                >
                    {isClaiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Solicitar Paquete (50)
                </Button>
            </div>

            {hasPendingRecords && (
                <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Trabajo Pendiente</AlertTitle>
                    <AlertDescription>
                        Tienes un paquete asignado de {records.length} registros. Debes completar y enviar todos los registros a validación antes de poder solicitar un nuevo paquete.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Mis Registros Pendientes</CardTitle>
                    <CardDescription>Empresas asignadas a tu cuenta que requieren ser completadas.</CardDescription>
                </CardHeader>
                <CardContent>
                    {records.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50">
                            No tienes registros pendientes en este momento.
                            <br />
                            Haz clic en "Solicitar Paquete" para empezar.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-slate-500">Empresa</th>
                                        <th className="px-4 py-3 font-medium text-slate-500">Progreso</th>
                                        <th className="px-4 py-3 font-medium text-slate-500">Estado</th>
                                        <th className="px-4 py-3 font-medium text-slate-500 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {records.map(record => {
                                        const requiredFields = ['name', 'email', 'phone', 'category', 'city', 'country', 'address'];
                                        const filledFields = requiredFields.filter(f => !!record[f as keyof FreelanceRecord]);
                                        const progress = Math.round((filledFields.length / requiredFields.length) * 100);

                                        return (
                                            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-medium">{record.name || 'Sin Nombre'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">{progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="bg-slate-100 capitalize">
                                                        {record.verificationStatus || 'draft'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" asChild className="text-blue-600">
                                                            <a href={`/admin/basic/${record.id}/edit`} target="_blank" rel="noopener noreferrer">
                                                                <Edit2 className="h-4 w-4 mr-2" /> Editar
                                                            </a>
                                                        </Button>
                                                        {record.verificationStatus === 'draft' && (
                                                            <Button 
                                                                variant="default" 
                                                                size="sm" 
                                                                onClick={() => handleSendToClient(record.id)}
                                                                disabled={sendingId === record.id}
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                {sendingId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar a Cliente'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
