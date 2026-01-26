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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createCoupon, searchCompanies } from '@/app/actions/coupons';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Building2, MapPin, Info, Tag, Euro, Percent, Type } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Schema
const couponSchema = z.object({
    companyId: z.string().min(1, 'ID Required'),
    companyName: z.string().min(1, 'Name Required'),
    category: z.string().min(1, 'Category Required'),
    title: z.string().min(3, 'Title too short'),
    description: z.string().optional(),
    startDate: z.string(),
    endDate: z.string(),
    country: z.string().min(1, 'Country Required'),
    city: z.string().min(1, 'City Required'),
    discountType: z.enum(['euro', 'percent', 'text']),
    discountValue: z.string().optional(),
});

interface CouponFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category: string; // Pre-filled category
    initialData?: any; // For editing
}

export function CouponForm({ isOpen, onClose, onSuccess, category, fixedCompanyId, fixedCompanyName, initialData }: CouponFormProps) {
    const { t } = useTranslation('admin');
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
            description: '',
            discountType: 'text',
            discountValue: ''
        },
    });

    const discountType = form.watch('discountType');

    // Reset or Load Initial Data when opening
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Formatting dates if necessary (removing T if exists)
                const start = initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                const end = initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                form.reset({
                    companyId: initialData.companyId || fixedCompanyId,
                    companyName: initialData.companyName || fixedCompanyName,
                    category: initialData.category || category,
                    title: initialData.title || '',
                    description: initialData.description || '',
                    startDate: start,
                    endDate: end,
                    country: initialData.country || 'Deutschland',
                    city: initialData.city || '',
                    discountType: initialData.discountType || 'text',
                    discountValue: initialData.discountValue || ''
                });
            } else {
                form.reset({
                    category,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    country: 'Deutschland',
                    city: '',
                    companyId: fixedCompanyId || '',
                    companyName: fixedCompanyName || '',
                    title: '',
                    description: '',
                    discountType: 'text',
                    discountValue: ''
                });
                setSearchTerm('');
                setSearchResults([]);
            }
        }
    }, [isOpen, category, form, fixedCompanyId, fixedCompanyName, initialData]);

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

    const handleManualSubmit = async () => {
        // Validation check
        const isValid = await form.trigger();
        if (!isValid) return;

        const values = form.getValues();
        setIsLoading(true);
        // Cast values to match CouponData strictly if needed, but safe here
        const res = await createCoupon(values as any);
        setIsLoading(false);

        if (res.success) {
            toast({
                title: t('contracts.coupons.successTitle', 'Muffin Created'),
                description: t('contracts.coupons.successDesc', { code: res.code }),
            });
            onSuccess();
            onClose();
        } else {
            toast({
                title: t('contracts.coupons.errorTitle'),
                description: res.error || t('contracts.coupons.errorDesc'),
                variant: 'destructive',
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleManualSubmit();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
                onKeyDown={handleKeyDown}
            >

            >
                <DialogHeader>
                    <DialogTitle>{initialData ? t('contracts.coupons.editTitle', 'Editar Cupón') : t('contracts.coupons.createTitle', 'Crear Nuevo Cupón')}</DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Edita los detalles para actualizar o reactivar este cupón.' : t('contracts.coupons.createDescription', { category })}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4">

                        {!fixedCompanyId && (
                            <>
                                {/* Company Auto-Complete Section */}
                                <div className="space-y-2 relative" ref={searchRef}>
                                    <FormField
                                        control={form.control}
                                        name="companyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('contracts.coupons.searchLabel', 'Buscar Empresa')}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder={t('contracts.coupons.searchPlaceholder', 'Escribe el nombre de la empresa...')}
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

                                    {/* Not Found Message */}
                                    {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {t('contracts.coupons.noResults', 'No se encontraron resultados.')}
                                        </div>
                                    )}
                                </div>

                                {/* Manual ID Fallback */}
                                <div className="p-3 bg-muted/30 rounded border border-dashed">
                                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        <span>{t('contracts.coupons.manualIdInfo', 'Si la búsqueda no funciona...')}</span>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="companyId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">{t('contracts.coupons.manualIdLabel', 'ID de Empresa')}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder={t('contracts.coupons.manualIdPlaceholder')} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}

                        {fixedCompanyId && (
                            <div className="p-3 bg-muted/40 rounded border">
                                <FormLabel className="text-xs text-muted-foreground">{t('contracts.coupons.companyLabel', 'Unternehmen')}</FormLabel>
                                <div className="font-medium flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    {fixedCompanyName || fixedCompanyId}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="discountType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Descuento</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="text">
                                                    <div className="flex items-center gap-2"><Type className="h-4 w-4" /> Texto Libre</div>
                                                </SelectItem>
                                                <SelectItem value="percent">
                                                    <div className="flex items-center gap-2"><Percent className="h-4 w-4" /> Porcentaje (%)</div>
                                                </SelectItem>
                                                <SelectItem value="euro">
                                                    <div className="flex items-center gap-2"><Euro className="h-4 w-4" /> Importe (€)</div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {discountType !== 'text' && (
                                <FormField
                                    control={form.control}
                                    name="discountValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor ({discountType === 'percent' ? '%' : '€'})</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="20" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('contracts.coupons.titleLabel', 'Título / Beneficio')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('contracts.coupons.titlePlaceholder')} {...field} />
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
                                    <FormLabel>{t('contracts.coupons.descriptionLabel', 'Descripción')}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t('contracts.coupons.descriptionPlaceholder')} {...field} />
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
                                        <FormLabel>{t('contracts.coupons.startDateLabel', 'Fecha Inicio')}</FormLabel>
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
                                        <FormLabel>{t('contracts.coupons.endDateLabel', 'Fecha Expiración')}</FormLabel>
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
                                        <FormLabel>{t('contracts.coupons.countryLabel', 'País')}</FormLabel>
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
                                        <FormLabel>{t('contracts.coupons.cityLabel', 'Ciudad')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>
                                {t('contracts.coupons.cancelButton', 'Cancelar')}
                            </Button>
                            <Button type="button" onClick={handleManualSubmit} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (initialData ? 'Guardar Cambios' : t('contracts.coupons.createButton', 'Crear Cupón'))}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
