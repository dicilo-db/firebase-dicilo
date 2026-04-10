'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { createTicket } from '@/app/actions/tickets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateTicketPage() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [module, setModule] = useState('general'); // Default to general
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [attachment, setAttachment] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            const result = await createTicket({
                uid: user.uid,
                userEmail: user.email || '',
                userName: user.displayName || 'User',
                title,
                module, // Pass module
                description,
                priority,
                attachments: attachment ? [attachment] : []
            });

            if (result.success) {
                toast({
                    title: t('tickets.successCreated'),
                    description: t('form.successDesc'),
                });
                router.push('/dashboard/tickets');
            } else {
                toast({
                    title: t('form.errorTitle'),
                    description: result.error,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: t('form.errorTitle'),
                description: t('form.errorDesc'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/dashboard/tickets">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('tickets.myTickets')}
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>{t('tickets.createTitle')}</CardTitle>
                    <CardDescription>{t('form.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">{t('tickets.subject')}</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="e.g., Cannot update profile image"
                            />
                        </div>


                        <div className="space-y-2">
                            <Label htmlFor="module">{t('tickets.module', 'Modul')}</Label>
                            <Select value={module} onValueChange={setModule}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('tickets.selectModule', 'Wählen Sie ein Modul')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">{t('tickets.modules.general', 'Allgemein')}</SelectItem>
                                    <SelectItem value="dashboard">{t('tickets.modules.dashboard', 'Dashboard')}</SelectItem>
                                    <SelectItem value="profile">{t('tickets.modules.profile', 'Profil')}</SelectItem>
                                    <SelectItem value="builder">{t('tickets.modules.builder', 'Landing Page Builder')}</SelectItem>
                                    <SelectItem value="ads">{t('tickets.modules.ads', 'Ads Manager')}</SelectItem>
                                    <SelectItem value="inhaltsverwaltung">{t('tickets.modules.content', 'Inhaltsverwaltung')}</SelectItem>
                                    <SelectItem value="ai_chat">{t('tickets.modules.ai_chat', 'AI Chat')}</SelectItem>
                                    <SelectItem value="registrations">{t('tickets.modules.registrations', 'Registrierungen')}</SelectItem>
                                    <SelectItem value="private_users">{t('tickets.modules.private_users', 'Privat User')}</SelectItem>
                                    <SelectItem value="directory">{t('tickets.modules.directory', 'Verzeichnis (Businesses)')}</SelectItem>
                                    <SelectItem value="statistics">{t('tickets.modules.statistics', 'Statistiken')}</SelectItem>
                                    <SelectItem value="plans">{t('tickets.modules.plans', 'Pläne')}</SelectItem>
                                    <SelectItem value="forms">{t('tickets.modules.forms', 'Formulare')}</SelectItem>
                                    <SelectItem value="recommendations">{t('tickets.modules.recommendations', 'Empfehlungen')}</SelectItem>
                                    <SelectItem value="feedback">{t('tickets.modules.feedback', 'Feedback')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">{t('tickets.priority')}</Label>
                            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">{t('tickets.priorityLow')}</SelectItem>
                                    <SelectItem value="medium">{t('tickets.priorityMedium')}</SelectItem>
                                    <SelectItem value="high">{t('tickets.priorityHigh')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">{t('tickets.description')}</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={5}
                                placeholder="Describe the issue in detail..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="attachment">{t('tickets.attachment', 'Anhang (Optional)')}</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="attachment"
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        // Max 5MB
                                        if (file.size > 5 * 1024 * 1024) {
                                            toast({
                                                title: t('common:error'),
                                                description: t('tickets.fileTooLarge', 'Datei ist zu groß (Max 5MB)'),
                                                variant: "destructive"
                                            });
                                            return;
                                        }

                                        setIsSubmitting(true);
                                        try {
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            formData.append('path', `tickets/${user?.uid}/${Date.now()}_${file.name}`);

                                            // Dynamic import to avoid server action issues in client component if not handled well, 
                                            // though standard import works for server actions usually.
                                            // Using standard import as per Next.js App Router patterns.
                                            const { uploadImage } = await import('@/app/actions/upload');

                                            const res = await uploadImage(formData);
                                            if (res.success && res.url) {
                                                setAttachment(res.url);
                                                toast({ title: t('common:success'), description: t('tickets.uploadSuccess', 'Datei hochgeladen') });
                                            } else {
                                                toast({ title: t('common:error'), description: res.error, variant: "destructive" });
                                            }
                                        } catch (error) {
                                            console.error(error);
                                            toast({ title: t('common:error'), description: t('tickets.uploadError', 'Fehler beim Hochladen'), variant: "destructive" });
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }}
                                />
                                {attachment && (
                                    <span className="text-xs text-green-600 font-medium overflow-hidden max-w-[200px] truncate">
                                        {t('tickets.fileAttached', 'Angehängt')}
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Supported: JPG, PNG (Max 5MB)</p>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('tickets.submit')}
                                </>
                            ) : (
                                t('tickets.submit')
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div >
    );
}
