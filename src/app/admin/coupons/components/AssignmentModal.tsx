'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { searchPrivateUsers, assignCoupon } from '@/app/actions/coupons';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    couponId: string;
    companyId: string;
    couponTitle: string;
}

export function AssignmentModal({ isOpen, onClose, couponId, companyId, couponTitle }: AssignmentModalProps) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm || searchTerm.length < 2) return;
        setIsSearching(true);
        const res = await searchPrivateUsers(searchTerm);
        if (res.success) {
            setUsers(res.users || []);
        }
        setIsSearching(false);
    };

    const handleAssign = async (userId: string, userName: string) => {
        if (!confirm(`¿Asignar cupón a ${userName}?`)) return;

        setIsAssigning(true);
        const res = await assignCoupon(couponId, companyId, userId);
        setIsAssigning(false);

        if (res.success) {
            toast({
                title: 'Cupón asignado',
                description: `El cupón ha sido asignado correctamente a ${userName}.`,
            });
            onClose();
        } else {
            toast({
                title: 'Error',
                description: res.error || 'No se pudo asignar el cupón.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Asignar Cupón: {couponTitle}</DialogTitle>
                    <DialogDescription>
                        Busca un usuario privado para asignarle este cupón manualmente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Buscar por email o nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                        </Button>
                    </div>

                    <div className="border rounded-md min-h-[200px] max-h-[300px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 && !isSearching && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            Sin resultados. Busca un usuario.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {users.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>{u.firstName} {u.lastName}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAssign(u.id, u.firstName)}
                                                disabled={isAssigning}
                                            >
                                                {isAssigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
