'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Search, Check, AlertTriangle, CheckCircle, Info, ScanLine, Zap } from 'lucide-react';
import { createProspect } from '@/app/actions/prospects';
import { processBusinessCard } from '@/app/actions/scanner';
import { Prospect } from '@/types/prospect';
import { createWorker } from 'tesseract.js'; // Client-side import

// --- STYLES & ASSETS ---
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- DATA: FAIRS & EVENTS ---
const FAIRS_DATA = {
    "Turismo": [
        "ITB Berlín (Alemania)", "FITUR (España)", "World Travel Market (WTM) (Reino Unido)",
        "Arabian Travel Market (Dubái)", "Tourism EXPO Japan (Japón)"
    ],
    "Gastronomía": [
        "Salón Internacional del Gourmet (SIG) (España)", "SIAL Paris (Francia)",
        "Fiera Internazionale del Tartufo Bianco (Italia)", "Food & Hotel Asia (FHA) (Singapur)",
        "The Restaurant Show (Reino Unido)"
    ],
    "Inmobiliaria": [
        "MIPIM (Francia)", "Expo Real (Alemania)",
        "China International Fair for Trade in Services (CIFTIS) (China)", "Real Estate Expo (India)",
        "The Property Show (Emiratos Árabes Unidos)"
    ],
    "Hotelería": [
        "ITB Berlin (Alemania)", "EquipHotel (Francia)", "Hotel Show Dubai (Emiratos Árabes Unidos)",
        "World Travel Market (Reino Unido)", "Fitur (Hotelería) (España)"
    ],
    "Robótica": [
        "CES (Consumer Electronics Show) (EE. UU.)", "Automatica (Alemania)",
        "Robotics Summit & Expo (EE. UU.)", "Robogames (EE. UU.)", "China International Robot Show (China)"
    ],
    "Textil": [
        "Texworld Paris (Francia)", "The London Textile Fair (Reino Unido)",
        "Intertextile Shanghai (China)", "FIMI (España)", "Première Vision Paris (Francia)"
    ],
    "Electrodomésticos": [
        "IFA (Alemania)", "CES (EE. UU.)", "MEBLE POLSKA (Polonia)",
        "KBIS (EE. UU.)", "China International Consumer Electronics Show (China)"
    ]
};

export default function ScannerPro({ recruiterId = 'DIC-001' }: { recruiterId?: string }) {
    const { t } = useTranslation('admin');
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // UI State
    const [status, setStatus] = useState<string>(t('scanner.pro.status.initializing', 'Iniciando cámara...'));
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannedPhotoUrl, setScannedPhotoUrl] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<{ status: 'success' | 'duplicate', message: string, companyName: string, clientName: string } | null>(null);
    const [showDebug, setShowDebug] = useState(false);

    // Smart Scan State
    const [scanMode, setScanMode] = useState<'auto' | 'manual'>('auto');
    const [isScanningText, setIsScanningText] = useState(false);
    const [ocrConfidence, setOcrConfidence] = useState(0);
    const workerRef = useRef<Tesseract.Worker | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    const [interest, setInterest] = useState<string>('');
    const [campaignClient, setCampaignClient] = useState<{ id: string, name: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [rememberClient, setRememberClient] = useState(true);

    // --- INIT ---
    useEffect(() => {
        initCamera();
        initTesseract();
        checkStoredCampaign();

        return () => {
            stopCamera();
            stopSmartScan();
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, []);

    // Start/Stop Smart Scan based on mode and processing state
    useEffect(() => {
        if (scanMode === 'auto' && !isProcessing && workerRef.current) {
            startSmartScan();
        } else {
            stopSmartScan();
        }
    }, [scanMode, isProcessing]);

    const initCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use rear camera
                    width: { ideal: 1920 },    // Request high res
                    height: { ideal: 1080 }
                }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to actually play before setting status
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setStatus(t('scanner.pro.status.ready', 'Buscando tarjeta...'));
                };
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setStatus('Error: No se pudo acceder a la cámara. Verifica permisos HTTPS.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    const initTesseract = async () => {
        try {
            const worker = await createWorker(['eng', 'spa', 'deu']);
            workerRef.current = worker;
            console.log("Client-Side Tesseract Ready");
        } catch (err) {
            console.error("Tesseract Init Failed:", err);
            // Fallback to manual mode if OCR fails to load
            setScanMode('manual');
        }
    };

    // --- SMART SCAN LOOP ---
    const startSmartScan = () => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

        scanIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !canvasRef.current || !workerRef.current || isProcessing) return;

            // 1. Capture small frame for fast OCR
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Low res for speed (e.g., 640px width)
            const scale = 0.5;
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

            // 2. Run OCR
            setIsScanningText(true);
            try {
                const { data } = await workerRef.current.recognize(canvas);

                // 3. Heuristic: Is this a business card?
                // Look for common patterns: @ symbol, .com, digits (phone), or just enough text confidence
                const text = data.text;
                const confidence = data.confidence;
                const wordCount = data.words.length;

                setOcrConfidence(confidence);

                const hasEmail = text.includes('@');
                const hasWebsite = text.includes('www') || text.includes('.com');
                const hasPhone = text.replace(/[^0-9]/g, '').length > 6;
                const isDenseText = wordCount > 5 && confidence > 70; // Good quality text block

                if (isDenseText || hasEmail || hasWebsite || hasPhone) {
                    // TRIGGER CAPTURE!
                    console.log("Smart Scan Triggered!", { confidence, textPreview: text.substring(0, 50) });
                    stopSmartScan(); // Stop loop
                    captureAndProcess(text); // Pass the simplified text to helper
                }

            } catch (ignore) {
                // Ignore transient errors in loop
            } finally {
                setIsScanningText(false);
            }

        }, 1500); // Check every 1.5s
    };

    const stopSmartScan = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
    };

    // --- CAPTURE & PROCESS ---
    const captureAndProcess = async (preDetectedText: string = '') => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsProcessing(true);
        setStatus(t('scanner.pro.status.capturing', '¡Texto detectado! Analizando...'));

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // 1. Full Resolution Capture
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);

        canvas.toBlob(async (blob: Blob | null) => {
            if (!blob) {
                setIsProcessing(false);
                return;
            }

            try {
                const formData = new FormData();
                formData.append('image', blob, 'scan_smart.webp');
                formData.append('recruiterId', recruiterId);

                // Pass the client-side OCR text to save server work (optional but helpful)
                // Note: The server action needs to be updated to accept this, or we rely on server OCR.
                // For now, let's rely on server OCR as per previous robust implementation, 
                // OR send this as a hint if we update the server action. 
                // Let's rely on server OCR for consistency unless we change the server action now.
                // *Self-correction*: User approved plan to "Pass client OCR". Let's add it.
                formData.append('clientOcrText', preDetectedText);

                const result = await processBusinessCard(formData);

                if (result.success && result.data) {
                    populateForm(result.data, result.photoUrl);
                    setStatus(t('scanner.pro.status.success', '✅ Tarjeta Procesada'));
                } else {
                    setStatus(t('scanner.pro.status.error', '❌ No se pudo leer la tarjeta'));
                }

            } catch (err) {
                console.error(err);
                setStatus('Error de conexión');
            } finally {
                setIsProcessing(false);
                // If in auto mode, wait a bit before restarting (to avoid loop on same card)
                if (scanMode === 'auto') {
                    setTimeout(() => setStatus(t('scanner.pro.status.ready', 'Buscando tarjeta...')), 3000);
                }
            }
        }, 'image/webp', 0.9);
    };

    const populateForm = (data: any, photoUrl?: string) => {
        setFormData((prev: any) => ({
            ...prev,
            businessName: data.businessName || prev.businessName,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            website: data.website || prev.website,
            address: data.address || prev.address,
            description: `SCANNED (Smart Scan) ${new Date().toLocaleTimeString()}`
        }));

        if (data.interest && ['Basic', 'Starter', 'Minorista', 'Premium'].includes(data.interest)) {
            setInterest(data.interest);
        }

        if (photoUrl) {
            setScannedPhotoUrl(photoUrl);
        }
    };

    // --- FORM SUBMISSION ---
    // (Reuse existing helpers like checkStoredCampaign, clearCampaign, handleSubmit...)
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

    const handleSearch = (val: string) => {
        setSearchTerm(val);
        if (val.length < 2) { setSearchResults([]); return; }
        const mockResults = [
            { id: '1', name: 'Travelposting S.L.' },
            { id: '2', name: 'Club Inviajes' },
            { id: '3', name: 'Latinoamericana Tours' }
        ].filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
        setSearchResults(mockResults);
    };

    const selectCompany = (company: any) => {
        setFormData((prev: any) => ({ ...prev, clientCompanyId: company.id, clientCompanyName: company.name }));
        setSearchTerm(company.name);
        setSearchResults([]);
        if (rememberClient) {
            localStorage.setItem('dicilo_client_id', company.id);
            localStorage.setItem('dicilo_client_name', company.name);
            setTimeout(checkStoredCampaign, 500);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setLastResult(null);

        const { description, ...restFormData } = formData;
        const payload: any = {
            ...restFormData,
            category: 'Prospecto Pendiente',
            subcategory: 'General',
            recruiterId,
            ocrRawData: description,
        };

        if (scannedPhotoUrl) payload.photoUrl = scannedPhotoUrl;
        if (interest) payload.interest = interest as any;

        const res = await createProspect(payload);

        if (res.success) {
            setLastResult({
                status: res.status as any,
                message: res.message || 'Guardado',
                companyName: res.companyName || formData.businessName,
                clientName: formData.clientCompanyName || 'Dicilo'
            });
            setFormData({
                businessName: '', phone: '', email: '', website: '', address: '', description: '',
                leadDestination: campaignClient ? 'AMBOS' : 'DICILO',
                clientCompanyId: campaignClient?.id || '',
                clientCompanyName: campaignClient?.name || '',
                eventName: 'Online (Directo)'
            });
            setScannedPhotoUrl(null);
            setInterest('');
            setStatus(t('scanner.pro.status.ready', 'Listo para el siguiente'));
        } else {
            toast({ title: 'Error', variant: 'destructive' });
        }
        setIsProcessing(false);
    };


    return (
        <div className="space-y-6">

            {/* Header Moderno */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('scanner.title', 'Dicilo Scanner AI')}</h1>
                    <p className="text-muted-foreground">{t('scanner.subtitle', 'Captura inteligente de prospectos')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground">Modo:</span>
                    <Button
                        variant={scanMode === 'auto' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScanMode(scanMode === 'auto' ? 'manual' : 'auto')}
                        className="gap-2"
                    >
                        {scanMode === 'auto' ? <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : <Camera className="h-4 w-4" />}
                        {scanMode === 'auto' ? 'Auto-Scan' : 'Manual'}
                    </Button>
                </div>
            </div>

            {/* Campaign Active Banner */}
            {campaignClient && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md shadow-sm flex justify-between items-center animate-in slide-in-from-top-2">
                    <div>
                        <p className="text-xs text-blue-500 font-bold uppercase">CLIENTE ACTIVO</p>
                        <p className="text-blue-900 font-bold text-lg">{campaignClient.name}</p>
                    </div>
                    <Button onClick={clearCampaign} variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        Salir
                    </Button>
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-2">

                {/* COLUMNA IZQUIERDA: CÁMARA */}
                <div className="space-y-4">
                    <Card className="overflow-hidden border-2 border-emerald-500/10 shadow-lg relative">
                        {/* Status Bar Overlay */}
                        <div className="absolute top-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm p-2 flex justify-between items-center text-white px-4">
                            <span className="text-xs font-mono flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
                                {status}
                            </span>
                            {scanMode === 'auto' && (
                                <span className={`text-xs font-bold transition-colors ${ocrConfidence > 50 ? 'text-green-400' : 'text-gray-400'}`}>
                                    TXT: {Math.round(ocrConfidence)}%
                                </span>
                            )}
                        </div>

                        <div className="relative aspect-[3/4] md:aspect-video bg-black group">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Scanning Line Animation (Only when active) */}
                            {!isProcessing && scanMode === 'auto' && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    <div className="w-full h-[2px] bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                                </div>
                            )}

                            {/* Focus Frame Overlay */}
                            <div className="absolute inset-x-[15%] inset-y-[20%] border-2 border-white/30 rounded-lg pointer-events-none">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-0.5 -ml-0.5"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-0.5 -mr-0.5"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-0.5 -ml-0.5"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-0.5 -mr-0.5"></div>
                            </div>

                            {/* Manual Trigger Overlay (if manual mode) */}
                            {scanMode === 'manual' && !isProcessing && (
                                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                                    <Button
                                        onClick={() => captureAndProcess()}
                                        size="lg"
                                        className="rounded-full w-16 h-16 bg-white hover:bg-gray-100 p-0 border-4 border-emerald-500 shadow-xl"
                                    >
                                        <Camera className="h-8 w-8 text-emerald-600" />
                                    </Button>
                                </div>
                            )}

                            {/* Hidden Processing Canvas */}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    </Card>

                    {/* Result Feedback */}
                    {lastResult && (
                        <div className={`p-4 rounded-lg border flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 ${lastResult.status === 'success' ? 'bg-green-50 border-green-200 text-green-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                            {lastResult.status === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                            <div>
                                <p className="font-bold">{lastResult.message}</p>
                                <p className="text-sm opacity-90">{lastResult.companyName} → {lastResult.clientName}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* COLUMNA DERECHA: FORMULARIO */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Datos Extraídos</CardTitle>
                        <CardDescription>Edita si es necesario</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                value={formData.businessName}
                                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                placeholder="Nombre de la Empresa"
                                className="text-lg font-bold"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Teléfono" />
                                <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email" />
                            </div>

                            <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="Sitio Web" />
                            <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Dirección" />

                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Notas..."
                                className="h-20 text-xs font-mono"
                            />

                            {/* Interest Tags */}
                            <div className="flex gap-2">
                                {['Basic', 'Starter', 'Minorista', 'Premium'].map((tag) => (
                                    <div
                                        key={tag}
                                        onClick={() => setInterest(tag)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer select-none transition-colors ${interest === tag ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-100'}`}
                                    >
                                        {tag}
                                    </div>
                                ))}
                            </div>

                            <Button type="submit" disabled={isProcessing} className="w-full font-bold uppercase" size="lg">
                                {isProcessing ? <Loader2 className="animate-spin" /> : 'Guardar y Seguir'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

