'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pen, UserPlus, Send, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logActionAndReward } from '@/app/actions/freelancer-rewards';
import { updateMarketingLead, sendMarketingEmail, convertLeadToClient } from '@/app/actions/admin-marketing';
import { getTemplates, EmailTemplate } from '@/actions/email-templates';

interface FichaTecnicaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead: any;
    onLeadUpdated: () => void;
}

export function FichaTecnicaModal({ open, onOpenChange, lead, onLeadUpdated }: FichaTecnicaModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [editingLead, setEditingLead] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Email Send State
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    
    // Convert State
    const [isConvertOpen, setIsConvertOpen] = useState(false);
    const [targetType, setTargetType] = useState<string>('business');
    const [isConverting, setIsConverting] = useState(false);

    useEffect(() => {
        if (lead && open) {
            setEditingLead({ ...lead });
            fetchTemplates();
        }
    }, [lead, open]);

    const fetchTemplates = async () => {
        try {
            const templatesRes = await getTemplates(true);
            setTemplates((templatesRes || []).filter(t => t.category === 'email_marketing' || t.category === 'marketing'));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveLead = async () => {
        if (!editingLead) return;
        setIsSaving(true);
        try {
            const sanitizedLead = JSON.parse(JSON.stringify(editingLead));
            const res = await updateMarketingLead(editingLead.id, sanitizedLead);
            
            if (res && res.success) {
                toast({ title: 'Lead actualizado', description: 'Cambios guardados correctamente.' });
                // Log action
                if (user) {
                    await logActionAndReward(user.uid, 'p2_data_updated', editingLead.id, 'referrals_pioneers');
                }
                onLeadUpdated();
                onOpenChange(false);
            } else {
                throw new Error(res?.error || 'Error desconocido');
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateKey = () => {
        if (!editingLead) return;
        const array = new Uint8Array(4);
        window.crypto.getRandomValues(array);
        const key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
        setEditingLead({ ...editingLead, securityKey: key });
        toast({ title: 'Clave generada', description: 'Se ha generado una clave única para este prospecto. Recuerda Guardar Cambios.' });
    };

    const handleSendEmail = async () => {
        if (!editingLead || !selectedTemplate || !user) return;
        setIsSending(true);
        try {
            // Save current data first
            const sanitizedLead = JSON.parse(JSON.stringify(editingLead));
            await updateMarketingLead(editingLead.id, sanitizedLead);

            const res = await sendMarketingEmail(editingLead.id, selectedTemplate);
            if (res.success) {
                toast({ title: 'Email enviado', description: 'La campaña se ha enviado al lead.' });
                // Add reward and log
                await logActionAndReward(user.uid, 'email_sent', editingLead.id, 'referrals_pioneers');
                
                setIsEmailOpen(false);
                onLeadUpdated();
            } else {
                throw new Error(res.error);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    const handleConvert = async () => {
        if (!editingLead || !user) return;
        setIsConverting(true);
        try {
            const res = await convertLeadToClient(editingLead.id, targetType);
            if (res.success) {
                toast({ title: 'Convertido con éxito', description: `Se ha creado el negocio/cliente (${targetType}).` });
                // Add reward and log
                await logActionAndReward(user.uid, 'converted_to_client', editingLead.id, 'referrals_pioneers');
                
                setIsConvertOpen(false);
                onOpenChange(false);
                onLeadUpdated();
            } else {
                throw new Error(res.error);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsConverting(false);
        }
    };

    if (!editingLead) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Pen className="h-5 w-5 text-blue-500" />
                            Ficha Técnica del Prospecto
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-6 py-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                <UserPlus className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col text-sm">
                                <span className="text-muted-foreground">Registrado por:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{editingLead.referrerName || 'Tú'}</span>
                                    {editingLead.referrerId && (
                                        <Badge variant="outline" className="font-mono text-[10px] py-0">{editingLead.referrerId}</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre del Lead</Label>
                                <Input 
                                    value={editingLead.friendName} 
                                    onChange={e => setEditingLead({...editingLead, friendName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input 
                                    value={editingLead.friendEmail} 
                                    onChange={e => setEditingLead({...editingLead, friendEmail: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Empresa</Label>
                                <Input 
                                    value={editingLead.companyName || ''} 
                                    onChange={e => setEditingLead({...editingLead, companyName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <Input 
                                    value={editingLead.phone || editingLead.friendPhone || ''} 
                                    onChange={e => setEditingLead({...editingLead, phone: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ciudad</Label>
                                <Input 
                                    value={editingLead.city || ''} 
                                    onChange={e => setEditingLead({...editingLead, city: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>País</Label>
                                <Input 
                                    value={editingLead.country || ''} 
                                    onChange={e => setEditingLead({...editingLead, country: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Idioma de Contacto</Label>
                                <Select value={editingLead.lang || 'es'} onValueChange={v => setEditingLead({...editingLead, lang: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                                        <SelectItem value="en">🇬🇧 English</SelectItem>
                                        <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                                        <SelectItem value="pt">🇵🇹 Português</SelectItem>
                                        <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notas / Comentarios</Label>
                            <Textarea 
                                className="h-24"
                                value={editingLead.notes || ''}
                                onChange={e => setEditingLead({...editingLead, notes: e.target.value})}
                                placeholder="Agrega notas internas sobre este prospecto..."
                            />
                        </div>
                        
                        {/* Security Key & Validation */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 flex flex-col md:flex-row gap-6 items-center mt-2">
                            <div className="flex-1 space-y-2">
                                <Label className="flex items-center gap-2"><Key className="h-4 w-4" /> Clave Única de Registro</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={editingLead.securityKey || ''} 
                                        onChange={(e) => setEditingLead({ ...editingLead, securityKey: e.target.value })}
                                        placeholder="SIN CLAVE..."
                                        className="font-mono bg-white uppercase"
                                    />
                                    {!editingLead.securityKey && (
                                        <Button variant="outline" onClick={handleGenerateKey}>Generar</Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">Esta clave servirá para verificar la autenticidad al momento de que la empresa se registre.</p>
                            </div>

                            <div className="flex-1 space-y-2 text-center md:text-right">
                                <Label className="block mb-2">Estado de Validación</Label>
                                {editingLead.securityKey ? (
                                    <Badge className="bg-green-500 text-white hover:bg-green-600 px-4 py-1.5 text-sm uppercase">✅ CLAVE ASIGNADA</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 px-4 py-1.5 text-sm uppercase">⚠️ PENDIENTE DE REVISIÓN</Badge>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 pt-4 border-t">
                            <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => setIsEmailOpen(true)}
                                disabled={editingLead.converted}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Enviar Campaña
                            </Button>
                            <Button 
                                variant="outline" 
                                className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => setIsConvertOpen(true)}
                                disabled={editingLead.converted}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Convertir a Cliente
                            </Button>
                            <Button 
                                className="flex-1"
                                onClick={handleSaveLead}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Guardar Cambios'}
                            </Button>
                        </div>
                        
                        {editingLead.converted && (
                            <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-green-700 text-sm font-medium">
                                <CheckCircle className="h-4 w-4" />
                                Este lead ya ha sido convertido en cliente con éxito.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL: SELECCIONAR PLANTILLA */}
            <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
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
                            El email se enviará a <strong>{editingLead?.friendEmail}</strong>. Al enviar, recibirás una recompensa en tu Tarjeta Verde y DP.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmailOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSendEmail} disabled={!selectedTemplate || isSending}>
                            {isSending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                            Enviar Ahora
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: CONVERTIR A CLIENTE */}
            <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Convertir Prospecto a Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tipo de Cliente Destino</Label>
                            <Select value={targetType} onValueChange={setTargetType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="business">Solo Negocio (Directorio)</SelectItem>
                                    <SelectItem value="starter">Plan Starter</SelectItem>
                                    <SelectItem value="retailer">Plan Retailer (Einzelhändler)</SelectItem>
                                    <SelectItem value="premium">Plan Premium</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Se creará una nueva entrada en el sistema. Recibirás una recompensa en tu Tarjeta Verde y DP al completar esta acción.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConvertOpen(false)}>Cancelar</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleConvert} disabled={isConverting}>
                            {isConverting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Confirmar Conversión
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
