'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Mail, CheckCircle, AlertTriangle, Eye, UserPlus, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface InviteFriendSectionProps {
    uniqueCode: string;
    referrals: any[];
}

interface PioneerInvite {
    id?: string;
    friendName: string;
    friendEmail: string;
    status: 'draft' | 'sent' | 'opened' | 'registered' | 'action_required' | 'reminder_1_sent' | 'reminder_2_sent' | 'manual_action_required';
    createdAt: any;
    opened?: boolean;
    iteration?: number;
    customBody?: string;
    updatedAt?: any;
}

interface InviteInput {
    name: string;
    email: string;
    lang: 'es' | 'de' | 'en';
}

const MAX_FRIENDS = 15;

const DEFAULT_TEMPLATES: Record<string, string> = {
    es: `Hola {{name}}, te escribo porque quiero que seas pionero en algo grande. Al unirte y adquirir tu DiciCoin física, no solo obtienes 50 DiciPoints de saldo, sino que te aseguro 25€ iniciales en acciones de una empresa que valdrá millones. Es el momento de decir "Yo estuve ahí desde el principio".`,
    de: `Hallo {{name}}, ich lade dich ein, Teil des Dicilo-Ökosystems zu werden. Mit deiner physischen DiciCoin sicherst du dir 50 DiciPoints und ein garantiertes Guthaben von 25€ für deine zukünftigen Firmenanteile. Werde zum Mitbegründer einer globalen Vision.`,
    en: `Hi {{name}}, I'm writing because I want you to be a pioneer in something big. By joining and getting your physical DiciCoin, you get 50 DiciPoints and a guaranteed 25€ balance for future shares. It's time to say "I was there from the beginning".`
};

export function InviteFriendSection({ uniqueCode }: InviteFriendSectionProps) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const functions = getFunctions(app, 'europe-west1');

    const [invites, setInvites] = useState<PioneerInvite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    // Cascading Input State
    const [inputs, setInputs] = useState<InviteInput[]>([{ name: '', email: '', lang: 'es' }]);

    // Initial Data Fetch
    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(
            collection(db, 'referrals_pioneers'),
            where('referrerId', '==', auth.currentUser.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedInvites = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PioneerInvite));
            // Sort by creation date desc
            loadedInvites.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            setInvites(loadedInvites);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [auth.currentUser]);

    // Input Handlers
    const addRow = () => {
        if (inputs.length + invites.length >= MAX_FRIENDS) {
            toast({ title: t('pioneer.toasts.limitReached'), description: t('pioneer.toasts.limitReachedDesc', { max: MAX_FRIENDS }), variant: 'destructive' });
            return;
        }
        setInputs([...inputs, { name: '', email: '', lang: 'es' }]);
    };

    const removeRow = (index: number) => {
        const newInputs = [...inputs];
        newInputs.splice(index, 1);
        setInputs(newInputs);
    };

    const updateRow = (index: number, field: keyof InviteInput, value: string) => {
        const newInputs = [...inputs];
        newInputs[index] = { ...newInputs[index], [field]: value };
        setInputs(newInputs);
    };

    const handleSendBatch = async () => {
        const validInputs = inputs.filter(i => i.name.trim() && i.email.trim() && i.email.includes('@'));

        if (validInputs.length === 0) {
            toast({ title: t('pioneer.toasts.incompleteData'), description: t('pioneer.toasts.incompleteDataDesc'), variant: 'destructive' });
            return;
        }

        if (validInputs.length + invites.length > MAX_FRIENDS) {
            toast({ title: t('pioneer.toasts.excessInvites'), description: t('pioneer.toasts.excessInvitesDesc', { max: MAX_FRIENDS }), variant: 'destructive' });
            return;
        }

        setIsSending(true);
        try {
            const sendFn = httpsCallable(functions, 'sendPioneerInvitations');

            // Prepare payload
            const friendsPayload = validInputs.map(input => ({
                name: input.name,
                email: input.email,
                lang: input.lang,
                // Generate personalized text based on template
                editedText: DEFAULT_TEMPLATES[input.lang].replace('{{name}}', input.name)
            }));

            await sendFn({
                referrerName: auth.currentUser?.displayName || 'Un Amigo',
                referrerId: auth.currentUser?.uid,
                friends: friendsPayload
            });

            toast({ title: t('pioneer.toasts.sentSuccess'), description: t('pioneer.toasts.sentSuccessDesc', { count: validInputs.length }) });
            setInputs([{ name: '', email: '', lang: 'es' }]); // Reset form
        } catch (error: any) {
            console.error(error);
            toast({ title: t('pioneer.toasts.sendError'), description: error.message || t('pioneer.toasts.sendErrorDesc'), variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    const getStatusColor = (status: string, opened?: boolean) => {
        if (status === 'registered') return 'bg-green-100 text-green-800 border-green-200';
        if (status === 'action_required' || status === 'manual_action_required') return 'bg-orange-100 text-orange-800 border-orange-200';
        if (opened) return 'bg-blue-50 text-blue-800 border-blue-200';
        return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    const getStatusLabel = (invite: PioneerInvite) => {
        switch (invite.status) {
            case 'registered': return t('pioneer.status.registered');
            case 'opened': return t('pioneer.status.seenInterest');
            case 'sent': return t('pioneer.status.sent');
            case 'reminder_1_sent': return t('pioneer.status.reminder1');
            case 'reminder_2_sent': return t('pioneer.status.reminder2');
            case 'action_required':
            case 'manual_action_required': return t('pioneer.status.manualAction');
            default: return t('pioneer.status.pending');
        }
    };

    const availableSlots = Math.max(0, MAX_FRIENDS - invites.length);

    return (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
            {/* Header / Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-primary/90 to-primary text-white border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-white/80">{t('pioneer.stats.availableSlots')}</CardDescription>
                        <CardTitle className="text-4xl font-bold">{availableSlots}</CardTitle>
                    </CardHeader>
                    <CardFooter className="text-sm opacity-80">
                        {t('pioneer.stats.totalSlots', { max: MAX_FRIENDS })}
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('pioneer.stats.viewingProposal')}</CardDescription>
                        <CardTitle className="text-4xl text-blue-600 font-bold">
                            {invites.filter(i => i.opened && i.status !== 'registered').length}
                        </CardTitle>
                    </CardHeader>
                    <CardFooter className="text-sm text-muted-foreground">
                        {t('pioneer.stats.emailsOpened')}
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('pioneer.stats.referralsClosed')}</CardDescription>
                        <CardTitle className="text-4xl text-green-600 font-bold">
                            {invites.filter(i => i.status === 'registered').length}
                        </CardTitle>
                    </CardHeader>
                    <CardFooter className="text-sm text-muted-foreground">
                        {t('pioneer.stats.bonusPerUser')}
                    </CardFooter>
                </Card>
            </div>

            {/* Cascading Invite Form */}
            {availableSlots > 0 && (
                <Card className="border-2 border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            {t('pioneer.form.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('pioneer.form.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="grid grid-cols-12 gap-3 text-sm font-medium text-muted-foreground mb-2 px-1">
                                <div className="col-span-4 md:col-span-3">{t('pioneer.form.name')}</div>
                                <div className="col-span-5 md:col-span-5">{t('pioneer.form.email')}</div>
                                <div className="col-span-3 md:col-span-3">{t('pioneer.form.language')}</div>
                                <div className="col-span-1"></div>
                            </div>

                            {inputs.map((input, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-3 items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="col-span-4 md:col-span-3">
                                        <Input
                                            placeholder={t('pioneer.form.name')}
                                            value={input.name}
                                            onChange={(e) => updateRow(idx, 'name', e.target.value)}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="col-span-5 md:col-span-5">
                                        <Input
                                            placeholder={t('pioneer.form.emailPlaceholder')}
                                            value={input.email}
                                            onChange={(e) => updateRow(idx, 'email', e.target.value)}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="col-span-3 md:col-span-3">
                                        <Select
                                            value={input.lang}
                                            onValueChange={(val: any) => updateRow(idx, 'lang', val)}
                                        >
                                            <SelectTrigger className="bg-background">
                                                <SelectValue placeholder={t('pioneer.form.language')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="es">🇪🇸 ES</SelectItem>
                                                <SelectItem value="de">🇩🇪 DE</SelectItem>
                                                <SelectItem value="en">🇬🇧 EN</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        {inputs.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeRow(idx)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4 border-t mt-4">
                            <Button
                                variant="outline"
                                onClick={addRow}
                                disabled={inputs.length >= availableSlots}
                                className="border-dashed"
                            >
                                <Plus className="h-4 w-4 mr-2" /> {t('pioneer.form.addRow')}
                            </Button>

                            <Button
                                onClick={handleSendBatch}
                                disabled={isSending}
                                className="bg-primary text-white shadow-md w-full sm:w-auto min-w-[200px]"
                            >
                                {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                {t('pioneer.form.submitButton')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tracking List */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('pioneer.tracking.title')}</CardTitle>
                    <CardDescription>
                        {t('pioneer.tracking.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <div className="space-y-1">
                            {invites.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground bg-secondary/10 rounded-lg border border-dashed">
                                    <Mail className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p>{t('pioneer.tracking.emptyState')}</p>
                                    <p className="text-sm opacity-70">{t('pioneer.tracking.emptyStateSub')}</p>
                                </div>
                            ) : (
                                invites.map((invite) => (
                                    <div
                                        key={invite.id}
                                        className={cn(
                                            "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border mb-3 transition-all hover:shadow-sm",
                                            invite.status === 'registered' ? "bg-green-50/60 border-green-200" : "bg-card"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border select-none",
                                                invite.status === 'registered' ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {invite.friendName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold flex items-center gap-2">
                                                    {invite.friendName}
                                                    {invite.opened && invite.status !== 'registered' && (
                                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] py-0 h-5">
                                                            <Eye className="w-3 h-3 mr-1" /> {t('pioneer.status.seen')}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{invite.friendEmail}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 justify-between sm:justify-end w-full sm:w-auto">
                                            <div className="flex flex-col items-end">
                                                <Badge variant="outline" className={cn("whitespace-nowrap", getStatusColor(invite.status, invite.opened))}>
                                                    {getStatusLabel(invite)}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground mt-1">
                                                    {invite.updatedAt ? new Date(invite.updatedAt.seconds * 1000).toLocaleDateString() : t('pioneer.status.recent')}
                                                </span>
                                            </div>

                                            {/* Action Buttons for Critical States */}
                                            {(invite.status === 'manual_action_required' || invite.status === 'action_required') && (
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm ml-2"
                                                    onClick={() => window.open(`https://wa.me/?text=Hola ${invite.friendName}, vi que te envié la invitación a Dicilo pero no has podido revisarla. ¿Tienes dudas?`, '_blank')}
                                                >
                                                    <MessageSquare className="h-4 w-4 mr-1" /> {t('pioneer.actions.contact')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
