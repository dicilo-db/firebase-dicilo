'use client';

import { FileCode2, MonitorSmartphone, LayoutTemplate } from 'lucide-react';

export default function PageEditorPage() {
    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <FileCode2 className="w-8 h-8" />
                            Creador de Landing Page
                        </h1>
                        <p className="mt-3 text-blue-200 max-w-xl text-lg">
                            Construye y gestiona visualmente tu Landing Page Empresarial sin código. Totalmente optimizada para móvil y buscadores.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-8 rounded-2xl border shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <MonitorSmartphone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">Responsive Design</h3>
                        <p className="text-slate-500 text-sm">
                            Tu landing se adaptará automáticamente a cualquier tamaño de pantalla.
                        </p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl border shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                        <LayoutTemplate className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">Editor Visual (Próximo)</h3>
                        <p className="text-slate-500 text-sm">
                            Arrastra y suelta galerías, textos destacados, llamadas a la acción y videos para componer tu perfil.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 shadow-inner">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Motor de Plantillas en Preparación</h2>
                <div className="w-full bg-slate-200 h-2 rounded-full max-w-md mx-auto overflow-hidden">
                    <div className="bg-blue-600 h-full w-2/3"></div>
                </div>
                <p className="text-slate-500 mt-4 text-sm font-semibold uppercase tracking-wider">
                    Infraestructura al 60%
                </p>
            </div>
        </div>
    );
}
