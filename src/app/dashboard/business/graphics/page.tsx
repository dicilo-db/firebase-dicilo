'use client';

import { Palette, Image as ImageIcon, Wand2, ArrowRight } from 'lucide-react';

export default function GraphicsPage() {
    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-pink-500 to-fuchsia-600 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <Palette className="w-8 h-8" />
                            Herramientas Gráficas
                        </h1>
                        <p className="mt-3 text-pink-100 max-w-xl text-lg">
                            Diseña banners, edita fotos de productos y crea anuncios directamente en Dicilo usando nuestras herramientas en la nube.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                    <ImageIcon className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-800 text-lg">Editor de Retoque</h3>
                    <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto">
                        Corrección de luz, contraste y recortes para imágenes de catálogo directamente sin Photoshop.
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                    <Wand2 className="w-12 h-12 text-fuchsia-500 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-800 text-lg">Templates Mágicos</h3>
                    <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto">
                        Plantillas de "Oferta" y "En Rebaja" que se aplican automáticamente sobre tus portadas de producto.
                    </p>
                </div>
            </div>

            <div className="bg-slate-100 rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-fuchsia-500">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Canva Integrado en Camino</h2>
                    <p className="text-slate-500 max-w-lg">
                        Estamos integrando el SDK visual para que puedas arrastrar y soltar elementos de diseño. 
                    </p>
                </div>
                <div className="bg-slate-300 text-slate-600 px-6 py-3 rounded-full font-bold flex items-center gap-2">
                    En Desarrollo
                </div>
            </div>
        </div>
    );
}
