'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getUserTickets, createTicket, getTicket, addTicketMessage, Ticket } from '@/app/actions/tickets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, ArrowLeft, Send, User } from 'lucide-react';
import { format } from 'date-fns';

// --- SUB-COMPONENTS (Could be separate files, effectively separate here for brevity) ---

// 1. TICKET LIST VIEW
const TicketList = ({ onSelectTicket, onCreateClick }: { onSelectTicket: (id: string) => void, onCreateClick: () => void }) => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            if (user?.uid) {
                const res = await getUserTickets(user.uid);
                if (res.success && res.tickets) setTickets(res.tickets as Ticket[]);
            }
            setLoading(false);
        };
        fetch();
    }, [user]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'open': return 'default';
            case 'in_progress': return 'secondary';
            case 'closed': return 'outline';
            default: return 'default';
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('tickets.title')}</h1>
                <Button onClick={onCreateClick}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('tickets.createButton')}
                </Button>
            </div>

            <div className="grid gap-4">
                {tickets.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            {t('tickets.noTickets')}
                        </CardContent>
                    </Card>
                ) : (
                    tickets.map((ticket) => (
                        <Card key={ticket.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => onSelectTicket(ticket.id)}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-semibold">{ticket.title}</CardTitle>
                                <Badge variant={getStatusVariant(ticket.status) as any}>{ticket.status}</Badge>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="line-clamp-2">{ticket.description}</CardDescription>
                                <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                                    <span>{format(new Date(ticket.createdAt), 'PP p')}</span>
                                    <Badge variant="outline" className="text-xs">{ticket.priority}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

// 2. CREATE TICKET VIEW
const CreateTicket = ({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [module, setModule] = useState('general');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);
        try {
            const res = await createTicket({
                uid: user.uid,
                userEmail: user.email || '',
                userName: user.displayName || 'User',
                title,
                module,
                description,
                priority
            });
            if (res.success) {
                toast({ title: t('tickets.successCreated'), description: t('form.successDesc') });
                onSuccess();
            } else {
                toast({ title: t('form.errorTitle'), description: res.error, variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: t('form.errorTitle'), description: t('form.errorDesc'), variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
            <Button variant="ghost" onClick={onCancel} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t('tickets.myTickets')}
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>{t('tickets.createTitle')}</CardTitle>
                    <CardDescription>{t('form.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('tickets.subject')}</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Issue title..." />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('tickets.module')}</Label>
                            <Select value={module} onValueChange={setModule}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">{t('tickets.modules.general', 'General')}</SelectItem>
                                    <SelectItem value="dashboard">Dashboard</SelectItem>
                                    <SelectItem value="transactions">Transactions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('tickets.priority')}</Label>
                            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('tickets.description')}</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('tickets.submit')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

// 3. TICKET DETAIL VIEW
const TicketDetail = ({ ticketId, onBack }: { ticketId: string, onBack: () => void }) => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const { toast } = useToast();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    const fetchTicket = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        const res = await getTicket(ticketId);
        if (res.success && res.ticket) setTicket(res.ticket as Ticket);
        else if (!silent) toast({ title: 'Error', description: res.error, variant: 'destructive' });
        if (!silent) setLoading(false);
    }, [ticketId, toast]);

    useEffect(() => {
        fetchTicket();
        const interval = setInterval(() => fetchTicket(true), 15000);
        return () => clearInterval(interval);
    }, [ticketId, fetchTicket]);

    const handleSend = async () => {
        if (!newMessage.trim() || !user || !ticket) return;
        setSending(true);
        const res = await addTicketMessage(ticket.id, { senderId: user.uid, senderName: user.displayName || 'User', message: newMessage });
        if (res.success) { setNewMessage(''); fetchTicket(); }
        else toast({ title: 'Error', description: 'Failed to send', variant: 'destructive' });
        setSending(false);
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!ticket) return <div className="p-8 text-center">Ticket not found</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t('tickets.myTickets')}
            </Button>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                            <CardDescription className="mt-2">
                                <Badge variant="outline">{ticket.status}</Badge> | <Badge variant="secondary" className="ml-2">{ticket.priority}</Badge>
                            </CardDescription>
                        </div>
                        <div className="text-sm text-muted-foreground">{format(new Date(ticket.createdAt), 'PP')}</div>
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
                            {ticket.messages?.map((msg, i) => (
                                <div key={i} className={`flex gap-3 ${msg.senderId === user?.uid ? 'flex-row-reverse' : ''}`}>
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
                            {(!ticket.messages || ticket.messages.length === 0) && <p className="text-sm text-center py-4">No messages yet.</p>}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Textarea placeholder={t('tickets.newMessage')} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1" />
                    <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

// --- MAIN MANAGER COMPONENT ---
export function TicketsManager() {
    // State: 'list' | 'create' | 'detail'
    // Storing view state in memory means reload resets to list. User wants single dashboard feel, so this is expected behavior for a "view".
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    // Reset view if selecting tickets generally? No, persist state within session is fine.

    return (
        <>
            {view === 'list' && (
                <TicketList
                    onSelectTicket={(id) => { setSelectedTicketId(id); setView('detail'); }}
                    onCreateClick={() => setView('create')}
                />
            )}
            {view === 'create' && (
                <CreateTicket
                    onCancel={() => setView('list')}
                    onSuccess={() => setView('list')}
                />
            )}
            {view === 'detail' && selectedTicketId && (
                <TicketDetail
                    ticketId={selectedTicketId}
                    onBack={() => setView('list')}
                />
            )}
        </>
    );
}
