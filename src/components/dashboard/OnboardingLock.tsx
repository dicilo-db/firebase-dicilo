'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, MapPin, Sparkles, Check, ChevronsUpDown } from 'lucide-react';
import { completeOnboarding } from '@/app/actions/profile';
import { Checkbox } from '@/components/ui/checkbox';
import categoriesData from '@/data/categories.json';
import { ALL_COUNTRIES } from '@/data/countries';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const formSchema = z.object({
    country: z.string().min(2, 'Por favor, selecciona tu país.'),
    city: z.string().min(2, 'Escribe el nombre de tu ciudad.'),
    items: z.array(z.string()).min(1, 'Selecciona al menos una categoría/interés.')
});

export function OnboardingLock({
    uid,
    name,
    userType,
    clientId,
    onSuccess
}: {
    uid: string,
    name: string,
    userType: 'private' | 'client',
    clientId?: string,
    onSuccess: () => void
}) {
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { country: '', city: '', items: [] },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSaving(true);
        const result = await completeOnboarding(uid, values, userType, clientId);
        setIsSaving(false);
        if (result.success) {
            onSuccess();
        } else {
            console.error('Error saving onboarding data');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-emerald-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-center mb-2">¡Hola, {name}! 👋</h2>
                <p className="text-slate-500 text-center mb-8">
                    Para ofrecerte una experiencia local y sugerencias relevantes, requerimos que confirmes tu ubicación actual y {userType === 'private' ? 'tus intereses.' : 'tu rubro principal.'}
                </p>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="font-bold mt-2">País</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? ALL_COUNTRIES.find((c) => c.value === field.value)?.label
                                                            : "Selecciona país..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0">
                                                <Command>
                                                    <CommandInput placeholder="Buscar país..." />
                                                    <CommandList>
                                                        <CommandEmpty>No se encontró el país.</CommandEmpty>
                                                        <CommandGroup>
                                                            {ALL_COUNTRIES.map((c) => (
                                                                <CommandItem
                                                                    value={c.label}
                                                                    key={c.value}
                                                                    onSelect={() => {
                                                                        form.setValue("country", c.value)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            c.value === field.value
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {c.label}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="font-bold mt-2">Ciudad</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Madrid, Medellín..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="space-y-3">
                            <FormLabel className="font-bold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-emerald-500" />
                                {userType === 'private' ? 'Tus Intereses' : 'Categoría Principal de la Empresa'}
                            </FormLabel>
                            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-xl bg-slate-50">
                                {categoriesData.map((cat) => (
                                    <FormField key={cat.categoria} control={form.control} name="items" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(cat.categoria)}
                                                    onCheckedChange={(checked) => {
                                                        if (userType === 'client') {
                                                            return checked ? field.onChange([cat.categoria]) : field.onChange([]);
                                                        }
                                                        return checked
                                                            ? field.onChange([...field.value, cat.categoria])
                                                            : field.onChange(field.value?.filter((v) => v !== cat.categoria));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="text-sm font-medium cursor-pointer leading-tight">{cat.categoria}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                            {form.formState.errors.items && (
                                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.items.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg rounded-xl shadow-lg mt-4" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Descubrir Dicilo'}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
