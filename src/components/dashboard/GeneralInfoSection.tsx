import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { Loader2, Calendar as CalendarIcon, Link as LinkIcon, Info, ExternalLink, CalendarClock, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { trackGeneralInfoView } from '@/app/actions/track';
import { GeneralInfoComments } from './GeneralInfoComments';

const db = getFirestore(app);

export function GeneralInfoSection() {
    const { t } = useTranslation('common');
    const [isLoading, setIsLoading] = useState(true);
    const [events, setEvents] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedNote, setSelectedNote] = useState<any | null>(null);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                // To safely fetch, we pull where active == true. 
                // Note: If no composite index exists for active + createdAt, 
                // we might need to fetch and sort on the client, or just fetch all active.
                const q = query(
                    collection(db, 'general_info'),
                    where('active', '==', true)
                );
                
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Client-side sorting and splitting
                data.sort((a: any, b: any) => {
                    const timeA = a.createdAt?.toMillis() || 0;
                    const timeB = b.createdAt?.toMillis() || 0;
                    return timeB - timeA; // desc
                });

                const evts = data.filter((item: any) => item.type === 'event');
                const nts = data.filter((item: any) => item.type === 'note');

                setEvents(evts);
                setNotes(nts);
            } catch (error) {
                console.error("Error fetching general info:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInfo();
    }, []);

    // Create array of Date objects for the calendar highlighting
    const eventDates = events
        .filter(e => e.date)
        .map(e => new Date(e.date + "T00:00:00")); // Ensure local time parsing doesn't shift the day

    // Get events for the currently selected date
    const selectedDateString = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
    const selectedEvents = events.filter(e => e.date === selectedDateString);

    if (isLoading) {
        return (
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </Card>
                <Card className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </Card>
            </div>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* LEFT COLUMN: CALENDAR */}
            <Card className="h-full flex flex-col shadow-md border-teal-100 dark:border-teal-900/50">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <CalendarIcon className="h-5 w-5 text-teal-600" />
                        Eventos / Reuniones
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-6 p-6 flex-1">
                    <div className="flex-shrink-0 flex justify-center">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            modifiers={{ booked: eventDates }}
                            modifiersStyles={{
                                booked: { 
                                    fontWeight: 'bold', 
                                    backgroundColor: '#0d9488', // teal-600
                                    color: 'white',
                                    borderRadius: '50%'
                                }
                            }}
                            className="rounded-md border shadow-sm p-3 inline-block bg-white dark:bg-slate-950"
                        />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                        <h4 className="font-semibold text-sm mb-3 text-slate-500 border-b pb-2">
                            {selectedDate ? selectedDate.toLocaleDateString() : 'Selecciona un día'}
                        </h4>
                        
                        <div className="space-y-3 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                            {selectedEvents.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p>No hay eventos programados para este día.</p>
                                </div>
                            ) : (
                                selectedEvents.map(evt => (
                                    <div key={evt.id} className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3 border border-teal-100 dark:border-teal-800/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <h5 className="font-semibold text-teal-900 dark:text-teal-300 text-sm leading-tight">
                                                {evt.title}
                                            </h5>
                                            {(evt.time || evt.endTime) && (
                                                <span className="text-xs bg-white dark:bg-slate-800 text-teal-700 px-2 py-0.5 rounded shadow-sm whitespace-nowrap ml-2">
                                                    {evt.time || '-'} a {evt.endTime || '-'}
                                                </span>
                                            )}
                                        </div>
                                        {evt.description && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-line">
                                                {evt.description}
                                            </p>
                                        )}
                                        {evt.url && (
                                            <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-teal-600 text-xs" asChild>
                                                <a href={evt.url} target="_blank" rel="noopener noreferrer" onClick={() => trackGeneralInfoView(evt.id)}>
                                                    Ver enlace del evento
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* RIGHT COLUMN: LAST EVENTS / NOTES */}
            <Card className="h-full flex flex-col shadow-md border-blue-100 dark:border-blue-900/50">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Info className="h-5 w-5 text-blue-600" />
                        Últimos Eventos y Actualizaciones
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar">
                    {notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <LinkIcon className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No hay enlaces ni noticias recientes.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {notes.map(note => (
                                <div 
                                    key={note.id} 
                                    onClick={() => {
                                        setSelectedNote(note);
                                        trackGeneralInfoView(note.id);
                                    }}
                                    className="group cursor-pointer"
                                >
                                    <div className="bg-white dark:bg-slate-950 border rounded-lg p-4 transition-all hover:border-blue-400 hover:shadow-md relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 group-hover:w-2 transition-all"></div>
                                        <div className="flex items-start justify-between pl-2">
                                            <div>
                                                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                                                    {note.title}
                                                </h4>
                                                {note.description && (
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {note.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Maximize2 className="h-4 w-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0 ml-2 mt-0.5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal for Reading Notes completely */}
            <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
                <DialogContent className="max-w-md w-11/12 max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
                    <DialogHeader className="p-6 pb-2 border-b flex flex-row items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            <Info className="h-5 w-5 flex-shrink-0" /> 
                            <span>{selectedNote?.title}</span>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 py-4">
                        <DialogDescription className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                            {selectedNote?.description || 'Sin descripción adicional.'}
                        </DialogDescription>
                        {selectedNote && (
                            <GeneralInfoComments infoId={selectedNote.id} />
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg">
                        <Button variant="outline" onClick={() => setSelectedNote(null)}>
                            Cerrar
                        </Button>
                        {selectedNote?.url && (
                             <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                                <a href={selectedNote.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2" onClick={() => trackGeneralInfoView(selectedNote.id)}>
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir Enlace
                                </a>
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
