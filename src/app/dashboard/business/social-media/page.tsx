'use client';

import { useTranslation } from 'react-i18next';
import { Share2, Facebook, Instagram, Linkedin, CalendarClock } from 'lucide-react';

export default function SocialMediaPage() {
    const { t } = useTranslation('common');
    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <Share2 className="w-8 h-8" />
                            Presencia Automatizada
                        </h1>
                        <p className="mt-3 text-pink-100 max-w-xl text-lg">
                            Genera y programa automáticamente hasta <strong>12 posts mensuales en 3 canales</strong>.
                            Diseñado para maximizar la visibilidad de tu negocio con Inteligencia Artificial.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center">
                    <Facebook className="text-blue-600 w-12 h-12 mb-4" />
                    <h3 className="font-bold text-slate-800">Conectar Facebook</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center">
                    <Instagram className="text-pink-600 w-12 h-12 mb-4" />
                    <h3 className="font-bold text-slate-800">Conectar Instagram</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center">
                    <Linkedin className="text-blue-800 w-12 h-12 mb-4" />
                    <h3 className="font-bold text-slate-800">Conectar LinkedIn</h3>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm">
                <CalendarClock className="w-16 h-16 mx-auto text-slate-300 mb-6" />
                <h2 className="text-2xl font-bold text-slate-700 mb-2">{t('business.socialMedia.editor', 'Editor de Programación en Desarrollo')}</h2>
                <p className="text-slate-500 max-w-lg mx-auto">
                    Pronto podrás visualizar todo tu plan de medios en un calendario e instruir a la IA a escribir las novedades de tu tienda.
                </p>
            </div>
        </div>
    );
}
