'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, Loader2, PlusCircle } from 'lucide-react';

import { suggestLocation } from '@/app/actions/location-suggestions';
import { getLocations, LocationData, City } from '@/app/actions/admin-locations';
import { useToast } from '@/hooks/use-toast';

import { User } from 'firebase/auth';

export function SuggestLocationDialog({ currentUser }: { currentUser?: User | null }) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('city');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Data state
    const [locations, setLocations] = useState<LocationData[]>([]);
    
    // Form state
    const [selectedCountryId, setSelectedCountryId] = useState('');
    const [selectedCityName, setSelectedCityName] = useState('');
    const [newCityName, setNewCityName] = useState('');
    const [newDistrictName, setNewDistrictName] = useState('');

    useEffect(() => {
        if (open && locations.length === 0) {
            loadLocations();
        }
    }, [open]);

    const loadLocations = async () => {
        setIsLoading(true);
        const res = await getLocations();
        if (res.success && res.data) {
            setLocations(res.data);
            if (res.data.length > 0) {
                // Select Germany by default if exists or the first one
                const defaultCountry = res.data.find(d => d.countryCode === 'DE' || d.countryName === 'Alemania') || res.data[0];
                setSelectedCountryId(defaultCountry.id);
            }
        }
        setIsLoading(false);
    };

    const handleSuggest = async () => {
        if (!currentUser) return;
        setIsSubmitting(true);

        const targetCountry = locations.find(l => l.id === selectedCountryId);
        if (!targetCountry) {
            setIsSubmitting(false);
            return;
        }

        let res;
        if (activeTab === 'city') {
            res = await suggestLocation({
                type: 'city',
                userId: currentUser.uid,
                countryId: targetCountry.id,
                countryName: targetCountry.countryName,
                cityName: newCityName,
            });
        } else {
            res = await suggestLocation({
                type: 'district',
                userId: currentUser.uid,
                countryId: targetCountry.id,
                countryName: targetCountry.countryName,
                cityName: selectedCityName,
                districtName: newDistrictName,
            });
        }

        setIsSubmitting(false);

        if (res.success) {
            toast({
                title: "¡Gracias por tu aportación!",
                description: res.message,
            });
            setOpen(false);
            // Reset fields
            setNewCityName('');
            setNewDistrictName('');
            setSelectedCityName('');
        } else {
            toast({
                title: "Atención",
                description: res.error,
                variant: 'destructive'
            });
        }
    };

    const selectedCountry = locations.find(l => l.id === selectedCountryId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary border-t pt-4 mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Sugerir Nueva Ubicación
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Añadir Ubicación a Dicilo</DialogTitle>
                    <DialogDescription>
                        Para mantener el orden, toda ubicación será validada por nuestro equipo antes de aparecer públicamente.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-6"><Loader2 className="animate-spin text-slate-400" /></div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="city">Nueva Ciudad</TabsTrigger>
                            <TabsTrigger value="district">Nuevo Barrio</TabsTrigger>
                        </TabsList>
                        
                        <div className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <Label>País</Label>
                                <select 
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedCountryId}
                                    onChange={e => {
                                        setSelectedCountryId(e.target.value);
                                        setSelectedCityName('');
                                    }}
                                >
                                    <option value="" disabled>Selecciona un país</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.countryName}</option>
                                    ))}
                                </select>
                            </div>

                            <TabsContent value="city" className="space-y-2 mt-0">
                                <Label>Nombre de la Ciudad</Label>
                                <Input 
                                    placeholder="Ej. Múnich" 
                                    value={newCityName} 
                                    onChange={e => setNewCityName(e.target.value)} 
                                />
                            </TabsContent>

                            <TabsContent value="district" className="space-y-4 mt-0">
                                <div className="space-y-2">
                                    <Label>¿En qué ciudad se encuentra el barrio?</Label>
                                    <select 
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={selectedCityName}
                                        onChange={e => setSelectedCityName(e.target.value)}
                                    >
                                        <option value="" disabled>Selecciona la ciudad</option>
                                        {selectedCountry?.cities.sort((a,b)=>a.name.localeCompare(b.name)).map(city => (
                                            <option key={city.name} value={city.name}>{city.name}</option>
                                        ))}
                                    </select>
                                    {selectedCountry && selectedCountry.cities.length === 0 && (
                                        <p className="text-xs text-red-500">Este país aún no tiene ciudades registradas. Sugiere una ciudad primero.</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Nombre del Barrio / Distrito</Label>
                                    <Input 
                                        placeholder="Ej. Sternschanze" 
                                        value={newDistrictName} 
                                        onChange={e => setNewDistrictName(e.target.value)} 
                                    />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                )}

                <DialogFooter className="mt-6 border-t pt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button 
                        onClick={handleSuggest} 
                        disabled={
                            isSubmitting || 
                            !selectedCountryId || 
                            (activeTab === 'city' && !newCityName.trim()) || 
                            (activeTab === 'district' && (!selectedCityName || !newDistrictName.trim()))
                        }
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
                        Enviar Sugerencia
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
