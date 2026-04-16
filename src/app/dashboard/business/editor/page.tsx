'use client';

import React, { useEffect, useState } from 'react';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EditClientForm from '@/app/admin/clients/[id]/edit/EditClientForm';
import { ClientData } from '@/app/admin/clients/[id]/edit/page';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { LayoutTemplate } from 'lucide-react';

export default function PageEditorPage() {
    const { businessId, clientId, isLoading } = useBusinessAccess();
    const activeId = businessId || clientId;
    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const { t } = useTranslation('common');

    useEffect(() => {
        if (!activeId) {
            setLoadingData(false);
            return;
        }

        const fetchClientData = async () => {
            try {
                const docRef = doc(db, 'clients', activeId);
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    setClientData({ id: snapshot.id, ...snapshot.data() } as ClientData);
                }
            } catch (error) {
                console.error("Error fetching client data:", error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchClientData();
    }, [activeId]);

    if (isLoading || loadingData) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <Skeleton className="w-full h-[600px] rounded-xl" />
            </div>
        );
    }

    if (!activeId || !clientData) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-4 text-sm font-medium mt-6">
                    <p>{t('business.editor.noProfile', 'No se pudo localizar el perfil comercial activo. Por favor, contacta con soporte si el problema persiste.')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-0 animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white shadow-xl mb-4">
                <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <LayoutTemplate className="w-8 h-8" />
                            {t('business.editor.pageTitle', 'Gestor de Contenidos & Herramientas Avanzadas')}
                        </h1>
                        <p className="mt-2 text-blue-200 max-w-3xl text-lg">
                            {t('business.editor.pageDesc', 'Desde aquí puedes administrar los textos, banners, sistema de cupones integrados y las invitaciones a nuevos clientes (Tu Panel Clásico).')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1240px] mx-auto p-4 md:p-8">
                {/* Renders the complex dashboard/editor the user requested to be brought back */}
                <EditClientForm initialData={clientData} />
            </div>
        </div>
    );
}
