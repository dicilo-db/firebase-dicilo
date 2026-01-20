'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateDoc, doc, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Loader2, ArrowLeft, MessageSquare, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'closed';
    priority: 'low' | 'medium' | 'high';
    createdAt: any;
    userName: string;
    userEmail: string;
    module: string;
}

import { useAuth } from '@/context/AuthContext';

export default function AdminTicketsPage() {
    const { t } = useTranslation('admin');
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const db = getFirestore(app);

    useEffect(() => {
        if (user) {
            fetchTickets();
        }
    }, [user]);

    const fetchTickets = async () => {
        if (!user) return;
        try {
            const { getAllTickets } = await import('@/app/actions/tickets');
            const result = await getAllTickets(user.uid);

            if (result.success && result.tickets) {
                setTickets(result.tickets as unknown as Ticket[]);
            } else {
                throw new Error(result.error || "Failed to fetch");
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast({
                title: "Error",
                description: "Failed to load tickets.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (ticketId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'tickets', ticketId), { status: newStatus });
            setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus as any } : t));
            toast({ title: "Status Updated", description: `Ticket marked as ${newStatus}` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'open': return 'destructive'; // Red for open
            case 'in_progress': return 'default'; // Blue/Black for in progress
            case 'closed': return 'secondary'; // Gray for closed
            default: return 'outline';
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ticket System (Central)</h1>
                    <p className="text-muted-foreground">Manage support tickets from all users.</p>
                </div>
                <Button variant="outline" asChild className="gap-2">
                    <Link href="/admin">
                        <LayoutDashboard className="h-4 w-4" />
                        {t('dashboard.backToDashboard', 'Zurück zum Dashboard')}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4">
                {tickets.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No tickets found.</div>
                ) : (
                    tickets.map((ticket) => (
                        <Card key={ticket.id} className="text-left">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                                        <Badge variant="outline">{ticket.module}</Badge>
                                        <Badge variant={ticket.priority === 'high' ? 'destructive' : 'secondary'}>
                                            {ticket.priority.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <CardDescription className="mt-1">
                                        By {ticket.userName} ({ticket.userEmail}) • {format(ticket.createdAt, 'PP p')}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select
                                        defaultValue={ticket.status}
                                        onValueChange={(val) => handleStatusChange(ticket.id, val)}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm mt-2 line-clamp-2">{ticket.description}</p>
                                <div className="mt-4 flex justify-end">
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/admin/tickets/${ticket.id}`}>
                                            View Ticket & Reply
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
