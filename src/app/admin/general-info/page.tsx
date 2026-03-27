'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, getDocs, orderBy, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { broadcastGeneralInfoNewsletter } from '@/app/actions/admin-general-info';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Loader2, Search, Trash2, LayoutDashboard, RefreshCw, Pen, Plus, Calendar, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const db = getFirestore(app);

export default function GeneralInfoPage() {
    useAuthGuard(['admin', 'superadmin']);
    const { t } = useTranslation('admin');
    const { toast } = useToast();
    
    const [infoList, setInfoList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Edit/Add State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'general_info'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInfoList(data);
        } catch (error: any) {
            console.error('Error fetching general info:', error);
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los datos.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'general_info', id));
            toast({ title: 'Eliminado', description: 'Registro eliminado exitosamente.' });
            setInfoList(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo eliminar el registro.', variant: 'destructive' });
        }
    };

    const handleSave = async () => {
        if (!editingItem?.title || !editingItem?.type) {
            toast({ title: 'Validación', description: 'El título y el tipo son obligatorios.', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        try {
            const dataToSave = {
                title: editingItem.title,
                type: editingItem.type,
                date: editingItem.date || null,
                time: editingItem.time || null,
                endTime: editingItem.endTime || null,
                url: editingItem.url || '',
                description: editingItem.description || '',
                active: editingItem.active !== undefined ? editingItem.active : true,
                updatedAt: serverTimestamp(),
            };

            if (editingItem.id) {
                // Update
                await updateDoc(doc(db, 'general_info', editingItem.id), dataToSave);
                toast({ title: 'Actualizado', description: 'Registro actualizado con éxito.' });
            } else {
                // Create
                const docRef = await addDoc(collection(db, 'general_info'), {
                    ...dataToSave,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Creado', description: 'Nuevo registro añadido. Disparando notificaciones...' });

                // Dispatch if it was saved as active 
                if (dataToSave.active) {
                    try {
                        const result = await broadcastGeneralInfoNewsletter({
                            type: dataToSave.type as 'note' | 'event',
                            title: dataToSave.title,
                            description: dataToSave.description,
                            url: dataToSave.url,
                            date: dataToSave.date || undefined,
                            time: dataToSave.time || undefined,
                            endTime: dataToSave.endTime || undefined
                        });
                        if (!result.success) {
                            toast({ title: 'Aviso Notificaciones', description: 'Guardado, pero falló el envío: ' + result.error, variant: 'destructive' });
                        } else {
                            toast({ title: 'Notificaciones', description: `Se enviaron ${result.count} correos exitosamente.` });
                        }
                    } catch (err: any) {
                        console.error('Broadcast failed:', err);
                        toast({ title: 'Aviso', description: 'Falló el envío de correos: ' + err.message, variant: 'destructive' });
                    }
                }
            }
            setIsDialogOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const openCreateDialog = () => {
        setEditingItem({
            type: 'note',
            active: true,
            title: '',
            description: '',
            url: '',
            date: '',
            time: '',
            endTime: ''
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (item: any) => {
        setEditingItem({ ...item });
        setIsDialogOpen(true);
    };

    const filteredList = infoList.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
            <main className="container mx-auto p-4 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            Módulo de Información General
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Administra eventos del calendario y la sección de últimas noticias/enlaces.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Panel Admin
                            </Link>
                        </Button>
                        <Button onClick={fetchData} variant="outline" disabled={isLoading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                        <Button onClick={openCreateDialog} className="bg-teal-600 hover:bg-teal-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Registro
                        </Button>
                    </div>
                </div>

                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-white dark:bg-slate-800 border-b">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                Eventos y Noticias
                                <Badge variant="secondary" className="ml-2 bg-teal-100 text-teal-700 hover:bg-teal-100">
                                    {filteredList.length} Total
                                </Badge>
                            </CardTitle>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por título..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                        <TableRow>
                                            <TableHead>Título</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-center">Vistas</TableHead>
                                            <TableHead>Fecha Programada</TableHead>
                                            <TableHead>Enlace</TableHead>
                                            <TableHead className="text-center">Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredList.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                                                    No hay registros disponibles.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredList.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <TableCell className="font-medium">
                                                        {item.title}
                                                        {item.description && (
                                                            <span className="block text-xs text-muted-foreground truncate max-w-[200px]" title={item.description}>
                                                                {item.description}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.type === 'event' ? (
                                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                                <Calendar className="w-3 h-3 mr-1" /> Calendario
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                <LinkIcon className="w-3 h-3 mr-1" /> Noticia / Link
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary" className="bg-slate-100/50 text-slate-600 border-transparent hover:bg-slate-200 font-mono">
                                                            <Eye className="w-3 h-3 mr-1 text-slate-400" /> {item.views || 0}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm min-w-[140px]">
                                                        {item.type === 'event' && item.date ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-medium whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</span>
                                                                {(item.time || item.endTime) && (
                                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                        {item.time || '-'} a {item.endTime || '-'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : <span className="text-muted-foreground">-</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.url ? (
                                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center text-xs bg-blue-50 w-fit px-2 py-1 rounded max-w-[150px] truncate">
                                                                <LinkIcon className="w-3 h-3 mr-1 flex-shrink-0" /> {item.url}
                                                            </a>
                                                        ) : <span className="text-muted-foreground text-sm">-</span>}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {item.active ? (
                                                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                                                                <Eye className="w-3 h-3 mr-1" /> Visible
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">
                                                                <EyeOff className="w-3 h-3 mr-1" /> Oculto
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)}>
                                                                <Pen className="h-4 w-4" />
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="hover:bg-destructive/10 text-destructive">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Se borrará permanentemente y desaparecerá del dashboard de los usuarios. Esta acción no se puede deshacer.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Dialogo CREAR / EDITAR */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingItem?.id ? 'Editar Registro' : 'Añadir Nuevo Registro'}</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Tipo de Información <span className="text-red-500">*</span></Label>
                                <Select 
                                    value={editingItem.type} 
                                    onValueChange={(val) => setEditingItem({...editingItem, type: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="note">Noticia / Enlace (Video Youtube, Drive, etc)</SelectItem>
                                        <SelectItem value="event">Evento de Calendario (Reunión, Cierre)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Título Visible <span className="text-red-500">*</span></Label>
                                <Input 
                                    placeholder="Ej. Actualización del sistema v2.0"
                                    value={editingItem.title}
                                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                                />
                            </div>

                            {editingItem.type === 'event' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fecha del Evento <span className="text-red-500">*</span></Label>
                                        <Input 
                                            type="date"
                                            value={editingItem.date || ''}
                                            onChange={(e) => setEditingItem({...editingItem, date: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hora de Inicio</Label>
                                        <Input 
                                            type="time"
                                            value={editingItem.time || ''}
                                            onChange={(e) => setEditingItem({...editingItem, time: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hora de Fin</Label>
                                        <Input 
                                            type="time"
                                            value={editingItem.endTime || ''}
                                            onChange={(e) => setEditingItem({...editingItem, endTime: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Enlace Externo (Opcional)</Label>
                                <Input 
                                    placeholder="https://youtube.com/... o https://drive.google.com/..."
                                    value={editingItem.url}
                                    onChange={(e) => setEditingItem({...editingItem, url: e.target.value})}
                                />
                                <p className="text-[10px] text-muted-foreground leading-tight">
                                    Perfecto para videos de YouTube, carpetas de Nextcloud o documentos de Drive. Si usas 'Noticia / Enlace', asegúrate de colocar uno.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Descripción (Opcional)</Label>
                                <Textarea 
                                    placeholder="Escribe algunas notas descriptivas..."
                                    value={editingItem.description}
                                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                                    className="h-20"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t mt-2">
                                <input 
                                    type="checkbox" 
                                    id="status-checkbox"
                                    checked={editingItem.active}
                                    onChange={(e) => setEditingItem({...editingItem, active: e.target.checked})}
                                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                                />
                                <Label htmlFor="status-checkbox" className="cursor-pointer">Publicar (Visible para los usuarios)</Label>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingItem?.id ? 'Guardar Cambios' : 'Crear Registro'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
