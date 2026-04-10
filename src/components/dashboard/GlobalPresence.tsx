'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Users, Building2, TrendingUp, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGlobalStats } from '@/app/actions/global-stats';

interface GlobalPresenceProps {
    stats: any | null;
}

export function GlobalPresence({ stats }: GlobalPresenceProps) {
    if (!stats) return null;

    const activeCountriesList = Object.entries(stats.countries)
        .filter(([_, data]: any) => data.agencies > 0 || data.users > 0)
        .sort((a, b: any) => (b[1].agencies + b[1].users) - (a[1].agencies + a[1].users));

    // Heuristic: Countries with 0 but listed in DB as potential (if we had that data)
    // For now, we show active.
    
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-none shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <Building2 className="h-5 w-5 text-purple-400" />
                            </div>
                            <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400 uppercase font-black tracking-tighter">Real-time</Badge>
                        </div>
                        <div className="text-3xl font-black text-white mb-1 tracking-tighter">
                            {stats.agencies}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Agencias Registradas</div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-none shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Globe className="h-5 w-5 text-blue-400" />
                            </div>
                            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 uppercase font-black tracking-tighter">Global</Badge>
                        </div>
                        <div className="text-3xl font-black text-white mb-1 tracking-tighter">
                            {stats.commercialPresence}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Presencia Comercial</div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-none shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-green-500/10 rounded-xl">
                                <Users className="h-5 w-5 text-green-400" />
                            </div>
                            <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400 uppercase font-black tracking-tighter">Verified</Badge>
                        </div>
                        <div className="text-3xl font-black text-white mb-1 tracking-tighter">
                            {stats.privateUsers}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Usuarios Activos</div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-none shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-amber-500/10 rounded-xl">
                                <TrendingUp className="h-5 w-5 text-amber-400" />
                            </div>
                            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 uppercase font-black tracking-tighter">Growth</Badge>
                        </div>
                        <div className="text-3xl font-black text-white mb-1 tracking-tighter">
                            {stats.potentialPresence}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Mercados Potenciales</div>
                    </CardContent>
                </Card>
            </div>

            {/* Countries Table */}
            <Card className="bg-white border shadow-xl rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Presencia por País</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Desglose detallado de actividad global</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border shadow-sm">
                        <Search className="h-4 w-4 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Filtro Activo</span>
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">País</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-center">Agencias</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-center">Usuarios</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-right">Estatus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeCountriesList.map(([code, data]: any) => (
                                    <tr key={code} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-xl text-xl shadow-sm group-hover:scale-110 transition-transform">
                                                    {getEmojiFlag(code)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900">{getCountryName(code)}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-sm font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100">
                                                {data.agencies}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                                {data.users}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <Badge className="bg-green-500/10 text-green-600 border-green-200/50 text-[10px] font-black uppercase tracking-tighter px-3">
                                                Activo
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Helpers
function getEmojiFlag(countryCode: string) {
    if (!countryCode) return "🌐";
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

const countryNames: { [key: string]: string } = {
    'ES': 'España',
    'DE': 'Alemania',
    'BO': 'Bolivia',
    'BR': 'Brasil',
    'CO': 'Colombia',
    'EC': 'Ecuador',
    'PA': 'Panamá',
    'DO': 'República Dominicana',
    'NI': 'Nicaragua',
    'VE': 'Venezuela',
    'US': 'Estados Unidos',
    'MX': 'México',
    'AR': 'Argentina',
    'CL': 'Chile',
    'PE': 'Perú'
};

function getCountryName(code: string) {
    return countryNames[code.toUpperCase()] || code;
}
