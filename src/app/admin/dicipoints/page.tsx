'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, RefreshCw, Save, Lock, Wallet } from 'lucide-react';
import { adminAdjustBalance, adminUpdatePointValue, getWalletData, setMasterPassword, isMasterPasswordSet } from '@/app/actions/wallet';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

// Placeholder for getting all users - we might need a search or list. 
// For now, simple user ID input or upgrade to use a combobox later.
// We can re-use the user list logic from private-users but that's heavy. 
// Let's implement a simple "Enter User ID / Unique Code" or just "Target User ID" for now to start.

export default function DicipointsControlCenter() {
    const { toast } = useToast();
    const { t } = useTranslation('common');

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [masterPassword, setMasterPasswordState] = useState('');
    const [inputPassword, setInputPassword] = useState('');

    useEffect(() => {
        checkSecurityStatus();
    }, []);

    const checkSecurityStatus = async () => {
        try {
            const isSet = await isMasterPasswordSet();
            setIsSetupMode(!isSet);
        } catch (e) {
            console.error(e);
        }
    };

    // Config State
    const [pointValue, setPointValue] = useState(0.10);
    const [loadingConfig, setLoadingConfig] = useState(false);

    // Adjustment State
    const [targetUid, setTargetUid] = useState('');
    const [amount, setAmount] = useState(0);
    const [reason, setReason] = useState('Manual Adjustment');
    const [loadingAdjustment, setLoadingAdjustment] = useState(false);

    // Verify Master Password locally (or via server action response)
    // Actually best practice is to require it on every sensitive action, but we can have a "session" here.
    // For this implementation, we will pass the password with every request to the server actions.
    // The initial login just unlocks the UI.

    const handleLogin = () => {
        // Simple client-side check for UI unlock, actual security is on server actions
        // In a real app we might verify against an API first to get a token, but here we pass the pwd.
        if (inputPassword.length > 5) {
            setMasterPasswordState(inputPassword);
            setIsAuthenticated(true);
            toast({ title: "Access Granted", description: "Session valid for this view." });
        } else {
            toast({ title: "Invalid Password", variant: "destructive" });
        }
    };

    const handleFirstTimeSetup = async () => {
        if (inputPassword.length < 6) {
            toast({ title: "Weak Password", description: "Minimum 6 chars.", variant: "destructive" });
            return;
        }
        try {
            const res = await setMasterPassword(inputPassword);
            if (res.success) {
                toast({ title: "Setup Complete", description: "Master Key secured." });
                setMasterPasswordState(inputPassword);
                setIsAuthenticated(true);
                setIsSetupMode(false);
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Setup failed.", variant: "destructive" });
        }
    };

    const handleUpdateGlobalValue = async () => {
        setLoadingConfig(true);
        try {
            const res = await adminUpdatePointValue(Number(pointValue), masterPassword);
            if (res.success) {
                toast({ title: "Updated", description: "Global point value updated." });
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleAdjustBalance = async () => {
        if (!targetUid || amount === 0) return;
        setLoadingAdjustment(true);
        try {
            const res = await adminAdjustBalance(targetUid, Number(amount), reason, masterPassword);
            if (res.success) {
                toast({ title: "Success", description: "Balance adjusted successfully." });
                setAmount(0);
                setTargetUid('');
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Transaction failed.", variant: "destructive" });
        } finally {
            setLoadingAdjustment(false);
        }
    };

    const handleSetKey = async (newKey: string) => {
        try {
            const res = await setMasterPassword(newKey);
            if (res.success) {
                toast({ title: "Success", description: "Master Key updated successfully." });
                setMasterPasswordState(newKey);
                setInputPassword(newKey);
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to set master key.", variant: "destructive" });
        }
    };


    if (!isAuthenticated) {
        if (isSetupMode) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-gray-100">
                    <Card className="w-full max-w-md border-green-200 shadow-xl">
                        <CardHeader className="space-y-1">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-full bg-green-100">
                                    <ShieldAlert className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl text-center">First Time Security Setup</CardTitle>
                            <CardDescription className="text-center">Create a Master Key to secure the DiciPoints Economy.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Define Master Key</Label>
                                <Input
                                    type="password"
                                    value={inputPassword}
                                    onChange={(e) => setInputPassword(e.target.value)}
                                    placeholder="Create strong password..."
                                />
                                <p className="text-xs text-muted-foreground">You will need this key for every manual adjustment.</p>
                            </div>
                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleFirstTimeSetup}>
                                <Save className="mr-2 h-4 w-4" /> Secure & Initialize
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-full bg-red-100">
                                <ShieldAlert className="h-8 w-8 text-red-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-center">Dicipoints Control Center</CardTitle>
                        <CardDescription className="text-center">Restricted Access. Superadmin Only.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Master Password</Label>
                            <Input
                                type="password"
                                value={inputPassword}
                                onChange={(e) => setInputPassword(e.target.value)}
                                placeholder="Enter Master Key"
                            />
                        </div>
                        <Button className="w-full" onClick={handleLogin}>
                            <Lock className="mr-2 h-4 w-4" /> Unlock
                        </Button>

                        <div className="flex justify-center pt-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="link" className="text-xs text-muted-foreground h-auto p-0">
                                        First time setup or forgot key? Reset here.
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Setup / Reset Master Key</DialogTitle>
                                        <DialogDescription>
                                            As a Superadmin, you can set or override the Master Security Key here.
                                            <strong> This will invalidate the old key immediately.</strong>
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>New Master Key</Label>
                                            <Input
                                                type="password"
                                                placeholder="Enter new key..."
                                                id="reset-key-input"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={() => {
                                            const input = document.getElementById('reset-key-input') as HTMLInputElement;
                                            if (input && input.value.length > 5) {
                                                handleSetKey(input.value);
                                            } else {
                                                toast({ title: "Weak Password", description: "Minimum 6 chars.", variant: "destructive" });
                                            }
                                        }}>
                                            Set & Unlock
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Wallet className="h-8 w-8 text-primary" /> Dicipoints Central
            </h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Global Economy Settings */}
                <Card className="border-red-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-gray-500" /> Economy Engine
                        </CardTitle>
                        <CardDescription>Manage global point values. Affects ALL users immediately.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 mb-4">
                            <strong>Warning:</strong> Changing the Point Value changes the displayed EUR equivalent for all users instantly.
                        </div>
                        <div className="space-y-2">
                            <Label>Value per 1 Dicipoint (€)</Label>
                            <div className="flex gap-4">
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={pointValue}
                                    onChange={(e) => setPointValue(Number(e.target.value))}
                                />
                                <Button
                                    onClick={handleUpdateGlobalValue}
                                    disabled={loadingConfig}
                                    className="w-40"
                                >
                                    {loadingConfig ? "Saving..." : "Update Rate"}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Current: 100 DP = {(100 * pointValue).toFixed(2)} €</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Manual Injection */}
                <Card className="border-blue-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-gray-500" /> Manual Injection
                        </CardTitle>
                        <CardDescription>Load or deduct points for a specific user.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Target User UID</Label>
                            <Input
                                placeholder="User UID"
                                value={targetUid}
                                onChange={(e) => setTargetUid(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount (DP)</Label>
                                <Input
                                    type="number"
                                    placeholder="50"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Use negative for deduction.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason / Ref</Label>
                                <Input
                                    placeholder="e.g. Christmas Gift"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="w-full mt-4" disabled={loadingAdjustment || !targetUid}>
                                    Process Transaction
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirm Transaction</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to {amount > 0 ? 'send' : 'deduct'} <strong>{Math.abs(amount)} DP</strong> to user <code>{targetUid}</code>?
                                        <br /><br />
                                        Value: approx. €{(Math.abs(amount) * pointValue).toFixed(2)}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button onClick={handleAdjustBalance} disabled={loadingAdjustment}>
                                        {loadingAdjustment ? "Processing..." : "Confirm & Execute"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>

            {/* Security Management */}
            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-gray-500" /> Security Management
                    </CardTitle>
                    <CardDescription>Update your Master Access Key.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                Change Master Key
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Change Master Key</DialogTitle>
                                <DialogDescription>
                                    Set a new Master Key. You will need this key to authorize all sensitive transactions.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>New Master Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="Enter new key..."
                                        id="new-key-input"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => {
                                    const input = document.getElementById('new-key-input') as HTMLInputElement;
                                    if (input && input.value.length > 5) {
                                        handleSetKey(input.value);
                                    } else {
                                        toast({ title: "Weak Password", description: "Minimum 6 chars.", variant: "destructive" });
                                    }
                                }}>
                                    Set New Key
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    );
}
