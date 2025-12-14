'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAllCoupons, getCouponStats } from '@/app/actions/coupons';
import Link from 'next/link';
import { Tag, Loader2, Search, Filter, Plus, FileText, Calendar, Building2, MapPin, ArrowLeft, Euro, Percent, Type, Download } from 'lucide-react';
import { CouponForm } from './components/CouponForm';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export default function CouponsPage() {
    const { t } = useTranslation('admin');
    const { toast } = useToast();

    // State
    const [coupons, setCoupons] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState('');

    // Initial Load
    useEffect(() => {
        fetchData();
        fetchStats();
    }, []);

    // Filter Effect (Debounced search)
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchTerm, statusFilter, monthFilter, countryFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getAllCoupons({
                search: searchTerm,
                status: statusFilter,
                month: monthFilter,
                country: countryFilter
            });
            if (res.success && res.coupons) {
                setCoupons(res.coupons);
            }
        } catch (error) {
            console.error(error);
            toast({
                title: 'Fehler',
                description: 'Konnte Coupons nicht laden.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        const res = await getCouponStats();
        if (res.success && res.stats) {
            setStats(res.stats);
        }
    };

    // Calculate total stats for the summary cards
    const totalActive = Object.values(stats).reduce((acc: number, curr: any) => acc + curr.active, 0);
    const totalCount = Object.values(stats).reduce((acc: number, curr: any) => acc + curr.total, 0);

    const renderDiscountBadge = (coupon: any) => {
        if (!coupon.discountType || coupon.discountType === 'text') {
            return <Badge variant="secondary" className="gap-1"><Type className="h-3 w-3" /> Angebot</Badge>;
        }
        if (coupon.discountType === 'percent') {
            return <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800"><Percent className="h-3 w-3" /> {coupon.discountValue}%</Badge>;
        }
        if (coupon.discountType === 'euro') {
            return <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800"><Euro className="h-3 w-3" /> {coupon.discountValue}€</Badge>;
        }
        return null;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500">Aktiv</Badge>;
            case 'expired':
                return <Badge variant="destructive">Abgelaufen</Badge>;
            case 'scheduled':
                return <Badge variant="outline" className="text-blue-500 border-blue-500">Geplant</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col gap-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/admin/dashboard">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <h1 className="text-3xl font-bold tracking-tight">Gestión Central de Cupones</h1>
                        </div>
                        <p className="text-muted-foreground">
                            Administra todos los cupones activos, expirados y programados de todas las empresas.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => fetchData()}>
                            <Filter className="mr-2 h-4 w-4" />
                            Refrescar
                        </Button>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Cupón (Admin)
                        </Button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cupones Activos</CardTitle>
                            <Tag className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalActive}</div>
                            <p className="text-xs text-muted-foreground">Disponibles ahora mismo</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Histórico</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCount}</div>
                            <p className="text-xs text-muted-foreground">Cupones creados en total</p>
                        </CardContent>
                    </Card>
                    {/* Placeholder for future stat */}
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-medium text-green-700">Sistema Unificado Activo</div>
                            <p className="text-xs text-green-600/80">Generación de fondos AI: Activada</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar empresa, código, título..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Estados</SelectItem>
                                    <SelectItem value="active">Activos</SelectItem>
                                    <SelectItem value="scheduled">Programados</SelectItem>
                                    <SelectItem value="expired">Expirados</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                type="month"
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                className="w-full"
                            />

                            <Select value={countryFilter} onValueChange={setCountryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="País" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Países</SelectItem> {/* Handle empty string logic */}
                                    <SelectItem value="Deutschland">Deutschland</SelectItem>
                                    <SelectItem value="Schweiz">Schweiz</SelectItem>
                                    <SelectItem value="Österreich">Österreich</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>Cupón</TableHead>
                                    <TableHead>Descuento</TableHead>
                                    <TableHead>Fechas</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Cargando datos...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : coupons.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No se encontraron cupones con los filtros actuales.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    coupons.map((coupon) => (
                                        <TableRow key={coupon.id} className="group">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium flex items-center gap-2">
                                                        <Building2 className="h-3 w-3 text-muted-foreground" />
                                                        {coupon.companyName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{coupon.category}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {coupon.backgroundImage && (
                                                        <div className="h-8 w-12 rounded overflow-hidden bg-muted">
                                                            <img src={coupon.backgroundImage} alt="" className="h-full w-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm truncate max-w-[150px]" title={coupon.title}>{coupon.title}</span>
                                                        <span className="text-xs font-mono bg-muted px-1 rounded w-fit">{coupon.code}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {renderDiscountBadge(coupon)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(coupon.startDate), 'dd.MM.yy')}
                                                    </span>
                                                    <span>bis {format(new Date(coupon.endDate), 'dd.MM.yy')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    {coupon.city}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(coupon.status)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <CouponForm
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => {
                    fetchData();
                    setIsCreateOpen(false);
                }}
                category="Allgemein" // Default category for admin creation if not specified
            />
        </div>
    );
}
