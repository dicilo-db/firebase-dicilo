'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientProspects, markProspectsAsReported } from '@/app/actions/prospects';
import * as XLSX from 'xlsx';

// Mock active B2B clients - In PROD replace with fetch from DB
const MOCK_CLIENTS = [
    { id: 'travelposting-id', name: 'Travelposting' },
    { id: 'club-inviajes-id', name: 'Club Inviajes' },
    { id: 'latam-tours-id', name: 'Latinoamericana Tours' }
];

export function ReportsPanel() {
    const { toast } = useToast();
    const [selectedClient, setSelectedClient] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) {
            toast({ title: 'Error', description: 'Selecciona una empresa.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            // 1. Fetch Data
            // Note: Currently fetch logic gets ALL un-reported prospects for client. 
            // If you specifically want to filter by DATE on Server Side, update action.
            // For now, client logic requests "unreported" and we filter by date or just take all.
            // Based on user request: "Leads de esa empresa en esa fecha"
            // Let's assume we want ALL pending leads active for report, or filter strictly.
            // Implementing Strict Date Filter client-side now for MVP.

            const prospects = await getClientProspects(selectedClient, true);

            // Filter by date (approximate check on ISO string)
            const filtered = prospects.filter(p => p.createdAt.startsWith(date));

            if (filtered.length === 0) {
                toast({ title: 'Sin datos', description: 'No hay leads pendientes para esta fecha/empresa.' });
                setIsLoading(false);
                return;
            }

            // 2. Prepare Excel Data
            const excelData = filtered.map(p => ({
                'ID Lead': p.id,
                'Nombre/Empresa': p.businessName,
                'Teléfono': p.phone,
                'Email': p.email,
                'Sitio Web': p.website,
                'Dirección': p.address,
                'Notas del Agente': p.ocrRawData, // Or logic to combine desc
                'Reclutador': p.recruiterId, // Or resolve name
                'Fecha Captura': new Date(p.createdAt).toLocaleDateString() + ' ' + new Date(p.createdAt).toLocaleTimeString()
            }));

            // 3. Generate File
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Leads");

            const clientName = MOCK_CLIENTS.find(c => c.id === selectedClient)?.name || 'Cliente';
            const fileName = `Reporte_${clientName.replace(/\s+/g, '_')}_${date}.xlsx`;

            XLSX.writeFile(wb, fileName);

            // 4. Mark as Reported (Optional Logic - User might want to re-download)
            // Uncomment to auto-mark:
            // await markProspectsAsReported(filtered.map(p => p.id!));

            toast({ title: 'Éxito', description: `Reporte descargado (${filtered.length} leads).` });

        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Fallo al generar reporte.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full border-green-100 shadow-sm">
            <CardHeader className="pb-3 border-b bg-green-50/50">
                <CardTitle className="text-lg flex items-center text-green-800">
                    <Download className="mr-2 h-5 w-5" />
                    Generar Reporte Diario (B2B)
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleDownload} className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="grid w-full items-center gap-1.5 flex-1">
                            <Label>Empresa Receptora</Label>
                            <Select onValueChange={setSelectedClient} value={selectedClient}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Seleccionar Empresa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MOCK_CLIENTS.map(client => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid w-full items-center gap-1.5 flex-1">
                            <Label>Fecha</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold w-full mt-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar Excel
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
