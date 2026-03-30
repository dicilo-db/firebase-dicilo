'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Plus, Package, Trash2, Edit, Save, X, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Product {
    id: string; // generated locally if missing
    name: string;
    price: string;
    description: string;
    imageUrl: string;
}

interface ClientProductManagerProps {
    companyId: string;
}

export function ClientProductManager({ companyId }: ClientProductManagerProps) {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'clients', companyId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error("Error fetching products", error);
            toast({ title: 'Error', description: 'No se pudieron cargar los productos.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) fetchProducts();
    }, [companyId]);

    const openModal = (prod?: Product) => {
        if (prod) {
            setEditingProduct(prod);
            setName(prod.name || '');
            setPrice(prod.price || '');
            setDescription(prod.description || '');
            setImageUrl(prod.imageUrl || '');
        } else {
            setEditingProduct(null);
            setName('');
            setPrice('');
            setDescription('');
            setImageUrl('');
        }
        setIsModalOpen(true);
    };

    const handleSaveProduct = async () => {
        if (!name.trim()) {
            toast({ title: 'Atención', description: 'El nombre del producto es obligatorio', variant: 'destructive' });
            return;
        }

        setSaving(true);
        try {
            const docRef = doc(db, 'clients', companyId);
            let updatedProducts = [...products];

            if (editingProduct) {
                // Update
                updatedProducts = updatedProducts.map(p => 
                    p.id === editingProduct.id 
                        ? { ...p, name, price, description, imageUrl }
                        : p
                );
            } else {
                // Create
                const newProd: Product = {
                    id: Date.now().toString(),
                    name,
                    price,
                    description,
                    imageUrl
                };
                updatedProducts.push(newProd);
            }

            await updateDoc(docRef, { products: updatedProducts });
            setProducts(updatedProducts);
            toast({ title: 'Éxito', description: 'Producto guardado correctamente.' });
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Error al actualizar el catálogo.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (idToDelete: string) => {
        if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
        setSaving(true);
        try {
            const docRef = doc(db, 'clients', companyId);
            const updatedProducts = products.filter(p => p.id !== idToDelete);
            await updateDoc(docRef, { products: updatedProducts });
            setProducts(updatedProducts);
            toast({ title: 'Eliminado', description: 'El producto fue eliminado del catálogo.' });
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo eliminar el producto.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-slate-800">Catálogo Activo</h3>
                    <p className="text-sm text-slate-500">
                        Los productos añadidos aquí aparecerán públicamente en tu Ficha Técnica Dicilo.
                    </p>
                </div>
                <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Agregar Producto
                </Button>
            </div>

            {products.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">Catálogo Vacío</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">No has agregado ningún producto o servicio todavía. Agrega el primero para que tus clientes puedan explorar tu oferta.</p>
                    <Button variant="outline" className="mt-6 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => openModal()}>
                        Comenzar
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(prod => (
                        <Card key={prod.id || prod.name} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                            {prod.imageUrl ? (
                                <div className="h-40 w-full bg-slate-100 relative group">
                                    <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="h-40 w-full bg-slate-50 flex items-center justify-center border-b border-slate-100">
                                    <ImageIcon className="w-10 h-10 text-slate-200" />
                                </div>
                            )}
                            <CardHeader className="pb-3 flex-grow">
                                <div className="flex justify-between items-start gap-2">
                                    <CardTitle className="text-lg font-bold text-slate-800 leading-tight">
                                        {prod.name}
                                    </CardTitle>
                                    {prod.price && <span className="font-mono font-bold text-emerald-600 shrink-0 bg-emerald-50 px-2 py-1 rounded-md text-sm">{prod.price}</span>}
                                </div>
                                <CardDescription className="line-clamp-3 text-sm mt-2">{prod.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4 flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200" onClick={() => openModal(prod)}>
                                    <Edit className="w-4 h-4 mr-2" /> Editar
                                </Button>
                                <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(prod.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Editar Producto/Servicio' : 'Nuevo Producto/Servicio'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Menú del día" />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="price">Precio (Aprox. o Fijo)</Label>
                            <Input id="price" value={price} onChange={e => setPrice(e.target.value)} placeholder="Ej: 15.00€ o 'Desde 10€'" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc">Descripción</Label>
                            <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalla los beneficios o características..." rows={3} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="img">URL de Imagen Principal</Label>
                            <Input id="img" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" />
                            <p className="text-xs text-slate-500">Puedes pegar un enlace directo de una foto.</p>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancelar</Button>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveProduct} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Guardar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
