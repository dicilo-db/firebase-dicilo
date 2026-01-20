'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Send, Loader2, Eye, Plus, Trash2, Share2, MessageCircle, Facebook, Mail, Copy, Twitter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

import { getTemplates, EmailTemplate } from '@/actions/email-templates';

// Fallback templates in case DB is empty
const FALLBACK_TEMPLATES: Record<string, any> = {
    'es': {
        'general': {
            subject: "{{Nombre}}, te guardé esta invitación (Ahorro + $$) 🚀",
            body: "Hola {{Nombre}}, ¿cómo va todo? 👋\n\nMe acordé de ti porque sé que tienes buen ojo para las oportunidades y no te gusta tirar el dinero.\n\nTe invito a entrar en Dicilo.net. Es una plataforma alemana (de Hamburgo, gente seria) que está cambiando las reglas: no solo ahorras comprando, sino que ganas dinero real por recomendar y conectar empresas.\n\nTe paso mi pase VIP gratis para que entres ya.\n\nTienen un sistema de puntos (DiciPoints) que vale la pena mirar. Entra, regístrate y echa un ojo. 👀\n\n👉 [BOTÓN: Ver Dicilo y Aceptar Invitación] (Se activará con mi código: {{RefCode}})\n\nPD: Si te registras, escríbeme por WhatsApp. Ya descubrí un par de trucos para sumar puntos más rápido y quiero contártelos para que arranques con ventaja. 😉\n\nUn abrazo,\n\n{{Tu Nombre}}"
        },
        // ... (preserving other existing fallbacks if needed, but for brevity using general as main fallback)
    }
};

type Friend = {
    name: string;
    email: string;
    language: string;
    templateId: string; // Changed from template to templateId
};

export function ReferralCard() {
    const { t, i18n } = useTranslation(['common', 'admin']);
    const { toast } = useToast();
    const auth = getAuth(app);
    const db = getFirestore(app);

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // Preview state
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // User Info
    const [referrerName, setReferrerName] = useState('');
    const [uniqueCode, setUniqueCode] = useState('');

    // Friends Accumulator
    const [friends, setFriends] = useState<Friend[]>([]);

    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // Current Block Input State
    const [currentName, setCurrentName] = useState('');
    const [currentEmail, setCurrentEmail] = useState('');
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'es');
    const [currentTemplateId, setCurrentTemplateId] = useState('');

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const fetched = await getTemplates();
                // Filter only 'referrals'
                setTemplates(fetched.filter(t => t.category === 'referrals'));
            } catch (e) {
                console.error("Failed to fetch templates", e);
            } finally {
                setLoadingTemplates(false);
            }
        };
        fetchTemplates();
    }, []);

    useEffect(() => {
        // Set default template when templates load
        if (templates.length > 0) {
            setCurrentTemplateId(templates[0].id || '');
        } else {
            setCurrentTemplateId('general'); // Fallback ID
        }
    }, [templates]);

    useEffect(() => {
        const fetchProfile = async () => {
            const user = auth.currentUser;
            if (user) {
                setReferrerName(user.displayName || '');
                try {
                    const docRef = doc(db, 'private_profiles', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.firstName) setReferrerName(data.firstName + (data.lastName ? ' ' + data.lastName : ''));
                        if (data.uniqueCode) setUniqueCode(data.uniqueCode);
                    }
                } catch (e) {
                    console.error("Error fetching profile", e);
                }
            }
        };
        fetchProfile();
    }, []);

    const addFriend = () => {
        if (!currentName.trim() || !currentEmail.trim()) {
            toast({ title: "Faltan datos", description: "Completa nombre y email", variant: "destructive" });
            return;
        }
        if (friends.length >= 7) {
            toast({ title: "Límite alcanzado", description: "Máximo 7 amigos por envío", variant: "destructive" });
            return;
        }
        setFriends([...friends, {
            name: currentName,
            email: currentEmail,
            language: currentLanguage,
            templateId: currentTemplateId
        }]);
        // Reset only name/email
        setCurrentName('');
        setCurrentEmail('');
    };

    const removeFriend = (index: number) => {
        const newFriends = [...friends];
        newFriends.splice(index, 1);
        setFriends(newFriends);
    };

    const handleSend = async () => {
        if (friends.length === 0) {
            toast({ title: "Error", description: "Agrega al menos un amigo", variant: "destructive" });
            return;
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast({ title: "Error", description: "No estás autenticado", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        const enrichedFriends = friends.map(friend => {
            // Removed deprecated CONTENT_PREVIEWS logic
            // const langContent = CONTENT_PREVIEWS[friend.language] || CONTENT_PREVIEWS['es'];
            // const tmplContent = langContent[friend.template] || langContent['general'];

            const inviteUrl = `https://dicilo.net/registrieren?ref=${uniqueCode || currentUser?.uid}`;

            // FETCH CONTENT FROM TEMPLATE ID or FALLBACK
            let subject = "";
            let body = "";

            const dbTemplate = templates.find(t => t.id === friend.templateId);
            if (dbTemplate) {
                const ver = dbTemplate.versions[friend.language] || dbTemplate.versions['es'] || dbTemplate.versions['en'];
                subject = ver?.subject || "";
                body = ver?.body || "";
            } else {
                // Fallback
                const fallback = FALLBACK_TEMPLATES['es']['general']; // Absolute safe fallback
                subject = fallback.subject;
                body = fallback.body;
            }

            // 1. Process Body
            body = body
                .replace(/\[Name\]|\[Nombre\]|\{\{Nombre\}\}|\{\{Name\}\}/g, friend.name)
                .replace(/\[Tu Nombre\]|\{\{Tu Nombre\}\}|\{\{Your Name\}\}|\{\{Dein Name\}\}/g, referrerName)
                .replace(/\[RefCode\]|\{\{RefCode\}\}/g, uniqueCode || currentUser?.uid)
                .replace(/\[(BOTÓN|BUTTON):.*?\]/g, `\n👉 ${inviteUrl}\n`);

            // 2. Process Subject
            // Handle various placeholder formats including {{}}
            subject = subject
                .replace(/\{\{.*?\}\}/g, friend.name)
                .replace(/\[Name\]|\[Nombre\]/g, friend.name);

            return {
                ...friend,
                generated_subject: subject,
                generated_body: body
            };
        });

        const payload = {
            referrer_id: uniqueCode || currentUser.uid,
            referrer_name: referrerName,
            referrer_email: currentUser.email,
            friends: enrichedFriends,
            timestamp: new Date().toISOString()
        };

        try {
            const webhookUrl = process.env.NEXT_PUBLIC_N8N_REFERRAL_WEBHOOK;
            if (!webhookUrl) throw new Error("Webhook URL not configured");

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast({
                    title: t('referrals.successTitle', '¡Envíos completados!'),
                    description: t('referrals.successDesc', `Se han procesado ${friends.length} envíos.`),
                });
                setIsOpen(false);
                setFriends([]);
            } else {
                throw new Error('Failed to send');
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Hubo un error al enviar. Inténtalo más tarde.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getPreviewContent = () => {
        // Use current inputs for preview
        const dbTemplate = templates.find(t => t.id === currentTemplateId);
        if (dbTemplate) {
            const ver = dbTemplate.versions[currentLanguage] || dbTemplate.versions['es'];
            return { subject: ver?.subject || '', body: ver?.body || '' };
        }
        // Fallback
        return FALLBACK_TEMPLATES['es']['general'];
    };

    const previewData = getPreviewContent();

    const handleSocialShare = async (platform: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser && !uniqueCode) {
            toast({ title: "Esperando datos...", description: "Cargando tu perfil, intenta en un momento." });
            return;
        }

        const inviteUrl = `https://dicilo.net/registrieren?ref=${uniqueCode || currentUser?.uid}`;

        // Prepare the body text by replacing placeholders
        let rawBody = previewData.body || "";

        // 1. Replace [Nombre] with a generic term based on language
        const genericName = currentLanguage === 'es' ? 'Amigo/a' :
            currentLanguage === 'de' ? 'Freund/in' : 'Friend';

        let processedBody = rawBody
            .replace(/\[Name\]|\[Nombre\]|\{\{Nombre\}\}|\{\{Name\}\}/g, genericName)
            .replace(/\[Tu Nombre\]|\{\{Tu Nombre\}\}|\{\{Your Name\}\}|\{\{Dein Name\}\}/g, referrerName || (currentLanguage === 'es' ? 'Tu Amigo' : 'Your Friend'))
            .replace(/\[RefCode\]|\{\{RefCode\}\}/g, uniqueCode || currentUser?.uid);

        // 2. Replace [BOTÓN: ...] with a clearer Call to Action and the Link
        // We add newlines to make it stand out.
        processedBody = processedBody.replace(/\[(BOTÓN|BUTTON):.*?\]/g, `\n👉 ${inviteUrl}\n`);

        // 3. Combine Subject + Body
        const subject = previewData.subject || "";
        const fullShareText = `*${subject}*\n\n${processedBody}`;

        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`, '_blank');
                break;
            case 'telegram':
                window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(fullShareText)}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(subject)}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(processedBody)}`;
                break;
            case 'native':
                if (navigator.share) {
                    navigator.share({
                        title: subject,
                        text: processedBody,
                        url: inviteUrl,
                    }).catch(console.error);
                } else {
                    toast({ description: "Sharing not supported on this device", variant: "destructive" });
                }
                break;
            case 'copy':
                try {
                    await navigator.clipboard.writeText(inviteUrl);
                    toast({ title: t('share.copied', 'Enlace copiado al portapapeles') });
                } catch (err) {
                    console.error('Clipboard failed');
                }
                break;
        }
    };

    return (
        <>
            <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <Users className="h-8 w-8 text-green-600 mb-2" />
                        <Badge className="bg-green-600 text-white hover:bg-green-700">
                            {t('admin:dashboard.cards.active', 'Activo')}
                        </Badge>
                    </div>
                    <CardTitle className="text-xl">{t('admin:dashboard.cards.referral.title', 'Recomienda a amigos')}</CardTitle>
                    <CardDescription>
                        {t('admin:dashboard.cards.referral.description', 'Recomienda amigos y gana 50 DiciPoints con cada amigo tuyo que se registre en dicilo.net con tu enlace unico de afiliado')}
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                {t('admin:invite.form.inviteFriendsButton', 'Invitar Amigos')}
                                <Send className="ml-2 h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t('admin:invite.form.title', 'Personalizar Invitación')}</DialogTitle>
                                <DialogDescription>
                                    {t('admin:invite.form.description', 'Agrega hasta 7 amigos y envíales una invitación personalizada.')}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                {/* Global User Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('admin:invite.form.yourId', 'Tu ID')}</Label>
                                        <Input value={uniqueCode || t('admin:invite.form.id_loading', 'Cargando...')} disabled className="bg-muted" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('admin:invite.form.yourName', 'Tu Nombre')}</Label>
                                        <Input
                                            value={referrerName}
                                            onChange={(e) => setReferrerName(e.target.value)}
                                            placeholder={t('admin:invite.form.yourNamePlaceholder', 'Tu nombre')}
                                        />
                                    </div>
                                </div>

                                {/* ADD FRIEND BLOCK */}
                                <div className="border border-blue-200 p-4 rounded-md bg-blue-50/50 dark:bg-blue-900/10 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-sm text-blue-700">{t('admin:invite.form.addFriend', { count: friends.length, defaultValue: `Agregar Amigo (${friends.length}/7)` })}</h4>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t('admin:invite.form.name', 'Nombre')}</Label>
                                            <Input
                                                value={currentName}
                                                onChange={(e) => setCurrentName(e.target.value)}
                                                placeholder={t('admin:invite.form.namePlaceholder', 'Ej. Martín')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('admin:invite.form.email', 'Email')}</Label>
                                            <Input
                                                type="email"
                                                value={currentEmail}
                                                onChange={(e) => setCurrentEmail(e.target.value)}
                                                placeholder={t('admin:invite.form.emailPlaceholder', 'email@ejemplo.com')}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t('admin:invite.form.language', 'Idioma')}</Label>
                                            <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('admin:invite.form.languagePlaceholder', 'Selecciona idioma')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="es">{t('admin:invite.form.languages.es', 'Español')}</SelectItem>
                                                    <SelectItem value="en">{t('admin:invite.form.languages.en', 'English')}</SelectItem>
                                                    <SelectItem value="de">{t('admin:invite.form.languages.de', 'Deutsch')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('admin:invite.form.template', 'Plantilla')}</Label>
                                            <Select value={currentTemplateId} onValueChange={setCurrentTemplateId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('admin:invite.form.templatePlaceholder', 'Selecciona plantilla')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {loadingTemplates ? (
                                                        <SelectItem value="loading" disabled>Cargando...</SelectItem>
                                                    ) : templates.length > 0 ? (
                                                        templates.map(tpl => (
                                                            <SelectItem key={tpl.id} value={tpl.id || 'unknown'}>
                                                                {tpl.name}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="general">General (Fallback)</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        {/* PREVIEW BUTTON (Current Block) */}
                                        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="flex-1" type="button">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    {t('admin:invite.form.preview', 'Vista Previa')}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[500px]">
                                                <DialogHeader>
                                                    <DialogTitle>{t('admin:invite.form.previewTitle', 'Vista Previa')} ({currentName || 'Amigo'})</DialogTitle>
                                                </DialogHeader>
                                                <div className="border rounded p-4 space-y-4 bg-white text-black text-sm max-h-[60vh] overflow-y-auto">
                                                    <div>
                                                        <span className="font-bold text-gray-500">Asunto:</span>
                                                        <p className="font-medium">{previewData.subject}</p>
                                                    </div>
                                                    <hr />
                                                    <div>
                                                        <span className="font-bold text-gray-500">Cuerpo:</span>
                                                        {/* Show full placeholder content. Correctly rendering newlines */}
                                                        <div className="mt-2 text-sm whitespace-pre-wrap">
                                                            {previewData.body
                                                                .replace(/\[Name\]|\[Nombre\]/g, currentName || 'Amigo')
                                                                .replace(/\[Tu Nombre\]/g, referrerName || 'Tu Amigo')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        {/* ADD BUTTON */}
                                        <Button
                                            type="button"
                                            onClick={addFriend}
                                            disabled={friends.length >= 7 || !currentName.trim() || !currentEmail.trim()}
                                            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            {t('admin:invite.form.addToList', 'Agregar a la lista')}
                                        </Button>
                                    </div>
                                </div>

                                {/* FRIENDS LIST */}
                                {friends.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t('admin:invite.form.sendList', { count: friends.length, defaultValue: `Lista de envío (${friends.length})` })}</Label>
                                        <div className="bg-white dark:bg-slate-950 border rounded-md divide-y max-h-[200px] overflow-y-auto">
                                            {friends.map((friend, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 text-sm">
                                                    <div className="grid gap-1">
                                                        <div className="font-semibold flex items-center gap-2">
                                                            {friend.name}
                                                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">{friend.language.toUpperCase()}</Badge>
                                                        </div>
                                                        <div className="text-muted-foreground text-xs">{friend.email}</div>
                                                        <div className="text-xs text-blue-600/80">
                                                            {templates.find(t => t.id === friend.templateId)?.name || 'General'}
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => removeFriend(index)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="flex-col sm:flex-row gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white h-11 text-lg">
                                            <Share2 className="mr-2 h-4 w-4" />
                                            {t('admin:invite.form.share', 'Compartir')}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuItem onClick={() => handleSocialShare('whatsapp')} className="cursor-pointer gap-2">
                                            <MessageCircle className="h-4 w-4 text-green-500" />
                                            <span>{t('admin:invite.form.share_whatsapp', 'WhatsApp')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('telegram')} className="cursor-pointer gap-2">
                                            <Send className="h-4 w-4 text-blue-400" />
                                            <span>{t('admin:invite.form.share_telegram', 'Telegram')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('facebook')} className="cursor-pointer gap-2">
                                            <Facebook className="h-4 w-4 text-blue-600" />
                                            <span>{t('admin:invite.form.share_facebook', 'Facebook')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('twitter')} className="cursor-pointer gap-2">
                                            <Twitter className="h-4 w-4 text-black dark:text-white" />
                                            <span>{t('admin:invite.form.share_twitter', 'X (Twitter)')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('email')} className="cursor-pointer gap-2">
                                            <Mail className="h-4 w-4 text-gray-600" />
                                            <span>{t('admin:invite.form.share_email', 'Email')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('native')} className="cursor-pointer gap-2">
                                            <Share2 className="h-4 w-4 text-gray-800 dark:text-gray-200" />
                                            <span>{t('admin:invite.form.share_more', '... Más opciones...')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleSocialShare('copy')} className="cursor-pointer gap-2">
                                            <Copy className="h-4 w-4" />
                                            <span>{t('admin:invite.form.share_copy', 'Copiar Enlace')}</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                    type="submit"
                                    onClick={handleSend}
                                    disabled={isLoading || friends.length === 0}
                                    className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 text-lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t('admin:invite.form.sending', { count: friends.length, defaultValue: `Enviando ${friends.length} Invitaciones...` })}
                                        </>
                                    ) : (
                                        <>
                                            {t('admin:invite.form.send', { count: friends.length, defaultValue: `Enviar ${friends.length} Invitaciones` })}
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
