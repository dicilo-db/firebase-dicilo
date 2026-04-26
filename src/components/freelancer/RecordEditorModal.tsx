'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Send } from 'lucide-react';
import { FreelanceRecord, saveRecordDraft, sendRecordToClient } from '@/app/actions/freelance-records';

interface RecordEditorModalProps {
    record: FreelanceRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function RecordEditorModal({ record, isOpen, onClose, onSuccess }: RecordEditorModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<FreelanceRecord>>(record || {});

    // Update local form state when record changes
    React.useEffect(() => {
        if (record) {
            setFormData(record);
        }
    }, [record]);

    if (!record) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveDraft = async () => {
        setIsLoading(true);
        try {
            const res = await saveRecordDraft(record.id, formData);
            if (res.success) {
                toast({ title: 'Borrador Guardado', description: 'El progreso ha sido guardado exitosamente.' });
                onSuccess();
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendToClient = async () => {
        // Validation: Required fields based on "Basic Form"
        const requiredFields = ['name', 'email', 'phone', 'category', 'city', 'country', 'address'];
        const missingFields = requiredFields.filter(f => !formData[f as keyof FreelanceRecord] || formData[f as keyof FreelanceRecord] === '');

        if (missingFields.length > 0) {
            toast({ 
                title: 'Campos Incompletos', 
                description: `Por favor llena todos los campos obligatorios. Faltan: ${missingFields.join(', ')}`, 
                variant: 'destructive' 
            });
            return;
        }

        setIsLoading(true);
        try {
            const res = await sendRecordToClient(record.id, formData);
            if (res.success) {
                toast({ title: 'Enviado con Éxito', description: 'Se ha enviado el correo de validación al cliente.' });
                onClose();
                onSuccess();
            } else {
                toast({ title: 'Error al enviar', description: res.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Registro P2</DialogTitle>
                    <DialogDescription>Completa todos los campos obligatorios para poder enviarlo a validación.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Nombre de la Empresa *</Label>
                        <Input name="name" value={formData.name || ''} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label>Email de Contacto *</Label>
                        <Input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label>Teléfono *</Label>
                        <Input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label>Categoría *</Label>
                        <Input name="category" value={formData.category || ''} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label>País *</Label>
                        <Input name="country" value={formData.country || ''} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label>Ciudad *</Label>
                        <Input name="city" value={formData.city || ''} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Dirección Completa *</Label>
                        <Input name="address" value={formData.address || ''} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Descripción Breve (Opcional)</Label>
                        <Input name="description" value={formData.description || ''} onChange={handleInputChange} disabled={isLoading} />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Borrador
                    </Button>
                    <Button onClick={handleSendToClient} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Enviar a Cliente
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
