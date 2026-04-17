'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, User, Phone, Video, CalendarCheck2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { useAdminUser } from '@/hooks/useAuthGuard';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { es, de, enUS } from 'date-fns/locale';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function MasterCalendarPage() {
    const { t, i18n } = useTranslation('common');
    const { plan, isLoading } = useBusinessAccess();
    const { user: adminUser } = useAdminUser();
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const locales: any = { es, de, en: enUS };
    const localeObj = locales[i18n.language] || es;

    // Escuchar el Webhook en tiempo real desde Firestore
    useEffect(() => {
        const q = query(
            collection(db, 'crm_appointments'),
            orderBy('startTime', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const appts: any[] = [];
            snapshot.forEach((doc) => {
                appts.push({ id: doc.id, ...doc.data() });
            });
            setAppointments(appts);
            setLoadingData(false);
        }, (error) => {
            console.error("Error fetching appointments:", error);
            setLoadingData(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) return <div className="p-8"><Skeleton className="w-full h-96" /></div>;

    // Solo Admin y Team Office
    if (!['admin', 'superadmin', 'team_office'].includes(adminUser?.role || '') && plan !== 'premium') {
        return (
            <div className="p-8 text-center text-rose-600 font-bold">
                Acceso Restringido. Esta vista es exclusiva para Gestión Operativa y Team Office.
            </div>
        );
    }

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
                        Calendario Central de Operaciones
                    </h1>
                    <p className="mt-2 text-emerald-100 text-lg">
                        Sincronización en tiempo real con Google Workspace y Calendly.
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
                                    <div key={day.toString()} className={`bg-white min-h-[120px] p-2 transition-colors hover:bg-slate-50 ${isToday ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-50/10' : ''}`}>
                                        <div className={`text-right text-sm font-medium p-1 mb-1 ${isToday ? 'text-emerald-700 bg-emerald-100 rounded-md w-fit ml-auto px-2' : 'text-slate-500'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        <div className="space-y-1">
                                            {dayAppts.map((appt, idx) => (
                                                <div key={idx} className="bg-indigo-50 border border-indigo-100 p-1.5 rounded text-xs animate-in fade-in cursor-pointer hover:bg-indigo-100 transition-colors">
                                                    <div className="font-bold text-indigo-700 flex items-center mb-0.5">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {format(parseISO(appt.startTime), 'HH:mm')}
                                                    </div>
                                                    <div className="text-slate-700 font-medium truncate" title={appt.inviteeName}>
                                                        {appt.inviteeName}
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
        </div>
    );
}
