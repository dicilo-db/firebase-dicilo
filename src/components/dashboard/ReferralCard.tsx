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

const CONTENT_PREVIEWS: Record<string, Record<string, any>> = {
    'es': {
        'general': {
            subject: "{{Nombre del amigo}}, tengo una invitación personal para ti (Ahorro + Ingresos) 🚀",
            body: "Hola [Nombre], ¡espero que estés genial! 👋\n\nTe escribo precisamente a ti porque sé que eres una persona que valora las oportunidades inteligentes y el crecimiento.\n\nQuiero invitarte personalmente a formar parte de Dicilo.net.\n\nQuizás no lo has escuchado aún, pero imagina formar parte de un ecosistema digital respaldado por la solidez alemana (MHC Alemania) que está revolucionando la forma en que conectamos, compramos y generamos ingresos.\n\nDicilo no es solo una plataforma más; es una red de confianza creada en Hamburgo, Alemania, por un grupo de jóvenes empresarios visionarios. ¿Su misión? Empoderar al comercio real y permitirnos a nosotros, los usuarios, ganar dinero mientras apoyamos a la economía.\n\n¿Por qué pensé en ti para esto? Porque en Dicilo tienes tres ventajas claras:\n\nAhorro inteligente: Accedes a ofertas exclusivas.\n\nIngresos reales: Puedes generar ganancias (DiciPoints y DiciCoins) recomendando o trabajando desde casa.\n\nSeguridad: Es una comunidad seria que está creciendo muy rápido a nivel internacional.\n\nMe encantaría que fuéramos parte de esto juntos desde el principio.\n\nRegístrate gratis con mi pase de invitado aquí abajo y echa un vistazo a la plataforma. No tienes nada que perder y sí mucho mundo por descubrir.\n\n👉 [BOTÓN: Entrar a Dicilo y Empezar a Ganar] (Usa mi ID de invitado para acceso VIP: [RefCode])\n\nSi al entrar te surge la duda de \"¿cómo puedo sacar el máximo provecho de esto?\", escríbeme. Tengo un par de estrategias para rentabilizar la cuenta que me gustaría contarte.\n\nUn abrazo y te veo dentro,\n\n[Tu Nombre]"
        },
        'business': {
            subject: "Genera ingresos extra recomendando empresas",
            body: "Hola [Nombre]! 👋\n\n¿Buscas trabajar desde casa, o te interesaría generar extras desde tu PC o móvil?\n\nEn Dicilo puedes hacerlo realidad gracias a la facilidad del trabajo online; te explico.\n\nRecomienda empresas y gana Dicipoints que luego puedes cambiar por descuentos en nuestras empresas aliadas, o recomienda las empresas donde sueles comprar y gana comisiones por la compra de publicidad que ellos hagan gracias a tu recomendación.\n\nDicilo es la plataforma de marketing digital de MHC Alemania. Regístrate aquí gratis para que empecemos juntos.\n\nDicilo es una red confiable creada en Hamburgo, Alemania, por un grupo de empresarios jóvenes para apoyar a los pequeños y medianos comerciantes y que está creciendo bastante rápido a nivel nacional e internacional.\n\n[BOTÓN: Empezar a Ganar]\n\nSi no es de tu interés o tienes alguna duda, por favor házmelo saber. Gracias y espero nos hablemos pronto.\nSaludos\n[Tu Nombre]"
        },
        'crypto': {
            subject: "50 DiciPoints te están esperando 🪙",
            body: "Hola [Nombre], 👋\n\nTe escribo porque sé que siempre estás buscando formas inteligentes de maximizar tus recursos y valoras estar un paso adelante.\n\nHe activado una invitación exclusiva para ti en Dicilo.net y quiero asegurarme de que la aproveches.\n\nImagina un ecosistema digital diferente: uno donde tu participación no genera solo \"likes\", sino valor tangible. Dicilo es una red descentralizada en plena expansión global que nos recompensa con DiciPoints y DiciCoins.\n\nNo son simples puntos; es una economía real respaldada por empresas, canjeable por productos, servicios e incluso viajes.\n\nQuiero que entremos juntos en esto antes de que se vuelva masivo. Es el momento perfecto para posicionarse en esta economía colaborativa.\n\nTu acceso VIP ya tiene una recompensa de bienvenida esperando:\n\n👉 [BOTÓN: Reclamar mis 50 DiciPoints y Acceder] (Usa mi ID de invitado para asegurar el bono: [RefCode])\n\nUn consejo extra: Ya he descubierto cómo acelerar la acumulación de DiciPoins más rápido que el usuario promedio. Si te registras hoy, escríbeme y te cuento el truco. 😉\n\nUn abrazo,\n\n[Tu Nombre]"
        }
    },
    'en': {
        'general': {
            subject: "{{Friend's Name}}, I have a personal invitation for you (Savings + Income) 🚀",
            body: "Hello [Nombre], hope you are doing great! 👋\n\nI'm writing specifically to you because I know you value smart opportunities and growth.\n\nI want to personally invite you to be part of Dicilo.net.\n\nYou might not have heard of it yet, but imagine being part of a digital ecosystem backed by German solidity (MHC Germany) that is revolutionizing how we connect, shop, and generate income.\n\nDicilo is not just another platform; it's a trusted network created in Hamburg, Germany, by a group of visionary young entrepreneurs. Their mission? To empower real commerce and allow us, the users, to earn money while supporting the economy.\n\nWhy did I think of you for this? Because in Dicilo you have three clear advantages:\n\nSmart Savings: You access exclusive offers.\n\nReal Income: You can generate earnings (DiciPoints and DiciCoins) by recommending or working from home.\n\nSecurity: It is a serious community growing very fast internationally.\n\nI would love for us to be part of this together from the start.\n\nSign up for free with my guest pass below and take a look at the platform. You have nothing to lose and a lot to discover.\n\n👉 [BUTTON: Enter Dicilo and Start Earning] (Use my guest ID for VIP access: [RefCode])\n\nIf you wonder \"how can I get the most out of this?\" upon entering, write to me. I have a couple of strategies to make the account profitable that I'd like to tell you about.\n\nBest regards,\n\n[Tu Nombre]"
        },
        'business': {
            subject: "Generate extra income by recommending businesses",
            body: "Hello [Nombre]! 👋\n\nAre you looking to work from home, or interested in generating extras from your PC or mobile?\n\nIn Dicilo you can make it happen thanks to the ease of online work; let me explain.\n\nRecommend businesses and earn Dicipoints that you can later exchange for discounts at our allied businesses, or recommend the businesses where you usually shop and earn commissions for the advertising purchases they make thanks to your recommendation.\n\nDicilo is the digital marketing platform of MHC Germany. Register here for free so we can start together.\n\nDicilo is a trusted network created in Hamburg, Germany, by a group of young entrepreneurs to support small and medium-sized merchants and is growing quite fast nationally and internationally.\n\n[BUTTON: Start Earning]\n\nIf this is not of interest to you or you have any doubts, please let me know. Thanks and hope to speak soon.\nRegards,\n[Tu Nombre]"
        },
        'crypto': {
            subject: "[Nombre], I have reserved 50 DiciPoints for you 🪙",
            body: "Hello [Nombre], 👋\n\nI'm writing because I know you are always looking for smart ways to maximize your resources and value staying one step ahead.\n\nI have activated an exclusive invitation for you at Dicilo.net and I want to make sure you take advantage of it.\n\nImagine a different digital ecosystem: one where your participation generates not just \"likes\", but tangible value. Dicilo is a decentralized network in full global expansion that rewards us with DiciPoints and DiciCoins.\n\nThey are not simple points; it is a real economy backed by businesses, redeemable for products, services, and even trips.\n\nI want us to get into this together before it becomes massive. It is the perfect time to position oneself in this collaborative economy.\n\nYour VIP access already has a welcome reward waiting:\n\n👉 [BUTTON: Claim my 50 DiciPoints and Access] (Use my guest ID to secure the bonus: [RefCode])\n\nAn extra tip: I have already discovered how to accelerate DiciPoints accumulation faster than the average user. If you register today, write to me and I'll tell you the trick. 😉\n\nBest,\n\n[Tu Nombre]"
        }
    },
    'de': {
        'general': {
            subject: "{{Name des Freundes}}, ich habe eine persönliche Einladung für dich (Sparen + Einkommen) 🚀",
            body: "Hallo [Nombre], ich hoffe, es geht dir gut! 👋\n\nIch schreibe dir, weil ich weiß, dass du clevere Möglichkeiten und Wachstum schätzt.\n\nIch möchte dich persönlich einladen, Teil von Dicilo.net zu werden.\n\nVielleicht hast du noch nichts davon gehört, aber stell dir vor, Teil eines digitalen Ökosystems zu sein, das durch deutsche Solidität (MHC Deutschland) gestützt wird und die Art und Weise revolutioniert, wie wir uns vernetzen, einkaufen und Einkommen generieren.\n\nDicilo ist nicht nur eine weitere Plattform; es ist ein vertrauenswürdiges Netzwerk, das in Hamburg von einer Gruppe visionärer Jungunternehmer gegründet wurde. Ihre Mission? Den realen Handel stärken und uns Nutzern ermöglichen, Geld zu verdienen, während wir die Wirtschaft unterstützen.\n\nWarum habe ich dabei an dich gedacht? Weil du bei Dicilo drei klare Vorteile hast:\n\nSmartes Sparen: Zugang zu exklusiven Angeboten.\n\nReales Einkommen: Du kannst Einnahmen (DiciPoints und DiciCoins) durch Empfehlungen oder Arbeit von zu Hause aus generieren.\n\nSicherheit: Es ist eine seriöse Gemeinschaft, die international sehr schnell wächst.\n\nIch würde mich freuen, wenn wir von Anfang an gemeinsam dabei wären.\n\nRegistriere dich unten kostenlos mit meinem Gastpass und schau dir die Plattform an. Du hast nichts zu verlieren und viel zu entdecken.\n\n👉 [BUTTON: Dicilo betreten und Geld verdienen] (Nutze meine Gast-ID für VIP-Zugang: [RefCode])\n\nWenn du dich nach dem Eintritt fragst: \"Wie kann ich das Beste daraus machen?\", schreib mir. Ich habe ein paar Strategien, um das Konto rentabel zu machen, die ich dir gerne erzählen würde.\n\nViele Grüße,\n\n[Tu Nombre]"
        },
        'business': {
            subject: "Generiere Zusatzeinkommen durch Unternehmens-Empfehlungen",
            body: "Hallo [Nombre]! 👋\n\nSuchst du Arbeit von zu Hause oder möchtest du dir etwas dazuverdienen, bequem von PC oder Handy aus?\n\nBei Dicilo kannst du das dank der einfachen Online-Arbeit verwirklichen; lass es mich erklären.\n\nEmpfiehl Unternehmen und verdiene DicioPoints, die du später gegen Rabatte bei unseren Partnerunternehmen eintauschen kannst, oder empfiehl die Geschäfte, in denen du normalerweise einkaufst, und verdiene Provisionen für deren Werbekäufe dank deiner Empfehlung.\n\nDicilo ist die digitale Marketingplattform der MHC Deutschland. Registriere dich hier kostenlos, damit wir gemeinsam starten können.\n\nDicilo ist ein vertrauenswürdiges Netzwerk, das in Hamburg von einer Gruppe junger Unternehmer gegründet wurde, um kleine und mittlere Händler zu unterstützen, und wächst national sowie international sehr schnell.\n\n[BUTTON: Jetzt Geld verdienen]\n\nFalls kein Interesse besteht oder du Fragen hast, lass es mich bitte wissen. Danke und ich hoffe, wir hören bald voneinander.\nGrüße,\n[Tu Nombre]"
        },
        'crypto': {
            subject: "[Nombre], ich habe 50 DiciPoints für dich reserviert 🪙",
            body: "Hallo [Nombre], 👋\n\nIch schreibe dir, weil ich weiß, dass du immer nach smarten Wegen suchst, deine Ressourcen zu maximieren und es schätzt, einen Schritt voraus zu sein.\n\nIch habe eine exklusive Einladung für dich auf Dicilo.net aktiviert und möchte sicherstellen, dass du sie nutzt.\n\nStell dir ein anderes digitales Ökosystem vor: eines, in dem deine Teilnahme nicht nur \"Likes\", sondern greifbaren Wert generiert. Dicilo ist ein dezentrales Netzwerk in voller globaler Expansion, das uns mit DiciPoints und DiciCoins belohnt.\n\nEs sind keine einfachen Punkte; es ist eine reale Wirtschaft, gestützt durch Unternehmen, einlösbar gegen Produkte, Dienstleistungen und sogar Reisen.\n\nIch möchte, dass wir gemeinsam einsteigen, bevor es massentauglich wird. Es ist der perfekte Zeitpunkt, um sich in dieser kollaborativen Wirtschaft zu positionieren.\n\nDein VIP-Zugang hält bereits eine Willkommensbelohnung bereit:\n\n👉 [BUTTON: Meine 50 DiciPoints beanspruchen und zugreifen] (Nutze meine Gast-ID, um den Bonus zu sichern: [RefCode])\n\nEin Extra-Tipp: Ich habe bereits herausgefunden, wie man die Ansammlung von DiciPoints schneller beschleunigt als der Durchschnittsnutzer. Wenn du dich heute registrierst, schreib mir und ich verrate dir den Trick. 😉\n\nAlles Gute,\n\n[Tu Nombre]"
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
            .replace(/\[Name\]|\[Nombre\]/g, genericName)
            .replace(/\[Tu Nombre\]/g, referrerName || (currentLanguage === 'es' ? 'Tu Amigo' : 'Your Friend'))
            .replace(/\[RefCode\]/g, uniqueCode || currentUser?.uid);

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
            <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <Users className="h-8 w-8 text-blue-600 mb-2" />
                        <Badge className="bg-blue-600 text-white hover:bg-blue-700">
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

                            <DialogFooter className="flex-col sm:flex-row gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white h-11 text-lg">
                                            <Share2 className="mr-2 h-4 w-4" />
                                            {t('share.button', 'Compartir')}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuItem onClick={() => handleSocialShare('whatsapp')} className="cursor-pointer gap-2">
                                            <MessageCircle className="h-4 w-4 text-green-500" />
                                            <span>WhatsApp</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('telegram')} className="cursor-pointer gap-2">
                                            <Send className="h-4 w-4 text-blue-400" />
                                            <span>Telegram</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('facebook')} className="cursor-pointer gap-2">
                                            <Facebook className="h-4 w-4 text-blue-600" />
                                            <span>Facebook</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('twitter')} className="cursor-pointer gap-2">
                                            <Twitter className="h-4 w-4 text-black dark:text-white" />
                                            <span>X (Twitter)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('email')} className="cursor-pointer gap-2">
                                            <Mail className="h-4 w-4 text-gray-600" />
                                            <span>Email</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSocialShare('native')} className="cursor-pointer gap-2">
                                            <Share2 className="h-4 w-4 text-gray-800 dark:text-gray-200" />
                                            <span>... Más opciones...</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleSocialShare('copy')} className="cursor-pointer gap-2">
                                            <Copy className="h-4 w-4" />
                                            <span>{t('ad.copyLink', 'Copiar Enlace')}</span>
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
