'use client';

import React from 'react';
import ScannerPro from '@/components/admin/ScannerPro';
import { ReportsPanel } from '@/components/admin/ReportsPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import { Scan } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { getUserProfileSummary } from '@/app/actions/profile';
import { ensureUniqueCode } from '@/app/actions/profile';

export default function ScannerPage() {
    const { t } = useTranslation('admin');
    const { user } = useAuth();
    const [recruiterInfo, setRecruiterInfo] = React.useState<string>('Cargando...');

    React.useEffect(() => {
        const fetchRecruiterData = async () => {
            if (user?.uid) {
                // Ensure they have a code first
                await ensureUniqueCode(user.uid);
                // Get details
                const res = await getUserProfileSummary(user.uid);
                if (res.success && res.data) {
                    const { firstName, lastName, uniqueCode } = res.data;
                    setRecruiterInfo(`${firstName} ${lastName} (${uniqueCode})`.trim());
                } else {
                    setRecruiterInfo('Usuario Desconocido');
                }
            }
        };
        fetchRecruiterData();
    }, [user]);

    return (
        <div className="w-full max-w-[1800px] mx-auto p-4 md:p-8 space-y-8 pb-24">
            <div className="space-y-2 text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2 justify-center md:justify-start">
                    <Scan className="h-8 w-8 text-blue-600" />
                    {t('scanner.title', 'Dicilo Scanner & Reports')}
                </h1>
                <p className="text-slate-500">
                    {t('scanner.subtitle', 'Herramienta unificada para capturar prospectos y generar reportes B2B.')}
                </p>
            </div>

            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[60%_40%] xl:grid-cols-[65%_35%]">

                {/* Left Column: Scanner */}
                <div className="space-y-6">
                    <Card className="border-blue-100 shadow-md">
                        <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-3">
                            <CardTitle className="text-lg text-blue-900">{t('scanner.cardTitle')}</CardTitle>
                            <CardDescription>{t('scanner.cardDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ScannerPro recruiterId={recruiterInfo} />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Reports & Info */}
                <div className="space-y-6">

                    {/* Reports Panel */}
                    <ReportsPanel />

                    {/* Instructions / Help */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('scanner.howItWorks.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4 text-slate-600">
                            <div>
                                <strong className="block text-slate-900 mb-1">{t('scanner.howItWorks.step1.title')}</strong>
                                <p>{t('scanner.howItWorks.step1.desc')}</p>
                            </div>
                            <Separator />
                            <div>
                                <strong className="block text-slate-900 mb-1">{t('scanner.howItWorks.step2.title')}</strong>
                                <p>{t('scanner.howItWorks.step2.desc')}</p>
                            </div>
                            <Separator />
                            <div>
                                <strong className="block text-slate-900 mb-1">{t('scanner.howItWorks.step3.title')}</strong>
                                <p>{t('scanner.howItWorks.step3.desc')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
