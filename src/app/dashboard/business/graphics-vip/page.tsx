'use client';

import React, { useState } from 'react';
import { ImagePlus, Sparkles, Upload, Image as ImageIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';

// Carga dinámica exclusiva en el cliente porque el canvas requiere interactuar con el DOM
const FilerobotImageEditor = dynamic(
  () => import('react-filerobot-image-editor'),
  { ssr: false, loading: () => <div className="p-12 text-center text-amber-600 font-bold animate-pulse">Cargando el Motor Biográfico de I.A...</div> }
);

export default function GraphicsVipPage() {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [sourceImage, setSourceImage] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limitar tamaño por seguridad del navegador
        if (file.size > 8 * 1024 * 1024) {
            toast({ title: t('business.graphicsVip.fileTooLargeTitle', 'Archivo muy grande'), description: t('business.graphicsVip.fileTooLargeDesc', 'Por favor usa una imagen menor a 8MB'), variant: 'destructive' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setSourceImage(event.target?.result as string);
            setIsEditorOpen(true);
        };
        reader.readAsDataURL(file);
        
        // Reset the input value so the same file could be uploaded again if needed
        e.target.value = '';
    };

    const handleSave = (editedImageObject: any) => {
        // La imagen resultante editada (en base64) para subirla a Firebase o descargar
        const finalImageBase64 = editedImageObject.imageBase64;
        
        // Aquí conectaremos luego la subida a Firebase Storage
        toast({ title: t('business.graphicsVip.editSuccessTitle', '¡Edición Exitosa!'), description: t('business.graphicsVip.editSuccessDesc', 'La imagen fue procesada por el Estudio Mágico.') });
        
        // Cierra el editor para volver al panel
        setIsEditorOpen(false);
        setSourceImage(null);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-600 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <ImagePlus className="w-8 h-8" />
                            {t('business.graphicsVip.title', 'Estudio Gráfico Avanzado VIP')}
                        </h1>
                        <p className="mt-3 text-amber-100 max-w-xl text-lg">
                            {t('business.graphicsVip.description', 'Servicio exclusivo Premium. Edita, recorta, aplica filtros y pon tu marca de agua al instante con nuestro motor nativo avanzado.')}
                        </p>
                    </div>
                </div>
            </div>
            
            {!isEditorOpen ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Panel de Subida */}
                    <Card className="border-2 border-dashed border-amber-300 bg-amber-50/50 p-12 flex flex-col items-center justify-center text-center relative group hover:bg-amber-50 transition-colors">
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleFileUpload}
                        />
                        <Upload className="w-16 h-16 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">{t('business.graphicsVip.uploadTitle', 'Editor Filerobot Nativo')}</h2>
                        <p className="text-slate-500 max-w-sm mb-6">
                            {t('business.graphicsVip.uploadDesc', 'Haz clic aquí o arrastra la foto cruda de tu negocio, tu equipo o producto para abrir el cuarto de revelado.')}
                        </p>
                        <Button className="bg-amber-600 hover:bg-amber-700 pointer-events-none">
                            {t('business.graphicsVip.startButton', 'Iniciar Editor')}
                        </Button>
                    </Card>

                    {/* Panel Promocional IA */}
                    <Card className="border border-slate-200 bg-white p-10 flex flex-col justify-center relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 p-32 bg-amber-400/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <Sparkles className="w-12 h-12 text-amber-400 mb-4 relative z-10" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 relative z-10">{t('business.graphicsVip.aiTitle', 'Borrador I.A. Mágico')}</h2>
                        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold w-fit mb-4 relative z-10">
                            {t('business.graphicsVip.soon', 'Próximamente')}
                        </div>
                        <p className="text-slate-500 relative z-10 mb-6">
                            {t('business.graphicsVip.aiDesc', 'Como cliente VIP, recibirás un bono mensual para utilizar la I.A. que elimina fondos automáticamente, dejando el producto transparente y listo para publicidad.')}
                        </p>
                    </Card>
                </div>
            ) : (
                <Card className="border-slate-300 shadow-xl overflow-hidden h-[800px] w-full animate-in slide-in-from-bottom flex flex-col">
                    <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2"><ImageIcon className="w-5 h-5"/> {t('business.graphicsVip.workspace', 'Area de Trabajo Visual')}</h3>
                        <Button variant="ghost" size="sm" className="hover:bg-slate-700 text-slate-300" onClick={() => setIsEditorOpen(false)}>
                            {t('business.graphicsVip.cancelEdit', 'Cancelar Edición')}
                        </Button>
                    </div>
                    <div className="flex-grow bg-slate-100 relative">
                        {sourceImage && (
                            <FilerobotImageEditor
                                source={sourceImage}
                                onSave={(editedImageObject, designState) => handleSave(editedImageObject)}
                                annotationsCommon={{ fill: '#ff0000' }}
                                Text={{ text: 'Dicilo Premium...' }}
                                Rotate={{ angle: 90, componentType: 'slider' }}
                                tabsIds={[
                                    'Adjust', 'Annotate', 'Watermark', 'Filters', 'Finetune', 'Resize'
                                ]}
                                defaultTabId="Adjust"
                                defaultToolId="Crop"
                            />
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
