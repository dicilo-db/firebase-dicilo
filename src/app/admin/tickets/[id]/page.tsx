'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getTicket, addTicketMessage, editTicketMessage, Ticket } from '@/app/actions/tickets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2, User, Globe, MessageSquare, Pencil, Languages, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateDoc, doc, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { translateText } from '@/app/actions/translate';

const db = getFirestore(app);

const SUPPORTED_LANGUAGES = [
    { value: 'Spanish', label: 'Español' },
    { value: 'English', label: 'English' },
    { value: 'German', label: 'Deutsch' },
    { value: 'French', label: 'Français' },
    { value: 'Italian', label: 'Italiano' },
    { value: 'Portuguese', label: 'Português' },
    { value: 'Mandarin', label: '中文 (Mandarin)' },
    { value: 'Hindi', label: 'हिन्दी (Hindi)' },
    { value: 'Danish', label: 'Dansk' },
    { value: 'Croatian', label: 'Hrvatski' },
    { value: 'Turkish', label: 'Türkçe' },
    { value: 'Lithuanian', label: 'Lietuvių' },
    { value: 'Polish', label: 'Polski' },
    { value: 'Arabic', label: 'العربية (Arabic)' },
];

export default function AdminTicketDetailPage() {
    const { t } = useTranslation('admin');
    const { user } = useAuth(); // Admin user
    const { id } = useParams();
    const { toast } = useToast();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Translation configuration
    const [myLanguage, setMyLanguage] = useState('Spanish');
    const [replyLanguage, setReplyLanguage] = useState('Spanish');

    // State
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [translating, setTranslating] = useState<Record<string, boolean>>({});
    const [translatingDraft, setTranslatingDraft] = useState(false);

    // Editing State
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const fetchTicket = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const result = await getTicket(id as string);
            if (result.success && result.ticket) {
                setTicket(result.ticket as Ticket);
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to load ticket', variant: 'destructive' });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTicket(); }, [id]);

    const handleTranslate = async (id: string, text: string) => {
        setTranslating(prev => ({ ...prev, [id]: true }));
        try {
            const result = await translateText(text, myLanguage);
            if (result.success && result.translation) {
                setTranslations(prev => ({ ...prev, [id]: result.translation }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setTranslating(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleTranslateDraft = async () => {
        if (!newMessage.trim()) return;
        setTranslatingDraft(true);
        try {
            const result = await translateText(newMessage, replyLanguage);
            if (result.success && result.translation) {
                setNewMessage(result.translation);
                toast({ title: "Translated", description: `Draft translated to ${replyLanguage}` });
            }
        } catch (error) {
            toast({ title: "Error", description: "Translation failed", variant: "destructive" });
        } finally {
            setTranslatingDraft(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !ticket) return;

        setSending(true);
        try {
            const result = await addTicketMessage(ticket.id, {
                senderId: user.uid,
                senderName: user.displayName || 'Support Team',
                message: newMessage
            });

            if (result.success) {
                setNewMessage('');
                fetchTicket();
                toast({ title: 'Reply sent', description: 'User has been notified.' });
            } else {
                toast({ title: 'Error', description: 'Failed to send message', variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    const handleSaveEdit = async (msgId: string) => {
        if (!ticket || !editText.trim()) return;
        try {
            const result = await editTicketMessage(ticket.id, msgId, editText);
            if (result.success) {
                setEditingMessageId(null);
                fetchTicket();
                toast({ title: "Updated", description: "Message updated." });
            } else {
                toast({ title: "Error", description: "Failed to update", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!ticket) return;
        try {
            await updateDoc(doc(db, 'tickets', ticket.id), { status: newStatus });
            setTicket({ ...ticket, status: newStatus as any });
            toast({ title: "Status Updated", description: `Ticket marked as ${newStatus}` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!ticket) return <div className="p-8 text-center">{t('tickets.noTickets')}</div>;

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
            <div className="flex justify-between items-center">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/admin/tickets">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Tickets
                    </Link>
                </Button>

                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border">
                    <span className="text-xs font-medium px-2">Reading Language:</span>
                    <Select value={myLanguage} onValueChange={setMyLanguage}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SUPPORTED_LANGUAGES.map(lang => (
                                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Chat Area */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="h-[700px] flex flex-col shadow-md">
                        <CardHeader className="border-b bg-muted/5 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Conversation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
                            {/* Original Request */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border shadow-sm relative group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-semibold text-primary">{ticket.userName} <span className="text-xs font-normal text-muted-foreground">(Original Request)</span></span>
                                    <button
                                        onClick={() => handleTranslate('original', ticket.description)}
                                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full transition-colors"
                                        disabled={translating['original']}
                                    >
                                        <Languages className="h-3 w-3" />
                                        {translating['original'] ? 'Translating...' : `Translate to ${myLanguage}`}
                                    </button>
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
                                {translations['original'] && (
                                    <div className="mt-3 pt-3 border-t border-dashed bg-yellow-50/50 -mx-5 px-5 -mb-5 py-3 rounded-b-xl border-yellow-200">
                                        <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-1">Translation ({myLanguage}):</p>
                                        <p className="text-sm text-yellow-950 italic">{translations['original']}</p>
                                    </div>
                                )}
                            </div>

                            {/* Thread */}
                            {ticket.messages && ticket.messages.map((msg, index) => (
                                <div key={index} className={`flex gap-3 ${msg.senderId === user?.uid ? 'flex-row-reverse' : ''} group`}>
                                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center border shadow-sm ${msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-white'}`}>
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className={`rounded-2xl p-4 max-w-[85%] shadow-sm border ${msg.senderId === user?.uid ? 'bg-primary text-primary-foreground border-primary' : 'bg-white border-slate-200'}`}>
                                        <div className="text-xs opacity-70 mb-2 flex justify-between gap-4 items-center border-b border-black/10 pb-1">
                                            <span className="font-medium">{msg.senderName}</span>
                                            <span>{msg.timestamp ? format(new Date(msg.timestamp), 'p') : ''}</span>
                                        </div>

                                        {editingMessageId === msg.id ? (
                                            <div className="space-y-2 min-w-[300px]">
                                                <Textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="min-h-[80px] bg-background text-foreground"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                                                    <Button size="sm" onClick={() => handleSaveEdit(msg.id!)} className="bg-white text-primary hover:bg-white/90">Save</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>

                                                {translations[index.toString()] && (
                                                    <div className="mt-3 pt-2 border-t border-black/10">
                                                        <p className="text-xs font-bold opacity-70 uppercase tracking-wide mb-1">Translation ({myLanguage}):</p>
                                                        <p className="text-sm italic opacity-90">{translations[index.toString()]}</p>
                                                    </div>
                                                )}

                                                <div className="mt-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Edit Button for Sender */}
                                                    {msg.senderId === user?.uid && msg.id && (
                                                        <button
                                                            onClick={() => { setEditingMessageId(msg.id!); setEditText(msg.message); }}
                                                            className="text-[10px] uppercase tracking-wider opacity-70 hover:opacity-100 flex items-center gap-1 bg-black/10 hover:bg-black/20 px-2 py-0.5 rounded transition-colors"
                                                        >
                                                            <Pencil className="h-3 w-3" /> Edit
                                                        </button>
                                                    )}

                                                    {/* Translate Button for Receiver */}
                                                    {msg.senderId !== user?.uid && !translations[index.toString()] && (
                                                        <button
                                                            onClick={() => handleTranslate(index.toString(), msg.message)}
                                                            className="text-[10px] uppercase tracking-wider opacity-70 hover:opacity-100 flex items-center gap-1 bg-black/5 hover:bg-black/10 px-2 py-0.5 rounded transition-colors"
                                                            disabled={translating[index.toString()]}
                                                        >
                                                            <Languages className="h-3 w-3" />
                                                            {translating[index.toString()] ? '...' : 'Translate'}
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>

                        <div className="p-4 border-t bg-background">
                            {/* Translation Toolbar */}
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-xs font-medium text-muted-foreground">Draft Reply</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Translate draft to:</span>
                                    <Select value={replyLanguage} onValueChange={setReplyLanguage}>
                                        <SelectTrigger className="w-[110px] h-7 text-xs border-dashed">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_LANGUAGES.map(lang => (
                                                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs gap-1"
                                        onClick={handleTranslateDraft}
                                        disabled={translatingDraft || !newMessage.trim()}
                                    >
                                        {translatingDraft ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                        Translate Draft
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Textarea
                                    placeholder={`Type your reply here... (e.g. in ${myLanguage})`}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1 min-h-[100px] resize-none focus-visible:ring-1"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={sending || !newMessage.trim()}
                                    className="h-auto w-24 flex-col gap-1"
                                >
                                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                    <span className="text-xs">Send</span>
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 text-right">
                                Tip: Write in your language, select target language, click "Translate Draft", then Send.
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">ID</label>
                                <p className="text-sm font-mono">{ticket.id.slice(0, 8)}...</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">
                                    <Select
                                        defaultValue={ticket.status}
                                        onValueChange={(val) => handleStatusChange(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                                <div className="mt-1">
                                    <Badge variant={ticket.priority === 'high' ? 'destructive' : 'secondary'}>
                                        {ticket.priority.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Module</label>
                                <p className="text-sm">{ticket.module}</p>
                            </div>
                            <div className="pt-4 border-t">
                                <label className="text-xs font-medium text-muted-foreground">User Info</label>
                                <p className="text-sm font-semibold">{ticket.userName}</p>
                                <p className="text-sm text-muted-foreground text-xs">{ticket.userEmail}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
