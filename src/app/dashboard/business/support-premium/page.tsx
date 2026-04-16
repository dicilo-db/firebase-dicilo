'use client';

import { useTranslation } from 'react-i18next';

import { HeadphonesIcon, Star, MailOpen } from 'lucide-react';

export default function SupportPremiumPage() {
    const { t } = useTranslation('common');
    return (
        <div className="p-8 max-w-4xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-slate-800 to-black p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <HeadphonesIcon className="w-8 h-8 text-amber-500" />
                            {t('business.supportPremium.title', 'Soporte Técnico Premium')}
                        </h1>
                        <p className="mt-3 text-slate-300 max-w-xl text-lg">
                            {t('business.supportPremium.desc', 'Canal de atención preferente por email exclusivo para negocios minoristas. Disponible de Lunes a Viernes.')}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 border shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Star className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{t('business.supportPremium.vipTitle', 'Tienes Prioridad VIP')}</h2>
                        <p className="text-slate-500">{t('business.supportPremium.vipDesc', 'Tus consultas omiten la cola general de Dicilo.')}</p>
                    </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 mx-auto text-center">
                    <MailOpen className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                    <h3 className="font-bold text-slate-700">{t('business.supportPremium.ticketsTitle', 'Módulo de Tickets Interno')}</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                        {t('business.supportPremium.ticketsDesc', 'Pronto podrás abrir tickets de soporte directamente desde aquí sin tener que ir a tu correo personal.')}
                    </p>
                </div>
            </div>
        </div>
    );
}
