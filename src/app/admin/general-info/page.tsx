'use client';

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, getDocs, orderBy, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { broadcastGeneralInfoNewsletter, saveGeneralInfoAction } from '@/app/actions/admin-general-info';
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
import { Loader2, Search, Trash2, LayoutDashboard, RefreshCw, Pen, Plus, Calendar, Link as LinkIcon, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { GeneralInfoAdminComments } from '@/components/admin/GeneralInfoAdminComments';
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
    DialogDescription,
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
    const [commentsItemOpen, setCommentsItemOpen] = useState<any | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            if (filesArray.length > 10) {
                toast({ title: 'Límite superado', description: 'Por favor, selecciona un máximo de 10 archivos.', variant: 'destructive' });
                return;
            }
            setSelectedFiles(filesArray);
        } else {
            setSelectedFiles([]);
        }
    };

    const handleSave = async () => {
        if (!editingItem?.title || !editingItem?.type) {
            toast({ title: 'Validación', description: 'El título y el tipo son obligatorios.', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            if (editingItem.id) formData.append('id', editingItem.id);
            formData.append('title', editingItem.title);
            formData.append('type', editingItem.type);
            formData.append('date', editingItem.date || '');
            formData.append('time', editingItem.time || '');
            formData.append('endTime', editingItem.endTime || '');
            formData.append('url', editingItem.url || '');
            formData.append('description', editingItem.description || '');
            formData.append('active', (editingItem.active !== undefined ? editingItem.active : true).toString());
            formData.append('adminComment', editingItem.admin_comment || '');

            // Keep existing paths if not replaced (array format)
            const legacyPaths = [];
            if (editingItem.pdf_path) legacyPaths.push(editingItem.pdf_path);
            if (editingItem.video_path) legacyPaths.push(editingItem.video_path);
            if (editingItem.image_path) legacyPaths.push(editingItem.image_path);
            if (Array.isArray(editingItem.media_paths)) legacyPaths.push(...editingItem.media_paths);
            
            formData.append('legacyPaths', JSON.stringify(legacyPaths));

            if (selectedFiles.length > 0) {
                selectedFiles.forEach(file => {
                    formData.append('files', file);
                });
            }

            const result = await saveGeneralInfoAction(formData);

            if (!result.success) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
                setIsSaving(false);
                return;
            }

            toast({ title: editingItem.id ? 'Actualizado' : 'Creado', description: 'Registro guardado con éxito.' });

            // Dispatch if it was saved as active 
            if (result.dataToSave.active && !editingItem.id) {
                try {
                    const broadcastResult = await broadcastGeneralInfoNewsletter({
                        type: result.dataToSave.type as 'note' | 'event',
                        title: result.dataToSave.title,
                        description: result.dataToSave.description,
                        url: result.dataToSave.url || (result.dataToSave.media_paths && result.dataToSave.media_paths[0]) || '',
                        date: result.dataToSave.date || '',
                        time: result.dataToSave.time || '',
                        endTime: result.dataToSave.endTime || ''
                    });
                    if (!broadcastResult.success) {
                        toast({ title: 'Aviso Notificaciones', description: 'Guardado, pero falló el envío: ' + broadcastResult.error, variant: 'destructive' });
                    } else {
                        toast({ title: 'Notificaciones', description: `Se enviaron ${broadcastResult.count} correos exitosamente.` });
                    }
                } catch (err: any) {
                    console.error('Broadcast failed:', err);
                    toast({ title: 'Aviso', description: 'Falló el envío de correos: ' + err.message, variant: 'destructive' });
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
        setSelectedFiles([]);
        setEditingItem({
            type: 'note',
            active: true,
            title: '',
            description: '',
            url: '',
            date: '',
            time: '',
            endTime: '',
            admin_comment: '',
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (item: any) => {
        setSelectedFiles([]);
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
                                                            <Button size="icon" variant="ghost" onClick={() => setCommentsItemOpen(item)} title="Ver Comentarios" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                                                                <MessageSquare className="h-4 w-4" />
                                                            </Button>
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
                <DialogContent className="sm:max-w-3xl w-11/12 max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2 border-b shrink-0 bg-slate-50">
                        <DialogTitle>{editingItem?.id ? 'Editar Registro' : 'Añadir Nuevo Registro'}</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            <SelectItem value="note">Noticia / Enlace</SelectItem>
                                            <SelectItem value="event">Evento de Calendario</SelectItem>
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
                            </div>

                            {editingItem.type === 'event' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-purple-50/30 p-4 rounded-lg border border-purple-100">
                                    <div className="space-y-2">
                                        <Label className="text-purple-800">Fecha del Evento <span className="text-red-500">*</span></Label>
                                        <Input 
                                            type="date"
                                            value={editingItem.date || ''}
                                            onChange={(e) => setEditingItem({...editingItem, date: e.target.value})}
                                            className="border-purple-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-purple-800">Hora de Inicio</Label>
                                        <Input 
                                            type="time"
                                            value={editingItem.time || ''}
                                            onChange={(e) => setEditingItem({...editingItem, time: e.target.value})}
                                            className="border-purple-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-purple-800">Hora de Fin</Label>
                                        <Input 
                                            type="time"
                                            value={editingItem.endTime || ''}
                                            onChange={(e) => setEditingItem({...editingItem, endTime: e.target.value})}
                                            className="border-purple-200"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Enlace Externo (Opcional)</Label>
                                    <Input 
                                        placeholder="https://youtube.com/..."
                                        value={editingItem.url}
                                        onChange={(e) => setEditingItem({...editingItem, url: e.target.value})}
                                    />
                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                        Perfecto para videos de YouTube, Noticia / Enlace.
                                    </p>
                                </div>

                                <div className="space-y-4 relative">
                                    <Label 
                                        className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-teal-300 rounded-lg bg-teal-50/50 hover:bg-teal-100/50 transition-colors text-center"
                                    >
                                        <LinkIcon className="w-8 h-8 text-teal-500 mb-2" />
                                        <span className="font-semibold text-teal-800">Haz clic aquí para seleccionar archivos (Máx. 10)</span>
                                        <span className="text-xs text-teal-600 font-normal mt-1">Soporta: PDF, JPEG, JPG, PNG, y Video</span>
                                    </Label>
                                    <input 
                                        id="media-upload"
                                        type="file"
                                        multiple
                                        accept=".pdf,image/*,video/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {selectedFiles.length > 0 && (
                                        <div className="bg-white border border-teal-100 p-2 rounded text-sm text-teal-800 shadow-sm">
                                            ✅ <strong>{selectedFiles.length} archivo(s) listos:</strong> {selectedFiles.map(f => f.name).join(', ')}
                                        </div>
                                    )}
                                    {(editingItem.pdf_path || editingItem.image_path || editingItem.video_path || (editingItem.media_paths && editingItem.media_paths.length > 0)) && selectedFiles.length === 0 ? (
                                        <p className="text-[11px] text-green-700 font-medium bg-green-50 p-2 rounded">✨ Ya existen archivos almacenados. Si subes nuevos, se SUMARÁN al registro original.</p>
                                    ) : null}
                                </div>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div className="space-y-2">
                                    <Label>Comentarios de la actualización (UX Admin)</Label>
                                    <Textarea 
                                        placeholder="Dejar nota interna (solo administradores)"
                                        value={editingItem.admin_comment || ''}
                                        onChange={(e) => setEditingItem({...editingItem, admin_comment: e.target.value})}
                                        className="h-10 bg-amber-50"
                                    />
                                </div>
                                
                                <div className="flex items-center gap-2 p-3 bg-slate-50 border rounded-lg h-[68px]">
                                    <input 
                                        type="checkbox" 
                                        id="status-checkbox"
                                        checked={editingItem.active}
                                        onChange={(e) => setEditingItem({...editingItem, active: e.target.checked})}
                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-5 w-5 cursor-pointer"
                                    />
                                    <Label htmlFor="status-checkbox" className="cursor-pointer font-medium">Publicar (Visible para los usuarios)</Label>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="p-4 bg-slate-50 border-t shrink-0 flex items-center justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingItem?.id ? 'Guardar Cambios' : 'Crear Registro'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialogo COMENTARIOS DE USUARIOS */}
            <Dialog open={!!commentsItemOpen} onOpenChange={(open) => !open && setCommentsItemOpen(null)}>
                <DialogContent className="max-w-md w-11/12 p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b bg-slate-50">
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-teal-600" />
                            Comentarios de los Usuarios
                        </DialogTitle>
                        <DialogDescription className="text-xs truncate max-w-sm">
                            Tema: {commentsItemOpen?.title}
                        </DialogDescription>
                    </DialogHeader>
                    {commentsItemOpen && (
                        <GeneralInfoAdminComments infoId={commentsItemOpen.id} />
                    )}
                    <div className="p-4 border-t bg-slate-50 flex justify-end">
                        <Button variant="outline" onClick={() => setCommentsItemOpen(null)}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
