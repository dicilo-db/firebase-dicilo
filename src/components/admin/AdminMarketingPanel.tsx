'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
    Search, 
    DownloadCloud, 
    Mail, 
    Calendar, 
    User, 
    ChevronDown, 
    ArrowLeft,
    Filter,
    Users
} from 'lucide-react';
import { getAllMarketingSends, AdminMarketingSend } from '@/app/actions/admin-marketing';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function AdminMarketingPanel({ onBack }: { onBack?: () => void }) {
    const { t } = useTranslation('admin');
    const { toast } = useToast();
    const [sends, setSends] = useState<AdminMarketingSend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBy, setFilterBy] = useState<'all' | 'freelancer' | 'recipient'>('all');

    useEffect(() => {
        async function load() {
            setIsLoading(true);
            const res = await getAllMarketingSends();
            if (res.success && res.sends) {
                setSends(res.sends);
            } else {
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los reportes de marketing.",
                    variant: "destructive"
                });
            }
            setIsLoading(false);
        }
        load();
    }, [toast]);

    const filteredSends = sends.filter(send => {
        const query = searchQuery.toLowerCase();
        if (filterBy === 'freelancer') {
            return send.referrerName.toLowerCase().includes(query) || send.referrerId.toLowerCase().includes(query);
        }
        if (filterBy === 'recipient') {
            return send.friendName.toLowerCase().includes(query) || send.friendEmail.toLowerCase().includes(query);
        }
        return (
            send.friendName.toLowerCase().includes(query) ||
            send.friendEmail.toLowerCase().includes(query) ||
            send.referrerName.toLowerCase().includes(query) ||
            send.template.toLowerCase().includes(query)
        );
    });

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.text("Reporte de Envíos E-Mail Marketing", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Total registros: ${filteredSends.length}`, 14, 34);

        // Table
        autoTable(doc, {
            startY: 40,
            head: [['Fecha', 'Freelancer', 'Destinatario', 'Email', 'Recompensa']],
            body: filteredSends.map(send => [
                new Date(send.createdAt).toLocaleDateString(),
                send.referrerName,
                send.friendName,
                send.friendEmail,
                `${send.rewardAmount} DP`
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] } // Indigo-600 appearance
        });

        doc.save(`reporte-marketing-${new Date().getTime()}.pdf`);
        toast({ title: "PDF Generado", description: "El reporte se ha descargado correctamente." });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/4" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                           <Mail className="h-6 w-6 text-indigo-500" /> Reporting E-Mail Marketing
                        </h2>
                        <p className="text-muted-foreground text-sm">Monitorea todos los envíos realizados por los freelancers.</p>
                    </div>
                </div>
                <Button onClick={exportToPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                    <DownloadCloud className="mr-2 h-4 w-4" /> Exportar PDF
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Envíos" value={sends.length} icon={Mail} color="text-blue-600" />
                <StatCard label="Freelancers Activos" value={new Set(sends.map(s => s.referrerId)).size} icon={Users} color="text-purple-600" />
                <StatCard label="Total Recompensas" value={sends.reduce((acc, s) => acc + s.rewardAmount, 0) + " DP"} icon={Calendar} color="text-emerald-600" />
                <StatCard label="Envíos Últ. 24h" value={sends.filter(s => new Date(s.createdAt) > new Date(Date.now() - 86400000)).length} icon={User} color="text-amber-600" />
            </div>

            {/* Filters & Table */}
            <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar por nombre, email o ID..." 
                                    className="pl-9 h-10 rounded-xl bg-white border-slate-200" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select 
                                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                value={filterBy}
                                onChange={(e: any) => setFilterBy(e.target.value)}
                            >
                                <option value="all">Todo</option>
                                <option value="freelancer">Freelancer</option>
                                <option value="recipient">Destinatario</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                           <Filter className="h-3.5 w-3.5" /> Mostrando {filteredSends.length} resultados
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left">Fecha / Hora</th>
                                    <th className="px-6 py-4 text-left">Freelancer</th>
                                    <th className="px-6 py-4 text-left">Destinatario</th>
                                    <th className="px-6 py-4 text-left">Recompensa</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSends.map((send) => {
                                    const dateObj = new Date(send.createdAt);
                                    return (
                                        <tr key={send.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">{dateObj.toLocaleDateString()}</div>
                                                <div className="text-[11px] text-muted-foreground">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-indigo-700">{send.referrerName}</div>
                                                <div className="text-[11px] text-muted-foreground font-mono">ID: {send.referrerId.slice(0, 8)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">{send.friendName}</div>
                                                <div className="text-[11px] text-muted-foreground">{send.friendEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-emerald-600">
                                                +{send.rewardAmount} DP
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 px-3 py-1 text-[10px] rounded-full uppercase font-black">
                                                    Enviado
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) {
    return (
        <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 shadow-inner`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                    <div className="text-2xl font-black tracking-tight">{value}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
                </div>
            </CardContent>
        </Card>
    );
}
