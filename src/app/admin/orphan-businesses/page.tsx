'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Link2, ShieldAlert, CheckCircle2, ArrowLeft, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { getTemplates, EmailTemplate } from '@/actions/email-templates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// The server actions
import { processOrphanBusiness, sendOrphanBusinessEmail } from '@/app/actions/orphan-business';

export default function OrphanBusinessesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [orphans, setOrphans] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Email templates state
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    const [emailTarget, setEmailTarget] = useState<any>(null);

    // Editable state for emails in the table
    const [emails, setEmails] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        getTemplates(true).then(res => {
            setTemplates(res.filter(t => t.category === 'email_marketing' || t.category === 'marketing'));
        });
    }, []);

    useEffect(() => {
        const fetchOrphans = async () => {
            try {
                const db = getFirestore(app);
                const clientsRef = collection(db, 'clients');
                
                // Fetch all clients, since Firestore doesn't easily let us query "where field does not exist"
                // We'll filter them locally. If they have over 100 it's totally fine.
                const snap = await getDocs(clientsRef);
                const orphanList: any[] = [];
                const emailMap: { [key: string]: string } = {};

                snap.forEach(doc => {
                    const data = doc.data();
                    // Identify orphans: ownerUid is missing or empty
                    if (!data.ownerUid || data.ownerUid.trim() === '') {
                        orphanList.push({
                            id: doc.id,
                            ...data
                        });
                        
                        // Suggest an email
                        let suggestedEmail = data.email || '';
                        if (suggestedEmail.includes('@')) {
                            // If it's something like kontakt@domain.com, replace with dicilo@
                            const domain = suggestedEmail.split('@')[1];
                            suggestedEmail = `dicilo@${domain}`;
                        }
                        emailMap[doc.id] = suggestedEmail;
                    }
                });

                setOrphans(orphanList);
                setEmails(emailMap);
            } catch (err) {
                console.error(err);
                toast({ title: 'Error cargando clientes', variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };

        fetchOrphans();
    }, [toast]);

    const handleEmailChange = (id: string, newEmail: string) => {
        setEmails(prev => ({ ...prev, [id]: newEmail }));
    };

    const handleProcess = async (clientId: string) => {
        const targetEmail = emails[clientId];
        if (!targetEmail || !targetEmail.includes('@')) {
            toast({ title: 'Email inválido', description: 'Por favor asigna un email válido.', variant: 'destructive' });
            return;
        }

        setProcessingId(clientId);
        try {
            const result = await processOrphanBusiness(clientId, targetEmail);
            if (result.success) {
                toast({
                    title: '¡Acceso Generado!',
                    description: `Contraseña: ${result.credentials?.password}`,
                    duration: 10000,
                });
                
                // Open Email Modal
                setEmailTarget({ 
                    id: clientId, 
                    email: targetEmail, 
                    password: result.credentials?.password, 
                    name: orphans.find(o => o.id === clientId)?.clientName || orphans.find(o => o.id === clientId)?.name 
                });
                setIsEmailOpen(true);

                // Remove from local list
                setOrphans(prev => prev.filter(o => o.id !== clientId));
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleSendEmail = async () => {
        if (!emailTarget || !selectedTemplate) return;
        setIsSending(true);
        try {
            const res = await sendOrphanBusinessEmail(emailTarget.id, emailTarget.email, selectedTemplate, emailTarget.password);
            if (res.success) {
                toast({ title: 'Email enviado', description: 'La campaña se ha enviado al cliente.' });
                setIsEmailOpen(false);
                setEmailTarget(null);
            } else {
                throw new Error(res.error);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Link href="/admin/dashboard" className="hover:text-slate-900 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <span>Volver al Dashboard</span>
                    </div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldAlert className="h-8 w-8 text-amber-500" />
                        Empresas Huérfanas ({orphans.length})
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Estas empresas fueron creadas manualmente en la base de datos pero no tienen cuenta de acceso. 
                        Revisa el correougerido, cámbialo si es necesario y genera el acceso con un clic.
                    </p>
                </div>
            </div>

            <Card className="border-t-4 border-t-amber-500">
                <CardHeader>
                    <CardTitle>Listado de Empresas sin OwnerUid</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : orphans.length === 0 ? (
                        <div className="text-center py-10 flex flex-col items-center">
                            <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
                            <h3 className="text-xl font-medium">¡Todo al día!</h3>
                            <p className="text-slate-500">No tienes compañías huérfanas pendientes.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3">Empresa</th>
                                        <th className="px-4 py-3">Email Original</th>
                                        <th className="px-4 py-3">Email de Acceso (Nuevo)</th>
                                        <th className="px-4 py-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orphans.map(orphan => (
                                        <tr key={orphan.id} className="border-b hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                {orphan.clientName || orphan.name || 'Sin Nombre'}
                                                <div className="text-xs text-slate-400 font-mono mt-1">{orphan.id}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {orphan.email || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Input 
                                                    value={emails[orphan.id] || ''}
                                                    onChange={(e) => handleEmailChange(orphan.id, e.target.value)}
                                                    className="w-full max-w-[250px]"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button 
                                                    disabled={processingId === orphan.id}
                                                    onClick={() => handleProcess(orphan.id)}
                                                    className="bg-emerald-600 hover:bg-emerald-700"
                                                    size="sm"
                                                >
                                                    {processingId === orphan.id ? 'Generando...' : (
                                                        <span className="flex items-center gap-2">
                                                            <Link2 className="h-4 w-4" /> Generar Acceso
                                                        </span>
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* MODAL: SELECCIONAR PLANTILLA */}
            <Dialog open={isEmailOpen} onOpenChange={(open) => {
                if (!open) setEmailTarget(null);
                setIsEmailOpen(open);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Seleccionar Plantilla de Campaña</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Plantillas Disponibles (Email Marketing)</Label>
                            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una plantilla..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id as string}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                    {templates.length === 0 && (
                                        <SelectItem value="none" disabled>No hay plantillas de marketing</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            El email se enviará a <strong>{emailTarget?.email}</strong> usando las variables de personalización disponibles. 
                            La clave generada es: <strong>{emailTarget?.password}</strong>
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmailOpen(false)}>Cerrar</Button>
                        <Button onClick={handleSendEmail} disabled={!selectedTemplate || isSending}>
                            {isSending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                            Enviar Ahora
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
