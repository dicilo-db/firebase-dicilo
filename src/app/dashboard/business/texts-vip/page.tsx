'use client';

import { Type, Edit3, Speech } from 'lucide-react';

export default function TextsVipPage() {
    const { t } = useTranslation('common');

    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-stone-700 to-stone-900 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <Type className="w-8 h-8 text-amber-500" />
                            {t('business.textsVip.title', 'Copywriter I.A. VIP')}
                        </h1>
                        <p className="mt-3 text-stone-300 max-w-xl text-lg">
                            {t('business.textsVip.desc', 'Crea textos persuasivos al instante. Deja que nuestro motor de Inteligencia Artificial redacte descripciones irresistibles para tus productos y anuncios publicitarios.')}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-2xl p-16 text-center border border-stone-200 shadow-sm">
                <Speech className="w-16 h-16 mx-auto text-amber-500 mb-6" />
                <h2 className="text-2xl font-bold text-stone-900 mb-2">{t('business.textsVip.generatorTitle', 'Generador Automático de Textos')}</h2>
                <p className="text-stone-500 max-w-lg mx-auto">
                    {t('business.textsVip.generatorDesc', 'Con tu suscripción Premium, solo tendrás que ingresar las características de tu producto y la I.A. te devolverá un copy de ventas perfectamente optimizado para captar clientes en Dicilo.')}
                </p>
                <div className="mt-6 px-6 py-2 bg-stone-100 text-stone-500 font-bold rounded-full inline-block">
                    {t('business.textsVip.soon', 'Motor I.A. en Preparación')}
                </div>
            </div>
        </div>
    );
}
