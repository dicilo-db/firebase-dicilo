'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getCouponsByCategory } from '@/app/actions/coupons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Calendar, UserPlus, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Components
import { CouponForm } from '../components/CouponForm';
import { AssignmentModal } from '../components/AssignmentModal';
import { ExpirationPanel } from '../components/ExpirationPanel';

export default function CategoryCouponsPage() {
    const params = useParams();
    const category = decodeURIComponent(params.category as string);

    const [coupons, setCoupons] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(''); // Could populate dynamically
    const [selectedCity, setSelectedCity] = useState(''); // Could populate dynamically

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState<{ id: string, title: string, companyId: string } | null>(null);

    // Fetch Coupons
    const fetchCoupons = async () => {
        setIsLoading(true);
        const res = await getCouponsByCategory(category, {
            search: searchTerm,
            month: selectedMonth,
            country: selectedCountry,
            city: selectedCity
        });

        if (res.success) {
            setCoupons(res.coupons || []);
        }
        setIsLoading(false);
    };

    // Debounce Search or Effect
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchCoupons();
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchTerm, selectedMonth, selectedCountry, selectedCity, category]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'expired': return 'bg-red-100 text-red-800';
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Link href="/admin/coupons">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{category}</h1>
                        <p className="text-muted-foreground">Listado de empresas y sus cupones.</p>
                    </div>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Crear Cupón
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Main Content (List) */}
                <div className="lg:col-span-3 space-y-4">

                    {/* Filters Bar */}
                    <Card>
                        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar empresa, país o ciudad..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            {/* Month Select (simplified for standard inputs) */}
                            <Input
                                type="month"
                                className="w-full md:w-[180px]"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    {/* Table */}
                    <Card>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-12 flex justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Empresa</TableHead>
                                            <TableHead>Cupón / Beneficio</TableHead>
                                            <TableHead>Fechas</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {coupons.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No se encontraron cupones.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {coupons.map((coupon) => (
                                            <TableRow key={coupon.id}>
                                                <TableCell className="font-medium">
                                                    <div>{coupon.companyName}</div>
                                                    <div className="text-xs text-muted-foreground flex gap-1">
                                                        {coupon.city}, {coupon.country}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold">{coupon.title}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">{coupon.code}</div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div><span className="text-muted-foreground">Inicio:</span> {new Date(coupon.startDate).toLocaleDateString()}</div>
                                                    <div><span className="text-muted-foreground">Fin:</span> {new Date(coupon.endDate).toLocaleDateString()}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={getStatusColor(coupon.status)}>
                                                        {coupon.status === 'active' ? 'Activo' :
                                                            coupon.status === 'expired' ? 'Expirado' : 'Programado'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setAssignTarget({ id: coupon.id, title: coupon.title, companyId: coupon.companyId })}
                                                    >
                                                        <UserPlus className="h-4 w-4 mr-2" />
                                                        Asignar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar (Stats) */}
                <div className="lg:col-span-1 space-y-6">
                    <ExpirationPanel coupons={coupons} />

                    {/* Helpful Tip */}
                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800">Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Los cupones se asignan manualmente a usuarios privados. Una vez asignados, aparecerán en la app del usuario.
                        </CardContent>
                    </Card>
                </div>

            </div>

            {/* Modals */}
            <CouponForm
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={fetchCoupons}
                category={category}
            />

            {assignTarget && (
                <AssignmentModal
                    isOpen={!!assignTarget}
                    onClose={() => setAssignTarget(null)}
                    couponId={assignTarget.id}
                    companyId={assignTarget.companyId}
                    couponTitle={assignTarget.title}
                />
            )}
        </div>
    );
}
