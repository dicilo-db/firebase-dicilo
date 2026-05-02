'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, RefreshCw, Save, Lock, Wallet, Search, UserPlus, Trash2, AlertTriangle, UserCog, UserCheck, Archive, Users } from 'lucide-react';
import { adminAdjustBalance, adminUpdatePointValue, isMasterPasswordSet, setMasterPassword, verifyMasterPassword, getManualPaymentHistory } from '@/app/actions/wallet';
import { auditRetroactivePoints, reassignProspect, getFreelancerReportData, generateReferralAuditReport } from '@/app/actions/dicipoints';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, CalendarIcon, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { adminProcessManualPayment } from '@/app/actions/wallet';
export default function DicipointsControlCenter() {
    const { toast } = useToast();
    const { t } = useTranslation('admin');

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [masterPassword, setMasterPasswordState] = useState('');
    const [inputPassword, setInputPassword] = useState('');
    const [loadingAuth, setLoadingAuth] = useState(false);

    useEffect(() => {
        checkSecurityStatus();
    }, []);

    const checkSecurityStatus = async () => {
        try {
            const isSet = await isMasterPasswordSet();
            setIsSetupMode(!isSet);
        } catch (e) {
            console.error(e);
            toast({ title: t('dicipoints.errorTitle'), description: "Security Check Failed", variant: "destructive" });
        }
    };

    // Config State
    const [pointValue, setPointValue] = useState(0.10);
    const [loadingConfig, setLoadingConfig] = useState(false);

    // Adjustment State
    // Cash Register State
    const [targetUid, setTargetUid] = useState('');
    const [targetEmail, setTargetEmail] = useState('');

    const [pointsAmount, setPointsAmount] = useState(0);
    const [pointsReason, setPointsReason] = useState('');

    const [cashAmount, setCashAmount] = useState(0);
    const [cashReason, setCashReason] = useState('');

    const [usdAmount, setUsdAmount] = useState(0);
    const [usdReason, setUsdReason] = useState('');

    const [referenceNote, setReferenceNote] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const [paymentResult, setPaymentResult] = useState<any>(null);
    const [loadingAdjustment, setLoadingAdjustment] = useState(false);

    // Audit State
    const [auditEmail, setAuditEmail] = useState('');
    const [auditCode, setAuditCode] = useState('');
    const [loadingAudit, setLoadingAudit] = useState(false);

    // Reassignment State
    const [reassignCud, setReassignCud] = useState('');
    const [reassignCode, setReassignCode] = useState('');
    const [reassignEmail, setReassignEmail] = useState('');
    const [reassignPoints, setReassignPoints] = useState(10);
    const [loadingReassign, setLoadingReassign] = useState(false);

    // Report State
    const [reportCode, setReportCode] = useState('');
    const [reportEmail, setReportEmail] = useState('');
    const [reportData, setReportData] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    // Referral Audit State
    const [referralStartDate, setReferralStartDate] = useState('2026-04-07');
    const [referralEndDate, setReferralEndDate] = useState('2026-05-01');
    const [referralAuditData, setReferralAuditData] = useState<any>(null);
    const [loadingReferralAudit, setLoadingReferralAudit] = useState(false);

    const handleGenerateReferralAudit = async () => {
        setLoadingReferralAudit(true);
        try {
            const result = await generateReferralAuditReport(referralStartDate, referralEndDate, masterPassword);
            if (result.success) {
                setReferralAuditData(result.data);
                toast({ title: 'Reporte generado', description: 'Auditoría de referidos completada con éxito.' });
            } else {
                toast({ title: 'Error', description: result.message, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setLoadingReferralAudit(false);
        }
    };

    const handleLogin = async () => {
        if (!inputPassword) return;
        setLoadingAuth(true);
        try {
            const isValid = await verifyMasterPassword(inputPassword);
            if (isValid) {
                setMasterPasswordState(inputPassword);
                setIsAuthenticated(true);
            } else {
                toast({ title: t('dicipoints.invalidPassword'), description: t('dicipoints.invalidPasswordDesc'), variant: "destructive" });
            }
        } catch (e) {
            toast({ title: t('dicipoints.errorTitle'), description: "Authentication error", variant: "destructive" });
        } finally {
            setLoadingAuth(false);
        }
    };

    const handleFirstTimeSetup = async () => {
        if (inputPassword.length < 6) {
            toast({ title: t('dicipoints.weakPassword'), description: t('dicipoints.weakPasswordDesc'), variant: "destructive" });
            return;
        }
        try {
            const res = await setMasterPassword(inputPassword);
            if (res.success) {
                toast({ title: t('dicipoints.setupComplete'), description: t('dicipoints.setupCompleteDesc') });
                setMasterPasswordState(inputPassword);
                setIsAuthenticated(true);
                setIsSetupMode(false);
            }
        } catch (e) {
            console.error(e);
            toast({ title: t('dicipoints.errorTitle'), description: t('dicipoints.setupFailed'), variant: "destructive" });
        }
    };

    const handleUpdateGlobalValue = async () => {
        setLoadingConfig(true);
        try {
            const res = await adminUpdatePointValue(Number(pointValue), masterPassword);
            if (res.success) {
                toast({ title: t('dicipoints.updated'), description: t('dicipoints.globalValueUpdated') });
            } else {
                toast({ title: t('dicipoints.errorTitle'), description: res.message, variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: t('dicipoints.errorTitle'), description: t('dicipoints.failedUpdate'), variant: "destructive" });
        } finally {
            setLoadingConfig(false);
        }
    };

    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [historyPage, setHistoryPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        // Initial fetch
        getManualPaymentHistory().then(res => {
            if (res.success) setPaymentHistory(res.data);
        });
    }, []);

    const handleProcessPayment = async () => {
        if (!targetUid || !targetEmail) {
            toast({ title: t('dicipoints.cashRegister.toast.missingDataTitle'), description: t('dicipoints.cashRegister.toast.missingDataDesc'), variant: "destructive" });
            return;
        }
        if (pointsAmount === 0 && cashAmount === 0 && usdAmount === 0) {
            toast({ title: t('dicipoints.cashRegister.toast.invalidAmountTitle'), description: t('dicipoints.cashRegister.toast.invalidAmountDesc'), variant: "destructive" });
            return;
        }

        setLoadingAdjustment(true);
        try {
            const res = await adminProcessManualPayment({
                targetUid,
                targetEmail,
                pointsAmount: Number(pointsAmount),
                pointsReason,
                cashAmount: Number(cashAmount),
                cashReason,
                usdAmount: Number(usdAmount),
                usdReason,
                referenceNote,
                customDate: selectedDate.toISOString(),
                masterKey: masterPassword
            });

            if (res.success) {
                toast({ title: t('dicipoints.cashRegister.toast.successTitle'), description: t('dicipoints.cashRegister.toast.successDesc') });
                setPaymentResult({
                    ...res.data,
                    pointsAmount,
                    pointsReason,
                    cashAmount,
                    cashReason,
                    usdAmount,
                    usdReason,
                    referenceNote
                });

                // Refresh History
                getManualPaymentHistory().then(res => {
                    if (res.success) setPaymentHistory(res.data);
                });

                // Reset Fields (optional, depending on UX preference, maybe keep for repeated entry?)
                // setPointsAmount(0);
                // setCashAmount(0);
                // setReferenceNote('');
            } else {
                toast({ title: t('dicipoints.cashRegister.toast.errorTransactionTitle'), description: res.message, variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: t('dicipoints.cashRegister.toast.errorGenericTitle'), description: t('dicipoints.cashRegister.toast.errorGenericDesc'), variant: "destructive" });
        } finally {
            setLoadingAdjustment(false);
        }
    };

    const handleGenerateReceipt = async () => {
        if (!paymentResult) return;

        try {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Recibo_Dicilo_${new Date().getTime()}</title>
                            <style>
                                body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 30px; }
                                .header { background-color: #22c55e; color: white; padding: 20px; font-size: 24px; font-weight: bold; margin-bottom: 30px; border-radius: 8px; }
                                .content { font-size: 14px; color: #333; line-height: 1.8; }
                                .box { background-color: #f3f4f6; padding: 15px; margin-top: 15px; border-radius: 6px; }
                                .footer { margin-top: 50px; font-size: 11px; color: #777; border-top: 1px solid #ddd; padding-top: 15px; }
                            </style>
                        </head>
                        <body>
                            <div class="header">Dicilo Network - Recibo de Pago</div>
                            <div class="content">
                                <h2>Detalles de la Transacción</h2>
                                <p><strong>Fecha de Emisión:</strong> ${new Date(paymentResult.timestamp).toLocaleString()}</p>
                                <p><strong>Nombre del Usuario:</strong> ${paymentResult.userName}</p>
                                <p><strong>Email del Usuario:</strong> ${paymentResult.userEmail} | <strong>UID:</strong> ${targetUid}</p>
                                
                                ${paymentResult.pointsAmount ? `<div class="box"><strong>Inyección de Puntos:</strong> +${paymentResult.pointsAmount} DP<br><strong>Motivo:</strong> ${paymentResult.pointsReason}</div>` : ''}
                                ${paymentResult.cashAmount ? `<div class="box"><strong>Pago Efectivo / Tarjeta (EUR):</strong> €${paymentResult.cashAmount}<br><strong>Motivo:</strong> ${paymentResult.cashReason}</div>` : ''}
                                ${paymentResult.usdAmount ? `<div class="box"><strong>Pago Efectivo / Tarjeta (USD):</strong> $${paymentResult.usdAmount}<br><strong>Motivo:</strong> ${paymentResult.usdReason}</div>` : ''}
                            </div>
                            <div class="footer">
                                Este documento sirve como comprobante de la transacción realizada en Dicilo Network.<br>
                                Emitido por: Admin / ${new Date().toISOString()}
                            </div>
                            <script>
                                window.onload = function() { 
                                    window.print(); 
                                };
                                window.onafterprint = function() {
                                    window.close();
                                };
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            } else {
                alert("Por favor habilita las ventanas emergentes (pop-ups) para imprimir el recibo.");
            }
        } catch (e: any) {
            console.error(e);
            toast({ title: "Error", description: "Fallo al abrir la ventana de impresión.", variant: "destructive" });
        }
    };

    const handleRetroactiveAudit = async () => {
        if (!auditEmail || !auditCode) {
            toast({ title: t('dicipoints.missingFields'), description: t('dicipoints.missingFieldsDesc'), variant: "destructive" });
            return;
        }
        setLoadingAudit(true);
        try {
            const res = await auditRetroactivePoints(auditEmail, auditCode, masterPassword);
            if (res.success) {
                toast({ title: t('dicipoints.auditComplete'), description: res.message, duration: 8000 });
                setAuditEmail('');
                setAuditCode('');
            } else {
                toast({ title: t('dicipoints.auditFailed'), description: res.message, variant: "destructive" });
            }
        } catch (e: any) {
            console.error(e);
            toast({ title: t('dicipoints.errorTitle'), description: e.message || t('dicipoints.auditFailedEx'), variant: "destructive" });
        } finally {
            setLoadingAudit(false);
        }
    };

    const handleReassign = async () => {
        if (!reassignCud || !reassignCode || !reassignEmail) {
            toast({ title: t('dicipoints.missingFields'), description: t('dicipoints.missingFieldsDesc'), variant: "destructive" });
            return;
        }
        setLoadingReassign(true);
        try {
            const res = await reassignProspect(reassignCud, reassignCode, reassignEmail, Number(reassignPoints), masterPassword);
            if (res.success) {
                toast({ title: t('dicipoints.reassignSuccess'), description: res.message });
                setReassignCud('');
                setReassignCode('');
                setReassignEmail('');
                setReassignPoints(10);
            } else {
                toast({ title: t('dicipoints.reassignError'), description: res.message, variant: "destructive" });
            }
        } catch (e: any) {
            console.error(e);
            toast({ title: t('dicipoints.errorTitle'), description: e.message, variant: "destructive" });
        } finally {
            setLoadingReassign(false);
        }
    };

    const handleSetKey = async (newKey: string) => {
        try {
            const res = await setMasterPassword(newKey);
            if (res.success) {
                toast({ title: t('dicipoints.success'), description: t('dicipoints.masterKeyUpdated') });
                setMasterPasswordState(newKey);
                setInputPassword(newKey);
            }
        } catch (e) {
            console.error(e);
            toast({ title: t('dicipoints.errorTitle'), description: t('dicipoints.failedSetKey'), variant: "destructive" });
        }
    };

    const handleSearchReport = async () => {
        if (!reportCode || !reportEmail) {
            toast({ title: t('dicipoints.missingFields'), description: t('dicipoints.missingFieldsDesc'), variant: "destructive" });
            return;
        }
        setLoadingReport(true);
        setReportData(null);
        try {
            const res = await getFreelancerReportData(reportCode, reportEmail, masterPassword);
            if (res.success) {
                setReportData(res.data);
                toast({ title: t('dicipoints.success'), description: "Report Data Loaded" });
            } else {
                toast({ title: t('dicipoints.report.error'), description: res.message, variant: "destructive" });
            }
        } catch (e: any) {
            console.error(e);
            toast({ title: t('dicipoints.errorTitle'), description: e.message, variant: "destructive" });
        } finally {
            setLoadingReport(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!reportData) return;

        try {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                const tableRowsHTML = reportData.transactions.map((trx: any) => `
                    <tr>
                        <td>${new Date(trx.timestamp).toLocaleDateString()}</td>
                        <td>${trx.type}</td>
                        <td>${trx.description}</td>
                        <td>${trx.amount > 0 ? '+' : ''}${trx.amount}</td>
                    </tr>
                `).join('');

                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Transaction_Report_${reportData.user.uniqueCode}</title>
                            <style>
                                body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 30px; color: #333; }
                                .header { background-color: #3b82f6; color: white; padding: 20px; font-size: 24px; font-weight: bold; border-radius: 8px; margin-bottom: 20px; }
                                .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; background-color: #f8fafc; padding: 20px; border-radius: 8px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                                th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
                                th { background-color: #f1f5f9; font-weight: bold; }
                                .footer { margin-top: 50px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                            </style>
                        </head>
                        <body>
                            <div class="header">Dicilo.net - Official Report</div>
                            <p><strong>Generated:</strong> ${new Date(reportData.generatedAt).toLocaleString()}</p>
                            
                            <div class="info-grid">
                                <div>
                                    <h3 style="margin-top: 0;">Freelancer Details:</h3>
                                    <p><strong>Name:</strong> ${reportData.user.name}</p>
                                    <p><strong>Code:</strong> ${reportData.user.uniqueCode}</p>
                                    <p><strong>Email:</strong> ${reportData.user.email}</p>
                                </div>
                                <div>
                                    <h3 style="margin-top: 0;">Wallet Summary:</h3>
                                    <p><strong>Current Balance:</strong> ${reportData.wallet.balance} DP</p>
                                    <p><strong>Lifetime Earned:</strong> ${reportData.wallet.totalEarned} DP</p>
                                </div>
                            </div>

                            <h3 style="margin-bottom: 10px;">Transaction History</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Amount (DP)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRowsHTML}
                                </tbody>
                            </table>
                            
                            <div class="footer">
                                This document is an official record from the Dicilo Dicipoints Central System.
                            </div>
                            <script>
                                window.onload = function() { 
                                    window.print(); 
                                };
                                window.onafterprint = function() {
                                    window.close();
                                };
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            } else {
                alert("Please enable pop-ups to print the report.");
            }
        } catch (e: any) {
            console.error(e);
            toast({ title: "Error generating PDF", variant: "destructive" });
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
                            <CardTitle className="text-2xl text-center">{t('dicipoints.firstTimeSetup.title')}</CardTitle>
                            <CardDescription className="text-center">{t('dicipoints.firstTimeSetup.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('dicipoints.firstTimeSetup.label')}</Label>
                                <Input
                                    type="password"
                                    value={inputPassword}
                                    onChange={(e) => setInputPassword(e.target.value)}
                                    placeholder={t('dicipoints.firstTimeSetup.placeholder')}
                                />
                                <p className="text-xs text-muted-foreground">{t('dicipoints.firstTimeSetup.hint')}</p>
                            </div>
                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleFirstTimeSetup}>
                                <Save className="mr-2 h-4 w-4" /> {t('dicipoints.firstTimeSetup.button')}
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
                        <CardTitle className="text-2xl text-center">{t('dicipoints.unlock.title')}</CardTitle>
                        <CardDescription className="text-center">{t('dicipoints.unlock.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('dicipoints.unlock.label')}</Label>
                            <Input
                                type="password"
                                value={inputPassword}
                                onChange={(e) => setInputPassword(e.target.value)}
                                placeholder={t('dicipoints.unlock.placeholder')}
                            />
                        </div>
                        <Button className="w-full" onClick={handleLogin} disabled={loadingAuth}>
                            <Lock className="mr-2 h-4 w-4" />
                            {loadingAuth ? t('dicipoints.reassign.buttonProcessing') : t('dicipoints.unlock.button')}
                        </Button>

                        <div className="flex justify-center pt-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="link" className="text-xs text-muted-foreground h-auto p-0">
                                        {t('dicipoints.unlock.resetLink')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t('dicipoints.unlock.resetDialogTitle')}</DialogTitle>
                                        <DialogDescription>
                                            {t('dicipoints.unlock.resetDialogDesc')}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>{t('dicipoints.unlock.newKeyLabel')}</Label>
                                            <Input
                                                type="password"
                                                placeholder={t('dicipoints.unlock.newKeyPlaceholder')}
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
                                                toast({ title: t('dicipoints.weakPassword'), description: t('dicipoints.weakPasswordDesc'), variant: "destructive" });
                                            }
                                        }}>
                                            {t('dicipoints.unlock.setUnlockButton')}
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

    // Main Dashboard Render
    return (
        <div className="container mx-auto py-10 space-y-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Wallet className="h-8 w-8 text-primary" /> {t('dicipoints.title')}
            </h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Global Economy Settings */}
                <Card className="border-red-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-gray-500" /> {t('dicipoints.economy.title')}
                        </CardTitle>
                        <CardDescription>{t('dicipoints.economy.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 mb-4">
                            <strong>{t('dicipoints.economy.warning')}</strong>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('dicipoints.economy.label')}</Label>
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
                                    {loadingConfig ? t('dicipoints.economy.buttonSaving') : t('dicipoints.economy.buttonUpdate')}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{t('dicipoints.economy.currentText')} {(100 * pointValue).toFixed(2)} €</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Retroactive Audit */}
                <Card className="border-indigo-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-indigo-500" /> {t('dicipoints.audit.title')}
                        </CardTitle>
                        <CardDescription>{t('dicipoints.audit.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('dicipoints.audit.emailLabel')}</Label>
                            <Input
                                placeholder={t('dicipoints.audit.emailPlaceholder')}
                                value={auditEmail}
                                onChange={(e) => setAuditEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('dicipoints.audit.codeLabel')}</Label>
                            <Input
                                placeholder={t('dicipoints.audit.codePlaceholder')}
                                value={auditCode}
                                onChange={(e) => setAuditCode(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            onClick={handleRetroactiveAudit}
                            disabled={loadingAudit || !auditEmail || !auditCode}
                        >
                            {loadingAudit ? t('dicipoints.audit.buttonScanning') : t('dicipoints.audit.buttonRun')}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            {t('dicipoints.audit.hint')}
                        </p>
                    </CardContent>
                </Card>

                {/* Referral Audit Report (New) */}
                <Card className="border-teal-200 shadow-sm md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-teal-600" /> Auditoría de Registros Mensuales / Comisiones
                        </CardTitle>
                        <CardDescription>Genera una lista de quiénes invitaron usuarios nuevos en un rango de fechas y calcula las comisiones (0.25€ Freelancers / 0.50€ Team Leaders).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fecha Inicio</Label>
                                <Input
                                    type="date"
                                    value={referralStartDate}
                                    onChange={(e) => setReferralStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha Fin</Label>
                                <Input
                                    type="date"
                                    value={referralEndDate}
                                    onChange={(e) => setReferralEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full bg-teal-600 hover:bg-teal-700"
                            onClick={handleGenerateReferralAudit}
                            disabled={loadingReferralAudit}
                        >
                            {loadingReferralAudit ? 'Generando Reporte...' : 'Generar Reporte de Referidos'}
                        </Button>

                        {referralAuditData && (
                            <div className="mt-6 space-y-4">
                                <div className="p-4 bg-teal-50 border border-teal-200 rounded-md">
                                    <h4 className="font-semibold text-teal-800 mb-2">Resumen del Reporte</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div><span className="text-muted-foreground">Nuevos Usuarios:</span> <span className="font-bold">{referralAuditData.summary.totalNewUsers}</span></div>
                                        <div><span className="text-muted-foreground">Referidores Activos:</span> <span className="font-bold">{referralAuditData.summary.totalReferrers}</span></div>
                                        <div><span className="text-muted-foreground">Total a Pagar (EUR):</span> <span className="font-bold text-green-700">€{referralAuditData.summary.totalEUR.toFixed(2)}</span></div>
                                        <div><span className="text-muted-foreground">Total Dicipoints:</span> <span className="font-bold text-blue-700">{referralAuditData.summary.totalDP} DP</span></div>
                                    </div>
                                    <div className="flex gap-4 mt-4">
                                        <Button size="sm" onClick={() => {
                                            // Simple CSV Export
                                            const headers = ['Referidor,Codigo,Rol,Tarifa EUR,Total Invitados,Ganancia EUR,Ganancia DP,Usuarios Invitados'];
                                            const rows = referralAuditData.details.map((d: any) => [
                                                `"${d.referrer.name}"`,
                                                d.referrer.code,
                                                d.referrer.role,
                                                d.payment.rateEUR,
                                                d.totalInvited,
                                                d.payment.earnedEUR,
                                                d.payment.earnedDP,
                                                `"${d.invitedUsers.map((u: any) => u.name).join(' | ')}"`
                                            ].join(','));
                                            const csvContent = [headers, ...rows].join('\n');
                                            const blob = new Blob([csvContent], { type: 'text/csv' });
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `referral_audit_${referralStartDate}_${referralEndDate}.csv`;
                                            a.click();
                                        }}>
                                            <Download className="mr-2 h-4 w-4" /> Exportar a CSV
                                        </Button>

                                        <Button size="sm" variant="outline" className="border-teal-600 text-teal-700 hover:bg-teal-50" onClick={() => {
                                            try {
                                                const printWindow = window.open('', '_blank');
                                                if (printWindow) {
                                                    const tableRowsHTML = referralAuditData.details.map((d: any) => `
                                                        <tr>
                                                            <td>${d.referrer.name}</td>
                                                            <td>${d.referrer.code}</td>
                                                            <td>${d.referrer.role.toUpperCase()}</td>
                                                            <td style="text-align: center;">${d.totalInvited}</td>
                                                            <td>€${d.payment.earnedEUR.toFixed(2)}</td>
                                                            <td>${d.payment.earnedDP} DP</td>
                                                        </tr>
                                                    `).join('');

                                                    printWindow.document.write(`
                                                        <html>
                                                            <head>
                                                                <title>Auditoria_Referidos_${referralStartDate}_${referralEndDate}</title>
                                                                <style>
                                                                    body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; }
                                                                    .header { background-color: #0f766e; color: white; padding: 15px; font-size: 20px; font-weight: bold; margin-bottom: 20px; border-radius: 5px; }
                                                                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                                                                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                                                    th { background-color: #f2f2f2; color: #333; }
                                                                    .summary { margin-bottom: 20px; line-height: 1.6; }
                                                                    .footer { margin-top: 30px; font-size: 10px; color: #666; }
                                                                </style>
                                                            </head>
                                                            <body>
                                                                <div class="header">Dicilo Network - Auditoría de Comisiones por Referidos</div>
                                                                <div class="summary">
                                                                    <p><strong>Periodo:</strong> ${referralStartDate} al ${referralEndDate}</p>
                                                                    <p><strong>Total Nuevos Usuarios:</strong> ${referralAuditData.summary.totalNewUsers}</p>
                                                                    <p><strong>Total a Pagar (EUR):</strong> €${referralAuditData.summary.totalEUR.toFixed(2)}</p>
                                                                    <p><strong>Total Dicipoints:</strong> ${referralAuditData.summary.totalDP} DP</p>
                                                                </div>
                                                                <table>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Referidor</th>
                                                                            <th>Código</th>
                                                                            <th>Rol</th>
                                                                            <th style="text-align: center;">Invitados</th>
                                                                            <th>Comisión EUR</th>
                                                                            <th>Comisión DP</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        ${tableRowsHTML}
                                                                    </tbody>
                                                                </table>
                                                                <div class="footer">Generado automáticamente el ${new Date().toLocaleString()}</div>
                                                                <script>
                                                                    window.onload = function() { 
                                                                        window.print(); 
                                                                    };
                                                                    window.onafterprint = function() {
                                                                        window.close();
                                                                    };
                                                                </script>
                                                            </body>
                                                        </html>
                                                    `);
                                                    printWindow.document.close();
                                                } else {
                                                    alert("Por favor habilita las ventanas emergentes (pop-ups) para imprimir la auditoría.");
                                                }
                                            } catch (e: any) {
                                                console.error(e);
                                                toast({ title: "Error PDF", description: e.message || "No se pudo generar el PDF", variant: "destructive" });
                                            }
                                        }}>
                                            <FileText className="mr-2 h-4 w-4" /> Exportar a PDF
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Referidor</TableHead>
                                                <TableHead>Rol</TableHead>
                                                <TableHead className="text-center">Invitados</TableHead>
                                                <TableHead className="text-right">Comisión Periodo</TableHead>
                                                <TableHead className="text-right">Balance Actual</TableHead>
                                                <TableHead>Detalle de Registros</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {referralAuditData.details.map((item: any, i: number) => (
                                                <TableRow key={i}>
                                                    <TableCell>
                                                        <div className="font-medium">{item.referrer.name}</div>
                                                        <div className="text-xs text-muted-foreground">{item.referrer.code}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={cn("px-2 py-0.5 rounded text-xs font-bold", 
                                                            item.referrer.role === 'team_leader' ? "bg-blue-100 text-blue-800" :
                                                            item.referrer.role === 'freelancer' ? "bg-purple-100 text-purple-800" :
                                                            "bg-gray-100 text-gray-800"
                                                        )}>
                                                            {item.referrer.role.toUpperCase()}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold">{item.totalInvited}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="text-green-700 font-bold">€{item.payment.earnedEUR.toFixed(2)}</div>
                                                        <div className="text-xs text-blue-600">{item.payment.earnedDP} DP</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="text-green-700 font-bold">€{(item.referrer.wallet?.eurBalance || 0).toFixed(2)}</div>
                                                        <div className="text-xs text-blue-600">{(item.referrer.wallet?.balance || 0)} DP</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-h-24 overflow-y-auto text-xs space-y-1">
                                                            {item.invitedUsers.map((u: any, idx: number) => (
                                                                <div key={idx} className="flex justify-between border-b pb-1 last:border-0">
                                                                    <span>{u.name}</span>
                                                                    <span className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {referralAuditData.details.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No hay registros con referentes en estas fechas.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Manual Prospect Reassignment (New) */}
                <Card className="border-purple-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-purple-600" /> {t('dicipoints.reassign.title')}
                        </CardTitle>
                        <CardDescription>{t('dicipoints.reassign.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('dicipoints.reassign.cudLabel')}</Label>
                            <Input
                                placeholder={t('dicipoints.reassign.cudPlaceholder')}
                                value={reassignCud}
                                onChange={(e) => setReassignCud(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">{t('dicipoints.reassign.cudHint')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('dicipoints.reassign.newCodeLabel')}</Label>
                                <Input
                                    placeholder={t('dicipoints.reassign.newCodePlaceholder')}
                                    value={reassignCode}
                                    onChange={(e) => setReassignCode(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('dicipoints.reassign.newEmailLabel')}</Label>
                                <Input
                                    placeholder={t('dicipoints.reassign.newEmailPlaceholder')}
                                    value={reassignEmail}
                                    onChange={(e) => setReassignEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-purple-700 font-semibold">{t('dicipoints.reassign.pointsLabel')}</Label>
                            <Input
                                type="number"
                                value={reassignPoints}
                                onChange={(e) => setReassignPoints(Number(e.target.value))}
                                className="border-purple-200 bg-purple-50"
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('dicipoints.reassign.pointsHint')}
                            </p>
                        </div>

                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
                            onClick={handleReassign}
                            disabled={loadingReassign || !reassignCud || !reassignCode || !reassignEmail}
                        >
                            {loadingReassign ? t('dicipoints.reassign.buttonProcessing') : t('dicipoints.reassign.buttonExecute')}
                        </Button>
                    </CardContent>
                </Card>

                {/* Cash Register / Manual Injection */}
                <Card className="border-blue-200 shadow-sm overflow-visible">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex flex-col space-y-1.5">
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-gray-500" /> {t('dicipoints.cashRegister.title')}
                            </CardTitle>
                            <CardDescription>{t('dicipoints.cashRegister.description')}</CardDescription>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>{t('dicipoints.cashRegister.datePicker')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </CardHeader>
                    <CardContent className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('dicipoints.cashRegister.uidLabel')}</Label>
                                <Input placeholder={t('dicipoints.cashRegister.uidPlaceholder')} value={targetUid} onChange={(e) => setTargetUid(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('dicipoints.cashRegister.emailLabel')}</Label>
                                <Input placeholder={t('dicipoints.cashRegister.emailPlaceholder')} value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>{t('dicipoints.cashRegister.pointsAmountLabel')}</Label>
                                <Input type="number" value={pointsAmount} onChange={(e) => setPointsAmount(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('dicipoints.cashRegister.pointsReasonLabel')}</Label>
                                <Select value={pointsReason} onValueChange={setPointsReason}>
                                    <SelectTrigger><SelectValue placeholder={t('dicipoints.cashRegister.pointsReasonPlaceholder')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Recomendación empresa">Recomendación empresa</SelectItem>
                                        <SelectItem value="Recomendación Amigo">Recomendación Amigo</SelectItem>
                                        <SelectItem value="Ajuste Manual">Ajuste Manual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>{t('dicipoints.cashRegister.cashAmountLabel')}</Label>
                                <Input type="number" value={cashAmount} onChange={(e) => setCashAmount(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('dicipoints.cashRegister.cashReasonLabel')}</Label>
                                <Select value={cashReason} onValueChange={setCashReason}>
                                    <SelectTrigger><SelectValue placeholder={t('dicipoints.cashRegister.cashReasonPlaceholder')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Venta: Banner">Venta: Banner</SelectItem>
                                        <SelectItem value="Venta: Campaña">Venta: Campaña</SelectItem>
                                        <SelectItem value="Venta: Starter">Venta: Starter</SelectItem>
                                        <SelectItem value="Venta: Reteil">Venta: Reteil</SelectItem>
                                        <SelectItem value="Venta: Premium">Venta: Premium</SelectItem>
                                        <SelectItem value="Deposito Efectivo">Deposito Efectivo</SelectItem>
                                        <SelectItem value="Pago de Bonos por usuario">Pago de Bonos por usuario</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Cantidad ($)</Label>
                                <Input type="number" value={usdAmount} onChange={(e) => setUsdAmount(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Razón (USD)</Label>
                                <Select value={usdReason} onValueChange={setUsdReason}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Venta: Banner">Venta: Banner</SelectItem>
                                        <SelectItem value="Venta: Campaña">Venta: Campaña</SelectItem>
                                        <SelectItem value="Venta: Starter">Venta: Starter</SelectItem>
                                        <SelectItem value="Venta: Reteil">Venta: Reteil</SelectItem>
                                        <SelectItem value="Venta: Premium">Venta: Premium</SelectItem>
                                        <SelectItem value="Deposito Efectivo">Deposito Efectivo</SelectItem>
                                        <SelectItem value="Pago de Bonos por usuario">Pago de Bonos por usuario</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('dicipoints.cashRegister.noteLabel')}</Label>
                            <Input placeholder={t('dicipoints.cashRegister.notePlaceholder')} value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} />
                        </div>

                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleProcessPayment} disabled={loadingAdjustment}>
                            {loadingAdjustment ? t('dicipoints.cashRegister.buttonProcessing') : t('dicipoints.cashRegister.buttonProcess')}
                        </Button>

                        {paymentResult && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-green-800">{t('dicipoints.cashRegister.successTitle')}</h4>
                                    <p className="text-xs text-green-600">{t('dicipoints.cashRegister.successDate')} {new Date(paymentResult.timestamp).toLocaleDateString()}</p>
                                </div>
                                <Button variant="outline" onClick={handleGenerateReceipt} className="border-green-600 text-green-700 hover:bg-green-100">
                                    <Printer className="mr-2 h-4 w-4" /> {t('dicipoints.cashRegister.buttonReceipt')}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* System Maintenance (Migration) */}
                <Card className="border-orange-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-orange-600" /> {t('dicipoints.maintenance.title')}
                        </CardTitle>
                        <CardDescription>{t('dicipoints.maintenance.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-orange-50 border border-orange-100 rounded text-xs text-orange-800">
                            <strong>{t('dicipoints.maintenance.warningTitle')}</strong> {t('dicipoints.maintenance.warningDesc')}
                        </div>
                        <div className="space-y-2">
                            <Label>{t('dicipoints.maintenance.legacyPatchTitle')}</Label>
                            <p className="text-xs text-muted-foreground">
                                {t('dicipoints.maintenance.legacyPatchDesc')}
                            </p>
                            <Button
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                onClick={async () => {
                                    const confirm = window.confirm("Are you sure you want to run the Legacy Migration? This will update ALL users without codes.");
                                    if (!confirm) return;

                                    try {
                                        toast({ title: t('dicipoints.maintenance.toastStartedTitle'), description: t('dicipoints.maintenance.toastStartedDesc') });
                                        const res = await fetch('/api/admin/migration/legacy-users', { method: 'POST' });
                                        const data = await res.json();

                                        if (data.success) {
                                            toast({ title: t('dicipoints.maintenance.toastCompleteTitle'), description: `Processed: ${data.processed}, Updated: ${data.updated}, Errors: ${data.errors}` });
                                        } else {
                                            toast({ title: t('dicipoints.maintenance.toastFailedTitle'), description: data.error, variant: "destructive" });
                                        }
                                    } catch (e: any) {
                                        toast({ title: t('dicipoints.maintenance.toastFailedTitle'), description: "Network error", variant: "destructive" });
                                    }
                                }}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                {t('dicipoints.maintenance.buttonRun')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment History (Global Log) */}
                <Card className="border-cyan-200 shadow-sm mt-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-cyan-600" /> {t('dicipoints.history.title')}
                            </CardTitle>
                            <CardDescription>{t('dicipoints.history.subtitle')}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-cyan-600 text-cyan-700 hover:bg-cyan-50" onClick={() => {
                                const headers = ["Fecha", "UID", "Tipo", "Monto", "Descripcion"];
                                const rows = paymentHistory.map(trx => [
                                    new Date(trx.timestamp).toLocaleString(),
                                    trx.userCode || trx.userId,
                                    trx.type === 'MANUAL_CASH' ? 'CASH' : 'POINTS',
                                    `${trx.amount > 0 ? '+' : ''}${trx.amount} ${trx.currency}`,
                                    trx.description
                                ]);
                                const csvContent = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.setAttribute("href", url);
                                link.setAttribute("download", `historial_caja_${new Date().getTime()}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}>
                                <Download className="mr-2 h-4 w-4" /> Exportar a CSV
                            </Button>
                                <Button size="sm" variant="outline" className="border-cyan-600 text-cyan-700 hover:bg-cyan-50" onClick={() => {
                                try {
                                    const printWindow = window.open('', '_blank');
                                    if (printWindow) {
                                        const tableRowsHTML = paymentHistory.map(trx => `
                                            <tr>
                                                <td>${new Date(trx.timestamp).toLocaleString()}</td>
                                                <td>${trx.userCode || trx.userId}</td>
                                                <td>${trx.type === 'MANUAL_CASH' ? 'CASH' : 'POINTS'}</td>
                                                <td>${trx.amount > 0 ? '+' : ''}${trx.amount} ${trx.currency}</td>
                                                <td>${trx.description}</td>
                                            </tr>
                                        `).join('');

                                        printWindow.document.write(`
                                            <html>
                                                <head>
                                                    <title>Historial_Caja_${new Date().getTime()}</title>
                                                    <style>
                                                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; }
                                                        .header { background-color: #0891b2; color: white; padding: 15px; font-size: 20px; font-weight: bold; margin-bottom: 20px; border-radius: 5px; }
                                                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                                                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                                        th { background-color: #f2f2f2; color: #333; }
                                                        .footer { margin-top: 30px; font-size: 10px; color: #666; }
                                                    </style>
                                                </head>
                                                <body>
                                                    <div class="header">Dicilo Network - Historial de Caja Registradora</div>
                                                    <p><strong>Generado el:</strong> ${new Date().toLocaleString()}</p>
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>Fecha</th>
                                                                <th>UID</th>
                                                                <th>Tipo</th>
                                                                <th>Monto</th>
                                                                <th>Descripción</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${tableRowsHTML}
                                                        </tbody>
                                                    </table>
                                                    <div class="footer">Este documento sirve como comprobante de transacciones manuales.</div>
                                                    <script>
                                                        window.onload = function() { 
                                                            window.print(); 
                                                        };
                                                        window.onafterprint = function() {
                                                            window.close();
                                                        };
                                                    </script>
                                                </body>
                                            </html>
                                        `);
                                        printWindow.document.close();
                                    } else {
                                        alert("Por favor habilita las ventanas emergentes (pop-ups) para imprimir el reporte.");
                                    }
                                } catch (e: any) {
                                    console.error(e);
                                    toast({ title: "Error PDF", description: e.message || "No se pudo generar el PDF", variant: "destructive" });
                                }
                            }}>
                                <FileText className="mr-2 h-4 w-4" /> Exportar a PDF
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const totalPages = Math.ceil(paymentHistory.length / itemsPerPage);
                            const currentHistory = paymentHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);
                            
                            return (
                                <div className="space-y-4">
                                    <div className="max-h-[500px] overflow-y-auto border rounded-md">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                                <TableRow>
                                                    <TableHead>#</TableHead>
                                                    <TableHead>{t('dicipoints.history.colDate')}</TableHead>
                                                    <TableHead>{t('dicipoints.history.colUser')}</TableHead>
                                                    <TableHead>{t('dicipoints.history.colType')}</TableHead>
                                                    <TableHead>{t('dicipoints.history.colAmount')}</TableHead>
                                                    <TableHead>{t('dicipoints.history.colDesc')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {currentHistory.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                                            {t('dicipoints.history.empty')}
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    currentHistory.map((trx, idx) => (
                                                        <TableRow key={trx.id}>
                                                            <TableCell className="text-muted-foreground text-xs">{(historyPage - 1) * itemsPerPage + idx + 1}</TableCell>
                                                            <TableCell className="font-mono text-xs text-nowrap">{new Date(trx.timestamp).toLocaleDateString()} {new Date(trx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                                            <TableCell className="font-mono text-xs max-w-[100px] truncate" title={trx.userCode || trx.userId}>{trx.userCode || trx.userId}</TableCell>
                                                            <TableCell>
                                                                <span className={cn("px-2 py-1 rounded text-xs font-medium",
                                                                    trx.type === 'MANUAL_CASH' ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"
                                                                )}>
                                                                    {trx.type === 'MANUAL_CASH' ? 'CASH' : 'POINTS'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className={cn("font-bold text-nowrap", trx.amount > 0 ? "text-green-600" : "text-red-600")}>
                                                                {trx.amount > 0 ? '+' : ''}{trx.amount} {trx.currency}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-gray-600 max-w-[200px] truncate" title={trx.description}>{trx.description}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    
                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between border-t pt-4">
                                            <div className="text-sm text-muted-foreground">
                                                Mostrando {(historyPage - 1) * itemsPerPage + 1} a {Math.min(historyPage * itemsPerPage, paymentHistory.length)} de {paymentHistory.length}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                                    disabled={historyPage === 1}
                                                >
                                                    Anterior
                                                </Button>
                                                <div className="flex items-center justify-center text-sm font-medium px-2">
                                                    Página {historyPage} de {totalPages}
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={historyPage === totalPages}
                                                >
                                                    Siguiente
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

                {/* History & Report (New) */}
                <Card className="border-cyan-200 shadow-sm col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-cyan-600" /> {t('dicipoints.report.title')}
                        </CardTitle>
                        <CardDescription>{t('dicipoints.report.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="grid gap-2 flex-grow">
                                <Label>{t('dicipoints.report.codeLabel')}</Label>
                                <Input
                                    placeholder="DHH25..."
                                    value={reportCode}
                                    onChange={(e) => setReportCode(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2 flex-grow">
                                <Label>{t('dicipoints.report.emailLabel')}</Label>
                                <Input
                                    placeholder="email@dicilo.net"
                                    value={reportEmail}
                                    onChange={(e) => setReportEmail(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleSearchReport}
                                disabled={loadingReport || !reportCode || !reportEmail}
                                className="bg-cyan-600 hover:bg-cyan-700"
                            >
                                {loadingReport ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                                {t('dicipoints.report.buttonSearch')}
                            </Button>
                        </div>

                        {reportData && (
                            <div className="space-y-4 border rounded-md p-4 bg-gray-50/50">
                                <div className="flex justify-between items-center border-b pb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">{reportData.user.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {t('dicipoints.report.balance')}: <span className="text-green-600 font-bold">{reportData.wallet.balance} DP</span>
                                        </p>
                                    </div>
                                    <Button variant="outline" onClick={handleDownloadPDF}>
                                        <Download className="h-4 w-4 mr-2" />
                                        {t('dicipoints.report.buttonPDF')}
                                    </Button>
                                </div>

                                <div className="max-h-[300px] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('dicipoints.report.table.date')}</TableHead>
                                                <TableHead>{t('dicipoints.report.table.type')}</TableHead>
                                                <TableHead>{t('dicipoints.report.table.desc')}</TableHead>
                                                <TableHead className="text-right">{t('dicipoints.report.table.amount')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.transactions.map((trx: any) => (
                                                <TableRow key={trx.id}>
                                                    <TableCell className="text-xs">{new Date(trx.timestamp).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-xs font-medium">{trx.type}</TableCell>
                                                    <TableCell className="text-xs max-w-[200px] truncate" title={trx.description}>{trx.description}</TableCell>
                                                    <TableCell className={`text-right font-bold ${trx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {trx.amount > 0 ? '+' : ''}{trx.amount}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {reportData.transactions.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                        {t('dicipoints.report.noTransactions')}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Security Management */}
            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-gray-500" /> {t('dicipoints.security.title')}
                    </CardTitle>
                    <CardDescription>{t('dicipoints.security.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                {t('dicipoints.security.buttonChange')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('dicipoints.security.dialogTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('dicipoints.security.dialogDesc')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>{t('dicipoints.security.newKeyLabel')}</Label>
                                    <Input
                                        type="password"
                                        placeholder={t('dicipoints.security.newKeyPlaceholder')}
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
                                        toast({ title: t('dicipoints.weakPassword'), description: t('dicipoints.weakPasswordDesc'), variant: "destructive" });
                                    }
                                }}>
                                    {t('dicipoints.security.buttonSet')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    );
}
