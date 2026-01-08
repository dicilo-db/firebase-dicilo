'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, KeyRound } from 'lucide-react';
import { checkMasterKeyStatus, setMasterKey, verifyMasterKey } from '@/app/actions/admin-security';
import { useToast } from '@/hooks/use-toast';

interface MasterKeyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function MasterKeyDialog({ isOpen, onClose, onSuccess }: MasterKeyDialogProps) {
    const { toast } = useToast();
    const [status, setStatus] = useState<'LOADING' | 'CREATE' | 'ENTER'>('LOADING');
    const [keyInput, setKeyInput] = useState('');
    const [confirmInput, setConfirmInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check key status on open
    useEffect(() => {
        if (isOpen) {
            checkStatus();
        } else {
            // Reset state on close
            setKeyInput('');
            setConfirmInput('');
            setStatus('LOADING');
        }
    }, [isOpen]);

    const checkStatus = async () => {
        setStatus('LOADING');
        const res = await checkMasterKeyStatus();
        if (res.exists) {
            setStatus('ENTER');
        } else {
            setStatus('CREATE');
        }
    };

    const handleCreate = async () => {
        if (keyInput !== confirmInput) {
            toast({ title: 'Error', description: 'Keys do not match.', variant: 'destructive' });
            return;
        }
        if (keyInput.length < 4) {
            toast({ title: 'Error', description: 'Key must be at least 4 characters.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        const res = await setMasterKey(keyInput);
        setIsSubmitting(false);

        if (res.success) {
            toast({ title: 'Master Key Set', description: 'Master key created successfully.' });
            onSuccess(); // Automatically proceed
        } else {
            toast({ title: 'Error', description: res.error || 'Failed to set key.', variant: 'destructive' });
        }
    };

    const handleVerify = async () => {
        setIsSubmitting(true);
        const res = await verifyMasterKey(keyInput);
        setIsSubmitting(false);

        if (res.valid) {
            toast({ title: 'Access Granted', description: 'Master key verified.' });
            onSuccess();
        } else {
            toast({ title: 'Access Denied', description: 'Invalid Master Key.' });
        }
    };

    // Handle Enter key
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (status === 'CREATE') {
                handleCreate();
            } else {
                handleVerify();
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {status === 'CREATE' ? <KeyRound className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        {status === 'LOADING' ? 'Checking Security...' :
                            status === 'CREATE' ? 'Create Master Key' : 'Security Check'}
                    </DialogTitle>
                    <DialogDescription>
                        {status === 'LOADING' && 'Please wait...'}
                        {status === 'CREATE' && 'To access this sensitive module, you must verify your identity. Since this is the first time, please define a Master Key.'}
                        {status === 'ENTER' && 'This module is protected. Please enter the Master Key to proceed.'}
                    </DialogDescription>
                </DialogHeader>

                {status === 'LOADING' ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="masterKey">Master Key</Label>
                            <Input
                                id="masterKey"
                                type="password"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                onKeyDown={onKeyDown}
                                autoFocus
                            />
                        </div>

                        {status === 'CREATE' && (
                            <div className="grid gap-2">
                                <Label htmlFor="confirmKey">Confirm Master Key</Label>
                                <Input
                                    id="confirmKey"
                                    type="password"
                                    value={confirmInput}
                                    onChange={(e) => setConfirmInput(e.target.value)}
                                    onKeyDown={onKeyDown}
                                />
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    {status !== 'LOADING' && (
                        <Button onClick={status === 'CREATE' ? handleCreate : handleVerify} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {status === 'CREATE' ? 'Create & Access' : 'Unlock'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
