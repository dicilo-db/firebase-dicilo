'use client';

import React, { useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Image as ImageIcon, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface ApoyoSocialDashboardProps {
    user: User;
    profile: any;
}

export function ApoyoSocialDashboard({ user, profile }: ApoyoSocialDashboardProps) {
    const { toast } = useToast();
    const bannerRef = useRef<HTMLDivElement>(null);
    
    const [bannerText, setBannerText] = useState('¡Apóyanos en nuestra causa!');
    const [bannerTitle, setBannerTitle] = useState(profile.firstName || 'Mi Proyecto Solidario');
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setBgImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownloadBanner = async () => {
        if (!bannerRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(bannerRef.current, {
                useCORS: true,
                scale: 2, // High quality
                backgroundColor: null,
            });
            const imageStr = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imageStr;
            link.download = `ApoyoSocial_${profile.firstName?.replace(/\s+/g, '_') || 'Dicilo'}.png`;
            link.click();
            toast({
                title: 'Banner Generado',
                description: 'La imagen se ha descargado y está lista para compartir en tus redes sociales.',
            });
        } catch (error) {
            console.error('Error generating banner:', error);
            toast({
                title: 'Error',
                description: 'No se pudo generar el banner. Intenta subir una imagen diferente.',
                variant: 'destructive'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            {/* Encabezado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-green-50/50 p-6 rounded-2xl border border-green-100">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-green-800">
                        <Heart className="h-8 w-8 text-green-600 fill-green-600" />
                        Bienvenido, {profile.firstName}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Panel de Control Exclusivo: Programa de Apoyo Social Dicilo.
                    </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-full border border-green-200 shadow-sm flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">Socio Verificado</span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Herramienta 1: Generador de Banners */}
                <Card className="md:col-span-2 border-green-200 overflow-hidden shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 pb-4">
                        <CardTitle className="text-green-800 flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-green-600" /> Generador de Banners Oficial
                        </CardTitle>
                        <CardDescription>
                            Crea imágenes promocionales para tus redes. Como beneficiario, el sello de "Verificado por Dicilo" brindará confianza a tus donantes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid gap-8 lg:grid-cols-2">
                            {/* Editor */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Título de tu causa</Label>
                                    <Input 
                                        value={bannerTitle} 
                                        onChange={(e) => setBannerTitle(e.target.value)} 
                                        placeholder="Ej: Salvemos a los perritos"
                                        maxLength={40}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mensaje principal</Label>
                                    <Input 
                                        value={bannerText} 
                                        onChange={(e) => setBannerText(e.target.value)} 
                                        placeholder="Tu mensaje aquí"
                                        maxLength={60}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sube una foto de fondo</Label>
                                    <div className="flex items-center gap-3">
                                        <Input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleImageUpload}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Recomendado: Imágenes horizontales de buena calidad.</p>
                                </div>
                            </div>

                            {/* Vista Previa */}
                            <div className="flex flex-col items-center gap-4">
                                <Label className="text-slate-500 font-semibold self-start">Vista Previa:</Label>
                                
                                <div 
                                    ref={bannerRef}
                                    className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100 flex flex-col justify-end"
                                    style={{
                                        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                >
                                    {/* Capa oscurecedora para que el texto resalte */}
                                    {bgImage && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0"></div>}

                                    {/* Contenido (Textos) */}
                                    <div className="relative z-10 p-6 flex flex-col items-center text-center">
                                        <h2 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-md tracking-tight mb-1">
                                            {bannerTitle}
                                        </h2>
                                        <p className="text-white/90 font-medium text-sm md:text-base drop-shadow-md max-w-[90%] mx-auto">
                                            {bannerText}
                                        </p>
                                    </div>

                                    {/* Marca de Agua (Watermark Fija) */}
                                    <div className="relative z-10 w-full bg-green-500/90 backdrop-blur-sm py-2 px-4 flex items-center justify-between border-t border-green-400">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-white" />
                                            <span className="text-white text-xs font-bold uppercase tracking-wider">
                                                Causa Verificada
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-90">
                                            <span className="text-white text-[10px] uppercase font-semibold">Respaldo:</span>
                                            {/* Símbolo/Logo simple o texto de Dicilo */}
                                            <span className="text-white text-xs font-black tracking-widest">DICILO.NET</span>
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    className="w-full bg-green-600 hover:bg-green-700 text-white mt-2 h-12 text-lg shadow-md transition-all hover:scale-[1.02]"
                                    onClick={handleDownloadBanner}
                                    disabled={isGenerating}
                                >
                                    <Download className="mr-2 h-5 w-5" /> 
                                    {isGenerating ? 'Generando...' : 'Descargar Imagen'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-slate-800 text-lg">¿Cómo funciona?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-600">
                        <div className="flex gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                            <p><strong>Descarga tu banner:</strong> Usa nuestra herramienta para crear contenido visual profesional con respaldo internacional.</p>
                        </div>
                        <div className="flex gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                            <p><strong>Compártelo:</strong> Pబ్licalo en tus redes sociales (Facebook, Instagram, WhatsApp) para ganar mayor credibilidad.</p>
                        </div>
                        <div className="flex gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                            <p><strong>Garantía Dicilo:</strong> El escrutinio de nuestras cuentas garantiza a tus donantes que los fondos llegarán al destino estipulado.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Soporte */}
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardHeader>
                        <CardTitle className="text-emerald-800 text-lg">Soporte Directo</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-emerald-700">
                        <p className="mb-4">
                            Como beneficiario del Apoyo Social, cuentas con acceso directo a nuestro equipo para resolver dudas sobre difusión y uso de plataforma.
                        </p>
                        <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white" onClick={() => window.open('mailto:apoyosocial@dicilo.net')}>
                            Contactar a Soporte Social
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
