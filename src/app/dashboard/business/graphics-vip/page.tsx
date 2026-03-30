'use client';

import { ImagePlus, Sparkles, Wand2 } from 'lucide-react';

export default function GraphicsVipPage() {
    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-600 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <ImagePlus className="w-8 h-8" />
                            Edición de Gráficos VIP
                        </h1>
                        <p className="mt-3 text-amber-100 max-w-xl text-lg">
                            Servicio exclusivo Premium. Sube tus fotos crudas y nuestro equipo de diseño profesional las editará para tu escaparate.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-amber-200">
                <Sparkles className="w-16 h-16 mx-auto text-amber-300 mb-6" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Editor y Cloud Privado en Preparación</h2>
                <p className="text-slate-500 max-w-lg mx-auto">
                    Pronto incluiremos aquí el botón para enviar directamente tus recursos gráficos a nuestros diseñadores sin salir de Dicilo.
                </p>
            </div>
        </div>
    );
}
