'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createCoupon, searchCompanies } from '@/app/actions/coupons'; // Added searchCompanies
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Building2, MapPin, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Schema
const couponSchema = z.object({
    companyId: z.string().min(1, 'La Empresa ID es obligatoria'),
    companyName: z.string().min(1, 'El Nombre de Empresa es obligatorio'),
    category: z.string().min(1, 'Categoría requerida'),
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    startDate: z.string(),
    endDate: z.string(),
    country: z.string().min(1, 'País requerido'),
    city: z.string().min(1, 'Ciudad requerida'),
});

interface CouponFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category: string; // Pre-filled category
    fixedCompanyId?: string;
    fixedCompanyName?: string;
}

export function CouponForm({ isOpen, onClose, onSuccess, category, fixedCompanyId, fixedCompanyName }: CouponFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const form = useForm<z.infer<typeof couponSchema>>({
        resolver: zodResolver(couponSchema),
        defaultValues: {
            category,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            country: 'Deutschland',
            city: '',
            companyId: fixedCompanyId || '',
            companyName: fixedCompanyName || '',
            title: '',
            description: ''
        },
    });

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            form.reset({
                category,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                country: 'Deutschland',
                city: '',
                companyId: fixedCompanyId || '',
                companyName: fixedCompanyName || '',
                title: '',
                description: ''
            });
            setSearchTerm('');
            setSearchResults([]);
        }
    }, [isOpen, category, form, fixedCompanyId, fixedCompanyName]);

    // Handle outside click to close results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                setIsSearching(true);
                const res = await searchCompanies(searchTerm);
                if (res.success && res.companies) {
                    setSearchResults(res.companies);
                    setShowResults(true);
                } else if (!res.success) {
                    console.error("Search error:", res.error);
                    // Optional: Show toast if strictly needed, but might be annoying while typing.
                    // For now, logging is enough, or a subtle message.
                }
                setIsSearching(false);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSelectCompany = (company: any) => {
        form.setValue('companyName', company.name);
        form.setValue('companyId', company.id);
        if (company.city) form.setValue('city', company.city);
        if (company.country) form.setValue('country', company.country);

        setSearchTerm(company.name);
        setShowResults(false);
    };

    const onSubmit = async (values: z.infer<typeof couponSchema>) => {
        setIsLoading(true);
        const res = await createCoupon(values);
        setIsLoading(false);

        if (res.success) {
            toast({
                title: 'Cupón creado',
                description: `Código generado: ${res.code}`,
            });
            onSuccess();
            onClose();
        } else {
            toast({
                title: 'Error',
                description: res.error || 'Ocurrió un error al crear el cupón.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Cupón</DialogTitle>
                    <DialogDescription>
                        Registra un nuevo descuento para la categoría: {category}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Also try to stop native propagation just in case
                        if (e.nativeEvent) {
                            e.nativeEvent.stopImmediatePropagation();
                            e.nativeEvent.stopPropagation();
                        }
                        form.handleSubmit(onSubmit)(e);
                    }} className="space-y-4">

                        {!fixedCompanyId && (
                            <>
                                {/* Company Auto-Complete Section */}
                                <div className="space-y-2 relative" ref={searchRef}>
                                    <FormField
                                        control={form.control}
                                        name="companyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Buscar Empresa</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Escribe el nombre de la empresa..."
                                                            {...field}
                                                            value={searchTerm}
                                                            onChange={(e) => {
                                                                setSearchTerm(e.target.value);
                                                                field.onChange(e.target.value);
                                                            }}
                                                            className="pl-8"
                                                            autoComplete="off"
                                                        />
                                                        {isSearching && (
                                                            <div className="absolute right-2 top-2.5">
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Dropdown Results */}
                                    {showResults && searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full bg-popover border rounded-md shadow-md max-h-[200px] overflow-y-auto mt-1">
                                            {searchResults.map((company) => (
                                                <div
                                                    key={company.id}
                                                    className="px-4 py-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors flex flex-col gap-1 border-b last:border-0"
                                                    onClick={() => handleSelectCompany(company)}
                                                >
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <Building2 className="h-4 w-4 text-primary" />
                                                        {company.name}
                                                    </div>
                                                    {(company.city || company.address) && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                                                            <MapPin className="h-3 w-3" />
                                                            {company.city || company.address}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Debug Info / Not Found Message */}
                                    {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            No se encontraron resultados. Intente escribir el ID manualmente.
                                        </div>
                                    )}
                                </div>

                                {/* Visible ID field to unblock saving if search fails */}
                                <div className="p-3 bg-muted/30 rounded border border-dashed">
                                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        <span>Si la búsqueda no funciona, ingrese el ID manualmente:</span>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="companyId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">ID de Empresa (Requerido)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Pegue aquí el ID del cliente" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}


                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título / Beneficio</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. 10% de Descuento" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Detalles del descuento..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha Inicio</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha Expiración</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>País</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ciudad</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crear Cupón'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
