'use client';

import React, { useEffect, useState } from 'react';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { Megaphone, Mail, Rocket, Filter, Loader2, PlusCircle, PieChart, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CampaignData {
    id: string;
    title: string;
    description: string;
    status: string;
    budget_total: number;
    budget_remaining: number;
    reward_per_action: number;
    start_date: string;
    end_date: string;
}

export default function CampaignsPage() {
    const { t } = useTranslation('common');
    const { businessId, clientId, plan, name, isLoading } = useBusinessAccess();
    const activeId = businessId || clientId;
    const { toast } = useToast();
    
    const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [requestData, setRequestData] = useState({ goal: '', budget: '', audience: '' });
    const [sendingRequest, setSendingRequest] = useState(false);

    useEffect(() => {
        async function fetchCampaigns() {
            if (!activeId) return;
            setLoadingData(true);
            try {
                const q = query(
                    collection(db, 'campaigns'), 
                    where('clientId', '==', activeId)
                );
                const snap = await getDocs(q);
                const results: CampaignData[] = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    results.push({
                        id: doc.id,
                        title: data.title || data.companyName,
                        description: data.description || 'Sin descripción',
                        status: data.status || 'inactive',
                        budget_total: data.budget_total || 0,
                        budget_remaining: data.budget_remaining || 0,
                        reward_per_action: data.reward_per_action || 0,
                        start_date: data.start_date || '',
                        end_date: data.end_date || ''
                    });
                });
                setCampaigns(results);
            } catch (error) {
                console.error("Error fetching campaigns:", error);
            } finally {
                setLoadingData(false);
            }
        }
        if (!isLoading && activeId) {
            fetchCampaigns();
        }
    }, [activeId, isLoading]);

    const handleSendRequest = async () => {
        if (!requestData.goal || !requestData.budget) {
            toast({ title: 'Error', description: 'Por favor, llena los campos obligatorios.', variant: 'destructive' });
            return;
        }
        setSendingRequest(true);
        try {
            await addDoc(collection(db, 'campaign_requests'), {
                clientId: activeId,
                clientName: name,
                goal: requestData.goal,
                budget: requestData.budget,
                audience: requestData.audience,
                status: 'pending',
                createdAt: new Date()
            });
            toast({ title: '¡Solicitud enviada!', description: 'Un asesor de DiciloMarketing te contactará pronto.' });
            setIsRequestOpen(false);
            setRequestData({ goal: '', budget: '', audience: '' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'No se pudo enviar la solicitud.', variant: 'destructive' });
        } finally {
            setSendingRequest(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <Skeleton className="w-full h-80 rounded-xl" />
            </div>
        );
    }

    if (plan === 'basic' || !activeId) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-4 text-sm font-medium mt-6">
                    <p>El módulo de Campañas requiere plan Starter o superior.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="pb-4 border-b border-slate-200 text-left mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-900">
                        <Megaphone className="w-8 h-8 text-orange-600" />
                        {t('business.campaigns.title', 'Campañas Personalizadas')}
                    </h1>
                    <p className="mt-2 text-slate-500 text-lg">
                        {t('business.campaigns.desc', 'Mide el rendimiento de tus estrategias de email marketing y captación orgánica administradas en Dicilo.')}
                    </p>
                </div>
                
                <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 font-bold whitespace-nowrap">
                            <PlusCircle className="w-5 h-5"/> {t('business.campaigns.requestNew', 'Solicitar Nueva Campaña')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Solicitar Campaña Publicitaria</DialogTitle>
                            <DialogDescription>
                                Nuestro equipo diseñará la segmentación perfecta y el copy de éxito para ti.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="gap-4 py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="goal" className="text-sm font-medium">Objetivo principal <span className="text-red-500">*</span></Label>
                                <Input id="goal" placeholder="Ej: Vender stock antiguo, más tráfico web..." value={requestData.goal} onChange={e => setRequestData({...requestData, goal: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="budget" className="text-sm font-medium">Presupuesto Sugerido (€) <span className="text-red-500">*</span></Label>
                                <Input id="budget" type="number" placeholder="Ej: 50" value={requestData.budget} onChange={e => setRequestData({...requestData, budget: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="audience" className="text-sm font-medium">Vecindario o Demografía (Opcional)</Label>
                                <Textarea id="audience" placeholder="Ej: Mujeres de 25-45 años cerca de mi local" rows={3} value={requestData.audience} onChange={e => setRequestData({...requestData, audience: e.target.value})} />
                            </div>
                        </div>
                        <Button 
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                            onClick={handleSendRequest}
                            disabled={sendingRequest}
                        >
                            {sendingRequest ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                            Enviar Solicitud al Experto
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            {loadingData ? (
                <div className="space-y-4">
                     <Skeleton className="w-full h-32 rounded-xl" />
                </div>
            ) : campaigns.length === 0 ? (
                <div className="bg-slate-50/80 rounded-2xl p-16 text-center shadow-sm border border-slate-200">
                    <Rocket className="w-16 h-16 mx-auto text-slate-300 mb-6" />
                    <h2 className="text-3xl font-extrabold text-slate-700 mb-2">{t('business.campaigns.emptyTitle', 'Sin Campañas Activas')}</h2>
                    <p className="text-slate-500 max-w-lg mx-auto mb-6">
                        No hemos detectado campañas de publicidad orgánica activas para tu negocio actualmente. Inicia la primera para captar leads mediante la comunidad.
                    </p>
                    <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50" onClick={() => setIsRequestOpen(true)}>
                        Entender el Modelo de Campañas
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {campaigns.map(camp => {
                        const spent = camp.budget_total - camp.budget_remaining;
                        const percent = camp.budget_total > 0 ? (spent / camp.budget_total) * 100 : 0;
                        const completedActions = camp.reward_per_action > 0 ? Math.floor(spent / camp.reward_per_action) : 0;
                        
                        return (
                            <Card key={camp.id} className="border-t-4 border-t-orange-500 shadow-sm relative overflow-hidden group">
                                <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge className={camp.status === 'active' ? "bg-emerald-500" : "bg-slate-400"}>
                                            {camp.status === 'active' ? 'En Circulación' : 'Pausada/Finalizada'}
                                        </Badge>
                                        <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                                            #{camp.id.substring(0,6).toUpperCase()}
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl text-slate-800 line-clamp-1" title={camp.title}>{camp.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">{camp.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4 bg-white">
                                    
                                    <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-slate-500 flex items-center gap-1 mb-1"><PieChart className="w-3.5 h-3.5"/> Presupuesto</p>
                                            <p className="font-bold text-slate-800">{camp.budget_total.toFixed(2)}€</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 flex items-center gap-1 mb-1"><TrendingUp className="w-3.5 h-3.5"/> Restante</p>
                                            <p className="font-bold text-emerald-600">{camp.budget_remaining.toFixed(2)}€</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-500">
                                            <span>Consumo: {percent.toFixed(1)}%</span>
                                            <span>{completedActions} acciones orgánicas generadas</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 text-xs text-slate-500 border-t border-slate-100">
                                        <Calendar className="w-4 h-4"/>
                                        {camp.start_date ? new Date(camp.start_date).toLocaleDateString() : 'N/A'} - {camp.end_date ? new Date(camp.end_date).toLocaleDateString() : 'N/A'}
                                    </div>
                                    
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    );
}


