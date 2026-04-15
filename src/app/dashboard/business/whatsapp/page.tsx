'use client';

import { MessageCircle, PhoneCall, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function WhatsAppVipPage() {
    const { t } = useTranslation('common');

    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <MessageCircle className="w-8 h-8" />
                            {t('business.whatsapp.title', 'Bandeja Omnicanal (WhatsApp & Telegram)')}
                        </h1>
                        <p className="mt-3 text-emerald-100 max-w-xl text-lg">
                            {t('business.whatsapp.desc', 'Centraliza los mensajes de tus clientes. Responde desde un solo lugar o configura tu propio bot de auto-respuesta 24/7.')}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Inbox Chat Panel */}
                <div className="bg-white rounded-2xl p-8 text-center border shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Smartphone className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">{t('business.whatsapp.inboxTitle', 'Bandeja Centralizada')}</h2>
                        <p className="text-slate-500 mb-6 text-sm">
                            {t('business.whatsapp.inboxDesc', 'Unifica tus conversaciones de WhatsApp API, Instagram y Facebook Messenger. Responde todo desde un solo entorno al estilo Mateo.')}
                        </p>
                    </div>
                    <div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto w-full">
                            <MessageCircle className="w-4 h-4" /> {t('business.whatsapp.inboxButton', 'Abrir Inbox Multi-red')}
                        </button>
                        <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-wider">{t('business.whatsapp.integrationStatus', 'Integración en curso')}</p>
                    </div>
                </div>

                {/* Automation Panel */}
                <div className="bg-white rounded-2xl p-8 text-center border shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <PhoneCall className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">{t('business.whatsapp.teamTitle', 'Asignación al Equipo')}</h2>
                        <p className="text-slate-500 mb-6 text-sm">
                            {t('business.whatsapp.teamDesc', 'Asigna chats específicos a diferentes miembros de tu equipo. Coordina internamente de forma invisible para el cliente.')}
                        </p>
                    </div>
                    <div>
                        <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto w-full">
                            {t('business.whatsapp.teamButton', 'Gestionar Equipo')}
                        </button>
                        <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-wider">{t('business.whatsapp.prepStatus', 'En Preparación')}</p>
                    </div>
                </div>
                
                 {/* Rating Panel */}
                 <div className="bg-white rounded-2xl p-8 text-center border shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">{t('business.whatsapp.reviewsTitle', 'Cosechadora de Reseñas')}</h2>
                        <p className="text-slate-500 mb-6 text-sm">
                            {t('business.whatsapp.reviewsDesc', 'Configura el bot para enviar plantillas automatizadas invitando al cliente a dejarte 5 estrellas en tu Ficha cuando un chat se cierra.')}
                        </p>
                    </div>
                    <div>
                        <button className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto w-full">
                            {t('business.whatsapp.reviewsButton', 'Campañas de Feedback')}
                        </button>
                        <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-wider">{t('business.whatsapp.soonStatus', 'Próximamente')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
