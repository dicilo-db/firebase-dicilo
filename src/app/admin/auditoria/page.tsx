'use client';

import React, { useEffect, useState } from 'react';
import { getMLMAuditData, AuditReferrerData } from '@/app/actions/admin-audit';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Download, Users, CheckCircle, XCircle, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

export default function AuditoriaPage() {
    const [data, setData] = useState<AuditReferrerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    useEffect(() => {
        getMLMAuditData().then(d => {
            setData(d);
            setLoading(false);
        }).catch(console.error);
    }, []);

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="p-8 text-center">Cargando reporte de auditoría...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0">
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Auditoría MLM y Referidos</h1>
                    <p className="text-muted-foreground mt-2">
                        Supervisa el rendimiento de los usuarios, sus referidos y los pagos de comisiones automáticas.
                    </p>
                </div>
                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                </Button>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8">
                <h1 className="text-2xl font-bold">Reporte de Auditoría Dicilo</h1>
                <p className="text-sm text-gray-500">Generado el: {new Date().toLocaleString()}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Registros Globales</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.reduce((acc, curr) => acc + curr.totalBrought, 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cuentas Activas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.reduce((acc, curr) => acc + curr.activeCount, 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cuentas Inactivas</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.reduce((acc, curr) => acc + curr.inactiveCount, 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dinero Pagado (Tarjetas Verdes)</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            €{data.reduce((acc, curr) => acc + curr.totalMoneyEarned, 0).toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rendimiento por Referidor</CardTitle>
                    <CardDescription>
                        Despliega cada fila para ver el detalle exacto de los usuarios que trajo cada referidor.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px] print:hidden"></TableHead>
                                <TableHead>Referidor</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead className="text-center">Total Traídos</TableHead>
                                <TableHead className="text-center">Activos</TableHead>
                                <TableHead className="text-center">Inactivos</TableHead>
                                <TableHead className="text-right">Comisiones (€)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((ref) => (
                                <React.Fragment key={ref.referrerId}>
                                    <TableRow className="bg-slate-50/50 print:break-inside-avoid">
                                        <TableCell className="print:hidden">
                                            <Button variant="ghost" size="sm" onClick={() => toggleRow(ref.referrerId)}>
                                                {expandedRows[ref.referrerId] ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {ref.referrerName}
                                            <div className="text-xs text-muted-foreground">{ref.referrerId}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={ref.referrerRole === 'freelancer' || ref.referrerRole === 'team_leader' ? 'default' : 'secondary'}>
                                                {ref.referrerRole.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">{ref.totalBrought}</TableCell>
                                        <TableCell className="text-center text-green-600 font-semibold">{ref.activeCount}</TableCell>
                                        <TableCell className="text-center text-red-600 font-semibold">{ref.inactiveCount}</TableCell>
                                        <TableCell className="text-right font-bold text-blue-600">
                                            €{ref.totalMoneyEarned.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                    
                                    {/* Expanded Details */}
                                    {(expandedRows[ref.referrerId] || window.matchMedia("print").matches) && ref.referredUsers.length > 0 && (
                                        <TableRow className="bg-white print:break-inside-avoid">
                                            <TableCell colSpan={7} className="p-0">
                                                <div className="p-4 pl-16 border-l-4 border-blue-500">
                                                    <h4 className="text-sm font-bold mb-2">Detalle de Registros ({ref.referrerName})</h4>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Nombre</TableHead>
                                                                <TableHead>Email</TableHead>
                                                                <TableHead>Fecha Registro</TableHead>
                                                                <TableHead>Estado</TableHead>
                                                                <TableHead>Pagado</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {ref.referredUsers.map(user => (
                                                                <TableRow key={user.registrationId}>
                                                                    <TableCell>{user.name}</TableCell>
                                                                    <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                                                                    <TableCell className="text-xs">
                                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {user.isActive ? 
                                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Activo</Badge> : 
                                                                            <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Inactivo</Badge>
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {user.isPaid ? 
                                                                            <span className="text-xs text-green-600 font-medium">Sí ({new Date(user.paidAt!).toLocaleDateString()})</span> : 
                                                                            <span className="text-xs text-gray-400">Pendiente</span>
                                                                        }
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">No hay datos de auditoría disponibles.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 10mm; size: auto; }
                    body { font-size: 10pt; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .print\\:break-inside-avoid { break-inside: avoid; }
                    .border-l-4 { border-left-width: 2px !important; }
                }
            `}} />
        </div>
    );
}
