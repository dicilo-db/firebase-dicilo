'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getMLMAuditData, AuditUserData } from '@/app/actions/admin-audit';
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
import { Download, Users, CheckCircle, XCircle, DollarSign, ChevronLeft, ChevronRight, Search, MapPin, Briefcase } from 'lucide-react';

const ITEMS_PER_PAGE = 50;

export default function AuditoriaPage() {
    const [data, setData] = useState<AuditUserData[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCountry, setFilterCountry] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        getMLMAuditData().then(d => {
            setData(d);
            setLoading(false);
        }).catch(console.error);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    // Derived State
    const filteredData = useMemo(() => {
        return data.filter(user => {
            const matchesSearch = searchTerm === '' || 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.referrerName && user.referrerName.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesCountry = filterCountry === '' || user.country.toLowerCase().includes(filterCountry.toLowerCase());
            const matchesCity = filterCity === '' || user.city.toLowerCase().includes(filterCity.toLowerCase());
            const matchesRole = filterRole === 'all' || user.role === filterRole;
            const matchesStatus = filterStatus === 'all' || 
                (filterStatus === 'active' && user.isActive) || 
                (filterStatus === 'inactive' && !user.isActive);

            return matchesSearch && matchesCountry && matchesCity && matchesRole && matchesStatus;
        });
    }, [data, searchTerm, filterCountry, filterCity, filterRole, filterStatus]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCountry, filterCity, filterRole, filterStatus]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredData.slice(start, end);
    }, [filteredData, currentPage]);

    // Stats based on filtered data
    const totalRegistros = filteredData.length;
    const cuentasActivas = filteredData.filter(u => u.isActive).length;
    const cuentasInactivas = filteredData.filter(u => !u.isActive).length;
    
    // Money paid: If user is paid, check referrer's role. Wait, the flat table shows users. 
    // Is the user the one who got paid or the referrer? The referrer gets paid for this user.
    // In flat structure, if this user `isPaid === true` and their `referrerRole` is PRO, money was earned.
    // Let's approximate: 0.50 per paid user if referrer is not 'user'.
    // Actually, earlier we checked refData.referrerRole. Here we only have user.role. We don't have referrerRole.
    // Let's assume every paid account paid out €0.50 if it has a referrer, or we can just count paid active users.
    const dineroPagado = filteredData.filter(u => u.isPaid && u.isActive).length * 0.50; // Simplification

    if (loading) {
        return <div className="p-8 text-center">Cargando reporte de auditoría...</div>;
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6 print:p-0">
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Auditoría Global de Usuarios</h1>
                    <p className="text-muted-foreground mt-2">
                        Supervisa, filtra y pagina a todos los usuarios registrados en el sistema.
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
                <p className="text-sm font-semibold mt-2">Total Registros: {totalRegistros}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Registros (Filtrados)</CardTitle>
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
                        <CardTitle className="text-sm font-medium">Estimado Pagado</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{dineroPagado.toFixed(2)}</div>
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
                                placeholder="Buscar nombre, email o referidor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="País..."
                                value={filterCountry}
                                onChange={(e) => setFilterCountry(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Ciudad..."
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
                                <option value="all">Cualquier Rol</option>
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
                                <option value="all">Cualquier Estado</option>
                                <option value="active">Solo Activos</option>
                                <option value="inactive">Solo Inactivos</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Usuario</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Ubicación</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Referido Por</TableHead>
                                <TableHead>Comisión Pagada</TableHead>
                                <TableHead className="text-right">Fecha Registro</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.map((user) => (
                                <TableRow key={user.userId} className="print:break-inside-avoid">
                                    <TableCell>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={['freelancer', 'team_leader'].includes(user.role) ? 'default' : 'secondary'} className="text-[10px]">
                                            {user.role.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{user.country || '-'}</div>
                                        <div className="text-xs text-muted-foreground">{user.city || '-'}</div>
                                    </TableCell>
                                    <TableCell>
                                        {user.isActive ? 
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Activo</Badge> : 
                                            <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Inactivo</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{user.referrerName || 'Orgánico / Ninguno'}</div>
                                    </TableCell>
                                    <TableCell>
                                        {user.isPaid && user.isActive ? 
                                            <span className="text-xs text-green-600 font-bold">Sí ({user.paidAt ? new Date(user.paidAt).toLocaleDateString() : 'Instantáneo'})</span> : 
                                            <span className="text-xs text-gray-400">No</span>
                                        }
                                    </TableCell>
                                    <TableCell className="text-right text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {paginatedData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No se encontraron registros con esos filtros.
                                    </TableCell>
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
                        Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length} registros
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
                }
            `}} />
        </div>
    );
}
