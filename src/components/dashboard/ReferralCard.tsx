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
import { Users, Send, Loader2, Eye, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

const CONTENT_PREVIEWS: Record<string, Record<string, any>> = {
    'es': {
        'general': {
            subject: "Te invito a ahorrar y ganar dinero en Dicilo.net",
            body: "Hola [Nombre]! 👋\n\nTu amigo [Tu Nombre] te ha invitado a unirte a Dicilo.\n\nDicilo es la red confiable y que esta creciendo bastante rapido a nivel internacional.\n\n[BOTÓN: Unirme y Ahorrar]\n\nSi no es de tu interes,por favor hazmelo saber. Gracias y espero nos hablemos pronto."
        },
        'business': {
            subject: "Genera ingresos extra recomendando empresas",
            body: "Hola [Nombre]! 👋\n\n¿Buscas trabajar desde casa, o te interesaría generar extras desde tu PC o móvil?\n\nEn Dicilo puedes hacerlo realidad gracias a la facilidad del trabajo online; te explico.\n\nRecomienda empresas y gana Dicipoints que luego puedes cambiar por descuentos en nuestras empresas aliadas, o recomienda las empresas donde sueles comprar y gana comisiones por la compra de publicidad que ellos hagan gracias a tu recomendación.\n\nDicilo es la plataforma de marketing digital de MHC Alemania. Regístrate aquí gratis para que empecemos juntos.\n\nDicilo es una red confiable creada en Hamburgo, Alemania, por un grupo de empresarios jóvenes para apoyar a los pequeños y medianos comerciantes y que está creciendo bastante rápido a nivel nacional e internacional.\n\n[BOTÓN: Empezar a Ganar]\n\nSi no es de tu interés o tienes alguna duda, por favor házmelo saber. Gracias y espero nos hablemos pronto.\nSaludos\n[Tu Nombre]"
        },
        'crypto': {
            subject: "50 DiciPoints te están esperando 🪙",
            body: "Hola [Nombre]! 👋\n\nÚnete a la economía de Dicilo. Gana DiciPoints y DiciCoins canjeables por productos y viajes. Es un ecosistema descentralizado donde tu participación tiene valor real. Usa mi invitación exclusiva aquí.\n\nDicilo es la red confiable y que esta creciendo bastante rapido a nivel internacional.\n\n[BOTÓN: Reclamar DiciPoints]\n\nSi no es de tu interes,por favor hazmelo saber. Gracias y espero nos hablemos pronto."
        }
    },
    'en': {
        'general': {
            subject: "I invite you to save and earn money on Dicilo.net",
            body: "Hello [Nombre]! 👋\n\nYour friend [Tu Nombre] invited you to join Dicilo.\n\nDicilo is the trusted network and is growing quite fast internationally.\n\n[BUTTON: Join and Save]\n\nIf this is not of interest to you, please let me know. Thanks and I hope we speak soon."
        },
        'business': {
            subject: "Generate extra income by referring businesses",
            body: "Hello [Nombre]! 👋\n\nAre you looking to work from home, or would you be interested in generating extra income from your PC or mobile?\n\nAt Dicilo you can make it happen thanks to the ease of online work; let me explain.\n\nRefer businesses and earn Dicipoints that you can later exchange for discounts at our allied companies, or recommend the companies where you usually shop and earn commissions for the advertising they purchase thanks to your recommendation.\n\nDicilo is the digital marketing platform of MHC Germany. Register here for free so we can start together.\n\nDicilo is a trusted network created in Hamburg, Germany, by a group of young entrepreneurs to support small and medium-sized merchants, and it is growing quite fast nationally and internationally.\n\n[BUTTON: Start Earning]\n\nIf this is not of interest to you or if you have any questions, please let me know. Thanks and I hope we speak soon.\nRegards\n[Tu Nombre]"
        },
        'crypto': {
            subject: "50 DiciPoints are waiting for you 🪙",
            body: "Hello [Nombre]! 👋\n\nJoin the Dicilo economy. Earn DiciPoints. Earn DiciPoints and DiciCoins redeemable for products and travel. It's a decentralized ecosystem where your participation has real value. Use my exclusive invitation here.\n\nDicilo is the trusted network and is growing quite fast internationally.\n\n[BUTTON: Claim DiciPoints]\n\nIf this is not of interest to you, please let me know. Thanks and I hope we speak soon."
        }
    },
    'de': {
        'general': {
            subject: "Ich lade dich ein, auf Dicilo.net zu sparen und zu verdienen",
            body: "Hallo [Nombre]! 👋\n\nDein Freund [Tu Nombre] hat dich eingeladen, Dicilo beizutreten.\n\nDicilo ist das vertrauenswürdige Netzwerk und wächst international ziemlich schnell.\n\n[BUTTON: Beitreten und Sparen]\n\nWenn dich das nicht interessiert, lass es mich bitte wissen. Danke und ich hoffe, wir sprechen uns bald."
        },
        'business': {
            subject: "Generiere Zusatzeinkommen durch Unternehmensnachweis",
            body: "Hallo [Nombre]! 👋\n\nSuchst du Arbeit von zu Hause aus, oder wärst du daran interessiert, Extras von deinem PC oder Handy aus zu generieren?\n\nBei Dicilo kannst du das dank der einfachen Online-Arbeit verwirklichen; ich erkläre es dir.\n\nEmpfiehl Unternehmen und verdiene Dicipoints, die du später gegen Rabatte bei unseren Partnerunternehmen eintauschen kannst, oder empfiehl die Unternehmen, bei denen du normalerweise einkaufst, und verdiene Provisionen für die Werbung, die sie dank deiner Empfehlung kaufen.\n\nDicilo ist die digitale Marketingplattform von MHC Deutschland. Registriere dich hier kostenlos, damit wir gemeinsam starten können.\n\nDicilo ist ein vertrauenswürdiges Netzwerk, das in Hamburg, Deutschland, von einer Gruppe junger Unternehmer gegründet wurde, um kleine und mittlere Händler zu unterstützen, und das national und international ziemlich schnell wächst.\n\n[BUTTON: Jetzt Verdienen]\n\nWenn dich das nicht interessiert oder du Fragen hast, lass es mich bitte wissen. Danke und ich hoffe, wir sprechen uns bald.\nGrüße\n[Tu Nombre]"
        },
        'crypto': {
            subject: "50 DiciPoints warten auf dich 🪙",
            body: "Hallo [Nombre]! 👋\n\nSchließ dich der Dicilo-Wirtschaft an. Verdiene DiciPoints und DiciCoins, die gegen Produkte und Reisen eingelöst werden können. Es ist ein dezentrales Ökosystem, in dem deine Teilnahme echten Wert hat. Nutze hier meine exklusive Einladung.\n\nDicilo ist das vertrauenswürdige Netzwerk und wächst international ziemlich schnell.\n\n[BUTTON: DiciPoints Beanspruchen]\n\nWenn dich das nicht interessiert, lass es mich bitte wissen. Danke und ich hoffe, wir sprechen uns bald."
        }
    }
};

type Friend = {
    name: string;
    email: string;
    language: string;
    template: string;
};

export function ReferralCard() {
    const { t, i18n } = useTranslation('common');
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

    // Current Block Input State
    const [currentName, setCurrentName] = useState('');
    const [currentEmail, setCurrentEmail] = useState('');
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'es');
    const [currentTemplate, setCurrentTemplate] = useState('general');

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
            template: currentTemplate
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

        const payload = {
            referrer_id: uniqueCode || currentUser.uid,
            referrer_name: referrerName,
            referrer_email: currentUser.email,
            friends: friends, // Array of objects with all config
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
        const langContent = CONTENT_PREVIEWS[currentLanguage] || CONTENT_PREVIEWS['es'];
        const tmplContent = langContent[currentTemplate] || langContent['general'];
        return tmplContent;
    };

    const previewData = getPreviewContent();

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
                        Gana 50 DiciPoints con cada amigo que se registre.
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
                        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Personalizar Invitación</DialogTitle>
                                <DialogDescription>
                                    Agrega hasta 7 amigos y envíales una invitación personalizada.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                {/* Global User Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tu ID</Label>
                                        <Input value={uniqueCode || 'Cargando...'} disabled className="bg-muted" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tu Nombre</Label>
                                        <Input
                                            value={referrerName}
                                            onChange={(e) => setReferrerName(e.target.value)}
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                </div>

                                {/* ADD FRIEND BLOCK */}
                                <div className="border border-blue-200 p-4 rounded-md bg-blue-50/50 dark:bg-blue-900/10 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-sm text-blue-700">Agregar Amigo ({friends.length}/7)</h4>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nombre</Label>
                                            <Input
                                                value={currentName}
                                                onChange={(e) => setCurrentName(e.target.value)}
                                                placeholder="Ej. Martín"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                value={currentEmail}
                                                onChange={(e) => setCurrentEmail(e.target.value)}
                                                placeholder="email@ejemplo.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Idioma</Label>
                                            <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
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
                                            <Select value={currentTemplate} onValueChange={setCurrentTemplate}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona plantilla" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="general">Ahorro (General)</SelectItem>
                                                    <SelectItem value="business">Trabajo (Negocios)</SelectItem>
                                                    <SelectItem value="crypto">Cripto (DiciPoints)</SelectItem>
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
                                                    Vista Previa
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[500px]">
                                                <DialogHeader>
                                                    <DialogTitle>Vista Previa ({currentName || 'Amigo'})</DialogTitle>
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
                                            Agregar a la lista
                                        </Button>
                                    </div>
                                </div>

                                {/* FRIENDS LIST */}
                                {friends.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Lista de envío ({friends.length})</Label>
                                        <div className="bg-white dark:bg-slate-950 border rounded-md divide-y max-h-[200px] overflow-y-auto">
                                            {friends.map((friend, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 text-sm">
                                                    <div className="grid gap-1">
                                                        <div className="font-semibold flex items-center gap-2">
                                                            {friend.name}
                                                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">{friend.language.toUpperCase()}</Badge>
                                                        </div>
                                                        <div className="text-muted-foreground text-xs">{friend.email}</div>
                                                        <div className="text-xs text-blue-600/80">{friend.template}</div>
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

                            <DialogFooter>
                                <Button
                                    type="submit"
                                    onClick={handleSend}
                                    disabled={isLoading || friends.length === 0}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enviando {friends.length} Invitaciones...
                                        </>
                                    ) : (
                                        <>
                                            Enviar {friends.length} Invitaciones
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
