'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Users, Send, Loader2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

export function ReferralCard() {
    const { t, i18n } = useTranslation('common');
    const { toast } = useToast();
    const auth = getAuth(app);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emails, setEmails] = useState('');
    const [language, setLanguage] = useState(i18n.language || 'es');
    const [template, setTemplate] = useState('general');

    const handleSend = async () => {
        if (!emails.trim()) return;

        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast({ title: "Error", description: "No estás autenticado", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        // Split emails by comma, newline, or space and clean up
        const emailList = emails.split(/[\n, ]+/).map(e => e.trim()).filter(e => e);

        if (emailList.length === 0) {
            setIsLoading(false);
            return;
        }

        const payload = {
            referrer_id: currentUser.uid,
            referrer_name: currentUser.displayName || currentUser.email,
            referrer_email: currentUser.email,
            emails: emailList,
            language: language,
            template: template,
            timestamp: new Date().toISOString()
        };

        try {
            // Using a placeholder URL or env var. 
            // Since the user didn't provide it yet, I'll use a relative API route or assume direct n8n call if configured.
            // For now, I'll allow it to fail gracefully or log it if no URL is set.
            const webhookUrl = process.env.NEXT_PUBLIC_N8N_REFERRAL_WEBHOOK;

            if (!webhookUrl) {
                console.warn("Missing NEXT_PUBLIC_N8N_REFERRAL_WEBHOOK");
                // Mock success for UI demo if no webhook is set, or throw error?
                // The user said "Webhook Node (POST): Recibe el JSON del frontend."
                // I'll assume they will set the ENV var.
                throw new Error("Webhook URL not configured");
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast({
                    title: t('referrals.successTitle', '¡Invitaciones enviadas!'),
                    description: t('referrals.successDesc', `Se han enviado ${emailList.length} invitaciones.`),
                });
                setIsOpen(false);
                setEmails('');
            } else {
                throw new Error('Failed to send');
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: t('referrals.error', 'Hubo un error al enviar las invitaciones. Inténtalo más tarde.'),
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <Users className="h-8 w-8 text-blue-600 mb-2" />
                        <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                            {t('adsManager.cards.active', 'Activo')}
                        </Badge>
                    </div>
                    <CardTitle className="text-xl">Recomienda a amigos</CardTitle>
                    <CardDescription>
                        Gana 50 DiciPoints con cada amigo que se registre usando tu invitaciÃ³n.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                Invitar Amigos
                                <Send className="ml-2 h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Invitar a amigos</DialogTitle>
                                <DialogDescription>
                                    Ingresa los correos de tus amigos y elige el idioma de la invitación.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="emails">Correos electrónicos (separados por coma)</Label>
                                    <Textarea
                                        id="emails"
                                        placeholder="amigo1@email.com, amigo2@email.com"
                                        value={emails}
                                        onChange={(e) => setEmails(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Idioma</Label>
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona idioma" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="es">Español</SelectItem>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="de">Deutsch</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Plantilla</Label>
                                        <Select value={template} onValueChange={setTemplate}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona plantilla" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="general">General</SelectItem>
                                                <SelectItem value="business">Negocios</SelectItem>
                                                <SelectItem value="crypto">Cripto / Web3</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleSend} disabled={isLoading || !emails.trim()}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            Enviar Invitaciones
                                            <Send className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
            </Card>
        </>
    );
}
