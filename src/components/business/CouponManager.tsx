'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCouponsByCompany, createCoupon } from '@/app/actions/coupons';
import { Loader2, Plus, Ticket, AlertCircle } from 'lucide-react';

interface CouponManagerProps {
    companyId: string;
}

export function CouponManager({ companyId }: CouponManagerProps) {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [discountType, setDiscountType] = useState<'euro' | 'percent' | 'text'>('euro');
    const [discountValue, setDiscountValue] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [category, setCategory] = useState('General'); // Default

    useEffect(() => {
        loadCoupons();
    }, [companyId]);

    const loadCoupons = async () => {
        setLoading(true);
        const res = await getCouponsByCompany(companyId);
        if (res.success && res.coupons) {
            setCoupons(res.coupons);
            setErrorMsg(null);
        } else {
            setErrorMsg(res.error || 'Error al cargar cupones');
        }
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg(null);

        const newCoupon = {
            companyId,
            companyName: 'Mi Empresa', // Should ideally fetch from context or profile
            title,
            description,
            discountType,
            discountValue,
            startDate,
            endDate,
            category,
            country: 'Deutschland', // Default
            city: 'Berlin', // Default
        };

        const res = await createCoupon(newCoupon);
        if (res.success) {
            setTitle('');
            setDescription('');
            setDiscountValue('');
            await loadCoupons();
        } else {
            setErrorMsg(res.error || 'Error al crear cupón');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-6">
            {errorMsg && (
                <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Generar Nuevo Cupón</CardTitle>
                    <CardDescription>Crea un cupón promocional para tus clientes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Título Corto</Label>
                                <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. 20% en Cenas" />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoría</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Gastronomie & Kulinarik">Gastronomía</SelectItem>
                                        <SelectItem value="Reise & Tourismus">Turismo</SelectItem>
                                        <SelectItem value="General">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Tipo de Descuento</Label>
                                <Select value={discountType} onValueChange={(val: any) => setDiscountType(val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="euro">Descuento Directo (€)</SelectItem>
                                        <SelectItem value="percent">Porcentaje (%)</SelectItem>
                                        <SelectItem value="text">Promoción Texto (2x1)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor del Descuento</Label>
                                <Input required={discountType !== 'text'} type={discountType === 'text' ? "text" : "number"} value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === 'percent' ? "Ej. 20" : "Ej. 15"} />
                            </div>

                            <div className="space-y-2">
                                <Label>Fecha de Inicio</Label>
                                <Input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha de Fin</Label>
                                <Input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Descripción y Condiciones</Label>
                                <Input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Válido solo los martes..." />
                            </div>
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            Crear Cupón
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Mis Cupones Activos ({coupons.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                    ) : coupons.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 border border-dashed rounded-lg bg-slate-50">
                            No tienes cupones generados.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {coupons.map(c => (
                                <div key={c.id} className="p-4 border rounded-lg bg-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2">
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase text-white ${c.status === 'active' ? 'bg-green-500' : c.status === 'scheduled' ? 'bg-blue-500' : 'bg-red-500'}`}>
                                            {c.status}
                                        </div>
                                    </div>
                                    <Ticket className="w-8 h-8 text-blue-600 mb-2" />
                                    <h4 className="font-bold text-slate-800">{c.title}</h4>
                                    <p className="text-xs text-slate-500 mb-2">{c.description}</p>
                                    <div className="text-sm font-semibold bg-blue-50 text-blue-700 p-2 rounded inline-block">
                                        CÓDIGO: {c.code}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
