'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, User, Phone, Video, CalendarCheck2, ExternalLink, Trash2, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, setHours, setMinutes } from 'date-fns';
import { es, de, enUS } from 'date-fns/locale';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateAppointmentTimeAction, deleteAppointmentAction, createBlockAction, updateAppointmentReasonAction } from '@/app/actions/crm-appointments';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';

export default function MasterCalendarPage() {
    const { t, i18n } = useTranslation('common');
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedAppt, setSelectedAppt] = useState<any>(null);
    const [editTime, setEditTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [savingTime, setSavingTime] = useState(false);

    // Block States
    const [blockDialogDay, setBlockDialogDay] = useState<Date | null>(null);
    const [blockTime, setBlockTime] = useState<string>('09:00');
    const [endBlockTime, setEndBlockTime] = useState<string>('');
    const [isFullDayBlock, setIsFullDayBlock] = useState<boolean>(true);
    const [blocking, setBlocking] = useState(false);
    const [blockReason, setBlockReason] = useState<string>('');

    const [isEditingReason, setIsEditingReason] = useState(false);
    const [editReasonText, setEditReasonText] = useState('');
    const [savingReason, setSavingReason] = useState(false);

    const locales: any = { es, de, en: enUS };
    const localeObj = locales[i18n.language] || es;

    useEffect(() => {
        if (selectedAppt) {
            setEditReasonText(selectedAppt.reason || '');
            setIsEditingReason(false);
            setEditTime(format(parseISO(selectedAppt.startTime), 'HH:mm'));
            if (selectedAppt.endTime) {
                setEditEndTime(format(parseISO(selectedAppt.endTime), 'HH:mm'));
            } else {
                setEditEndTime('');
            }
        }
    }, [selectedAppt]);

    // Escuchar el Webhook en tiempo real desde Firestore, filtrado por el usuario logueado
    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'crm_appointments'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const appts: any[] = [];
            snapshot.forEach((doc) => {
                appts.push({ id: doc.id, ...doc.data() });
            });
            // Ordenamos en el cliente para no requerir índice compuesto en producción
            appts.sort((a, b) => {
                const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
                const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
                return timeA - timeB;
            });
            setAppointments(appts);
            setLoadingData(false);
        }, (error) => {
            console.error("Error fetching appointments:", error);
            setLoadingData(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
        e.preventDefault();
        const apptId = e.dataTransfer.getData('apptId');
        if (!apptId) return;

        const appt = appointments.find(a => a.id === apptId);
        if (!appt || !appt.startTime) return;

        try {
            const oldStartDate = parseISO(appt.startTime);
            const newStartDate = new Date(targetDate);
            newStartDate.setHours(oldStartDate.getHours(), oldStartDate.getMinutes(), 0, 0);

            let newEndDateIso: string | undefined = undefined;
            if (appt.endTime) {
                const oldEndDate = parseISO(appt.endTime);
                const newEndDate = new Date(targetDate);
                newEndDate.setHours(oldEndDate.getHours(), oldEndDate.getMinutes(), 0, 0);
                newEndDateIso = newEndDate.toISOString();
            }

            const res = await updateAppointmentTimeAction(apptId, newStartDate.toISOString(), newEndDateIso, user?.uid);
            if (!res.success) throw new Error(res.error);

            toast({
                title: "Reunión movida",
                description: `Se ha reprogramado para el ${format(newStartDate, 'd de MMMM', { locale: localeObj })}`,
            });
        } catch (error) {
            console.error("Error updating appointment date:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo mover la reunión.",
            });
        }
    };

    if (authLoading) return <div className="p-8"><Skeleton className="w-full h-96" /></div>;

    const handleSaveTime = async () => {
        if (!selectedAppt || !editTime) return;
        setSavingTime(true);
        try {
            const date = parseISO(selectedAppt.startTime);
            const [h, m] = editTime.split(':').map(Number);
            const newDate = setMinutes(setHours(date, h), m);
            
            let newEndIso: string | undefined = undefined;
            if (editEndTime) {
                const endDate = parseISO(selectedAppt.endTime || selectedAppt.startTime);
                const [endH, endM] = editEndTime.split(':').map(Number);
                const newEndDate = setMinutes(setHours(endDate, endH), endM);
                newEndIso = newEndDate.toISOString();
            }

            const res = await updateAppointmentTimeAction(selectedAppt.id, newDate.toISOString(), newEndIso, user?.uid);
            if (!res.success) throw new Error(res.error);
            toast({ title: 'Horario actualizado', description: 'La cita ha sido reprogramada.' });
            setSelectedAppt({ ...selectedAppt, startTime: newDate.toISOString(), endTime: newEndIso || null });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cambiar el horario.' });
        } finally {
            setSavingTime(false);
        }
    };

    const handleSaveReason = async () => {
        if (!selectedAppt) return;
        setSavingReason(true);
        try {
            const res = await updateAppointmentReasonAction(selectedAppt.id, editReasonText, user?.uid);
            if (!res.success) throw new Error(res.error);
            toast({ title: 'Texto actualizado', description: 'Los detalles del evento han sido guardados.' });
            setIsEditingReason(false);
            setSelectedAppt({ ...selectedAppt, reason: editReasonText });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el texto.' });
        } finally {
            setSavingReason(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedAppt) return;
        const confirmed = window.confirm("¿Estás seguro de que deseas cancelar y eliminar esta reunión? La hora volverá a estar disponible para reservas.");
        if (!confirmed) return;

        try {
            const res = await deleteAppointmentAction(selectedAppt.id, user?.uid);
            if (!res.success) throw new Error(res.error);
            toast({ title: 'Reunión cancelada', description: 'La cita fue eliminada y la hora ha sido liberada.' });
            setSelectedAppt(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la reunión.' });
        }
    };

    const handleCreateBlock = async () => {
        if (!blockDialogDay) return;
        setBlocking(true);
        const blockDate = new Date(blockDialogDay);
        let endBlockIso: string | null = null;
        if (!isFullDayBlock) {
            const [h, m] = blockTime.split(':').map(Number);
            blockDate.setHours(h, m, 0, 0);
            
            if (endBlockTime) {
                const endDate = new Date(blockDialogDay);
                const [endH, endM] = endBlockTime.split(':').map(Number);
                endDate.setHours(endH, endM, 0, 0);
                endBlockIso = endDate.toISOString();
            }
        } else {
            blockDate.setHours(0, 0, 0, 0);
        }

        try {
            const res = await createBlockAction(
                blockDate.toISOString(), 
                isFullDayBlock, 
                endBlockIso, 
                blockReason || null,
                user?.uid
            );
            if (!res.success) throw new Error(res.error);
            
            toast({ title: 'Bloqueo creado', description: 'El horario ha sido bloqueado con éxito.' });
            setBlockDialogDay(null);
            setBlockReason('');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el bloqueo.' });
        } finally {
            setBlocking(false);
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = monthStart;
    const endDate = monthEnd;

    // Rellenamos días vacíos al inicio para alinear con la semana
    const prefixDays = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1; 

    const dateFormat = "MMMM yyyy";

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const today = () => setCurrentDate(new Date());

    const days = eachDayOfInterval({
        start: monthStart,
        end: monthEnd
    });

    return (
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in zoom-in duration-500">
            {/* Header / Hero */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-800 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden flex justify-between items-center">
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3">
                        <CalendarCheck2 className="w-8 h-8 text-emerald-300" />
                        Calendario Personal
                    </h1>
                    <p className="mt-2 text-emerald-100 text-lg">
                        Tu organizador privado y planificador del día a día.
                    </p>
                </div>
                <div className="relative z-10 flex gap-2">
                    <Button variant="secondary" onClick={today} className="bg-white/20 text-white hover:bg-white/30 border-0">Hoy</Button>
                    <Button variant="secondary" onClick={prevMonth} className="bg-white/20 text-white hover:bg-white/30 border-0"><ChevronLeft className="w-5 h-5"/></Button>
                    <Button variant="secondary" onClick={nextMonth} className="bg-white/20 text-white hover:bg-white/30 border-0"><ChevronRight className="w-5 h-5"/></Button>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm p-6 overflow-hidden">
                <div className="text-2xl font-bold text-slate-800 text-center mb-6 capitalize">
                    {format(currentDate, dateFormat, { locale: localeObj })}
                </div>

                {loadingData ? (
                    <div className="grid grid-cols-7 gap-px bg-slate-200"><Skeleton className="h-64 col-span-7" /></div>
                ) : (
                    <div className="bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
                        {/* Headers */}
                        <div className="grid grid-cols-7 gap-px bg-slate-200">
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                                <div key={d} className="bg-slate-50 py-2 text-center text-sm font-semibold text-slate-600 uppercase">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-7 gap-px bg-slate-200">
                            {Array.from({ length: prefixDays }).map((_, i) => (
                                <div key={`empty-${i}`} className="bg-slate-50/50 min-h-[120px]"></div>
                            ))}
                            
                            {days.map(day => {
                                // Find appointments for this day
                                const dayAppts = appointments.filter(a => {
                                    if(!a.startTime) return false;
                                    const aDate = parseISO(a.startTime);
                                    return isSameDay(aDate, day);
                                });

                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div 
                                        key={day.toString()} 
                                        className={`bg-white min-h-[120px] p-2 transition-colors hover:bg-slate-50 cursor-pointer ${isToday ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-50/10' : ''}`}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => handleDrop(e, day)}
                                        onClick={(e) => {
                                            // Only open block dialog if clicking empty space, not an appointment
                                            if (e.target === e.currentTarget && user) {
                                                setBlockDialogDay(day);
                                                setBlockReason('');
                                            }
                                        }}
                                    >
                                        <div className={`text-right text-sm font-medium p-1 mb-1 ${isToday ? 'text-emerald-700 bg-emerald-100 rounded-md w-fit ml-auto px-2' : 'text-slate-500'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        <div className="space-y-1">
                                            {dayAppts.map((appt, idx) => (
                                                <div 
                                                    key={appt.id || idx} 
                                                    draggable
                                                    onDragStart={(e) => e.dataTransfer.setData('apptId', appt.id)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedAppt(appt);
                                                    }}
                                                    className={`p-1.5 rounded text-xs animate-in fade-in cursor-grab hover:opacity-80 transition-opacity active:cursor-grabbing ${appt.type === 'full_day_block' ? 'bg-red-50 border border-red-200 text-red-800' : appt.type?.includes('block') ? 'bg-orange-50 border border-orange-200 text-orange-800' : 'bg-indigo-50 border border-indigo-100'}`}
                                                >
                                                    <div className={`font-bold flex items-center mb-0.5 ${appt.type?.includes('block') ? 'text-red-700' : 'text-indigo-700'}`}>
                                                        {appt.type?.includes('block') ? <Lock className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                                        {appt.type === 'full_day_block' ? 'Todo el día' : appt.type === 'time_range_block' ? `${format(parseISO(appt.startTime), 'HH:mm')} - ${format(parseISO(appt.endTime), 'HH:mm')}` : format(parseISO(appt.startTime), 'HH:mm')}
                                                    </div>
                                                    <div className={`font-medium truncate ${appt.type?.includes('block') ? 'text-red-900' : 'text-slate-700'}`} title={appt.type?.includes('block') ? (appt.reason || 'Bloqueado') : (appt.inviteeName || appt.clientName)}>
                                                        {appt.type?.includes('block') ? (appt.reason || 'Bloqueado') : (appt.inviteeName || appt.clientName || 'Sin título')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Card>

            <Dialog open={!!selectedAppt} onOpenChange={(open) => !open && setSelectedAppt(null)}>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalles de la Reunión</DialogTitle>
                        <DialogDescription>
                            Información completa sobre la cita programada o el bloqueo activo.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAppt && (
                        <div className="space-y-4 py-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                    {selectedAppt.type?.includes('block') ? 'Datos del evento / Motivo' : 'Invitado'}
                                </span>
                                {selectedAppt.type?.includes('block') ? (
                                    isEditingReason ? (
                                        <div className="mt-2 space-y-2">
                                            <textarea 
                                                value={editReasonText} 
                                                onChange={(e) => setEditReasonText(e.target.value)} 
                                                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[150px]"
                                            />
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={handleSaveReason} disabled={savingReason}>
                                                    {savingReason ? 'Guardando...' : 'Guardar'}
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setIsEditingReason(false)}>
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 group relative">
                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-pre-wrap max-h-60 overflow-y-auto pr-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                                                {selectedAppt.reason || 'Bloqueado'}
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="absolute top-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setIsEditingReason(true)}
                                            >
                                                Editar texto
                                            </Button>
                                            {/* Hint for mobile where hover doesn't exist */}
                                            <div className="text-right mt-1 sm:hidden">
                                                <button onClick={() => setIsEditingReason(true)} className="text-xs text-emerald-600 hover:underline">Editar texto</button>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <span className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
                                        <User className="w-4 h-4" />
                                        {selectedAppt.inviteeName || 'Desconocido'}
                                    </span>
                                )}
                            </div>
                            
                            {selectedAppt.inviteeEmail && (
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email</span>
                                    <span className="text-sm font-medium mt-1">{selectedAppt.inviteeEmail}</span>
                                </div>
                            )}

                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Fecha y Hora</span>
                                                <span className="text-sm font-medium mt-1 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-md w-fit">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    {format(parseISO(selectedAppt.startTime), 'PPPP', { locale: localeObj })}
                                                    {selectedAppt.type === 'full_day_block' ? '' : (
                                                        <> a las {format(parseISO(selectedAppt.startTime), 'HH:mm')} {selectedAppt.endTime ? `- ${format(parseISO(selectedAppt.endTime), 'HH:mm')}` : ''}</>
                                                    )}
                                                </span>
                                                
                                                <div className="mt-3 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700 flex-wrap">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-slate-500" />
                                                        <input 
                                                            type="time" 
                                                            value={editTime}
                                                            onChange={(e) => setEditTime(e.target.value)}
                                                            className="bg-transparent border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                        />
                                                    </div>
                                                    <span className="text-slate-400 font-bold">-</span>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="time" 
                                                            value={editEndTime}
                                                            onChange={(e) => setEditEndTime(e.target.value)}
                                                            placeholder="Fin"
                                                            className="bg-transparent border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                        />
                                                    </div>
                                                    <Button 
                                                        size="sm" 
                                                        onClick={handleSaveTime} 
                                                        disabled={savingTime || (editTime === format(parseISO(selectedAppt.startTime), 'HH:mm') && (!selectedAppt.endTime || editEndTime === format(parseISO(selectedAppt.endTime), 'HH:mm')))}
                                                    >
                                                        {savingTime ? 'Guardando...' : 'Guardar'}
                                                    </Button>
                                                </div>
                                            </div>

                            {selectedAppt.status && (
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Estado</span>
                                    <span className="text-sm capitalize font-medium mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">{selectedAppt.status}</span>
                                </div>
                            )}

                            {selectedAppt.meetLink && (
                                <div className="pt-4 border-t">
                                    <Button asChild className="w-full">
                                        <a href={selectedAppt.meetLink} target="_blank" rel="noreferrer">
                                            <Video className="w-4 h-4 mr-2" />
                                            Unirse a la Reunión
                                            <ExternalLink className="w-3 h-3 ml-2" />
                                        </a>
                                    </Button>
                                </div>
                            )}

                            <div className="pt-4 border-t flex flex-col sm:flex-row justify-end gap-2">
                                {selectedAppt.type?.includes('block') ? (
                                    user && (
                                        <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Eliminar Bloqueo
                                        </Button>
                                    )
                                ) : (
                                    <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Cancelar y Eliminar Cita
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog para Bloquear Día/Hora */}
            <Dialog open={!!blockDialogDay} onOpenChange={(open) => !open && setBlockDialogDay(null)}>
                <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-red-500" />
                            Bloquear Horario
                        </DialogTitle>
                        <DialogDescription>
                            Día seleccionado: <strong className="text-slate-800 dark:text-white">{blockDialogDay && format(blockDialogDay, 'PPPP', { locale: localeObj })}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer" onClick={() => setIsFullDayBlock(!isFullDayBlock)}>
                            <input type="checkbox" id="fullDay" checked={isFullDayBlock} readOnly className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
                            <div className="flex flex-col">
                                <label htmlFor="fullDay" className="text-sm font-bold text-slate-800 dark:text-white cursor-pointer">Bloquear todo el día</label>
                                <span className="text-xs text-slate-500">Nadie podrá reservar en ninguna hora de este día.</span>
                            </div>
                        </div>

                        {!isFullDayBlock && (
                            <div className="flex flex-col space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-800 dark:text-white">Hora de inicio</label>
                                    <div className="flex items-center gap-3 mt-1">
                                        <Clock className="w-5 h-5 text-slate-400" />
                                        <input type="time" value={blockTime} onChange={(e) => setBlockTime(e.target.value)} className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-800 dark:text-white">Hora de fin (Opcional)</label>
                                    <div className="flex items-center gap-3 mt-1">
                                        <Clock className="w-5 h-5 text-slate-400" />
                                        <input type="time" value={endBlockTime} onChange={(e) => setEndBlockTime(e.target.value)} className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                    <span className="text-xs text-slate-500 mt-2 block">Selecciona una hora de fin para bloquear un rango de horas, o déjalo vacío para bloquear solo una hora específica.</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-bold text-slate-800 dark:text-white">Datos del evento / Motivo del bloqueo</label>
                            <textarea 
                                value={blockReason} 
                                onChange={(e) => setBlockReason(e.target.value)} 
                                placeholder="Ej: Reunión con cliente, Evento especial, etc." 
                                className="mt-1 w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                            />
                        </div>

                        <Button onClick={handleCreateBlock} disabled={blocking} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12">
                            {blocking ? 'Bloqueando...' : 'Confirmar Bloqueo'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
