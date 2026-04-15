'use client';

import { Video, CalendarDays, Projector } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PresentationsVipPage() {
    const { t } = useTranslation('common');

    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <Video className="w-8 h-8" />
                            {t('business.presentations.title', 'Webinars y Demostraciones')}
                        </h1>
                        <p className="mt-3 text-red-100 max-w-xl text-lg">
                            {t('business.presentations.desc', 'Haz presentaciones en vivo de tus productos o servicios. Reúnete directamente con tus prospectos de Dicilo y construye tu propia red de clientes leales (Netzwerk).')}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-8 rounded-2xl border shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{t('business.presentations.scheduleTitle', 'Agendar Transmisión')}</h3>
                        <p className="text-slate-500 text-sm">
                            {t('business.presentations.scheduleDesc', 'Programa una fecha para tu próxima presentación y nosotros notificaremos a tu audiencia y prospectos interesados en tu categoría.')}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl border shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                        <Projector className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{t('business.presentations.roomTitle', 'Sala en Vivo y Networking')}</h3>
                        <p className="text-slate-500 text-sm">
                            {t('business.presentations.roomDesc', 'Tu link de videoconferencia se mostrará aquí. Únete, haz demostraciones de tus productos, responde preguntas en tiempo real y cierra negocios al instante.')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
