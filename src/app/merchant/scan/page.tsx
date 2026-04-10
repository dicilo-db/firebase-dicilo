'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Search, Calculator, CheckCircle2, User } from 'lucide-react';
import { getWalletData, processQrPayment } from '@/app/actions/wallet';
import { useAuth } from '@/context/AuthContext';

export default function MerchantScanPage() {
    const { user } = useAuth(); // Merchant User
    const { toast } = useToast();

    const [step, setStep] = useState(1); // 1: Scan/Search, 2: Amount, 3: Success
    const [searchQuery, setSearchQuery] = useState(''); // UID or Code
    const [customerData, setCustomerData] = useState<any>(null);
    const [pointsToDeduct, setPointsToDeduct] = useState('');
    const [loading, setLoading] = useState(false);

    // Mock "Scan" - in reality this would be populate by a QR reader lib
    // For now we just type the UID
    const handleSearchUser = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            // We reuse getWalletData which takes a UID. 
            // In a real scenario we'd need to resolve UniqueCode -> UID first if they scan the code string.
            // For this demo, let's assume they enter the UID or we implement a lookup.
            // Since we don't have a public lookup action yet, let's assume input IS UID for MVP.

            const wallet = await getWalletData(searchQuery);
            if (wallet) {
                setCustomerData({ ...wallet, uid: searchQuery });
                setStep(2);
            } else {
                toast({ title: "User not found", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error fetching user", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayment = async () => {
        const amount = parseInt(pointsToDeduct);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Invalid Amount", variant: "destructive" });
            return;
        }
        if (amount > customerData.balance) {
            toast({ title: "Insufficient User Balance", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await processQrPayment(customerData.uid, user?.uid || 'MERCHANT_001', amount);
            if (res.success) {
                setCustomerData({ ...customerData, balance: res.newBalance });
                setStep(3);
                toast({ title: "Transaction Successful" });
            } else {
                toast({ title: "Transaction Failed", description: res.message, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep(1);
        setSearchQuery('');
        setPointsToDeduct('');
        setCustomerData(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
            <Card className="w-full max-w-sm shadow-xl">
                <CardHeader className="bg-primary text-primary-foreground rounded-t-xl pb-6">
                    <CardTitle className="flex items-center gap-2">
                        <ScanLine className="h-6 w-6" /> Dicilo Merchant
                    </CardTitle>
                    <CardDescription className="text-primary-foreground/80">Point of Sale Terminal</CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right">
                            <div className="flex justify-center py-6">
                                <div className="h-40 w-40 border-4 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                                    <ScanLine className="h-16 w-16 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Or enter User ID manually</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Scan or Type UID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="font-mono"
                                    />
                                    <Button onClick={handleSearchUser} disabled={loading}>
                                        <Search size={18} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && customerData && (
                        <div className="space-y-6 animate-in slide-in-from-right">
                            <div className="bg-secondary/10 p-4 rounded-lg flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">Customer Verified</p>
                                    <p className="text-sm text-muted-foreground">Balance: <span className="font-bold text-primary">{customerData.balance} DP</span></p>
                                    <p className="text-xs text-muted-foreground">≈ €{customerData.valueInEur.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Amount (Points)</Label>
                                <div className="relative">
                                    <Calculator className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        className="pl-9 text-lg font-bold"
                                        placeholder="0"
                                        value={pointsToDeduct}
                                        onChange={(e) => setPointsToDeduct(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-right text-muted-foreground">
                                    Value: €{((parseInt(pointsToDeduct) || 0) * customerData.pointValue).toFixed(2)}
                                </p>
                            </div>

                            <Button className="w-full text-lg h-12" onClick={handleProcessPayment} disabled={loading}>
                                {loading ? 'Processing...' : 'Charge Account'}
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={reset}>Cancel</Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-6 py-4 animate-in zoom-in duration-300">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-24 w-24 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Transaction Approved</h3>
                                <p className="text-muted-foreground">Successfully deducted {pointsToDeduct} DP</p>
                            </div>
                            <div className="rounded-lg bg-gray-100 p-4 text-left text-sm space-y-1">
                                <p className="flex justify-between"><span>New Balance:</span> <span className="font-bold">{customerData.balance} DP</span></p>
                                <p className="flex justify-between"><span>Transaction ID:</span> <span className="font-mono text-xs">#{Date.now().toString().slice(-6)}</span></p>
                            </div>
                            <Button className="w-full" onClick={reset}>New Transaction</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
