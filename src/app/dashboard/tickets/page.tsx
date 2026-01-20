'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getUserTickets, Ticket } from '@/app/actions/tickets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Loader2, Plus, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function TicketsPage() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const { clientData, privateProfile, isLoading: isDashboardLoading } = useDashboardData();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [currentView, setCurrentView] = useState('tickets');

    // Determine user data for sidebar
    const userData = clientData || privateProfile || {};

    useEffect(() => {
        const fetchTickets = async () => {
            if (user?.uid) {
                const result = await getUserTickets(user.uid);
                if (result.success && result.tickets) {
                    setTickets(result.tickets as Ticket[]);
                }
            }
            setLoadingTickets(false);
        };
        fetchTickets();
    }, [user]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'open': return 'default';
            case 'in_progress': return 'secondary';
            case 'closed': return 'outline';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return t('tickets.statusOpen');
            case 'in_progress': return t('tickets.statusInProgress');
            case 'closed': return t('tickets.statusClosed');
            default: return status;
        }
    };

    if (isDashboardLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <DashboardLayout
            userData={userData}
            currentView={currentView}
            onViewChange={setCurrentView}
        >
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">{t('tickets.title')}</h1>
                    <div className="flex gap-2">
                        {/* We don't really need "Back to Dashboard" anymore if we are IN the dashboard layout, 
                            but we can keep it or change it to 'Create'. 
                            Let's keep Create and maybe remove Back since Sidebar is there. 
                            Actually, redundant Back button removed for cleanliness. */}
                        <Button asChild>
                            <Link href="/dashboard/tickets/create">
                                <Plus className="mr-2 h-4 w-4" />
                                {t('tickets.createButton')}
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4">
                    {loadingTickets ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : tickets.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                {t('tickets.noTickets')}
                            </CardContent>
                        </Card>
                    ) : (
                        tickets.map((ticket) => (
                            <Card key={ticket.id} className="hover:bg-muted/50 transition-colors">
                                <Link href={`/dashboard/tickets/${ticket.id}`}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-xl font-semibold">
                                            {ticket.title}
                                        </CardTitle>
                                        <Badge variant={getStatusVariant(ticket.status) as any}>
                                            {getStatusLabel(ticket.status)}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="line-clamp-2">
                                            {ticket.description}
                                        </CardDescription>
                                        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                                            <span>{format(new Date(ticket.createdAt), 'PP p')}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {t(`tickets.priority${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}`)}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Link>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
