'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Download, Users, CheckCircle, XCircle, DollarSign, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search, MapPin, Briefcase } from 'lucide-react';

const ITEMS_PER_PAGE = 50;

export default function AuditoriaPage() {
    const [data, setData] = useState<AuditReferrerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCountry, setFilterCountry] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    // Note: Status for Referrer could mean 'do they have any active users' or we just filter their referrals
    const [filterStatus, setFilterStatus] = useState('all');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

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

    // Derived State
    const filteredData = useMemo(() => {
        return data.filter(ref => {
            // Search in referrer name OR referred users
            const matchesSearch = searchTerm === '' || 
                ref.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                ref.referredUsers.some(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesCountry = filterCountry === '' || (ref.referrerCountry && ref.referrerCountry.toLowerCase().includes(filterCountry.toLowerCase()));
            const matchesCity = filterCity === '' || (ref.referrerCity && ref.referrerCity.toLowerCase().includes(filterCity.toLowerCase()));
            const matchesRole = filterRole === 'all' || ref.referrerRole === filterRole;
            
            // Status: if 'active', they must have at least 1 active user. If 'inactive', they must have 0 active users (only inactive ones).
            let matchesStatus = true;
            if (filterStatus === 'active') matchesStatus = ref.activeCount > 0;
            if (filterStatus === 'inactive') matchesStatus = ref.activeCount === 0 && ref.inactiveCount > 0;

            return matchesSearch && matchesCountry && matchesCity && matchesRole && matchesStatus;
        });
    }, [data, searchTerm, filterCountry, filterCity, filterRole, filterStatus]);

    // Reset page and expand rows if search is used
    useEffect(() => {
        setCurrentPage(1);
        if (searchTerm.length > 2) {
            const newExpanded: Record<string, boolean> = {};
            filteredData.forEach(r => newExpanded[r.referrerId] = true);
            setExpandedRows(newExpanded);
        } else {
            setExpandedRows({});
        }
    }, [searchTerm, filterCountry, filterCity, filterRole, filterStatus, filteredData]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredData.slice(start, end);
    }, [filteredData, currentPage]);

    // Stats based on filtered data
    const totalRegistros = filteredData.reduce((acc, curr) => acc + curr.totalBrought, 0);
    const cuentasActivas = filteredData.reduce((acc, curr) => acc + curr.activeCount, 0);
    const cuentasInactivas = filteredData.reduce((acc, curr) => acc + curr.inactiveCount, 0);
    const dineroPorPagar = filteredData.reduce((acc, curr) => acc + curr.greenCardBalance, 0);

    if (loading) {
        return <div className="p-8 text-center">Cargando reporte de auditoría...</div>;
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6 print:p-0">
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Auditoría MLM y Tarjetas</h1>
                    <p className="text-muted-foreground mt-2">
                        Supervisa las redes de referidos y el balance actual por pagar en sus billeteras.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        Volver al Panel
                    </Button>
                    <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF
                    </Button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8">
                <h1 className="text-2xl font-bold">Reporte de Auditoría Dicilo</h1>
                <p className="text-sm text-gray-500">Generado el: {new Date().toLocaleString()}</p>
                <p className="text-sm font-semibold mt-2">Total Registros Filtrados: {totalRegistros}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Registros Filtrados</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRegistros}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cuentas Activas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cuentasActivas}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cuentas Inactivas</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cuentasInactivas}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tarjetas Verdes (Total por Pagar)</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">€{dineroPorPagar.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Bar */}
            <Card className="print:hidden">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar referidor o referido..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="País (Referidor)..."
                                value={filterCountry}
                                onChange={(e) => setFilterCountry(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Ciudad (Referidor)..."
                                value={filterCity}
                                onChange={(e) => setFilterCity(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="relative">
                            <Briefcase className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">Rol de Referidor</option>
                                <option value="freelancer">Freelancer</option>
                                <option value="team_leader">Team Leader</option>
                                <option value="team_office">Team Office</option>
                                <option value="user">Usuario Básico</option>
                            </select>
                        </div>
                        <div className="relative">
                            <CheckCircle className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">Desempeño Referidor</option>
                                <option value="active">Con usuarios activos</option>
                                <option value="inactive">Puros usuarios inactivos</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Saldos y Red de Referidores</CardTitle>
                    <CardDescription>
                        Despliega cada fila para ver el detalle de los registros que conforman la red de este referidor.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px] print:hidden"></TableHead>
                                <TableHead>Referidor</TableHead>
                                <TableHead>Rol y Ubicación</TableHead>
                                <TableHead className="text-center">Total Traídos</TableHead>
                                <TableHead className="text-center">Activos</TableHead>
                                <TableHead className="text-right">Tarjeta Negra (DP)</TableHead>
                                <TableHead className="text-right text-green-600 font-bold">Tarjeta Verde (€)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.map((ref) => (
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
                                            <div>
                                                <Badge variant={ref.referrerRole === 'freelancer' || ref.referrerRole === 'team_leader' ? 'default' : 'secondary'}>
                                                    {ref.referrerRole.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </div>
                                            {(ref.referrerCountry || ref.referrerCity) && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {ref.referrerCountry} {ref.referrerCity ? `- ${ref.referrerCity}` : ''}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">{ref.totalBrought}</TableCell>
                                        <TableCell className="text-center text-green-600 font-semibold">{ref.activeCount}</TableCell>
                                        <TableCell className="text-right font-bold">
                                            {ref.blackCardBalance} DP
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-green-600">
                                            €{ref.greenCardBalance.toFixed(2)}
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
                                                                            <span className="text-xs text-green-600 font-medium">Sí ({user.paidAt ? new Date(user.paidAt).toLocaleDateString() : 'Instantáneo'})</span> : 
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
                            {filteredData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No se encontraron registros con esos filtros.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between print:hidden">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length} referidores
                    </p>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Anterior
                        </Button>
                        <div className="flex items-center px-4 text-sm font-medium border rounded-md bg-white">
                            Página {currentPage} de {totalPages}
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

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
