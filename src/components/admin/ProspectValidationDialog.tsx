'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pen, UserPlus, Key, Mail, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { sendProspectInvitation } from '@/app/actions/prospect-actions';

const db = getFirestore(app);

interface ProspectValidationDialogProps {
    prospect: any | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: (updatedProspect: any) => void;
}

export function ProspectValidationDialog({
    prospect,
    isOpen,
    onOpenChange,
    onUpdate
}: ProspectValidationDialogProps) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    
    const [editingRec, setEditingRec] = useState<any | null>(null);
    const [recommenderDetails, setRecommenderDetails] = useState<{name: string, diciloCode: string} | null>(null);
    
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    
    // Sync local state when prospect prop changes
    useEffect(() => {
        if (prospect) {
            setEditingRec({ ...prospect });
        } else {
            setEditingRec(null);
        }
    }, [prospect]);

    // Fetch recommender details
    useEffect(() => {
        if (editingRec?.userId && !recommenderDetails) {
            getDoc(doc(db, 'private_profiles', editingRec.userId)).then(d => {
                if (d.exists()) {
                    const ud = d.data();
                    setRecommenderDetails({
                        name: ud.name || ud.first_name || editingRec.referrerName || t('validationDialog.unknown', 'Desconocido'),
                        diciloCode: ud.diciloCode || editingRec.diciloCode || '-'
                    });
                } else {
                    setRecommenderDetails(null);
                }
            }).catch(console.error);
        }
    }, [editingRec?.userId, db, recommenderDetails, t]);

    const handleSaveEdit = async () => {
        if (!editingRec || !editingRec.id) return;
        setIsSavingEdit(true);
        try {
            const { id, ...dataToSave } = editingRec;
            await updateDoc(doc(db, 'recommendations', id), dataToSave);
            
            toast({ title: t('validationDialog.updatedTitle', 'Recomendación actualizada'), description: t('validationDialog.updatedDesc', 'Cambios guardados exitosamente.') });
            onUpdate(editingRec);
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: t('common.error', 'Error'), description: error.message, variant: 'destructive' });
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleVerifyData = () => {
        if (!editingRec) return;
        let isValid = true;
        
        if (!editingRec.companyName || editingRec.companyName.trim() === '') isValid = false;
        if (!editingRec.email || !editingRec.email.includes('@')) isValid = false;
        
        if (isValid) {
            setEditingRec({ ...editingRec, validationStatus: 'validated' });
            toast({ title: t('validationDialog.verifiedTitle', 'Datos verificados'), description: t('validationDialog.verifiedDesc', 'La información del prospecto es válida. Puedes enviar la invitación.') });
        } else {
            setEditingRec({ ...editingRec, validationStatus: 'pending' });
            toast({ title: t('validationDialog.failedTitle', 'Validación fallida'), description: t('validationDialog.failedDesc', 'Faltan campos obligatorios o el email es inválido.'), variant: 'destructive' });
        }
    };

    const handleGenerateKey = () => {
        if (!editingRec) return;
        const array = new Uint8Array(4);
        window.crypto.getRandomValues(array);
        const key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
        setEditingRec({ ...editingRec, securityKey: key });
        toast({ title: t('validationDialog.keyGeneratedTitle', 'Clave generada'), description: t('validationDialog.keyGeneratedDesc', 'Se ha generado una clave única para este prospecto.') });
    };

    const handleSendInvitation = async () => {
        if (!editingRec || !editingRec.id) return;
        setIsSendingEmail(true);
        try {
            const { id, ...dataToSave } = editingRec;
            await updateDoc(doc(db, 'recommendations', id), dataToSave);

            const result = await sendProspectInvitation(id);
            
            if (!result) {
                throw new Error(t('validationDialog.serverError', "El servidor no pudo ser contactado."));
            }

            if (result.success) {
                toast({ title: t('validationDialog.emailSentTitle', 'Invitación enviada'), description: t('validationDialog.emailSentDesc', 'El email de invitación se ha enviado exitosamente.') });
                const updatedRec = { ...editingRec, validationStatus: 'invitation_sent', securityKey: result.securityKey || editingRec.securityKey };
                setEditingRec(updatedRec);
                onUpdate(updatedRec);
            } else {
                throw new Error(result.error || t('validationDialog.emailFailed', "Falló el envío de la invitación."));
            }
        } catch (error: any) {
            toast({ title: t('validationDialog.emailErrorTitle', 'Error al enviar invitación'), description: error.message, variant: 'destructive' });
        } finally {
            setIsSendingEmail(false);
        }
    };

    if (!editingRec) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('validationDialog.title', 'Centro de Validación de Prospecto')}</DialogTitle>
                    <DialogDescription>{t('validationDialog.description', 'Revisa y verifica la información antes de enviar la invitación segura.')}</DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                    {/* Recommender Data Section */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-muted-foreground flex items-center gap-2">
                            <UserPlus className="h-4 w-4" /> {t('validationDialog.recommenderData', 'Datos del Recomendador')}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs">{t('validationDialog.recommenderName', 'Nombre del recomendador')}</p>
                                <p className="font-medium text-foreground">
                                    {recommenderDetails ? recommenderDetails.name : 
                                    (editingRec.referrerName === 'Un usuario de Dicilo' && editingRec.userId ? `ID Sistema: ${editingRec.userId.slice(0, 8)}...` : 
                                    (editingRec.referrerName || editingRec.contactName || t('validationDialog.unknown', 'Desconocido')))}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">{t('validationDialog.recommenderId', 'ID del recomendador')}</p>
                                <p className="font-medium font-mono bg-white inline-block px-1 border rounded">
                                    {recommenderDetails ? recommenderDetails.diciloCode : (editingRec.diciloCode || (editingRec.userId ? editingRec.userId.slice(0, 8) : 'N/A'))}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Company Information */}
                    <div className="grid gap-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Pen className="h-4 w-4" /> {t('validationDialog.companyData', 'Datos de la Empresa')}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>{t('validationDialog.companyName', 'Nombre de Empresa')} *</Label>
                                <Input value={editingRec.companyName || ''} onChange={(e) => setEditingRec({ ...editingRec, companyName: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('validationDialog.category', 'Categoría')}</Label>
                                <Input value={editingRec.category || ''} onChange={(e) => setEditingRec({ ...editingRec, category: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>{t('validationDialog.email', 'Email General / Contacto')} *</Label>
                                <Input value={editingRec.email || editingRec.companyEmail || ''} onChange={(e) => setEditingRec({ ...editingRec, email: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('validationDialog.phone', 'Teléfono')}</Label>
                                <Input value={editingRec.phone || editingRec.companyPhone || ''} onChange={(e) => setEditingRec({ ...editingRec, phone: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label>{t('validationDialog.country', 'País')}</Label>
                                <Input value={editingRec.country || ''} onChange={(e) => setEditingRec({ ...editingRec, country: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('validationDialog.city', 'Ciudad')}</Label>
                                <Input value={editingRec.city || ''} onChange={(e) => setEditingRec({ ...editingRec, city: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('validationDialog.neighborhood', 'Barrio / Zona')}</Label>
                                <Input value={editingRec.neighborhood || ''} onChange={(e) => setEditingRec({ ...editingRec, neighborhood: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid gap-2 mt-2">
                            <Label>{t('validationDialog.lang', 'Idioma de Contacto')}</Label>
                            <Select value={editingRec.lang || 'es'} onValueChange={v => setEditingRec({...editingRec, lang: v})}>
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
                        <div className="grid gap-2">
                            <Label>{t('validationDialog.website', 'Sitio Web / Redes Sociales')}</Label>
                            <Input value={editingRec.website || ''} onChange={(e) => setEditingRec({ ...editingRec, website: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('validationDialog.comments', 'Comentarios del Recomendador')}</Label>
                            <Textarea value={editingRec.comments || ''} onChange={(e) => setEditingRec({ ...editingRec, comments: e.target.value })} />
                        </div>
                    </div>

                    {/* Security Key & Validation */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1 space-y-2">
                            <Label className="flex items-center gap-2"><Key className="h-4 w-4" /> {t('validationDialog.securityKey', 'Clave Única de Registro')}</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={editingRec.securityKey || ''} 
                                    onChange={(e) => setEditingRec({ ...editingRec, securityKey: e.target.value })}
                                    placeholder={t('validationDialog.noKey', 'Sin clave...')}
                                    className="font-mono bg-white uppercase"
                                />
                                {!editingRec.securityKey && (
                                    <Button variant="outline" onClick={handleGenerateKey}>{t('validationDialog.generate', 'Generar')}</Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">{t('validationDialog.keyHint', 'Esta clave servirá para verificar la autenticidad al momento de que la empresa se registre.')}</p>
                        </div>

                        <div className="flex-1 space-y-2 text-center md:text-right">
                            <Label className="block mb-2">{t('validationDialog.validationState', 'Estado de Validación')}</Label>
                            {editingRec.validationStatus === 'validated' || editingRec.validationStatus === 'invitation_sent' ? (
                                <Badge className="bg-green-500 text-white hover:bg-green-600 px-4 py-1.5 text-sm uppercase">✅ {t('validationDialog.stateValidated', 'Datos Validados')}</Badge>
                            ) : (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 px-4 py-1.5 text-sm uppercase">⚠️ {t('validationDialog.statePending', 'Pendiente de Revisión')}</Badge>
                            )}
                            
                            {editingRec.validationStatus === 'invitation_sent' && (
                                <p className="text-xs text-green-600 font-medium mt-1">{t('validationDialog.emailSentNote', 'Invitación ya enviada')}</p>
                            )}
                        </div>
                    </div>

                </div>
                
                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel', 'Cancelar')}</Button>
                        <Button onClick={handleSaveEdit} variant="secondary" disabled={isSavingEdit}>
                            {isSavingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('validationDialog.saveWithoutSending', 'Guardar Sin Enviar')}
                        </Button>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto md:ml-auto">
                        {editingRec?.validationStatus !== 'validated' && editingRec?.validationStatus !== 'invitation_sent' ? (
                            <Button onClick={handleVerifyData} className="bg-blue-600 hover:bg-blue-700">
                                {t('validationDialog.verifyBtn', 'Verificar Datos')}
                            </Button>
                        ) : (
                            <Button onClick={handleSendInvitation} disabled={isSendingEmail || !editingRec?.securityKey} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                                {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                {t('validationDialog.sendEmailBtn', 'Disparar Email de Invitación')}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
