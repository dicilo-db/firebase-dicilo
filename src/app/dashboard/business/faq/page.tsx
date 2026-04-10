'use client';

import { FaqsView } from '@/components/dashboard/FaqsView';
import { CircleHelp } from 'lucide-react';

export default function BusinessFaqsPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="pb-4 border-b border-slate-200 text-left">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <CircleHelp className="w-8 h-8 text-teal-600" />
                    Preguntas Frecuentes <span className="text-teal-600">(FAQ)</span>
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Encuentra respuestas a las dudas más comunes sobre la plataforma Dicilo Business.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <FaqsView />
            </div>
        </div>
    );
}
