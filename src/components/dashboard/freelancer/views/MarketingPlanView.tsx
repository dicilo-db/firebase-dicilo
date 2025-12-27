'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getMarketingPlanEvents, scheduleCampaignPost, CalendarEvent } from '@/app/actions/mkt-plan';
import { getFreelancerCampaigns } from '@/app/actions/freelancer';
import { Campaign } from '@/types/freelancer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronLeft, ChevronRight, GripVertical, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragEndEvent,
    DragStartEvent
} from '@dnd-kit/core';

// --- COMPONENTS FOR DND ---

function DraggableCampaign({ campaign }: { campaign: Campaign }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `campaign-${campaign.id}`,
        data: { campaign }
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                "flex items-center gap-3 p-3 bg-card border rounded-lg cursor-grab hover:shadow-md transition-all",
                isDragging ? "opacity-50" : ""
            )}
        >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{campaign.companyName}</p>
                <div className="flex gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">Active</Badge>
                </div>
            </div>
        </div>
    );
}

function CalendarDay({
    day,
    dateStr,
    events,
    isCurrentMonth,
    onDrop
}: {
    day: number | null,
    dateStr?: string,
    events: CalendarEvent[],
    isCurrentMonth: boolean,
    onDrop?: (campaignId: string, date: string) => void
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: dateStr || `empty-${Math.random()}`,
        data: { date: dateStr },
        disabled: !day || !isCurrentMonth // Disable drop on empty/padding cells
    });

    if (!day) return <div className="min-h-[120px] bg-muted/10 border-b border-r" />;

    const dayEvents = events.filter(e => e.date.startsWith(dateStr!));
    const totalEarnings = dayEvents.reduce((sum, e) => sum + (e.earnings || 0), 0);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "min-h-[120px] bg-background border-b border-r p-2 flex flex-col transition-colors",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                isOver && "bg-primary/10 ring-2 ring-inset ring-primary"
            )}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={cn(
                    "font-semibold text-sm h-7 w-7 flex items-center justify-center rounded-full",
                    new Date().toISOString().split('T')[0] === dateStr && "bg-primary text-white"
                )}>
                    {day}
                </span>
                {dayEvents.length > 0 && (
                    <span className="text-[10px] font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        €{totalEarnings.toFixed(2)}
                    </span>
                )}
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto max-h-[100px] no-scrollbar">
                {dayEvents.map(event => (
                    <div
                        key={event.id}
                        className={cn(
                            "text-[10px] px-1.5 py-1 rounded truncate flex items-center gap-1",
                            event.status === 'completed' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        )}
                        title={event.companyName}
                    >
                        {event.status === 'completed' ? <CheckCircle2 className="h-2 w-2" /> : <Clock className="h-2 w-2" />}
                        {event.companyName}
                    </div>
                ))}
            </div>

            <div className="mt-1 text-[10px] text-muted-foreground text-center border-t pt-1">
                {dayEvents.length} posts
            </div>
        </div>
    );
}

export function MarketingPlanView() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const { toast } = useToast();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [draggedItem, setDraggedItem] = useState<Campaign | null>(null);

    // Initial Load
    useEffect(() => {
        if (!user) return;

        async function loadData() {
            setIsLoading(true);
            try {
                // 1. Fetch Calendar Events
                const plan = await getMarketingPlanEvents(user!.uid, currentDate.getMonth() + 1, currentDate.getFullYear());
                if (plan.success && plan.data) {
                    setEvents(plan.data.events);
                }

                // 2. Fetch Active Campaigns (for sidebar)
                const camps = await getFreelancerCampaigns({});
                if (camps.success && camps.campaigns) {
                    setCampaigns(camps.campaigns);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [user, currentDate]);

    // Calendar Grid Logic
    const getDaysArray = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon...

        // Adjust for Monday start (ISO 8601) - standard in Europe
        // 0 (Sun) -> 6, 1 (Mon) -> 0
        const startOffset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

        const weeks = [];
        let dayCounter = 1;

        // Need to pad 5-6 weeks
        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < startOffset) {
                    week.push(null);
                } else if (dayCounter > daysInMonth) {
                    week.push(null);
                } else {
                    week.push({
                        day: dayCounter,
                        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`
                    });
                    dayCounter++;
                }
            }
            weeks.push(week);
            if (dayCounter > daysInMonth) break;
        }
        return weeks;
    };

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.campaign) {
            setDraggedItem(event.active.data.current.campaign);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setDraggedItem(null);
        const { active, over } = event;

        if (!over) return;

        const campaign = active.data.current?.campaign as Campaign;
        const targetDate = over.data.current?.date as string;

        if (!campaign || !targetDate) return;

        // Optimistic UI Update or Wait?
        // Let's call server action first to validate.

        if (!user) return;

        const dateObj = new Date(targetDate);
        // Force set to noon to avoid timezone border issues
        dateObj.setHours(12, 0, 0, 0);

        const result = await scheduleCampaignPost(user.uid, campaign.id, campaign.companyName, dateObj);

        if (result.success) {
            toast({
                title: t('marketing_plan.scheduled_status'),
                description: `${campaign.companyName} -> ${targetDate}`,
            });
            // Refresh events
            // We could optimistically add it, but for simplicity reloading events
            const plan = await getMarketingPlanEvents(user.uid, currentDate.getMonth() + 1, currentDate.getFullYear());
            if (plan.success && plan.data) setEvents(plan.data.events);
        } else {
            toast({
                title: "Error",
                description: result.error === 'Daily limit reached for this campaign'
                    ? t('marketing_plan.daily_limit_error')
                    : result.error,
                variant: "destructive"
            });
        }
    };

    const weekDays = [
        t('days.monday', 'Mo'), t('days.tuesday', 'Tu'), t('days.wednesday', 'We'),
        t('days.thursday', 'Th'), t('days.friday', 'Fr'), t('days.saturday', 'Sa'), t('days.sunday', 'Su')
    ];

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">

                {/* CALENDAR AREA */}
                <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-black/20 p-4 overflow-y-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{t('marketing_plan.title')}</h1>
                            <p className="text-sm text-muted-foreground">{t('marketing_plan.drag_instruction')}</p>
                        </div>
                        <div className="flex items-center gap-4 bg-white dark:bg-card p-1 rounded-lg shadow-sm border">
                            <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <span className="font-semibold w-32 text-center select-none">
                                {currentDate.toLocaleString(t('header.nav.language') === 'Español' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border-0 border-t border-l">
                        {/* Week Days Header */}
                        <div className="grid grid-cols-7 border-b bg-card">
                            {weekDays.map((d, i) => (
                                <div key={i} className="py-2 text-center text-xs font-semibold uppercase text-muted-foreground border-r last:border-r-0">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-7 auto-rows-fr min-h-[600px]">
                                {getDaysArray().map((week, wIndex) => (
                                    <React.Fragment key={wIndex}>
                                        {week.map((dayObj, dIndex) => (
                                            <CalendarDay
                                                key={`${wIndex}-${dIndex}`}
                                                day={dayObj?.day || null}
                                                dateStr={dayObj?.dateStr}
                                                isCurrentMonth={!!dayObj}
                                                events={events}
                                            />
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* SIDEBAR: CAMPAIGNS & STATS */}
                <div className="w-full lg:w-80 bg-white dark:bg-card border-l p-6 overflow-y-auto h-full shadow-xl">
                    <div className="mb-6">
                        <h2 className="font-bold text-lg mb-2">{t('marketing_plan.active_campaigns')}</h2>
                        <div className="space-y-4 text-sm text-muted-foreground mb-4">
                            Arrastra estas campañas al calendario para planificar tu semana.
                        </div>

                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                            ) : campaigns.length === 0 ? (
                                <p className="text-sm italic text-center py-4">No active campaigns found.</p>
                            ) : (
                                campaigns.map(camp => (
                                    <DraggableCampaign key={camp.id} campaign={camp} />
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mt-8">
                        <h3 className="font-semibold mb-2 text-sm">{t('marketing_plan.total_posts')} (Mes)</h3>
                        <p className="text-3xl font-bold text-primary">
                            {events.filter(e => e.status === 'completed').length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('marketing_plan.est_earnings')}: <span className="text-green-600 font-bold">
                                €{events.filter(e => e.status === 'completed').reduce((sum, e) => sum + (e.earnings || 0), 0).toFixed(2)}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Drag Overlay (Visual Follower) */}
                <DragOverlay>
                    {draggedItem ? (
                        <div className="opacity-90 bg-card border shadow-xl rounded-lg p-3 w-64 flex items-center gap-3">
                            <GripVertical className="h-4 w-4" />
                            <span className="font-bold">{draggedItem.companyName}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
