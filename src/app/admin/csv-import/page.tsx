'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UploadCloud, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const db = getFirestore(app);

const TARGET_FIELDS = [
  { id: 'name', label: 'Nombre' },
  { id: 'address', label: 'Dirección' },
  { id: 'phone', label: 'Teléfono' },
  { id: 'email', label: 'Email' },
  { id: 'website', label: 'Sitio Web' },
  { id: 'city', label: 'Ciudad' },
  { id: 'zip', label: 'Código Postal' },
  { id: 'category', label: 'Categoría' },
];

export default function CsvImportPage() {
  useAuthGuard(['admin', 'superadmin'], 'access_admin_panel');
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [delimiter, setDelimiter] = useState<string>(','); // Default to comma
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [mappingType, setMappingType] = useState<Record<string, 'csv' | 'manual' | 'ignore'>>({}); 
  const [mappingCsv, setMappingCsv] = useState<Record<string, string>>({}); // targetField -> csvHeader
  const [mappingManual, setMappingManual] = useState<Record<string, string>>({}); // targetField -> manual string
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isFinished, setIsFinished] = useState(false);

  const processFile = (uploadedFile: File, selectedDelimiter: string) => {
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      delimiter: selectedDelimiter,
      complete: (results) => {
        if (results.meta.fields) {
          // Filter out empty headers which crash Radix UI Select
          const cleanHeaders = results.meta.fields.filter(h => h.trim() !== '');
          setCsvHeaders(cleanHeaders);
          
          // Auto-mapping logic
          const autoMapCsv: Record<string, string> = {};
          const autoMapType: Record<string, 'csv' | 'manual' | 'ignore'> = {};
          
          TARGET_FIELDS.forEach(f => autoMapType[f.id] = 'ignore');

          cleanHeaders.forEach(header => {
            const h = header.toLowerCase().trim();
            if (h.includes('nombre') || h.includes('name')) { autoMapCsv['name'] = header; autoMapType['name'] = 'csv'; }
            if (h.includes('dirección') || h.includes('direccion') || h.includes('address')) { autoMapCsv['address'] = header; autoMapType['address'] = 'csv'; }
            if (h.includes('teléfono') || h.includes('telefono') || h.includes('phone')) { autoMapCsv['phone'] = header; autoMapType['phone'] = 'csv'; }
            if (h.includes('email') || h.includes('correo')) { autoMapCsv['email'] = header; autoMapType['email'] = 'csv'; }
            if (h.includes('sitio web') || h.includes('web') || h.includes('url')) { autoMapCsv['website'] = header; autoMapType['website'] = 'csv'; }
            if (h.includes('ciudad') || h.includes('city')) { autoMapCsv['city'] = header; autoMapType['city'] = 'csv'; }
            if (h.includes('postal') || h.includes('zip') || h.includes('plz')) { autoMapCsv['zip'] = header; autoMapType['zip'] = 'csv'; }
            if (h.includes('categoría') || h.includes('categoria') || h.includes('category')) { autoMapCsv['category'] = header; autoMapType['category'] = 'csv'; }
          });
          setMappingCsv(autoMapCsv);
          setMappingType(autoMapType);
        }
        setCsvData(results.data);
      },
      error: (error) => {
        toast({ title: 'Error leyendo CSV', description: error.message, variant: 'destructive' });
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsFinished(false);
    setMappingType({});
    setMappingCsv({});
    setMappingManual({});
    processFile(uploadedFile, delimiter);
  };

  const handleDelimiterChange = (newDelimiter: string) => {
    setDelimiter(newDelimiter);
    if (file) {
      processFile(file, newDelimiter);
    }
  };

  const handleImport = async () => {
    if (mappingType['name'] === 'ignore' || (mappingType['name'] === 'csv' && !mappingCsv['name']) || (mappingType['name'] === 'manual' && !mappingManual['name'])) {
      toast({ title: 'Atención', description: 'El campo "Nombre" es obligatorio. Por favor mapea una columna o escribe un valor manual.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: csvData.length });

    try {
      const BATCH_SIZE = 400; // Firestore limit is 500, keeping it safe
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      let totalProcessed = 0;

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        
        // Base business data
        const businessData: any = {
          description: '',
          country: 'Deutschland',
          active: true,
          tier_level: 'basic',
          createdAt: new Date().toISOString()
        };

        // First, append ALL raw columns from the CSV dynamically so no data is lost
        Object.keys(row).forEach(csvKey => {
            if(csvKey && csvKey.trim() !== '' && row[csvKey]) {
                // Remove dots or invalid chars for Firestore keys
                const safeKey = csvKey.replace(/\./g, '_');
                businessData[safeKey] = row[csvKey];
            }
        });

        // Then, specifically map the standard Dicilo target fields
        TARGET_FIELDS.forEach(field => {
          const type = mappingType[field.id] || 'ignore';
          if (type === 'csv') {
            const mappedHeader = mappingCsv[field.id];
            if (mappedHeader && row[mappedHeader]) {
              businessData[field.id] = row[mappedHeader].trim();
            } else if (!businessData[field.id]) {
              businessData[field.id] = '';
            }
          } else if (type === 'manual') {
             businessData[field.id] = mappingManual[field.id] || '';
          } else {
             if (!businessData[field.id]) businessData[field.id] = '';
          }
        });

        // Skip rows without a mapped name
        if (!businessData.name) continue;

        const newDocRef = doc(collection(db, 'businesses'));
        currentBatch.set(newDocRef, businessData);
        operationCount++;
        totalProcessed++;

        if (operationCount >= BATCH_SIZE) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          operationCount = 0;
          setProgress({ current: totalProcessed, total: csvData.length });
        }
      }

      if (operationCount > 0) {
        await currentBatch.commit();
      }

      setProgress({ current: csvData.length, total: csvData.length });
      setIsFinished(true);
      toast({ title: 'Importación Exitosa', description: `Se importaron ${totalProcessed} registros correctamente.` });
      
    } catch (error: any) {
      console.error('Error importing:', error);
      toast({ title: 'Error durante la importación', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <main className="flex-grow p-4 md:p-8 container mx-auto w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Importador de Base de Datos CSV</h1>
            <p className="text-muted-foreground mt-1">Sube tu archivo Excel (.csv) para poblar masivamente las empresas básicas.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard</Link>
          </Button>
        </div>

        {!file && (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Sube tu archivo CSV</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-2 mb-6">
                Asegúrate de que tu archivo esté en formato .csv separado por comas. El sistema detectará automáticamente las columnas.
              </p>
              
              <div className="flex items-center gap-4 mb-6">
                 <span className="text-sm font-medium">Separador del CSV:</span>
                 <Select value={delimiter} onValueChange={setDelimiter}>
                    <SelectTrigger className="w-40 bg-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value=",">Coma (,)</SelectItem>
                        <SelectItem value=";">Punto y coma (;)</SelectItem>
                        <SelectItem value="\t">Tabulación</SelectItem>
                    </SelectContent>
                 </Select>
              </div>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button>Seleccionar Archivo CSV</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {file && !isFinished && (
          <Card className="animate-in fade-in slide-in-from-bottom-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                  <div>
                      <CardTitle>Mapeo de Columnas</CardTitle>
                      <CardDescription>
                        Empareja las columnas de tu archivo CSV con los campos de la plataforma Dicilo.
                      </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-medium">Cambiar Separador:</span>
                     <Select value={delimiter} onValueChange={handleDelimiterChange}>
                        <SelectTrigger className="w-32 bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=",">Coma (,)</SelectItem>
                            <SelectItem value=";">Punto y coma (;)</SelectItem>
                            <SelectItem value="\t">Tabulación</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border mb-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-1/3">Campo en Dicilo</TableHead>
                      <TableHead className="w-2/3">Columna en tu CSV o Valor Manual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TARGET_FIELDS.map((field) => {
                      const currentType = mappingType[field.id] || 'ignore';
                      const currentCsvVal = mappingCsv[field.id] || '';
                      
                      return (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">
                          {field.label} {field.id === 'name' && <span className="text-red-500">*</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Select
                              value={currentType === 'csv' ? `csv-${currentCsvVal}` : currentType}
                              onValueChange={(val) => {
                                if (val === 'ignore' || val === 'manual') {
                                  setMappingType({ ...mappingType, [field.id]: val });
                                } else if (val.startsWith('csv-')) {
                                  setMappingType({ ...mappingType, [field.id]: 'csv' });
                                  setMappingCsv({ ...mappingCsv, [field.id]: val.replace('csv-', '') });
                                }
                              }}
                              disabled={isProcessing}
                            >
                              <SelectTrigger className="bg-white min-w-[200px] flex-1">
                                <SelectValue placeholder="Ignorar (Dejar vacío)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ignore" className="text-muted-foreground italic">-- Ignorar (Dejar vacío) --</SelectItem>
                                <SelectItem value="manual" className="font-semibold text-blue-600">✍️ Escribir valor manual...</SelectItem>
                                {csvHeaders.map(header => (
                                  <SelectItem key={header} value={`csv-${header}`}>{header}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {currentType === 'manual' && (
                                <input 
                                   type="text"
                                   placeholder={`Ej: Hamburg...`}
                                   value={mappingManual[field.id] || ''}
                                   onChange={(e) => setMappingManual({...mappingManual, [field.id]: e.target.value})}
                                   className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                                   disabled={isProcessing}
                                />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>

              {/* Preview Section */}
              {csvData.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Vista Previa del primer registro:</h4>
                  <div className="p-4 bg-muted rounded-md text-sm">
                    {TARGET_FIELDS.map(f => {
                      const type = mappingType[f.id] || 'ignore';
                      let val = '(Vacío)';
                      if (type === 'csv' && mappingCsv[f.id] && csvData[0][mappingCsv[f.id]]) {
                          val = csvData[0][mappingCsv[f.id]];
                      } else if (type === 'manual' && mappingManual[f.id]) {
                          val = mappingManual[f.id] + ' (Manual)';
                      }
                      
                      return (
                        <div key={f.id} className="grid grid-cols-3 py-1 border-b last:border-0 border-slate-200">
                          <span className="font-medium">{f.label}:</span>
                          <span className="col-span-2 text-slate-600 truncate">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-8 pt-4 border-t">
                <Button variant="ghost" onClick={() => setFile(null)} disabled={isProcessing}>
                  Cancelar
                </Button>
                
                <div className="flex items-center gap-4">
                  {isProcessing && (
                    <span className="text-sm font-medium text-blue-600">
                      Procesando {progress.current} de {progress.total}...
                    </span>
                  )}
                  <Button onClick={handleImport} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Comenzar Importación
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isFinished && (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-green-900">¡Importación Completada!</h3>
              <p className="text-green-700 mt-2 mb-8 max-w-md">
                Tus bases de datos se han insertado exitosamente. Ahora puedes encontrarlas en el panel de Empresas Básicas para terminar de rellenarlas y geolocalizarlas manualmente.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setFile(null)}>Importar otro archivo</Button>
                <Button asChild>
                  <Link href="/admin/basic">Ir a Empresas Básicas</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
