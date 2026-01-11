'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Search, Check, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { createProspect } from '@/app/actions/prospects';
import { processBusinessCard } from '@/app/actions/scanner';
import { Prospect } from '@/types/prospect';

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
    const [status, setStatus] = useState<string>(t('scanner.pro.status.ready', 'Listo para escanear'));
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannedPhotoUrl, setScannedPhotoUrl] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<{ status: 'success' | 'duplicate', message: string, companyName: string, clientName: string } | null>(null);
    const [showDebug, setShowDebug] = useState(false);

    // Form Data with Complete Fields
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
        eventName: 'Online (Directo)' // Default
    });

    // New Features State
    const [interest, setInterest] = useState<string>(''); // Output: Basic, Starter, Minorista, Premium

    // Campaign Memory State
    const [campaignClient, setCampaignClient] = useState<{ id: string, name: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [rememberClient, setRememberClient] = useState(true);

    // Initial Load
    useEffect(() => {
        initCamera();
        checkStoredCampaign();
        return () => stopCamera();
    }, []);

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
            }
        } catch (err) {
            console.error(err);
            setStatus('Error al acceder a la cámara. Permisos requeridos.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    // --- Memory Logic ---
    const checkStoredCampaign = () => {
        const storedId = localStorage.getItem('dicilo_client_id');
        const storedName = localStorage.getItem('dicilo_client_name');
        if (storedId && storedName) {
            setCampaignClient({ id: storedId, name: storedName });
            setFormData((prev: any) => ({
                ...prev,
                leadDestination: 'AMBOS',
                clientCompanyId: storedId,
                clientCompanyName: storedName
            }));
        }
    };

    const clearCampaign = () => {
        localStorage.removeItem('dicilo_client_id');
        localStorage.removeItem('dicilo_client_name');
        setCampaignClient(null);
        setFormData((prev: any) => ({
            ...prev,
            leadDestination: 'DICILO',
            clientCompanyId: '',
            clientCompanyName: ''
        }));
    };

    const selectCompany = (company: any) => {
        setFormData((prev: any) => ({
            ...prev,
            clientCompanyId: company.id,
            clientCompanyName: company.name
        }));
        setSearchTerm(company.name);
        setSearchResults([]);

        if (rememberClient) {
            localStorage.setItem('dicilo_client_id', company.id);
            localStorage.setItem('dicilo_client_name', company.name);
            setTimeout(checkStoredCampaign, 500);
        }
    };

    // --- Server-Side AI OCR Logic ---
    const scanCard = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsProcessing(true);
        setStatus(t('scanner.pro.status.capturing', 'Capturando y analizando con AI...'));

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // 1. Capture Original Frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);

        // 2. Convert to Blob
        canvas.toBlob(async (blob: Blob | null) => {
            if (!blob) {
                setStatus('Error al capturar imagen.');
                setIsProcessing(false);
                return;
            }

            try {
                // 3. Send to Server (Upload + AI)
                const formData = new FormData();
                formData.append('image', blob, 'scan.webp');
                formData.append('recruiterId', recruiterId);

                const result = await processBusinessCard(formData);

                if (result.success && result.data) {
                    const data = result.data;

                    setFormData((prev: any) => ({
                        ...prev,
                        businessName: data.businessName || prev.businessName,
                        email: data.email || prev.email,
                        phone: data.phone || prev.phone,
                        website: data.website || prev.website,
                        address: data.address || prev.address,
                        description: `SCANNED VIA GEMINI AI`
                    }));

                    if (data.interest && ['Basic', 'Starter', 'Minorista', 'Premium'].includes(data.interest)) {
                        setInterest(data.interest);
                    }

                    if (result.photoUrl) {
                        setScannedPhotoUrl(result.photoUrl);
                    }

                    setStatus(t('scanner.pro.status.success', '✅ Análisis AI Completado'));
                } else {
                    console.error("AI Error:", result.error);
                    setStatus(t('scanner.pro.status.error', '❌ Error en análisis AI'));
                }

            } catch (error) {
                console.error(error);
                setStatus('Error de conexión.');
            } finally {
                setIsProcessing(false);
            }

        }, 'image/webp', 0.85);
    };

    // --- Search Logic (Mock for now) ---
    const handleSearch = async (val: string) => {
        setSearchTerm(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        // In Prod: await searchBusiness(val)
        const mockResults = [
            { id: '1', name: 'Travelposting S.L.' },
            { id: '2', name: 'Club Inviajes' },
            { id: '3', name: 'Latinoamericana Tours' }
        ].filter(c => c.name.toLowerCase().includes(val.toLowerCase()));

        setSearchResults(mockResults);
    };

    // --- Submit with Data Completeness ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setLastResult(null);

        // Explicitly type the payload to match what createProspect expects
        // 1. Destructure to remove fields that are not unique or mapped differently
        const { description, ...restFormData } = formData;

        const payload: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'reportGeneratedAt'> = {
            ...restFormData, // Contains: businessName, phone, email, website, address, leadDestination, clientCompanyId, clientCompanyName, eventName

            // Data Completeness Defaults
            category: 'Prospecto Pendiente',
            subcategory: 'General',

            // Cast leadDestination to the specific string literal union type
            leadDestination: formData.leadDestination as 'DICILO' | 'CLIENTE' | 'AMBOS',
            recruiterId,
            ocrRawData: description, // Mapped from description

            // Initialize optional fields
            photoUrl: undefined,
            interest: undefined,
            // isActive is omitted from type, defaulting in backend
            // isActive: false,

            // Coordinates are optional in Prospect, so we can omit them or set undefined
            coordinates: undefined
        };

        // 1. Associate Image (Already uploaded by scanCard action)
        if (scannedPhotoUrl) {
            payload.photoUrl = scannedPhotoUrl;
        }

        // 2. Add Interest
        if (interest) {
            payload.interest = interest as 'Basic' | 'Starter' | 'Minorista' | 'Premium';
        }

        const res = await createProspect(payload);

        if (res.success) {
            // Success UX
            setLastResult({
                status: res.status as 'success' | 'duplicate',
                message: res.message || 'Operación completada.',
                companyName: res.companyName || formData.businessName,
                clientName: formData.clientCompanyName || 'Dicilo'
            });

            // Clear sensitive fields only
            setFormData((prev: any) => ({
                ...prev,
                businessName: '',
                phone: '',
                email: '',
                address: '',
                website: '',
                description: ''
            }));
            setScannedPhotoUrl(null);
            setInterest('');

            setStatus(t('scanner.pro.status.ready', 'Listo para el siguiente'));
        } else {
            toast({ title: 'Error', description: 'Error al conectar con el servidor.', variant: 'destructive' });
        }
        setIsProcessing(false);
    };

    // --- UI/UX RENDER ---
    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('scanner.title', 'Dicilo Scanner & Reports')}</h1>
                <p className="text-muted-foreground">
                    {t('scanner.subtitle', 'Herramienta unificada para capturar prospectos y generar reportes B2B.')}
                </p>
            </div>

            {/* Instructions Accordion */}
            <Accordion type="single" collapsible className="w-full bg-white rounded-lg px-4 border">
                <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="hover:no-underline hover:text-primary">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            <span>{t('scanner.howItWorks.title', '¿Cómo funciona?')}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="grid gap-4 md:grid-cols-3 pt-2">
                            <div className="space-y-1">
                                <h4 className="font-semibold">{t('scanner.howItWorks.step1.title', '1. Captura')}</h4>
                                <p className="text-sm text-muted-foreground">{t('scanner.howItWorks.step1.desc')}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-semibold">{t('scanner.howItWorks.step2.title', '2. Fusión')}</h4>
                                <p className="text-sm text-muted-foreground">{t('scanner.howItWorks.step2.desc')}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-semibold">{t('scanner.howItWorks.step3.title', '3. Reportes')}</h4>
                                <p className="text-sm text-muted-foreground">{t('scanner.howItWorks.step3.desc')}</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Campaign Banner - Updated Visuals */}
            {campaignClient && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-xs text-blue-500 font-bold uppercase">CLIENTE ACTIVO (MODO RÁFAGA)</p>
                        <p className="text-blue-900 font-bold text-lg">{campaignClient.name}</p>
                    </div>
                    <Button onClick={clearCampaign} variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700">
                        Cambiar Cliente
                    </Button>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* Left Column: Camera / Scanner */}
                <div className="space-y-6">
                    <Card className="overflow-hidden border-2 border-emerald-500/10">
                        <CardHeader className="bg-emerald-50/50 pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                                <Camera className="h-5 w-5" />
                                {t('scanner.cardTitle', 'Scanner Pro')}
                            </CardTitle>
                            <CardDescription>{t('scanner.cardDesc', 'Encuadra la tarjeta de visita')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative aspect-video bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />

                                {/* Visual Guide Overlay */}
                                <div className="absolute inset-[15%] border-2 border-dashed border-emerald-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none opacity-80" />
                                <div className="absolute bottom-4 left-0 right-0 text-center text-white/90 text-sm font-medium drop-shadow-md">
                                    {t('scanner.pro.overlay', 'ENCUADRAR TARJETA (HORIZONTAL)')}
                                </div>

                                {/* Debug Canvas */}
                                <canvas
                                    ref={canvasRef}
                                    className={`absolute bottom-2 right-2 w-24 h-16 border-2 border-red-500 bg-white ${showDebug ? 'block' : 'hidden'}`}
                                />
                            </div>

                            <div className="p-4 space-y-4">
                                <Button
                                    onClick={scanCard}
                                    disabled={isProcessing}
                                    size="lg"
                                    className="w-full text-lg font-bold uppercase tracking-wide bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md transition-all active:scale-[0.98]"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            {t('scanner.pro.btn.processing', 'Procesando...')}
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="mr-2 h-5 w-5" />
                                            {t('scanner.pro.btn.capture', 'Capturar Datos')}
                                        </>
                                    )}
                                </Button>

                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                    <p className="font-medium">{status}</p>
                                    <button
                                        onClick={() => setShowDebug(!showDebug)}
                                        className="underline hover:text-emerald-600"
                                    >
                                        {showDebug ? t('scanner.pro.debug.hide') : t('scanner.pro.debug.show')}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Result Feedback Card (Success/Duplicate) */}
                    {lastResult && (
                        <Card className={`border-l-4 ${lastResult.status === 'success' ? 'bg-green-50/50 border-l-green-500' : 'bg-amber-50/50 border-l-amber-500'}`}>
                            <CardContent className="p-4 flex items-start gap-3">
                                {lastResult.status === 'success' ? <CheckCircle className="text-green-600 w-6 h-6 shrink-0 mt-0.5" /> : <AlertTriangle className="text-amber-600 w-6 h-6 shrink-0 mt-0.5" />}
                                <div>
                                    <h3 className={`font-bold ${lastResult.status === 'success' ? 'text-green-800' : 'text-amber-800'}`}>
                                        {lastResult.status === 'success' ? t('scanner.pro.result.success', 'Registro Exitoso') : t('scanner.pro.result.duplicate', 'Empresa Existente')}
                                    </h3>
                                    <p className="text-sm text-foreground/80 mt-1">{lastResult.message}</p>
                                    <div className="mt-2 text-xs font-mono bg-white/50 p-2 rounded">
                                        <p>{t('scanner.pro.result.company')}: {lastResult.companyName}</p>
                                        <p>{t('scanner.pro.result.assigned')}: {lastResult.clientName}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('scanner.pro.form.title', 'Datos del Prospecto')}</CardTitle>
                        <CardDescription>{t('scanner.pro.form.desc', 'Revisa y completa la información antes de guardar.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium uppercase text-muted-foreground">{t('scanner.pro.form.name', 'Nombre / Empresa')}</label>
                                <Input
                                    value={formData.businessName}
                                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                    placeholder={t('scanner.pro.form.placeholder.name')}
                                    required
                                    className="font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium uppercase text-muted-foreground">{t('scanner.pro.form.phone')}</label>
                                    <Input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder={t('scanner.pro.form.placeholder.phone')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium uppercase text-muted-foreground">{t('scanner.pro.form.email')}</label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder={t('scanner.pro.form.placeholder.email')}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium uppercase text-muted-foreground">{t('scanner.pro.form.web', 'Web')}</label>
                                    <Input
                                        value={formData.website}
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        placeholder={t('scanner.pro.form.placeholder.web')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium uppercase text-muted-foreground">{t('scanner.pro.form.address', 'Dirección')}</label>
                                    <Input
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder={t('scanner.pro.form.placeholder.address')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium uppercase text-muted-foreground">{t('scanner.pro.form.notes')}</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="min-h-[80px] text-xs font-mono"
                                    placeholder={t('scanner.pro.form.placeholder.notes')}
                                />
                            </div>

                            {/* Meta Data & Event */}
                            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">{t('scanner.pro.form.sender')}:</label>
                                    <div className="font-mono text-xs font-medium">{recruiterId}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">{t('scanner.pro.form.event')}:</label>
                                    <Select
                                        value={formData.eventName}
                                        onValueChange={(val) => setFormData({ ...formData, eventName: val })}
                                    >
                                        <SelectTrigger className="h-8 text-xs bg-white">
                                            <SelectValue placeholder="Seleccionar Evento" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            <SelectItem value="Online (Directo)">🌍 Online / Directo / Otro</SelectItem>
                                            {Object.entries(FAIRS_DATA).map(([category, events]) => (
                                                <SelectGroup key={category}>
                                                    <SelectLabel className="bg-muted text-[10px] font-bold uppercase px-2 py-1 sticky top-0">
                                                        {category}
                                                    </SelectLabel>
                                                    {events.map(event => (
                                                        <SelectItem key={event} value={event} className="text-xs pl-4">
                                                            {event}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Interest Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium uppercase text-muted-foreground">{t('scanner.pro.form.interest')}:</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['Basic', 'Starter', 'Minorista', 'Premium'].map((item) => (
                                        <div
                                            key={item}
                                            onClick={() => setInterest(item)}
                                            className={`text-center py-2 rounded-md text-xs font-bold cursor-pointer transition-all border ${interest === item
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                : 'bg-background hover:bg-muted border-input'
                                                }`}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Assignment Selector (Only if No Campaign Set) */}
                            {!campaignClient && (
                                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                                    <label className="text-sm font-medium uppercase text-emerald-600">{t('scanner.pro.assign.label', 'Asignar Lead A')}:</label>

                                    <div className="flex gap-2">
                                        {['DICILO', 'CLIENTE', 'AMBOS'].map((opt) => (
                                            <div
                                                key={opt}
                                                onClick={() => setFormData({ ...formData, leadDestination: opt })}
                                                className={`flex-1 text-center py-2 rounded-md text-xs font-bold cursor-pointer transition-all border ${formData.leadDestination === opt
                                                    ? 'bg-white shadow-sm text-foreground ring-1 ring-emerald-500 border-emerald-500'
                                                    : 'text-muted-foreground border-transparent hover:bg-white/50'
                                                    }`}
                                            >
                                                {opt === 'DICILO' ? 'DICILO' : opt === 'CLIENTE' ? 'CLIENTE' : 'AMBOS'}
                                            </div>
                                        ))}
                                    </div>

                                    {(formData.leadDestination === 'CLIENTE' || formData.leadDestination === 'AMBOS') && (
                                        <div className="space-y-2 animate-in fade-in">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Buscar Cliente..."
                                                    value={searchTerm}
                                                    onChange={e => handleSearch(e.target.value)}
                                                    className="pl-9 bg-white"
                                                />
                                                {searchResults.length > 0 && (
                                                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                                        {searchResults.map(res => (
                                                            <div
                                                                key={res.id}
                                                                className="p-2 hover:bg-muted cursor-pointer text-sm border-b last:border-0"
                                                                onClick={() => selectCompany(res)}
                                                            >
                                                                {res.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div
                                                className="flex items-center gap-2 cursor-pointer"
                                                onClick={() => setRememberClient(!rememberClient)}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberClient ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-input'}`}>
                                                    {rememberClient && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className="text-xs text-muted-foreground select-none">{t('scanner.pro.assign.remember_client')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isProcessing}
                                size="lg"
                                className="w-full text-lg font-bold uppercase tracking-widest mt-4"
                            >
                                {isProcessing ? t('scanner.pro.btn.saving', 'Guardando...') : t('scanner.pro.btn.save', 'Guardar Prospecto')}
                            </Button>

                        </form>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
