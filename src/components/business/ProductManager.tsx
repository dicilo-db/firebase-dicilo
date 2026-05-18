'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProduct, getProductsByCompany, deleteProduct } from '@/app/actions/business-products';
import { Loader2, Plus, Trash2, Tag, AlertCircle } from 'lucide-react';

interface ProductManagerProps {
    companyId: string;
}

export function ProductManager({ companyId }: ProductManagerProps) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        loadProducts();
    }, [companyId]);

    const loadProducts = async () => {
        setLoading(true);
        const res = await getProductsByCompany(companyId);
        if (res.success && res.products) {
            setProducts(res.products);
            setErrorMsg(null);
        } else {
            setErrorMsg(res.error || 'Error al cargar productos');
        }
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg(null);

        const newProduct = {
            companyId,
            name,
            price: parseFloat(price) || 0,
            currency: 'EUR',
            category,
            description,
            images: [],
            language: 'es',
            country: 'Deutschland',
            hasActivePromotion: false
        };

        const res = await createProduct(newProduct);
        if (res.success) {
            // Reset form
            setName('');
            setPrice('');
            setCategory('');
            setDescription('');
            await loadProducts();
        } else {
            setErrorMsg(res.error || 'Error al crear producto');
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('¿Eliminar producto?')) return;
        const res = await deleteProduct(productId, companyId);
        if (res.success) {
            await loadProducts();
        } else {
            alert(res.error);
        }
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
                    <CardTitle>Añadir Nuevo Producto</CardTitle>
                    <CardDescription>Crea un producto. El sistema validará los límites de tu plan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre del Producto</Label>
                                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Zapatos Deportivos" />
                            </div>
                            <div className="space-y-2">
                                <Label>Precio (€)</Label>
                                <Input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoría</Label>
                                <Input required value={category} onChange={e => setCategory(e.target.value)} placeholder="Ej. Ropa" />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción Breve</Label>
                                <Input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles del producto..." />
                            </div>
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            Crear Producto
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Mis Productos ({products.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                    ) : products.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 border border-dashed rounded-lg bg-slate-50">
                            No tienes productos registrados aún.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {products.map(p => (
                                <div key={p.id} className="py-4 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800">{p.name}</span>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                            <span className="font-medium text-slate-700">{p.price} {p.currency}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Tag className="w-3 h-3"/> {p.category}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(p.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
