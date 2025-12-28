'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, RefreshCw, Save, Lock, Wallet, Search, UserPlus } from 'lucide-react';
import { adminAdjustBalance, adminUpdatePointValue, isMasterPasswordSet, setMasterPassword, verifyMasterPassword } from '@/app/actions/wallet';
import { auditRetroactivePoints, reassignProspect, getFreelancerReportData } from '@/app/actions/dicipoints';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const [targetUid, setTargetUid] = useState('');
    const [amount, setAmount] = useState(0);
    const [reason, setReason] = useState(t('dicipoints.injection.reasonPlaceholder'));
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

    const handleAdjustBalance = async () => {
        if (!targetUid || amount === 0) return;
        setLoadingAdjustment(true);
        try {
            const res = await adminAdjustBalance(targetUid, Number(amount), reason, masterPassword);
            if (res.success) {
                toast({ title: t('dicipoints.success'), description: t('dicipoints.balanceAdjusted') });
                setAmount(0);
                setTargetUid('');
            } else {
                toast({ title: t('dicipoints.errorTitle'), description: res.message, variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: t('dicipoints.errorTitle'), description: t('dicipoints.transactionFailed'), variant: "destructive" });
        } finally {
            setLoadingAdjustment(false);
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
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.setTextColor(40, 40, 40);
            doc.text("Dicilo.net - Official Report", 14, 22);

            doc.setFontSize(10);
            doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, 14, 30);

            // Freelancer Info
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Freelancer Details:", 14, 45);
            doc.setFont("helvetica", "normal");
            doc.text(`Name: ${reportData.user.name}`, 14, 52);
            doc.text(`Code: ${reportData.user.uniqueCode}`, 14, 59);
            doc.text(`Email: ${reportData.user.email}`, 14, 66);

            // Wallet Summary
            doc.setFont("helvetica", "bold");
            doc.text("Wallet Summary:", 120, 45);
            doc.setFont("helvetica", "normal");
            doc.text(`Current Balance: ${reportData.wallet.balance} DP`, 120, 52);
            doc.text(`Lifetime Earned: ${reportData.wallet.totalEarned} DP`, 120, 59);

            // Table
            const tableColumn = ["Date", "Type", "Description", "Amount (DP)"];
            const tableRows = reportData.transactions.map((trx: any) => [
                new Date(trx.timestamp).toLocaleDateString(),
                trx.type,
                trx.description,
                trx.amount > 0 ? `+${trx.amount}` : `${trx.amount}`
            ]);

            // @ts-ignore
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 75,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 66, 66] }
            });

            // Footer
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text("This document is an official record from the Dicilo Dicipoints Central System.", 14, finalY);

            doc.save(`Transaction_Report_${reportData.user.uniqueCode}.pdf`);

        } catch (e) {
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

                {/* Manual Injection */}
                <Card className="border-blue-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-gray-500" /> {t('dicipoints.injection.title')}
                        </CardTitle>
                        <CardDescription>{t('dicipoints.injection.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('dicipoints.injection.uidLabel')}</Label>
                            <Input
                                placeholder={t('dicipoints.injection.uidPlaceholder')}
                                value={targetUid}
                                onChange={(e) => setTargetUid(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('dicipoints.injection.amountLabel')}</Label>
                                <Input
                                    type="number"
                                    placeholder={t('dicipoints.injection.amountPlaceholder')}
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">{t('dicipoints.injection.amountHint')}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('dicipoints.injection.reasonLabel')}</Label>
                                <Input
                                    placeholder={t('dicipoints.injection.reasonPlaceholder')}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="w-full mt-4" disabled={loadingAdjustment || !targetUid}>
                                    {t('dicipoints.injection.buttonProcess')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{t('dicipoints.injection.dialogTitle')}</DialogTitle>
                                    <DialogDescription>
                                        {t('dicipoints.injection.dialogDescPart1')} {amount > 0 ? t('dicipoints.injection.dialogDescSend') : t('dicipoints.injection.dialogDescDeduct')} <strong>{Math.abs(amount)} DP</strong> {t('dicipoints.injection.dialogDescPart2')} <code>{targetUid}</code>?
                                        <br /><br />
                                        {t('dicipoints.injection.dialogDescVal')} {(Math.abs(amount) * pointValue).toFixed(2)}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button onClick={handleAdjustBalance} disabled={loadingAdjustment}>
                                        {loadingAdjustment ? t('dicipoints.injection.buttonConfirming') : t('dicipoints.injection.buttonConfirm')}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* System Maintenance (Migration) */}
                <Card className="border-orange-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-orange-600" /> Maintenance & Migration
                        </CardTitle>
                        <CardDescription>System-wide data patching and normalization tools.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-orange-50 border border-orange-100 rounded text-xs text-orange-800">
                            <strong>Warning:</strong> These operations affect thousands of records. Use with caution.
                        </div>
                        <div className="space-y-2">
                            <Label>Legacy Users Data Patch</Label>
                            <p className="text-xs text-muted-foreground">
                                Assigns unique codes (EMDC/DCL) and system referrers to orphaned legacy users.
                            </p>
                            <Button
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                onClick={async () => {
                                    const confirm = window.confirm("Are you sure you want to run the Legacy Migration? This will update ALL users without codes.");
                                    if (!confirm) return;

                                    try {
                                        toast({ title: "Migration Started", description: "Processing batches in background..." });
                                        const res = await fetch('/api/admin/migration/legacy-users', { method: 'POST' });
                                        const data = await res.json();

                                        if (data.success) {
                                            toast({ title: "Migration Complete", description: data.message, duration: 5000 });
                                        } else {
                                            toast({ title: "Migration Failed", description: data.error, variant: "destructive" });
                                        }
                                    } catch (e: any) {
                                        toast({ title: "Error", description: e.message || "Failed to trigger migration", variant: "destructive" });
                                    }
                                }}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Run Legacy Migration (Data Patching)
                            </Button>
                        </div>
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
