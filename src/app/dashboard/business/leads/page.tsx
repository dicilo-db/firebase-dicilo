'use client';

import { ClipboardList, UsersRound, DatabaseZap } from 'lucide-react';

export default function LeadsPage() {
    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <ClipboardList className="w-8 h-8" />
                            Captación de Leads
                        </h1>
                        <p className="mt-3 text-emerald-100 max-w-xl text-lg">
                            Diseña e incrusta un Formulario de Registro General para capturar los datos de clientes potenciales interesados en tus productos o servicios.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-8 rounded-2xl border shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <UsersRound className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">CRM de Contactos</h3>
                        <p className="text-slate-500 text-sm">
                            Administra centralizadamente a todos los usuarios que dejen sus consultas, descarguén cupones o llenen tu formulario principal.
                        </p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl border shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                        <DatabaseZap className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">Exportador Datos</h3>
                        <p className="text-slate-500 text-sm">
                            Descarga tu base de prospectos en Excel/CSV para utilizarla en plataformas externas de automatización.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Constructor de Formularios Inactivo</h2>
                <p className="text-slate-500 max-w-lg mx-auto">
                    El sistema dinámico para captar datos específicos (como preferencias y presupuestos de tus prospectos) entrará pronto en producción.
                </p>
            </div>
        </div>
    );
}
