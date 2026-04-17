'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarCheck2, Clock, Globe2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface NativeBookingDialogProps {
    trigger: React.ReactNode;
}

export default function NativeBookingDialog({ trigger }: NativeBookingDialogProps) {
    const { t } = useTranslation('common');
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);
    const [timeSlots, setTimeSlots] = useState<{ date: Date, localStr: string, berlinStr: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [userTz, setUserTz] = useState('Local');

    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        reason: ''
    });

    useEffect(() => {
        // Detect user's timezone dynamically
        setUserTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }, []);

    // Generate timeslots whenever a date is selected
    useEffect(() => {
        if (!selectedDate) {
            setTimeSlots([]);
            return;
        }

        // We want to create slots for the selected day corresponding to 09:00 to 17:00 Berlin time.
        // Since pure JS is tricky with parsing foreign timezones reliably across DST, 
        // we'll approximate assuming Central European Time (CET/CEST) offsets via a neat trick:
        // We iterate through UTC hours 07:00 to 15:00 (which safely covers ~09:00 to 17:00 EU time).
        
        const slots = [];
        const baseDate = new Date(selectedDate);
        baseDate.setHours(0, 0, 0, 0); // Start of local day
        
        // This is a simplified universal approach:
        // Define standard business hours (UTC). For Berlin 9am-5pm (~UTC 07:00 to 15:00)
        const utcHours = [7, 8, 9, 10, 11, 13, 14, 15]; // Excluded 12 for lunch break

        for (const hour of utcHours) {
            const slot = new Date(baseDate);
            // This is a bit tricky: We want the slot to be EXACTLY the given UTC hour on the selected Y/M/D.
            // But baseDate is local. Let's build a clean UTC date.
            const utcDate = new Date(Date.UTC(
                selectedDate.getFullYear(), 
                selectedDate.getMonth(), 
                selectedDate.getDate(), 
                hour, 0, 0
            ));

            // Format for user's local timezone
            const localFormatter = new Intl.DateTimeFormat('es-ES', {
                hour: '2-digit', minute: '2-digit', timeZone: userTz
            });
            
            // Format for Berlin timezone to show them the destination time
            const berlinFormatter = new Intl.DateTimeFormat('es-ES', {
                hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin'
            });

            slots.push({
                date: utcDate,
                localStr: localFormatter.format(utcDate),
                berlinStr: berlinFormatter.format(utcDate)
            });
        }

        setTimeSlots(slots);
        setSelectedTimeSlot(null);
    }, [selectedDate, userTz]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTimeSlot || !formData.name || !formData.whatsapp) return;
        
        setLoading(true);
        try {
            const res = await fetch('/api/bookings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedTimeSlot.toISOString(),
                    client_name: formData.name,
                    client_phone: formData.whatsapp,
                    client_reason: formData.reason
                })
            });
            if (!res.ok) throw new Error("API Route Failed");
            setSuccess(true);
            setStep(3); // Success Screen
        } catch (error) {
            console.error("Booking error:", error);
            alert("Hubo un error al guardar la cita. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep(1);
        setSelectedDate(undefined);
        setSelectedTimeSlot(null);
        setSuccess(false);
        setFormData({ name: '', whatsapp: '', reason: '' });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) reset();
            setOpen(val);
        }}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Left Sidebar Info */}
                    <div className="bg-blue-600 border-r border-blue-700 p-8 w-full md:w-1/3 flex flex-col justify-between text-white">
                        <div>
                            <h2 className="text-2xl font-bold mb-2 tracking-tight text-white">{t('booking.title', 'Agendar')} <br/> {t('booking.title2', 'Reunión')}</h2>
                            <p className="text-blue-100 text-sm mb-6">{t('booking.subtitle', 'Asesoría personalizada con el Team Office de Dicilo.')}</p>
                            
                            <div className="space-y-4 text-sm font-medium text-blue-100">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-emerald-400" />
                                    <span>{t('booking.duration', '30 Minutos')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Globe2 className="w-5 h-5 text-emerald-400" />
                                    <span className="flex-1">
                                        {t('booking.your_timezone', 'Tú: Zona horaria')} ({userTz})<br/>
                                        <span className="text-[10px] text-blue-200 font-normal leading-tight block mt-1">
                                            {t('booking.timezone_expl', 'Todas las horas abajo se muestran en tu hora local según tu dispositivo, para que no haya confusiones.')}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {selectedDate && selectedTimeSlot && (
                            <div className="mt-8 bg-blue-700 p-4 rounded-xl border border-blue-500 shadow-inner">
                                <p className="text-xs text-blue-200 uppercase font-bold tracking-wider mb-1">{t('booking.selected', 'Cita Seleccionada')}</p>
                                <p className="text-emerald-300 font-semibold">{format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</p>
                                <p className="text-white font-bold text-xl flex items-baseline gap-2">
                                    {timeSlots.find(s => s.date.getTime() === selectedTimeSlot.getTime())?.localStr}
                                    <span className="text-sm font-normal text-blue-200">({timeSlots.find(s => s.date.getTime() === selectedTimeSlot.getTime())?.berlinStr} Berlín)</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 p-8 bg-white min-h-[450px]">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-slate-900">{t('booking.select_day', 'Selecciona el Día')}</DialogTitle>
                                    <DialogDescription>{t('booking.select_day_desc', 'Haz clic en un día disponible del calendario.')}</DialogDescription>
                                </DialogHeader>

                                <div className="flex justify-center border border-slate-200 rounded-xl p-4 bg-slate-50">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(d) => { if(d) { setSelectedDate(d); setStep(2); } }}
                                        disabled={{ before: new Date() }}
                                        className="bg-white rounded-lg shadow-sm border border-slate-100"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="-ml-3 p-2 text-slate-400 hover:text-slate-900">←</Button>
                                        {t('booking.choose_time', 'Elige la Hora y Confirma')}
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-slate-700 mb-3">{t('booking.available_for', 'Horarios Disponibles para el ')} {selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })}</p>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto pr-2 pb-4 border-b border-slate-100">
                                        {timeSlots.map((slot, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedTimeSlot(slot.date)}
                                                className={`p-3 rounded-lg border text-center transition-all ${selectedTimeSlot?.getTime() === slot.date.getTime() ? 'bg-emerald-600 border-emerald-700 text-white shadow-md scale-[1.02]' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700'}`}
                                            >
                                                <div className="font-bold text-lg">{slot.localStr}</div>
                                                <div className="text-[10px] opacity-70">Berlín: {slot.berlinStr}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedTimeSlot && (
                                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="name">{t('booking.name', 'Nombre Completo')}</Label>
                                                <Input required id="name" placeholder={t('booking.name_ph', 'Ej. Carlos Martínez')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="whatsapp">WhatsApp / Teléfono</Label>
                                                <Input required id="whatsapp" placeholder="+34 600..." value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <Label htmlFor="reason">{t('booking.reason', '¿Sobre qué te gustaría hablar?')}</Label>
                                            <Textarea id="reason" placeholder={t('booking.reason_ph', 'Para qué es la reunión...')} className="resize-none h-20" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
                                        </div>
                                        <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-md">
                                            {loading ? t('booking.confirming', 'Confirmando...') : t('booking.confirm', 'Confirmar Reserva')}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        )}

                        {step === 3 && success && (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 duration-500 text-center py-12">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('booking.success_title', '¡Cita Confirmada!')}</h2>
                                <p className="text-slate-600 max-w-sm">
                                    {t('booking.success_msg1', 'Tu reunión ha sido agendada con éxito para el')} <strong className="text-emerald-700">{selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })}</strong> a las <strong className="text-emerald-700">{selectedTimeSlot && timeSlots.find(s => s.date.getTime() === selectedTimeSlot.getTime())?.localStr}</strong>.
                                </p>
                                <p className="text-sm border border-slate-200 bg-slate-50 p-3 rounded-lg text-slate-500 max-w-sm mt-4">
                                    {t('booking.success_msg2', 'Nuevos detalles y el enlace a la llamada te llegarán muy pronto a tu WhatsApp.')}
                                </p>
                                <Button onClick={() => setOpen(false)} variant="outline" className="mt-6 border-slate-300">
                                    {t('booking.close', 'Cerrar Ventana')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
