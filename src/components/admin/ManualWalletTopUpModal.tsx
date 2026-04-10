'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, Lock } from 'lucide-react';
import { setMasterPassword } from '@/app/actions/wallet';

interface ManualWalletTopUpModalProps {
    clientId: string;
    clientEmail?: string; // Optional, helps with verification
    triggerButton?: React.ReactNode; // Optional custom trigger
    onSuccess?: () => void;
}

export function ManualWalletTopUpModal({ clientId, clientEmail, triggerButton, onSuccess }: ManualWalletTopUpModalProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    // Form State
    const [amount, setAmount] = useState<string>('50');
    const [reason, setReason] = useState<string>('Venta: Banner');
    const [masterKey, setMasterKey] = useState<string>('');
    const [viewMode, setViewMode] = useState<'topup' | 'setup'>('topup');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTopUp = async () => {
        if (!amount || Number(amount) <= 0) {
            toast({ title: "Error", description: "Monto inválido", variant: "destructive" });
            return;
        }
        if (!masterKey) {
            toast({ title: "Seguridad", description: "Se requiere la Llave Maestra", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Note: We are using a server action that likely expects a User UID.
            // In the case of Ads, the 'clientId' might be the Company ID, not necessarily the User UID directly.
            // However, the adminProcessManualPayment logic tries to lookup by UID OR UniqueCode.
            // If clientId is the document ID of the client profile, we need to ensure the Wallet uses the same ID.
            // Assuming Client Profile ID == Wallet ID (Standard in this app).

            const res = await adminProcessManualPayment({
                targetUid: clientId,
                targetEmail: clientEmail || '',
                pointsAmount: 0, // Only Cash/Eur for this top-up
                pointsReason: '',
                cashAmount: Number(amount),
                cashReason: reason,
                referenceNote: `Manual TopUp via Ads/Registration Manager`,
                customDate: new Date().toISOString(),
                masterKey: masterKey
            });

            if (res.success) {
                toast({ title: "Éxito", description: `Saldo actualizado: +${amount}€` });
                setIsOpen(false);
                setMasterKey(''); // Clear sensitive data
                if (onSuccess) onSuccess();
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: "Fallo al procesar la transacción", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetKey = async () => {
        if (!masterKey || masterKey.length < 6) {
            toast({ title: "Error", description: "La clave debe tener al menos 6 caracteres", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await setMasterPassword(masterKey);
            if (res.success) {
                toast({ title: "Éxito", description: "Llave Maestra actualizada correctamente" });
                setViewMode('topup');
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Fallo al guardar la clave", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
                setMasterKey('');
                setViewMode('topup');
            }
        }}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <DollarSign className="h-4 w-4" />
                        <span className="sr-only">Cargar Saldo</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                {viewMode === 'topup' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" /> Cargar Saldo (Admin)
                            </DialogTitle>
                            <DialogDescription>
                                Inyección manual de saldo para el cliente <strong>{clientId}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">Monto (€)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="reason" className="text-right">Concepto</Label>
                                <div className="col-span-3">
                                    <Select value={reason} onValueChange={setReason}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Motivo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Venta: Banner">Venta: Banner</SelectItem>
                                            <SelectItem value="Venta: Premium">Venta: Premium</SelectItem>
                                            <SelectItem value="Regalo / Bonus">Regalo / Bonus</SelectItem>
                                            <SelectItem value="Deposito Efectivo">Depósito Efectivo</SelectItem>
                                            <SelectItem value="Ajuste">Ajuste</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="key" className="text-right text-red-500 font-bold">Master Key</Label>
                                <div className="col-span-3 space-y-2">
                                    <div className="relative">
                                        <Lock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="key"
                                            type="password"
                                            placeholder="Contraseña Maestra"
                                            value={masterKey}
                                            onChange={(e) => setMasterKey(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('setup')}
                                        className="text-xs text-blue-600 hover:underline w-full text-right"
                                    >
                                        ¿No tienes clave? Configúrala aquí
                                    </button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleTopUp} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar Recarga
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-blue-600" /> Configurar Llave Maestra
                            </DialogTitle>
                            <DialogDescription>
                                Establece una contraseña segura para autorizar transacciones manuales.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-key">Nueva Llave Maestra</Label>
                                <Input
                                    id="new-key"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={masterKey}
                                    onChange={(e) => setMasterKey(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Esta clave será necesaria para todas las recargas manuales futuras.
                                </p>
                            </div>
                        </div>
                        <DialogFooter className="flex justify-between sm:justify-between">
                            <Button variant="ghost" onClick={() => setViewMode('topup')}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSetKey} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Clave
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
