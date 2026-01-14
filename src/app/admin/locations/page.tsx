'use client';

import React, { useEffect, useState } from 'react';
import { useAdminUser, useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Trash2, Globe, Search, Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    getLocations,
    addCountry,
    deleteCountry,
    addCity,
    removeCity,
    addDistrict,
    removeDistrict,
    LocationData,
    City
} from '@/app/actions/admin-locations';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useTranslation } from 'react-i18next';
import { COUNTRIES_ISO } from '@/lib/constants/countries';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LocationsPage() {
    useAuthGuard(['superadmin', 'admin', 'team_office']);
    const { t } = useTranslation('admin');
    const { toast } = useToast();
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Add Country State
    const [isAddCountryOpen, setIsAddCountryOpen] = useState(false);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    const [newCountryName, setNewCountryName] = useState('');
    const [newCountryCode, setNewCountryCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Add City State
    const [activeCountryId, setActiveCountryId] = useState<string | null>(null);
    const [newCityName, setNewCityName] = useState('');

    // Add District State
    const [activeCityForDistrict, setActiveCityForDistrict] = useState<{ countryId: string, cityName: string } | null>(null);
    const [newDistrictName, setNewDistrictName] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await getLocations();
            if (res.success && res.data) {
                setLocations(res.data);
            } else {
                toast({
                    title: "Error",
                    description: res.error || "No se pudieron cargar las ubicaciones.",
                    variant: "destructive"
                });
            }
        } catch (e) {
            console.error("Fetch error", e);
            toast({
                title: "Error de Conexión",
                description: "Hubo un problema al cargar los datos.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddCountry = async () => {
        if (!newCountryName || !newCountryCode) return;
        setIsSubmitting(true);
        const res = await addCountry({ countryName: newCountryName, countryCode: newCountryCode });
        if (res.success) {
            toast({ title: t('admin.locations.success_title', "Éxito"), description: t('admin.locations.country_added', "País agregado correctamente.") });
            setIsAddCountryOpen(false);
            setNewCountryName('');
            setNewCountryCode('');
            fetchData();
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    const handleDeleteCountry = async (id: string, name: string) => {
        if (!confirm(t('admin.locations.confirm_delete_country', `¿Estás seguro de eliminar ${name}? Se borrarán todas sus ciudades y barrios.`, { name }))) return;
        const res = await deleteCountry(id);
        if (res.success) {
            toast({ title: t('admin.locations.deleted_title', "Eliminado"), description: t('admin.locations.country_deleted', "País eliminado.") });
            fetchData();
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" });
        }
    };

    const handleAddCity = async (countryId: string) => {
        if (!newCityName.trim()) return;
        const res = await addCity(countryId, newCityName.trim());
        if (res.success) {
            toast({ title: t('admin.locations.success_title', "Éxito"), description: t('admin.locations.city_added', "Ciudad agregada.") });
            setNewCityName('');
            setActiveCountryId(null);
            fetchData();
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" });
        }
    };

    const handleRemoveCity = async (countryId: string, city: string) => {
        const message = t('admin.locations.confirm_delete_city', `¿Eliminar ciudad ${city}?`, { city });
        if (!confirm(message)) return;

        const res = await removeCity(countryId, city);
        if (res.success) {
            fetchData();
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" });
        }
    };

    const handleAddDistrict = async () => {
        if (!activeCityForDistrict || !newDistrictName.trim()) return;
        const { countryId, cityName } = activeCityForDistrict;

        const res = await addDistrict(countryId, cityName, newDistrictName.trim());
        if (res.success) {
            toast({ title: t('admin.locations.success_title', "Éxito"), description: t('admin.locations.district_added', "Barrio agregado.") });
            setNewDistrictName('');
            setActiveCityForDistrict(null);
            fetchData();
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" });
        }
    };

    const handleRemoveDistrict = async (countryId: string, cityName: string, districtName: string) => {
        const message = t('admin.locations.confirm_delete_district', `¿Eliminar barrio ${districtName}?`, { districtName });
        if (!confirm(message)) return;

        const res = await removeDistrict(countryId, cityName, districtName);
        if (res.success) {
            fetchData();
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" });
        }
    };

    const filteredLocations = locations.filter(l =>
        l.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.cities.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
            <header className="bg-white dark:bg-slate-950 border-b px-8 py-4 flex items-center gap-4">
                <Link href="/admin/dashboard">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> {t('admin.locations.back_dashboard', "Volver al Dashboard")}
                    </Button>
                </Link>
            </header>

            <main className="flex-grow p-8 container mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Globe className="h-8 w-8 text-primary" />
                            {t('admin.locations.title', "Gestión de Ubicaciones")}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {t('admin.locations.description', "Administra países, ciudades y sus distritos (Stadtteile).")}
                        </p>
                    </div>

                    <Dialog open={isAddCountryOpen} onOpenChange={setIsAddCountryOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> {t('admin.locations.add_country_btn', "Agregar País")}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('admin.locations.add_country', 'Agregar Nuevo País')}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="country-select">{t('admin.locations.select_country', 'Seleccionar País')}</Label>
                                    <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={isComboboxOpen}
                                                className="w-full justify-between"
                                            >
                                                {newCountryName
                                                    ? newCountryName
                                                    : t('admin.locations.search_country', "Buscar país...")}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandInput placeholder={t('admin.locations.search_placeholder', "Buscar...")} />
                                                <CommandList>
                                                    <CommandEmpty>{t('admin.locations.no_country_found', "No se encontró el país.")}</CommandEmpty>
                                                    <CommandGroup className="max-h-[300px] overflow-auto">
                                                        {COUNTRIES_ISO.map((country) => (
                                                            <CommandItem
                                                                key={country.code}
                                                                value={country.name}
                                                                onSelect={(currentValue) => {
                                                                    setNewCountryName(country.name);
                                                                    setNewCountryCode(country.code);
                                                                    setIsComboboxOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        newCountryCode === country.code ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <span className="mr-2 font-mono text-xs text-muted-foreground">{country.code}</span>
                                                                {country.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="code">{t('admin.locations.country_code', 'Código ISO')}</Label>
                                    <Input
                                        id="code"
                                        value={newCountryCode}
                                        readOnly
                                        className="bg-slate-100"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleAddCountry} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('admin.locations.save', "Guardar")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('admin.locations.search_placeholder', "Buscar país o ciudad...")}
                            className="pl-8 max-w-md bg-white dark:bg-slate-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('admin.locations.active_countries', "Países Activos", { count: locations.length })} ({locations.length})</CardTitle>
                            <CardDescription>
                                {t('admin.locations.expand_country', "Expande un país para ver y gestionar sus ciudades y barrios.")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {filteredLocations.map((loc) => (
                                    <AccordionItem key={loc.id} value={loc.id}>
                                        <AccordionTrigger className="hover:no-underline px-4 bg-slate-50/50 dark:bg-slate-900/20 rounded mb-2">
                                            <div className="flex items-center gap-3 w-full pr-4">
                                                <span className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded font-bold">
                                                    {loc.countryCode}
                                                </span>
                                                <span className="font-semibold text-lg">{loc.countryName}</span>
                                                <Badge variant="secondary" className="ml-auto mr-2">
                                                    {loc.cities.length} ciudades
                                                </Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 border rounded-md mb-4 bg-white dark:bg-slate-950">

                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.locations.registered_cities', "Ciudades Registradas")}</h3>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-8 opacity-80 hover:opacity-100"
                                                    onClick={() => handleDeleteCountry(loc.id, loc.countryName)}
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" /> {t('admin.locations.delete_country', "Eliminar País")}
                                                </Button>
                                            </div>

                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[30%]">{t('admin.locations.city', "Ciudad")}</TableHead>
                                                        <TableHead className="w-[50%]">{t('admin.locations.districts', "Barrios (Stadtteile)")}</TableHead>
                                                        <TableHead className="text-right">{t('admin.locations.actions', "Acciones")}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loc.cities.sort((a, b) => a.name.localeCompare(b.name)).map((city) => (
                                                        <TableRow key={city.name}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                                    {city.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {city.districts.sort().map(dist => (
                                                                        <Badge key={dist} variant="outline" className="text-xs">
                                                                            {dist}
                                                                            <span
                                                                                className="ml-1 cursor-pointer hover:text-red-500 font-bold px-1"
                                                                                onClick={() => handleRemoveDistrict(loc.id, city.name, dist)}
                                                                            >
                                                                                ×
                                                                            </span>
                                                                        </Badge>
                                                                    ))}
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-6 w-6 p-0 rounded-full border border-dashed"
                                                                                onClick={() => {
                                                                                    setActiveCityForDistrict({ countryId: loc.id, cityName: city.name });
                                                                                    setNewDistrictName('');
                                                                                }}
                                                                            >
                                                                                <Plus className="h-3 w-3" />
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                        <DialogContent className="sm:max-w-[425px]">
                                                                            <DialogHeader>
                                                                                <DialogTitle>{t('admin.locations.add_district_to', `Agregar Barrio a ${city.name}`, { city: city.name })}</DialogTitle>
                                                                            </DialogHeader>
                                                                            <div className="grid gap-4 py-4">
                                                                                <div className="grid gap-2">
                                                                                    <Label htmlFor="district-name">{t('admin.locations.district_name', "Nombre del Barrio")}</Label>
                                                                                    <Input
                                                                                        id="district-name"
                                                                                        value={newDistrictName}
                                                                                        onChange={(e) => setNewDistrictName(e.target.value)}
                                                                                        placeholder="Ej: Mitte"
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter') handleAddDistrict();
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <DialogFooter>
                                                                                <Button type="button" onClick={handleAddDistrict}>{t('admin.locations.save', "Guardar")}</Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                                    onClick={() => handleRemoveCity(loc.id, city.name)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                                                        <TableCell colSpan={3}>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    placeholder={t('admin.locations.new_city_placeholder', "Nueva ciudad...")}
                                                                    className="h-8 w-48 bg-white dark:bg-slate-800"
                                                                    value={activeCountryId === loc.id ? newCityName : ''}
                                                                    onChange={(e) => {
                                                                        setActiveCountryId(loc.id);
                                                                        setNewCityName(e.target.value);
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleAddCity(loc.id);
                                                                    }}
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8"
                                                                    onClick={() => handleAddCity(loc.id)}
                                                                    disabled={!newCityName || activeCountryId !== loc.id}
                                                                >
                                                                    <Plus className="h-3 w-3 mr-1" /> {t('admin.locations.add_city_btn', "Agregar Ciudad")}
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                                {filteredLocations.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        {t('admin.locations.no_locations', "No se encontraron ubicaciones registradas.")}
                                        <br />
                                        <span className="text-sm">{t('admin.locations.start_adding', "¡Comienza agregando un país arriba!")}</span>
                                    </div>
                                )}
                            </Accordion>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
