'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

interface TrustBoardGuardProps {
    currentUser: User;
    children: React.ReactNode;
}

const db = getFirestore(app);

export function TrustBoardGuard({ currentUser, children }: TrustBoardGuardProps) {
    const { t } = useTranslation('common');
    const [loading, setLoading] = useState(true);
    const [isEligible, setIsEligible] = useState(false);
    
    const [profileStatus, setProfileStatus] = useState({
        hasName: false,
        hasPhoto: false,
        isVerified: false,
        hasLocation: false
    });

    useEffect(() => {
        const checkEligibility = async () => {
            if (!currentUser) return;
            try {
                // Fetch private profile
                const profileRef = doc(db, 'private_profiles', currentUser.uid);
                const profileSnap = await getDoc(profileRef);
                
                let hasLocation = false;
                let hasName = !!currentUser.displayName;
                let hasPhoto = !!currentUser.photoURL;
                let isVerified = currentUser.emailVerified; 
                let isAdmin = false;

                if (profileSnap.exists()) {
                    const data = profileSnap.data();
                    
                    // Fallbacks to Firestore data
                    if (!hasName) hasName = !!(data.displayName || data.name || data.firstName);
                    if (!hasPhoto) hasPhoto = !!(data.photoURL || data.photoUrl || data.avatar);
                    // Admins/SuperAdmins bypass some strict profile checks or usually count as verified
                    isAdmin = data.role === 'admin' || data.role === 'superadmin';
                    if (!isVerified) isVerified = !!(data.isVerified || data.emailVerified || isAdmin);
                    
                    hasLocation = !!(data.favoriteNeighborhood || data.location || data.address || data.city);
                }

                // Temporary override for superadmin users via email if doc is slow
                if (currentUser.email === 'superadmin@dicilo.net' || currentUser.email === 'mohammedzaxo@outlook.de' || isAdmin) {
                    hasName = true;
                    hasPhoto = true;
                    isVerified = true;
                    hasLocation = true;
                }

                setProfileStatus({
                    hasName,
                    hasPhoto,
                    isVerified,
                    hasLocation
                });

                if (hasName && hasPhoto && isVerified && hasLocation) {
                    setIsEligible(true);
                }
            } catch (error) {
                console.error("Error verifying TrustBoard access:", error);
            } finally {
                setLoading(false);
            }
        };

        checkEligibility();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48 animate-pulse text-muted-foreground">
                <ShieldAlert className="mr-2 h-6 w-6" /> {t('community.trustboard_guard.verifying', 'Verificando Credenciales de Ingreso...')}
            </div>
        );
    }

    if (!isEligible) {
        return (
            <Card className="border-red-200 bg-red-50/30 max-w-2xl mx-auto shadow-md">
                <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6" />
                        {t('community.trustboard_guard.restricted', 'Acceso Restringido al TrustBoard')}
                    </CardTitle>
                    <CardDescription className="text-red-600/80">
                        {t('community.trustboard_guard', 'Para mantener nuestra comunidad segura y libre de spam, el "Muro de la Confianza" requiere que todos los usuarios tengan su perfil validado al 100% para poder interactuar o publicar.')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ul className="space-y-3 p-4 bg-white rounded-md border border-red-100 shadow-sm">
                        <li className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">{t('community.trustboard_guard.req_name', 'Nombre Real Identificable')}</span>
                            {profileStatus.hasName ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                        </li>
                        <li className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">{t('community.trustboard_guard.req_photo', 'Fotografía de Perfil (Persona o negocio visible)')}</span>
                            {profileStatus.hasPhoto ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                        </li>
                        <li className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">{t('community.trustboard_guard.req_email', 'Correo Electrónico Verificado')}</span>
                            {profileStatus.isVerified ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                        </li>
                        <li className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">{t('community.trustboard_guard.req_location', 'Ubicación / Barrio Confirmado')}</span>
                            {profileStatus.hasLocation ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                        </li>
                    </ul>

                    <div className="pt-4 flex justify-end">
                        <Link href="/dashboard?view=settings">
                            <Button variant="default" className="bg-red-600 hover:bg-red-700 text-white">
                                {t('community.trustboard_guard.action_complete', 'Completar Perfil Ahora')}
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return <>{children}</>;
}
