'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getUserTickets, addTicketMessage, Ticket } from '@/app/actions/tickets'; // We might need getSingleTicket but logic can reuse getUserTickets for now or filter
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

export default function TicketDetailPage() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const { id } = useParams();
    const { toast } = useToast();
    const [ticket, setTicket] = useState<any | null>(null); // Use any temporarily or import Ticket type
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    const fetchTicket = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { getTicket } = await import('@/app/actions/tickets');
            const result = await getTicket(id as string);
            if (result.success) {
                setTicket(result.ticket);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load ticket',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !ticket) return;

        setSending(true);
        try {
            const { addTicketMessage } = await import('@/app/actions/tickets');
            const result = await addTicketMessage(ticket.id, {
                senderId: user.uid,
                senderName: user.displayName || 'User',
                message: newMessage
            });

            if (result.success) {
                setNewMessage('');
                fetchTicket(); // Refresh to see your message!
            } else {
                fetchTicket(); // Refresh ticket to show new message even on error, to ensure consistency
                toast({
                    title: 'Error',
                    description: 'Failed to send message',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!ticket) return <div className="p-8 text-center">{t('tickets.noTickets')}</div>;

    return (
        <div className="container mx-auto p-6 max-w-3xl space-y-6">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/dashboard/tickets">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('tickets.myTickets')}
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                            <CardDescription className="mt-2">
                                {t('tickets.status')}: <Badge variant="outline" className="ml-2">{ticket.status}</Badge> |
                                {t('tickets.priority')}: <Badge variant="secondary" className="ml-2">{ticket.priority}</Badge>
                            </CardDescription>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {format(new Date(ticket.createdAt), 'PP')}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted/30 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">{t('tickets.description')}</h3>
                        <p className="whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold">{t('tickets.messages')}</h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {ticket.messages && ticket.messages.map((msg, index) => (
                                <div key={index} className={`flex gap-3 ${msg.senderId === user?.uid ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className={`rounded-lg p-3 max-w-[80%] ${msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                            <span>{msg.senderName}</span>
                                            <span>{msg.timestamp ? format(new Date(msg.timestamp), 'p') : ''}</span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                            {(!ticket.messages || ticket.messages.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">No messages yet.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Textarea
                        placeholder={t('tickets.newMessage')}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} size="icon">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
