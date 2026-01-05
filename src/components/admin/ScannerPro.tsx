'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Search, Check, AlertTriangle, CheckCircle } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { createProspect } from '@/app/actions/prospects';

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

// --- STYLES & ASSETS ---
const STYLE = {
    green: '#8cc63f',
    dark: '#1a1a1a',
    gray: '#f4f4f4',
    text: '#333'
};

export default function ScannerPro({ recruiterId = 'DIC-001' }: { recruiterId?: string }) {
    const { t } = useTranslation('admin');
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<string>(t('scanner.pro.status.ready', 'Listo para escanear'));
    const [isProcessing, setIsProcessing] = useState(false);
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
            setFormData(prev => ({
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
        setFormData(prev => ({
            ...prev,
            leadDestination: 'DICILO',
            clientCompanyId: '',
            clientCompanyName: ''
        }));
    };

    const selectCompany = (company: any) => {
        setFormData(prev => ({
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

    // --- Image Pre-processing Logic (Contrast Boost) ---
    const preprocessImage = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
        const ctx = sourceCanvas.getContext('2d');
        if (!ctx) return sourceCanvas;

        const image = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const data = image.data;
        const contrast = 1.2; // Increase contrast by 20%
        const intercept = 128 * (1 - contrast);

        for (let i = 0; i < data.length; i += 4) {
            // 1. Grayscale
            let gray = (data[i] + data[i + 1] + data[i + 2]) / 3;

            // 2. Contrast Strecth
            gray = gray * contrast + intercept;

            // Clamp values
            gray = Math.min(255, Math.max(0, gray));

            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
            // Alpha (data[i+3]) remains unchanged
        }

        ctx.putImageData(image, 0, 0);
        return sourceCanvas;
    };

    // --- Advanced Parsing Logic ---
    const parseOCRText = (text: string) => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);

        // 1. Website Strategy
        const webRegex = /\b(?:www\.|https?:\/\/)[a-z0-9.-]+\.[a-z]{2,}\b/i;
        const bestWeb = text.match(webRegex)?.[0] || '';

        let domain = '';
        if (bestWeb) {
            domain = bestWeb.replace(/^(?:https?:\/\/)?(?:www\.)?/, '').split('/')[0];
        }

        // 2. Email Strategy (Multi-layer)
        let bestEmail = '';
        const strictEmailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        bestEmail = text.match(strictEmailRegex)?.[0] || '';

        if (!bestEmail && domain.length > 4) {
            const safeDomain = domain.replace('.', '\\.');
            const domainRegex = new RegExp(`\\b([a-zA-Z0-9._%+-]+)[\\s\\W]{1,4}${safeDomain}`, 'i');
            const match = text.match(domainRegex);
            if (match) bestEmail = `${match[1]}@${domain}`;
        }

        if (!bestEmail) {
            const looseEmailRegex = /[A-Za-z0-9._%+-]+\s?@\s?[A-Za-z0-9.-]+\s?\.\s?[A-Za-z]{2,}/;
            const looseMatch = text.match(looseEmailRegex);
            if (looseMatch) bestEmail = looseMatch[0].replace(/\s/g, '');
        }

        // 3. Phone Strategy
        const phoneRegex = /(?:(?:\+|00)\d{1,3}[\s.-]{0,3}(?:\(\d{1,5}\)[\s.-]{0,3})?|\b0\d{1,5}[\s.-]{0,3})[\d\s.-]{5,}/g;
        const potentialPhones = text.match(phoneRegex) || [];
        const bestPhone = potentialPhones.find(p => p.replace(/\D/g, '').length > 7) || '';

        // 4. Address Strategy
        const zipCityRegex = /\b\d{4,5}\s+[A-Za-zäöüÄÖÜß]+/g;
        const zipCityLineIndex = lines.findIndex(l => zipCityRegex.test(l));
        let bestAddress = '';

        if (zipCityLineIndex !== -1) {
            const zipLine = lines[zipCityLineIndex];
            const prevLine = zipCityLineIndex > 0 ? lines[zipCityLineIndex - 1] : '';
            if (prevLine && !prevLine.includes('@') && prevLine.length > 5) {
                bestAddress = `${prevLine}, ${zipLine}`;
            } else {
                bestAddress = zipLine;
            }
        }

        // 5. Company Name Strategy
        const legalSuffixes = ['GmbH', 'AG', 'S.L.', 'S.L.U.', 'S.A.', 'Inc', 'Ltd', 'LLC', 'e.V.', 'KG'];
        let companyName = '';
        const companyLine = lines.find(l => legalSuffixes.some(s => l.includes(s)));

        if (companyLine) {
            companyName = companyLine;
        } else {
            for (const line of lines) {
                if (line.includes('@') || line.match(phoneRegex) || line.match(webRegex)) continue;
                const cleanLine = line.replace(/^[^a-zA-Z0-9]+/, '').trim();
                if (cleanLine.length > 3 && !cleanLine.toLowerCase().startsWith('tel') && !cleanLine.toLowerCase().startsWith('fax')) {
                    companyName = cleanLine;
                    break;
                }
            }
        }

        return {
            businessName: companyName.replace(/^[^a-zA-Z0-9]+/, '').trim(),
            phone: bestPhone.trim(),
            email: bestEmail,
            website: bestWeb,
            address: bestAddress
        };
    };

    // --- OCR Logic ---
    const scanCard = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsProcessing(true);
        setStatus(t('scanner.pro.status.optimizing', 'Optimizando Imagen...'));

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // 1. Capture Original Frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);

        // 2. Apply Pre-processing Filter (Grayscale + Contrast)
        preprocessImage(canvas);

        setStatus(t('scanner.pro.status.reading', 'Leyendo Textos...'));

        try {
            const worker = await createWorker('spa');

            // PSM 6: Assume a single uniform block of text (Good for business cards)
            await worker.setParameters({
                tessedit_pageseg_mode: '6' as any,
            });

            const { data: { text } } = await worker.recognize(canvas.toDataURL());
            await worker.terminate();

            // Intelligent Parsing
            if (text.trim().length < 5) {
                setStatus(t('scanner.pro.status.shortText', '⚠️ Texto no claro. Mejora luz/enfoque.'));
                setIsProcessing(false);
                return;
            }

            // 3. Smart Parsing
            const parsed = parseOCRText(text);

            setFormData(prev => ({
                ...prev,
                businessName: parsed.businessName,
                email: parsed.email || prev.email,
                phone: parsed.phone || prev.phone,
                website: parsed.website || prev.website,
                address: parsed.address || prev.address,
                description: text
            }));

            setStatus(t('scanner.pro.status.success', '✅ Lectura Completada'));
        } catch (error) {
            console.error(error);
            setStatus(t('scanner.pro.status.error', '❌ Error en lectura'));
        } finally {
            setIsProcessing(false);
        }
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

        const payload = {
            ...formData,
            // Data Completeness Defaults
            category: 'Prospecto Pendiente',
            subcategory: 'General', // Placeholder to be filled by human
            location: '', // Human fill
            offerUrl: '',
            logoUrl: 'default_logo.png', // Placeholder
            isActive: false,
            recruiterId,
            ocrRawData: formData.description
        };

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
            setFormData(prev => ({
                ...prev,
                businessName: '',
                phone: '',
                email: '',
                address: '',
                website: '',
                description: ''
            }));

            setStatus(t('scanner.pro.status.ready', 'Listo para el siguiente'));
        } else {
            toast({ title: 'Error', description: 'Error al conectar con el servidor.', variant: 'destructive' });
        }
        setIsProcessing(false);
    };

    // --- UI/UX RENDER ---
    return (
        <div id="dicilo-scan-app" className="bg-white min-h-screen pb-20 font-sans">

            {/* Header App Style */}
            <div className="bg-[#1a1a1a] text-white p-4 text-center border-b-4 border-[#8cc63f] mb-6 shadow-md sticky top-0 z-50">
                <h1 className="text-xl font-bold tracking-wider">{t('scanner.pro.header', 'DICILOSCAN PRO').replace('PRO', '')}<span className="text-[#8cc63f]">PRO</span></h1>
            </div>

            {/* Campaign Banner */}
            {campaignClient && (
                <div className="w-[90%] mx-auto mb-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-xs text-blue-500 font-bold uppercase">CLIENTE ACTIVO</p>
                        <p className="text-blue-900 font-bold">{campaignClient.name}</p>
                    </div>
                    <Button onClick={clearCampaign} variant="ghost" size="sm" className="text-red-500 hover:text-red-700 h-8 text-xs">
                        Cambiar
                    </Button>
                </div>
            )}

            {/* Camera Container - WIDER Landscape Mode for Business Cards */}
            <div className="relative w-full mx-auto mb-6 rounded-2xl overflow-hidden shadow-xl bg-black aspect-[4/3]">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Debug Canvas (Visible if toggled) */}
                <canvas
                    ref={canvasRef}
                    className={`absolute bottom-2 right-2 w-24 h-16 border-2 border-red-500 bg-white ${showDebug ? 'block' : 'hidden'}`}
                />

                {/* Visual Guide Overlay - Horizontal Card Shape */}
                <div className="absolute top-[15%] left-[5%] right-[5%] bottom-[15%] border-2 border-dashed border-[#8cc63f] rounded-lg shadow-[0_0_0_100vmax_rgba(0,0,0,0.6)] pointer-events-none">
                    <div className="absolute -top-8 left-0 w-full text-center text-white font-bold text-sm tracking-widest drop-shadow-md bg-black/50 py-1 rounded">
                        {t('scanner.pro.overlay', 'ENCUADRAR TARJETA (HORIZONTAL)')}
                    </div>
                </div>
            </div>

            {/* Debug Toggle */}
            <div className="flex justify-center mb-2">
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-[10px] text-gray-500 underline"
                >
                    {showDebug ? t('scanner.pro.debug.hide', 'Ocultar visión del robot') : t('scanner.pro.debug.show', 'Ver qué ve el robot (Debug)')}
                </button>
            </div>

            {/* Action Buttons */}
            <button
                onClick={scanCard}
                disabled={isProcessing}
                className="w-full block py-4 bg-[#8cc63f] text-white border-none rounded-full text-lg font-bold uppercase tracking-wide cursor-pointer shadow-lg active:scale-95 transition-transform"
            >
                {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" /> {t('scanner.pro.btn.processing', 'Procesando...')}
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <Camera /> {t('scanner.pro.btn.capture', 'Capturar Datos')}
                    </span>
                )}
            </button>

            <p className="text-center text-gray-500 text-sm mt-2 font-medium h-5">{status}</p>

            {/* Result Feedback Card (Success/Duplicate) */}
            {lastResult && (
                <div className={`w-full mt-6 p-4 rounded-xl border-l-4 shadow-md animate-in slide-in-from-bottom-5 ${lastResult.status === 'success' ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'}`}>
                    <div className="flex items-start gap-3">
                        {lastResult.status === 'success' ? <CheckCircle className="text-green-600 w-6 h-6 shrink-0" /> : <AlertTriangle className="text-amber-600 w-6 h-6 shrink-0" />}
                        <div>
                            <h3 className={`font-bold ${lastResult.status === 'success' ? 'text-green-800' : 'text-amber-800'}`}>
                                {lastResult.status === 'success' ? t('scanner.pro.result.success', 'Registro Exitoso') : t('scanner.pro.result.duplicate', 'Empresa Existente')}
                            </h3>
                            <p className="text-sm text-gray-700 mt-1">{lastResult.message}</p>

                            <div className="mt-3 bg-white/60 p-2 rounded text-sm">
                                <p><strong>{t('scanner.pro.result.company', 'Empresa')}:</strong> {lastResult.companyName}</p>
                                <p><strong>{t('scanner.pro.result.assigned', 'Asignado a')}:</strong> {lastResult.clientName}</p>
                                <p><strong>{t('scanner.pro.result.status', 'Estado')}:</strong> <span className="bg-gray-200 px-1 rounded text-xs">{t('scanner.pro.result.pending', 'Pendiente Revisión')}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Section */}
            <div className="w-full mt-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('scanner.pro.form.name', 'Nombre / Empresa')}</label>
                        <input
                            value={formData.businessName}
                            onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8cc63f] focus:bg-white transition-colors"
                            placeholder={t('scanner.pro.form.placeholder.name', 'Ej. Restaurante Pepe')}
                            required
                        />
                    </div>

                    <div className="flex gap-3 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('scanner.pro.form.phone', 'Teléfono')}</label>
                            <input
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8cc63f] focus:bg-white transition-colors"
                                placeholder={t('scanner.pro.form.placeholder.phone', '+34 600...')}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('scanner.pro.form.email', 'Email')}</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8cc63f] focus:bg-white transition-colors"
                                placeholder={t('scanner.pro.form.placeholder.email', 'info@...')}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('scanner.pro.form.web', 'Web / Dirección')}</label>
                        <input
                            value={formData.website}
                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8cc63f] focus:bg-white transition-colors mb-2"
                            placeholder={t('scanner.pro.form.placeholder.web', 'www.ejemplo.com')}
                        />
                        <input
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8cc63f] focus:bg-white transition-colors"
                            placeholder={t('scanner.pro.form.placeholder.address', 'Calle Principal 1, Madrid')}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('scanner.pro.form.notes', 'Notas (OCR Raw)')}</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8cc63f] focus:bg-white transition-colors min-h-[80px] text-xs font-mono"
                            placeholder={t('scanner.pro.form.placeholder.notes', 'Texto extraído...')}
                        />
                    </div>

                    {/* Meta Data: Recruiter & Event (NEW) */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('scanner.pro.form.sender', 'Datos enviados por')}:</label>
                            <div className="font-mono text-sm font-bold text-gray-800 bg-white p-2 border rounded">
                                {recruiterId}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('scanner.pro.form.event', 'Evento / Feria')}:</label>
                            <Select
                                value={formData.eventName}
                                onValueChange={(val) => setFormData({ ...formData, eventName: val })}
                            >
                                <SelectTrigger className="w-full bg-white border-gray-200">
                                    <SelectValue placeholder="Seleccionar Evento" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="Online (Directo)">🌍 Online / Directo / Otro</SelectItem>
                                    {Object.entries(FAIRS_DATA).map(([category, events]) => (
                                        <SelectGroup key={category}>
                                            <SelectLabel className="bg-gray-100 text-xs font-extrabold uppercase tracking-wide text-gray-600 px-2 py-1 sticky top-0">
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
                            <p className="text-[10px] text-gray-400 mt-1">{t('scanner.pro.form.event_notes', 'Selecciona Online si no aplica.')}</p>
                        </div>
                    </div>

                    {/* Assignment Selector (Only if No Campaign Set) */}
                    {!campaignClient && (
                        <div className="mb-6 bg-gray-50 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-[#8cc63f] uppercase mb-2">{t('scanner.pro.assign.label', 'Asignar Lead A')}:</label>

                            <div className="flex gap-2 mb-4">
                                {['DICILO', 'CLIENTE', 'AMBOS'].map((opt) => (
                                    <div
                                        key={opt}
                                        onClick={() => setFormData({ ...formData, leadDestination: opt })}
                                        className={`flex-1 text-center py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${formData.leadDestination === opt
                                            ? 'bg-white shadow-sm text-[#1a1a1a] ring-1 ring-[#8cc63f]'
                                            : 'text-gray-400 hover:bg-gray-100'
                                            }`}
                                    >
                                        {opt === 'DICILO' ? t('scanner.pro.assign.dicilo', 'DICILO') : opt === 'CLIENTE' ? t('scanner.pro.assign.client', 'CLIENTE') : t('scanner.pro.assign.both', 'AMBOS')}
                                    </div>
                                ))}
                            </div>

                            {(formData.leadDestination === 'CLIENTE' || formData.leadDestination === 'AMBOS') && (
                                <div className="space-y-3 animate-in fade-in">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                        <input
                                            placeholder="Buscar Cliente..."
                                            value={searchTerm}
                                            onChange={e => handleSearch(e.target.value)}
                                            className="w-full pl-10 p-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {searchResults.length > 0 && (
                                            <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
                                                {searchResults.map(res => (
                                                    <div
                                                        key={res.id}
                                                        className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0"
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
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${rememberClient ? 'bg-[#8cc63f] border-[#8cc63f]' : 'bg-white border-gray-300'}`}>
                                            {rememberClient && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="text-xs text-gray-600 font-medium select-none">{t('scanner.pro.assign.remember_client', 'Recordar para escaneo continuo')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-4 bg-[#1a1a1a] text-white rounded-xl font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                    >
                        {isProcessing ? t('scanner.pro.btn.saving', 'Guardando...') : t('scanner.pro.btn.save', 'Guardar Prospecto')}
                    </button>

                </form>
            </div>

        </div>
    );
}
