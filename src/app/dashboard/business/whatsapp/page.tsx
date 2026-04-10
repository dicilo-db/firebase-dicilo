'use client';

import { MessageCircle, PhoneCall, Smartphone } from 'lucide-react';

export default function WhatsAppVipPage() {
    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <MessageCircle className="w-8 h-8" />
                            Soporte por WhatsApp
                        </h1>
                        <p className="mt-3 text-emerald-100 max-w-xl text-lg">
                            Comunicación directa, ágil y dedicada con nuestro equipo de Customer Success. De lunes a sábado.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-2xl p-16 text-center border shadow-sm max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Smartphone className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Contacto Directo VIP</h2>
                <p className="text-slate-500 mb-6">
                    Haz clic en el siguiente botón para enlazar instantáneamente con nuestro número oficial de soporte empresarial en tu app de WhatsApp.
                </p>
                <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors flex items-center justify-center gap-2 mx-auto">
                    <MessageCircle className="w-5 h-5" /> Abrir WhatsApp
                </button>
            </div>
        </div>
    );
}
