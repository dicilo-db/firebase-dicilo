'use client';

import { useTranslation } from 'react-i18next';

import { GraduationCap, PlayCircle, BookOpen, Trophy } from 'lucide-react';

export default function CoursesPage() {
    const { t } = useTranslation('common');
    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <GraduationCap className="w-8 h-8" />
                            {t('business.courses.title', 'Academia de I.A. (Cursos)')}
                        </h1>
                        <p className="mt-3 text-blue-100 max-w-xl text-lg">
                            {t('business.courses.desc', 'Accede a tus 4 cursos anuales para dominar las herramientas de Inteligencia Artificial como comerciante.')}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-8 rounded-2xl border shadow-sm flex items-start gap-4 hover:border-blue-300 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <PlayCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{t('business.courses.copyTitle', 'Copywriting con IA para Tiendas (Próximamente)')}</h3>
                        <p className="text-slate-500 mb-3">
                            {t('business.courses.copyDesc', 'Aprende a redactar descripciones magnéticas de tus productos y aumentar ventas.')}
                        </p>
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded-full tracking-wide">{t('business.courses.modulesLabel', '4 Módulos')}</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl border shadow-sm flex items-start gap-4 hover:border-blue-300 transition-colors cursor-pointer opacity-75">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{t('business.courses.imagesTitle', 'Imágenes con GenAI (Bloqueado)')}</h3>
                        <p className="text-slate-500 mb-3">
                            {t('business.courses.imagesDesc', 'Descubre cómo retocar fotografías de catálogo automáticamente.')}
                        </p>
                        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase rounded-full tracking-wide">{t('business.courses.juneLabel', 'Disponible en Junio')}</span>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200">
                <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('business.courses.expertTitle', 'Conviértete en un Minorista Experto')}</h2>
                <p className="text-slate-500 max-w-lg mx-auto">
                    {t('business.courses.expertDesc', 'Los certificados y las grabaciones se activarán una vez hayamos implementado el sistema de aprendizaje en el dashboard de Minorista.')}
                </p>
            </div>
        </div>
    );
}
