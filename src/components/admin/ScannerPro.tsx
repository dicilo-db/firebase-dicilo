'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Zap, CheckCircle, AlertTriangle, ChevronLeft, RefreshCw, Info } from 'lucide-react';
import { createProspect } from '@/app/actions/prospects';
import { processBusinessCard } from '@/app/actions/scanner';
import { useTranslation } from 'react-i18next';
import { CameraOverlay } from '@/components/admin/scanner/CameraOverlay';
import { useCardDetector } from '@/hooks/useCardDetector';

// --- DATA: FAIRS & EVENTS (Kept for reference/expansion) ---
const FAIRS_DATA = { /* ... (same as before) ... */ };

export default function ScannerPro({ recruiterId = 'DIC-001' }: { recruiterId?: string }) {
    const { t } = useTranslation('admin');
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // UI State
    const [status, setStatus] = useState<string>('Iniciando cámara...');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [scannedPhotoUrl, setScannedPhotoUrl] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<{ status: 'success' | 'duplicate', message: string, companyName: string } | null>(null);

    // Smart Scan State
    const [scanMode, setScanMode] = useState<'auto' | 'manual'>('auto');
    const isAuto = scanMode === 'auto';

    // Mediapip Hook
    const { isLoaded: isDetectorLoaded, confidence, isCardDetected, resetDetection } = useCardDetector(videoRef, isAuto && !isProcessing);

    // Form Data
    const [formData, setFormData] = useState({
        businessName: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        description: '',
        leadDestination: 'DICILO',
        clientCompanyId: '',
        clientCompanyName: '',
        eventName: 'Online (Directo)'
    });

    const [campaignClient, setCampaignClient] = useState<{ id: string, name: string } | null>(null);

    // --- INIT ---
    useEffect(() => {
        initCamera();
        checkStoredCampaign();

        return () => {
            stopCamera();
        };
    }, []);

    // Trigger Capture on Auto Detection
    useEffect(() => {
        if (isAuto && isCardDetected && !isProcessing) {
            console.log("Auto-Capture Triggered by MediaPipe!");
            captureAndProcess();
            resetDetection();
        }
    }, [isCardDetected, isAuto, isProcessing]);

    const initCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setStatus('Cámara lista');
                };
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setStatus('Error de cámara. Verifique permisos.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    // --- CAPTURE & PROCESS (With Cropping) ---
    const captureAndProcess = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        // Vibrate to confirm capture
        if (navigator.vibrate) navigator.vibrate(200);

        setIsProcessing(true);
        setStatus('Procesando imagen...');

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // 1. Calculate Crop Coordinates based on the Overlay
        // The overlay logic in CameraOverlay.tsx says reasonable card is:
        // x=10%, y=35%, width=80%, height=30% relative to container.
        // We need to map this to video source dimensions.

        const vidW = video.videoWidth;
        const vidH = video.videoHeight;

        // Define ROI (Region of Interest) - percentages matching the overlay
        const roiX = vidW * 0.10;
        const roiY = vidH * 0.35;
        const roiW = vidW * 0.80;
        const roiH = vidH * 0.30;

        // Set canvas to the size of the CROP, not full video
        canvas.width = roiW;
        canvas.height = roiH;

        // Draw only the roi portion of the video
        ctx.drawImage(video, roiX, roiY, roiW, roiH, 0, 0, roiW, roiH);

        canvas.toBlob(async (blob: Blob | null) => {
            if (!blob) {
                setIsProcessing(false);
                return;
            }

            try {
                const formDataPayload = new FormData();
                formDataPayload.append('image', blob, 'cropped_scan.webp');
                formDataPayload.append('recruiterId', recruiterId);
                // No need for clientOcrText anymore as we rely on Gemini with a better image

                const result = await processBusinessCard(formDataPayload);

                // FIX: Check if result exists basically to avoid "Cannot read properties of undefined"
                if (!result) {
                    throw new Error('El servidor no devolvió una respuesta válida.');
                }

                if (result.success && result.data) {
                    populateForm(result.data, result.photoUrl);
                    setStatus('¡Datos extraídos!');
                    setLastResult({
                        status: 'success',
                        message: 'Escaneo Completado',
                        companyName: result.data.businessName || 'Desconocido'
                    });
                } else {
                    throw new Error(result.error || 'No se pudieron extraer datos de la imagen.');
                }

            } catch (err: any) {
                console.error("Scan Error:", err);
                toast({
                    title: "Error de Escaneo",
                    description: err.message,
                    variant: "destructive"
                });
                setStatus('Error. Intente de nuevo.');
                setLastResult({ status: 'duplicate', message: 'Error', companyName: '' }); // Reuse duplicate type for error style
            } finally {
                setIsProcessing(false);
                // Reset status after a delay
                setTimeout(() => setStatus(isAuto ? 'Buscando tarjeta...' : 'Modo Manual'), 2000);
            }
        }, 'image/webp', 0.95); // High quality for AI
    };

    const populateForm = (data: any, photoUrl?: string) => {
        setFormData((prev: any) => ({
            ...prev,
            businessName: data.businessName || prev.businessName,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            website: data.website || prev.website,
            address: data.address || prev.address,
            description: `SCANNED (MediaPipe) ${new Date().toLocaleTimeString()}`
        }));

        if (photoUrl) {
            setScannedPhotoUrl(photoUrl);
        }
    };

    // --- FORM HELPERS (Reuse) ---
    const checkStoredCampaign = () => {
        const storedId = localStorage.getItem('dicilo_client_id');
        const storedName = localStorage.getItem('dicilo_client_name');
        if (storedId && storedName) {
            setCampaignClient({ id: storedId, name: storedName });
            setFormData((prev: any) => ({ ...prev, leadDestination: 'AMBOS', clientCompanyId: storedId, clientCompanyName: storedName }));
        }
    };

    const clearCampaign = () => {
        localStorage.removeItem('dicilo_client_id');
        localStorage.removeItem('dicilo_client_name');
        setCampaignClient(null);
        setFormData((prev: any) => ({ ...prev, leadDestination: 'DICILO', clientCompanyId: '', clientCompanyName: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        const { description, ...restFormData } = formData;
        const payload: any = {
            ...restFormData,
            category: 'Prospecto Pendiente',
            subcategory: 'General',
            recruiterId,
            ocrRawData: description,
        };
        if (scannedPhotoUrl) payload.photoUrl = scannedPhotoUrl;

        const res = await createProspect(payload);
        if (res.success) {
            toast({ title: 'Guardado correctamente' });
            // Reset form but keep campaign
            setFormData(prev => ({
                ...prev,
                businessName: '', phone: '', email: '', website: '', address: '', description: '',
            }));
            setScannedPhotoUrl(null);
            setLastResult(null);
        } else {
            toast({ title: 'Error al guardar', variant: 'destructive' });
        }
        setIsProcessing(false);
    };

    // If we have a successful scan, show the form primarily, but maybe keep camera small or hidden?
    // Let's keep camera visible but maybe smaller, or scroll to form.
    // For this full-screen UX, maybe toggle between "Camera View" and "Form View".
    const hasData = !!scannedPhotoUrl;

    if (hasData) {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => { setScannedPhotoUrl(null); setLastResult(null); }}>
                        <ChevronLeft className="h-4 w-4" /> Volver a Escanear
                    </Button>
                    <h2 className="text-xl font-bold">Revisar Datos</h2>
                </div>

                {scannedPhotoUrl && (
                    <div className="relative h-48 w-full bg-black rounded-lg overflow-hidden border">
                        <img src={scannedPhotoUrl} alt="Scan" className="object-contain w-full h-full" />
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Editar Información</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} placeholder="Nombre Empresa" className="font-bold text-lg" />
                            <div className="grid grid-cols-2 gap-3">
                                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Teléfono" />
                                <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email" />
                            </div>
                            <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="Web" />
                            <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Dirección" />
                            <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="animate-spin" /> : 'Confirmar y Guardar'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[85vh] md:h-[600px] bg-black rounded-xl overflow-hidden shadow-2xl flex flex-col">
            {/* Top Bar (Overlay) */}
            <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-start text-white bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
                <div className="flex flex-col pointer-events-auto">
                    <h1 className="text-lg font-bold drop-shadow-md">Dicilo Scanner</h1>
                    <span className="text-xs opacity-80">{status}</span>
                </div>
                <div className="flex gap-2 pointer-events-auto">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20"
                        onClick={() => setShowHelp(!showHelp)}
                    >
                        <Info className="h-5 w-5" />
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/20 backdrop-blur-md border-white/10 text-white hover:bg-white/30"
                        onClick={() => setScanMode(isAuto ? 'manual' : 'auto')}
                    >
                        {isAuto ? <Zap className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" /> : <Camera className="h-4 w-4 mr-1" />}
                        {isAuto ? 'Auto' : 'Manual'}
                    </Button>
                </div>
            </div>

            {/* Help Overlay */}
            {showHelp && (
                <div className="absolute inset-0 z-40 bg-black/90 p-6 flex flex-col justify-center animate-in fade-in text-white overflow-y-auto">
                    <h3 className="text-2xl font-bold mb-4 text-emerald-400">Cómo funciona</h3>
                    <ul className="space-y-4 text-sm md:text-base opacity-90">
                        <li className="flex gap-3">
                            <Camera className="shrink-0 h-6 w-6 text-emerald-400" />
                            <span><strong>Paso 1:</strong> Enfoca la tarjeta dentro del marco verde.</span>
                        </li>
                        <li className="flex gap-3">
                            <Zap className="shrink-0 h-6 w-6 text-yellow-400" />
                            <span><strong>Paso 2:</strong> En modo <strong>Auto</strong>, la app detectará el texto y tomará la foto sola. O usa el botón rojo manual.</span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle className="shrink-0 h-6 w-6 text-blue-400" />
                            <span><strong>Paso 3:</strong> Revisa los datos extraídos y guarda el contacto.</span>
                        </li>
                    </ul>
                    <Button className="mt-8 bg-white text-black hover:bg-gray-200" onClick={() => setShowHelp(false)}>
                        Entendido
                    </Button>
                </div>
            )}

            {/* Camera View */}
            <div className="relative flex-grow bg-black">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* SVG Overlay & Guide */}
                <CameraOverlay />

                {/* Processing Indicator */}
                {isProcessing && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                            <span className="text-white font-bold text-lg tracking-wider">PROCESANDO...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-30 p-8 pb-10 bg-gradient-to-t from-black/90 to-transparent flex justify-center items-center gap-4">

                {/* Confidence Indicator (Debug/Feedback) */}
                {isAuto && (
                    <div className="absolute top-[-40px] bg-black/40 px-3 py-1 rounded-full text-xs text-white font-mono backdrop-blur-md border border-white/10">
                        {isDetectorLoaded ? `Puntuación Texto: ${confidence}%` : 'Cargando IA...'}
                    </div>
                )}

                {/* Manual Trigger Button */}
                <Button
                    onClick={captureAndProcess}
                    disabled={isProcessing}
                    size="icon"
                    className={`rounded-full w-20 h-20 border-4 shadow-xl transition-all active:scale-95 ${isAuto
                        ? 'bg-transparent border-white/50 hover:bg-white/10' // Ghost button in auto
                        : 'bg-white border-gray-300 hover:bg-gray-100'        // Solid button in manual
                        }`}
                >
                    {isProcessing ? (
                        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
                    ) : (
                        <div className={`rounded-full ${isAuto ? 'w-14 h-14 bg-white/20' : 'w-16 h-16 bg-red-500 border-2 border-white'}`} />
                    )}
                </Button>
            </div>

            {/* Hidden Canvas for Processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
