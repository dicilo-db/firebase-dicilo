'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
// ... existing imports
import { getTicket, addTicketMessage, editTicketMessage, assignTicketRoles, Ticket } from '@/app/actions/tickets';
import { checkAdminRole } from '@/lib/auth';
import { Checkbox } from '@/components/ui/checkbox';
// ... other imports

export default function AdminTicketDetailPage() {
    const { t } = useTranslation('admin');
    const { user } = useAuth(); // Admin user
    const { id } = useParams();
    const { toast } = useToast();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false); // State for superadmin check

    // Translation configuration
    // ...

    useEffect(() => {
        const verifyRole = async () => {
            if (user) {
                const adminUser = await checkAdminRole(user);
                setIsSuperAdmin(adminUser?.role === 'superadmin');
            }
        };
        verifyRole();
        fetchTicket();
    }, [id, user]);

    // UseEffect logic...

    const handleRoleAssignment = async (role: string, checked: boolean) => {
        if (!ticket || !user) return;

        const currentRoles = ticket.assignedRoles || [];
        let newRoles = [...currentRoles];

        if (checked) {
            if (!newRoles.includes(role)) newRoles.push(role);
        } else {
            newRoles = newRoles.filter(r => r !== role);
        }

        try {
            const result = await assignTicketRoles(ticket.id, user.uid, newRoles);
            if (result.success) {
                setTicket({ ...ticket, assignedRoles: newRoles });
                toast({ title: "Access Updated", description: `Role ${role} ${checked ? 'added' : 'removed'}.` });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to update roles", variant: "destructive" });
        }
    };

    // ... handleSendMessage, handleSaveEdit, handleStatusChange ...

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!ticket) return <div className="p-8 text-center">{t('tickets.noTickets')}</div>;

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
            {/* Header ... */}
            <div className="flex justify-between items-center">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/admin/tickets">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Tickets
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Chat Area ... */}
                <div className="md:col-span-2 space-y-6">
                    {/* ... Existing Chat Card ... */}
                    <Card className="h-[700px] flex flex-col shadow-md">
                        <CardHeader className="border-b bg-muted/5 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Conversation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
                            {/* ... Content ... */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border shadow-sm relative group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-semibold text-primary">{ticket.userName} <span className="text-xs font-normal text-muted-foreground">(Original Request)</span></span>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-muted/20 border rounded px-2 py-0.5">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold whitespace-nowrap">Read in:</span>
                                            <Select value={myLanguage} onValueChange={setMyLanguage}>
                                                <SelectTrigger className="w-[100px] h-6 text-xs border-none bg-transparent focus:ring-0 p-0 shadow-none">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {SUPPORTED_LANGUAGES.map(lang => (
                                                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <button
                                            onClick={() => handleTranslate('original', ticket.description)}
                                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full transition-colors h-7"
                                            disabled={translating['original']}
                                        >
                                            <Languages className="h-3 w-3" />
                                            {translating['original'] ? 'Translating...' : 'Translate'}
                                        </button>
                                    </div>
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

                    {/* NEW: Assignment Card for Superadmins */}
                    {isSuperAdmin && (
                        <Card className="border-blue-200 bg-blue-50/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-blue-800">Assign / Share Ticket</CardTitle>
                                <CardDescription className="text-xs">Allow other roles to view this ticket.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="role-admin"
                                        checked={ticket.assignedRoles?.includes('admin')}
                                        onCheckedChange={(checked) => handleRoleAssignment('admin', checked as boolean)}
                                    />
                                    <label
                                        htmlFor="role-admin"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Share with Admins
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="role-team-office"
                                        checked={ticket.assignedRoles?.includes('team_office')}
                                        onCheckedChange={(checked) => handleRoleAssignment('team_office', checked as boolean)}
                                    />
                                    <label
                                        htmlFor="role-team-office"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Share with Team Office
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
