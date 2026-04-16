'use client';

import React, { useEffect, useState } from 'react';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { Bot, Upload, Loader2, Save, FileText, CheckCircle2, AlertCircle, Trash2, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { processUploadedFile } from '@/app/actions/ai-admin';

interface BotConfig {
    isActive: boolean;
    botName: string;
    greetingMessage: string;
    systemPrompt: string;
    avatarUrl?: string;
}

interface KnowledgeFile {
    id: string;
    fileName: string;
    url: string;
    status: 'pending' | 'processing' | 'processed' | 'error';
    createdAt: any;
    storagePath: string;
}

export default function ChatbotPage() {
    const { t } = useTranslation('common');
    const { businessId, clientId, plan, isLoading } = useBusinessAccess();
    const activeId = businessId || clientId;
    const { toast } = useToast();
    
    const [config, setConfig] = useState<BotConfig>({
        isActive: false,
        botName: 'Asistente Virtual',
        greetingMessage: '¡Hola! ¿En qué puedo ayudarte hoy?',
        systemPrompt: '',
        avatarUrl: ''
    });
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    
    const [files, setFiles] = useState<KnowledgeFile[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!activeId) return;

        const fetchData = async () => {
            setLoadingData(true);
            try {
                // Fetch Config
                const docRef = doc(db, 'clients', activeId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.chatbotConfig) {
                        setConfig(data.chatbotConfig);
                    }
                }

                // Fetch Knowledge Files
                const q = query(
                    collection(db, 'ai_knowledge_files'), 
                    where('clientId', '==', activeId)
                );
                const fileSnap = await getDocs(q);
                const fList: KnowledgeFile[] = [];
                fileSnap.forEach(f => {
                    fList.push({ id: f.id, ...f.data() } as KnowledgeFile);
                });
                setFiles(fList);

            } catch (err) {
                console.error(err);
                toast({ title: 'Error cargando datos', variant: 'destructive' });
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [activeId, toast]);

    const handleSaveConfig = async () => {
        if (!activeId) return;
        setSaving(true);
        try {
            const docRef = doc(db, 'clients', activeId);
            await updateDoc(docRef, { chatbotConfig: config });
            toast({ title: 'Configuración guardada' });
        } catch (e) {
            console.error(e);
            toast({ title: 'Error al guardar', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeId) return;
        
        if (file.type !== 'application/pdf') {
            toast({ title: 'Formato inválido', description: 'Por favor, sube un archivo PDF.', variant: 'destructive' });
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast({ title: 'Archivo muy grande', description: 'El límite es 10MB.', variant: 'destructive' });
            return;
        }

        setUploading(true);
        try {
            const fileId = Date.now().toString();
            const storagePath = `clients/${activeId}/knowledge/${fileId}_${file.name}`;
            const storageRef = ref(storage, storagePath);

            const uploadTask = await uploadBytesResumable(storageRef, file);
            const downloadUrl = await getDownloadURL(uploadTask.ref);

            // Record in firestore
            const fileData = {
                clientId: activeId,
                fileName: file.name,
                url: downloadUrl,
                storagePath: storagePath,
                mimeType: file.type,
                status: 'processing',
                createdAt: new Date()
            };

            await setDoc(doc(db, 'ai_knowledge_files', fileId), fileData);

            // Optimistic update
            setFiles(prev => [...prev, { id: fileId, ...fileData } as KnowledgeFile]);

            // Backend processing Call
            toast({ title: 'Procesando archivo', description: 'El asistente está leyendo el documento...' });
            
            const processRes = await processUploadedFile(fileId, storagePath, file.type);
            
            if (processRes && processRes.success) {
                setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processed' } : f));
                toast({ title: '¡Entrenamiento exitoso!', description: 'Archivo incorporado a la I.A.' });
            } else {
                setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'error' } : f));
                toast({ title: 'Error al leer archivo', variant: 'destructive' });
            }

        } catch (error) {
            console.error(error);
            toast({ title: 'Error de subida', variant: 'destructive' });
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDeleteFile = async (id: string, path: string) => {
        if(!confirm('¿Eliminar este archivo de la base de conocimiento?')) return;
        try {
            const storageRef = ref(storage, path);
            await deleteObject(storageRef).catch(console.error); // Allow to fail if missing
            await deleteDoc(doc(db, 'ai_knowledge_files', id));
            setFiles(prev => prev.filter(f => f.id !== id));
            toast({ title: 'Archivo eliminado' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error devolviendo', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 max-w-5xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <Skeleton className="w-full h-64 rounded-xl" />
            </div>
        );
    }

    if (plan === 'basic' || plan === 'starter' || !activeId) {
        return (
            <div className="p-8 max-w-5xl animate-in fade-in duration-500">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-4 text-sm font-medium mt-6">
                    <p>{t('business.chatbot.planReq', 'El módulo Asistente I.A. requiere plan Premium o un add-on específico.')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl animate-in fade-in zoom-in duration-500 mx-auto">
            <div className="pb-4 border-b border-slate-200 text-left mb-8 flex justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-900">
                        <Bot className="w-8 h-8 text-indigo-600" />
                        {t('business.chatbot.title', 'Asistente I.A.')}
                    </h1>
                    <p className="mt-2 text-slate-500 text-lg">
                        {t('business.chatbot.desc', 'Entrena a tu propio robot de atención al cliente para que responda dudas sobre tu negocio en tu Ficha Dicilo.')}
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 mb-1">
                    <Label htmlFor="active-bot" className="text-sm font-medium text-slate-700">
                        {config.isActive ? t('business.chatbot.iaOn', 'I.A. Activada') : t('business.chatbot.iaOff', 'I.A. Pausada')}
                    </Label>
                    <Switch 
                        id="active-bot"
                        checked={config.isActive}
                        onCheckedChange={(val) => setConfig({...config, isActive: val})}
                        className="data-[state=checked]:bg-indigo-600"
                    />
                </div>
            </div>
            
            {loadingData ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* LEFT COLUMN: Setup */}
                    <div className="space-y-6">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">{t('business.chatbot.baseConfig', 'Configuración Base')}</CardTitle>
                                <CardDescription>{t('business.chatbot.baseConfigDesc', 'Define la personalidad de tu bot.')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('business.chatbot.botName', 'Nombre del Asistente')}</Label>
                                    <Input 
                                        value={config.botName} 
                                        onChange={e => setConfig({...config, botName: e.target.value})}
                                        placeholder={t('business.chatbot.phName', 'Ej. Juan de Pizzería Napoli')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('business.chatbot.greeting', 'Mensaje de Bienvenida')}</Label>
                                    <Input 
                                        value={config.greetingMessage} 
                                        onChange={e => setConfig({...config, greetingMessage: e.target.value})}
                                        placeholder={t('business.chatbot.phGreeting', '¡Hola! Soy Juan, ¿tienes hambre?')}
                                    />
                                    <p className="text-xs text-slate-500">{t('business.chatbot.msgHint', 'Este mensaje aparecerá cuando el cliente abra el chat.')}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('business.chatbot.avatarUrl', 'URL del Avatar (Opcional)')}</Label>
                                    <Input 
                                        value={config.avatarUrl || ''} 
                                        onChange={e => setConfig({...config, avatarUrl: e.target.value})}
                                        placeholder={t('business.chatbot.phUrl', 'https://tulogo.com/robot.png')}
                                    />
                                    <p className="text-xs text-slate-500">{t('business.chatbot.imgHint', 'Puedes colocar una imagen que actuará como rostro de tu I.A.')}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('business.chatbot.prompt', 'Instrucciones Centrales (Prompt)')}</Label>
                                    <Textarea 
                                        value={config.systemPrompt} 
                                        onChange={e => setConfig({...config, systemPrompt: e.target.value})}
                                        placeholder={t('business.chatbot.phPrompt', 'Eres un agente de ventas amable. Tu objetivo es recomendar nuestras pizzas y proporcionar horarios...')}
                                        rows={6}
                                    />
                                    <p className="text-xs text-slate-500">{t('business.chatbot.promptHint', 'Instruye detalladamente a la I.A. sobre qué tono usar y qué información priorizar.')}</p>
                                </div>
                                <Button 
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4" 
                                    onClick={handleSaveConfig}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    {t('business.chatbot.save', 'Guardar Cambios')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Knowledge Base */}
                    <div className="space-y-6">
                        <Card className="border-slate-200 shadow-sm border-t-4 border-t-indigo-600">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-indigo-600" /> {t('business.chatbot.filesBox', 'Archivos de Conocimiento')}
                                </CardTitle>
                                <CardDescription>{t('business.chatbot.alimenta', 'Alimenta a tu I.A. con menús, catálogos o preguntas frecuentes en PDF.')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 relative hover:bg-slate-100 transition-colors cursor-pointer">
                                    <input 
                                        type="file" 
                                        accept="application/pdf" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                                            <p className="font-semibold text-slate-700">Subiendo y analizando...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="w-10 h-10 text-indigo-400 mb-3" />
                                            <p className="font-semibold text-slate-700">{t('business.chatbot.uploadDoc', 'Cargar Archivo PDF')}</p>
                                            <p className="text-sm text-slate-500 mt-1 max-w-xs">{t('business.chatbot.dragDrop', 'Arrastra o haz clic aquí (Máximo 10MB)')}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 space-y-3">
                                    <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-wider mb-3">{t('business.chatbot.trainedDocs', 'Documentos Entrenados')}</h4>
                                    {files.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic">{t('business.chatbot.noDocs', 'No hay documentos subidos todavía.')}</p>
                                    ) : (
                                        files.map(file => (
                                            <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                                                    <span className="text-sm font-medium text-slate-700 truncate" title={file.fileName}>
                                                        {file.fileName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 pl-2">
                                                    {file.status === 'processed' ? (
                                                        <span className="flex items-center text-xs text-emerald-600 font-medium">
                                                            <CheckCircle2 className="w-4 h-4 mr-1" /> Listo
                                                        </span>
                                                    ) : file.status === 'error' ? (
                                                        <span className="flex items-center text-xs text-rose-600 font-medium">
                                                            <AlertCircle className="w-4 h-4 mr-1" /> Falló
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-xs text-amber-600 font-medium">
                                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" /> ...
                                                        </span>
                                                    )}
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500" onClick={() => handleDeleteFile(file.id, file.storagePath)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            )}
        </div>
    );
}


