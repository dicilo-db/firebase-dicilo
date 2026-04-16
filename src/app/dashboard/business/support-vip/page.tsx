'use client';

import { useTranslation } from 'react-i18next';

import { HeartHandshake, ShieldCheck, UserCheck } from 'lucide-react';

export default function SupportVipPage() {
    const { t } = useTranslation('common');
    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <HeartHandshake className="w-8 h-8 text-black" />
                            {t('business.supportVip.title', 'Soporte Individual (No I.A.)')}
                        </h1>
                        <p className="mt-3 text-amber-100 max-w-xl text-lg">
                            {t('business.supportVip.desc', 'Despídete de los robots. Nuestros agentes humanos de nivel superior responderán todas tus inquietudes garantizando la mejor experiencia Premium.')}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-8 rounded-2xl border shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                        <UserCheck className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{t('business.supportVip.agentTitle', 'Agente Asignado')}</h3>
                        <p className="text-slate-500 text-sm">
                            {t('business.supportVip.agentDesc', 'Tu cuenta Dicilo será administrada por un Ejecutivo de Cuenta dedicado que conocerá tu negocio y trayectoria corporativa a detalle.')}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl border shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{t('business.supportVip.guaranteeTitle', 'Garantía de Resolución')}</h3>
                        <p className="text-slate-500 text-sm">
                            {t('business.supportVip.guaranteeDesc', 'Cualquier problema técnico crítico es escalado a nivel de ingeniería de inmediato en lugar del soporte tradicional.')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
