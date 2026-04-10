'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getDiciCoinPurchasers, DiciCoinPurchaser } from '@/app/actions/dicicoin';
import Link from 'next/link';
import { Loader2, Search, Filter, ArrowLeft, ArrowUpDown, ChevronLeft, ChevronRight, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAdminUser } from '@/hooks/useAuthGuard';
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Assuming this exists or using Loader2

export default function DiciCoinPurchasersPage() {
    const { t } = useTranslation('admin');
    const { user, isLoading: isAuthLoading } = useAdminUser();

    // State
    const [purchasers, setPurchasers] = useState<DiciCoinPurchaser[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [countryFilter, setCountryFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'coins_qty' | 'buyer_name'>('coins_qty');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Debounce Search
    useEffect(() => {
        const timeout = setTimeout(() => {
            setPage(1); // Reset to page 1 on search change
            fetchData();
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchTerm, countryFilter, sortBy, sortOrder]);

    // Fetch on Page Change
    useEffect(() => {
        fetchData();
    }, [page]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getDiciCoinPurchasers(page, limit, searchTerm, countryFilter, sortBy, sortOrder);
            if (res.success) {
                setPurchasers(res.purchasers);
                setTotal(res.total);
            } else {
                console.error(res.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSort = (field: 'coins_qty' | 'buyer_name') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc'); // Default to desc for new field
        }
        setPage(1); // Reset pagination on sort change
    };

    if (isAuthLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <h1 className="text-2xl font-bold">Acceso Denegado</h1>
                <p>No tienes permisos para ver esta página.</p>
                <Link href="/admin"><Button>Volver</Button></Link>
            </div>
        );
    }

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/dashboard">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Coins className="h-8 w-8 text-amber-500" />
                        Compradores DiciCoin
                    </h1>
                    <p className="text-muted-foreground">Gestión de compras de monedas y clientes</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o email..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Select value={countryFilter} onValueChange={setCountryFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="País" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Países</SelectItem>
                                <SelectItem value="Deutschland">Deutschland</SelectItem>
                                <SelectItem value="Schweiz">Schweiz</SelectItem>
                                <SelectItem value="Österreich">Österreich</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-end text-sm text-muted-foreground">
                            {total} Registros encontrados
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => toggleSort('buyer_name')}>
                                    <div className="flex items-center gap-2">
                                        Nombre Completo
                                        {sortBy === 'buyer_name' && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                </TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>País</TableHead>
                                <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => toggleSort('coins_qty')}>
                                    <div className="flex items-center gap-2">
                                        Monedas
                                        {sortBy === 'coins_qty' && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Cargando...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : purchasers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No se encontraron compradores.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                purchasers.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.buyer_name}</TableCell>
                                        <TableCell>{p.buyer_email}</TableCell>
                                        <TableCell>{p.buyer_country}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                {p.coins_qty} Coins
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages || 1}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
