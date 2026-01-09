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
            subject: "{{Nombre}}, te guardé esta invitación (Ahorro + $$) 🚀",
            body: "Hola {{Nombre}}, ¿cómo va todo? 👋\n\nMe acordé de ti porque sé que tienes buen ojo para las oportunidades y no te gusta tirar el dinero.\n\nTe invito a entrar en Dicilo.net. Es una plataforma alemana (de Hamburgo, gente seria) que está cambiando las reglas: no solo ahorras comprando, sino que ganas dinero real por recomendar y conectar empresas.\n\nTe paso mi pase VIP gratis para que entres ya.\n\nTienen un sistema de puntos (DiciPoints) que vale la pena mirar. Entra, regístrate y echa un ojo. 👀\n\n👉 [BOTÓN: Ver Dicilo y Aceptar Invitación] (Se activará con mi código: {{RefCode}})\n\nPD: Si te registras, escríbeme por WhatsApp. Ya descubrí un par de trucos para sumar puntos más rápido y quiero contártelos para que arranques con ventaja. 😉\n\nUn abrazo,\n\n{{Tu Nombre}}"
        },
        'business': {
            subject: "Genera ingresos extra recomendando empresas",
            body: "Hola [Nombre]! 👋\n\n¿Buscas trabajar desde casa, o te interesaría generar extras desde tu PC o móvil?\n\nEn Dicilo puedes hacerlo realidad gracias a la facilidad del trabajo online; te explico.\n\nRecomienda empresas y gana Dicipoints que luego puedes cambiar por descuentos en nuestras empresas aliadas, o recomienda las empresas donde sueles comprar y gana comisiones por la compra de publicidad que ellos hagan gracias a tu recomendación.\n\nDicilo es la plataforma de marketing digital de MHC Alemania. Regístrate aquí gratis para que empecemos juntos.\n\nDicilo es una red confiable creada en Hamburgo, Alemania, por un grupo de empresarios jóvenes para apoyar a los pequeños y medianos comerciantes y que está creciendo bastante rápido a nivel nacional e internacional.\n\n[BOTÓN: Empezar a Ganar]\n\nSi no es de tu interés o tienes alguna duda, por favor házmelo saber. Gracias y espero nos hablemos pronto.\nSaludos\n[Tu Nombre]"
        },
        'crypto': {
            subject: "{{Nombre}}, te guardé esta invitación (Ahorro + €€) 🚀",
            body: "Hola {{Nombre}}, ¿todo bien? 👋\n\nMe acordé de ti porque sé que tienes buen ojo para las oportunidades y no te gusta tirar el dinero.\n\nTe invito a Dicilo.net. Es una plataforma de aquí de Alemania (de Hamburgo, gente seria) que está cambiando las reglas: No solo ahorras al comprar, sino que ganas dinero real (DiciPoints) recomendando empresas.\n\nAquí tienes mi pase VIP gratis para ti.\n\nEl sistema de puntos vale mucho la pena. Regístrate y échale un vistazo. 👀\n\n👉 [BOTÓN: Ver Dicilo y Aceptar Invitación] (Tu bono se activa con mi código: {{RefCode}})\n\nP.D.: Cuando te registres, escríbeme por WhatsApp. Ya averigüé cómo sumar puntos más rápido y te cuento el truco encantado. 😉\n\nSaludos,\n\n{{Tu Nombre}}"
        },
        'freelancer': {
            subject: "{{Nombre}}, buscan 300 líderes de país (Oportunidad 2026) 🌍",
            body: "Hola {{Nombre}}, ¡feliz año nuevo! 👋 Espero que hayas arrancado este 2026 con la mejor energía.\n\nTe escribo justo ahora porque me enteré de algo que encaja con las metas de este año.\n\nUn amigo está dentro de Dicilo.net, una comunidad global que está en fase de expansión agresiva. Están buscando un grupo selecto de 1500 pioneros, y lo interesante es que de ahí seleccionarán a 300 Representantes de País.\n\nBásicamente, pagan por conectar empresas y dar \"tips\" de negocios. Si lo haces bien, pasas a ser Team Leader.\n\nOjo, importante: Esto NO es MLM ni esquemas piramidales. Es trabajo real de recomendación B2B y marketing. Tú ayudas a conseguir clientes y ellos pagan. Simple.\n\nYo ya aseguré mi lugar. Regístrate gratis con mi código para que te den tus primeros 50 DiciPoints (moneda interna para descuentos) y veas de qué va.\n\n👉 [BOTÓN: Ver Proyecto y Registrarme Gratis] (Código de acceso VIP: {{RefCode}})\n\nNo tienes nada que perder por mirar, el registro es gratuito. Si le inviertes tiempo, ganas. Avísame si tienes dudas y lo charlamos.\n\nUn abrazo,\n\n{{Tu Nombre}}"
        }
    },
    'en': {
        'general': {
            subject: "{{Name}}, I saved this invitation for you (Savings + $$) 🚀",
            body: "Hi {{Name}}, how is everything going? 👋\n\nI thought of you because I know you have an eye for opportunities and don't like throwing money away.\n\nI invite you to join Dicilo.net. It's a German platform (from Hamburg, serious people) that is changing the rules: not only do you save by buying, but you earn real money by recommending and connecting businesses.\n\nHere is my free VIP pass for you to enter now.\n\nThey have a points system (DiciPoints) that is worth looking at. Come in, register and take a look. 👀\n\n👉 [BUTTON: View Dicilo and Accept Invitation] (It will activate with my code: {{RefCode}})\n\nPS: If you register, text me on WhatsApp. I already discovered a couple of tricks to earn points faster and I want to tell you so you start with an advantage. 😉\n\nBig hug,\n\n{{Your Name}}"
        },
        'business': {
            subject: "Generate extra income by recommending businesses",
            body: "Hello [Nombre]! 👋\n\nAre you looking to work from home, or interested in generating extras from your PC or mobile?\n\nIn Dicilo you can make it happen thanks to the ease of online work; let me explain.\n\nRecommend businesses and earn Dicipoints that you can later exchange for discounts at our allied businesses, or recommend the businesses where you usually shop and earn commissions for the advertising purchases they make thanks to your recommendation.\n\nDicilo is the digital marketing platform of MHC Germany. Register here for free so we can start together.\n\nDicilo is a trusted network created in Hamburg, Germany, by a group of young entrepreneurs to support small and medium-sized merchants and is growing quite fast nationally and internationally.\n\n[BUTTON: Start Earning]\n\nIf this is not of interest to you or you have any doubts, please let me know. Thanks and hope to speak soon.\nRegards,\n[Tu Nombre]"
        },
        'crypto': {
            subject: "{{Name}}, I saved this invitation for you (Savings + €€) 🚀",
            body: "Hi {{Name}}, everything good? 👋\n\nI thought of you because I know you have an eye for good opportunities and hate wasting money.\n\nI invite you to Dicilo.net. It is a platform from here in Germany (from Hamburg, serious stuff) that is changing the rules: You not only save when shopping but earn real money (DiciPoints) by recommending businesses.\n\nHere is my free VIP pass for you.\n\nThe point system is really worth it. Sign up and take a look. 👀\n\n👉 [BUTTON: View Dicilo & Accept Invitation] (Your bonus is activated with my code: {{RefCode}})\n\nPS: Once you are registered, drop me a message on WhatsApp. I found out how to collect points faster and would love to tell you the trick. 😉\n\nBest regards,\n\n{{Your Name}}"
        },
        'freelancer': {
            subject: "{{Name}}, looking for 300 country leaders (Opportunity 2026) 🌍",
            body: "Hello {{Name}}, Happy New Year! 👋 I hope you started this 2026 with the best energy.\n\nI'm writing you right now because I found out about something that fits this year's goals.\n\nA friend is inside Dicilo.net, a global community that is in an aggressive expansion phase. They are looking for a select group of 1500 pioneers, and the interesting thing is that from there they will select 300 Country Representatives.\n\nBasically, they pay to connect companies and give business \"tips\". If you do well, you become a Team Leader.\n\nNote, important: This is NOT MLM or pyramid schemes. It is real B2B recommendation and marketing work. You help get clients and they pay. Simple.\n\nI already secured my spot. Sign up for free with my code to get your first 50 DiciPoints (internal currency for discounts) and see what it's about.\n\n👉 [BUTTON: View Project and Register for Free] (VIP access code: {{RefCode}})\n\nYou have nothing to lose by looking, registration is free. If you invest time, you earn. Let me know if you have doubts and we'll chat.\n\nBig hug,\n\n{{Your Name}}"
        }
    },
    'de': {
        'general': {
            subject: "{{Name}}, ich habe diese Einladung für dich aufgehoben (Sparen + $$) 🚀",
            body: "Hallo {{Name}}, wie läuft's? 👋\n\nIch musste an dich denken, weil ich weiß, dass du ein Auge für Chancen hast und kein Geld verschwenden magst.\n\nIch lade dich ein, Dicilo.net beizutreten. Es ist eine deutsche Plattform (aus Hamburg, seriöse Leute), die die Regeln ändert: Du sparst nicht nur beim Einkaufen, sondern verdienst echtes Geld durch Empfehlen und Vernetzen von Unternehmen.\n\nHier ist mein kostenloser VIP-Pass für dich, damit du sofort starten kannst.\n\nSie haben ein Punktesystem (DiciPoints), das einen Blick wert ist. Komm rein, registriere dich und schau es dir an. 👀\n\n👉 [BUTTON: Dicilo ansehen und Einladung annehmen] (Wird aktiviert mit meinem Code: {{RefCode}})\n\nPS: Wenn du dich registriert hast, schreib mir auf WhatsApp. Ich habe schon ein paar Tricks entdeckt, um schneller Punkte zu sammeln, und möchte sie dir verraten, damit du mit einem Vorteil startest. 😉\n\nViele Grüße,\n\n{{Dein Name}}"
        },
        'business': {
            subject: "Generiere Zusatzeinkommen durch Unternehmens-Empfehlungen",
            body: "Hallo [Nombre]! 👋\n\nSuchst du Arbeit von zu Hause oder möchtest du dir etwas dazuverdienen, bequem von PC oder Handy aus?\n\nBei Dicilo kannst du das dank der einfachen Online-Arbeit verwirklichen; lass es mich erklären.\n\nEmpfiehl Unternehmen und verdiene DicioPoints, die du später gegen Rabatte bei unseren Partnerunternehmen eintauschen kannst, oder empfiehl die Geschäfte, in denen du normalerweise einkaufst, und verdiene Provisionen für deren Werbekäufe dank deiner Empfehlung.\n\nDicilo ist die digitale Marketingplattform der MHC Deutschland. Registriere dich hier kostenlos, damit wir gemeinsam starten können.\n\nDicilo ist ein vertrauenswürdiges Netzwerk, das in Hamburg von einer Gruppe junger Unternehmer gegründet wurde, um kleine und mittlere Händler zu unterstützen, und wächst national sowie international sehr schnell.\n\n[BUTTON: Jetzt Geld verdienen]\n\nFalls kein Interesse besteht oder du Fragen hast, lass es mich bitte wissen. Danke und ich hoffe, wir hören bald voneinander.\nGrüße,\n[Tu Nombre]"
        },
        'crypto': {
            subject: "{{Name}}, ich habe diese Einladung für dich reserviert (Sparen + €€) 🚀",
            body: "Hallo {{Name}}, alles klar bei dir? 👋\n\nIch musste an dich denken, weil ich weiß, dass du ein Händchen für gute Gelegenheiten hast und ungern Geld verschwendest.\n\nIch lade dich zu Dicilo.net ein. Das ist eine Plattform hier aus Deutschland (aus Hamburg, seriöse Sache), die die Regeln ändert: Du sparst nicht nur beim Einkaufen, sondern verdienst echtes Geld (DiciPoints), indem du Unternehmen empfiehlst.\n\nHier ist mein kostenloser VIP-Pass für dich.\n\nDas Punktesystem lohnt sich wirklich. Melde dich an und schau es dir an. 👀\n\n👉 [BUTTON: Dicilo ansehen & Einladung annehmen] (Dein Bonus wird mit meinem Code aktiviert: {{RefCode}})\n\nP.S.: Wenn du angemeldet bist, schreib mir kurz bei WhatsApp. Ich habe schon herausgefunden, wie man die Punkte schneller sammelt, und verrate dir den Trick gerne. 😉\n\nViele Grüße,\n\n{{Dein Name}}"
        },
        'freelancer': {
            subject: "{{Name}}, 300 Landesleiter gesucht (Chance 2026) 🌍",
            body: "Hallo {{Name}}, frohes neues Jahr! 👋 Ich hoffe, du bist mit bester Energie in dieses 2026 gestartet.\n\nIch schreibe dir gerade jetzt, weil ich von etwas erfahren habe, das zu den Zielen dieses Jahres passt.\n\nEin Freund ist bei Dicilo.net dabei, einer globalen Community, die sich in einer aggressiven Expansionsphase befindet. Sie suchen eine ausgewählte Gruppe von 1500 Pionieren, und das Interessante ist, dass sie daraus 300 Landesvertreter auswählen werden.\n\nIm Grunde zahlen sie für das Vernetzen von Unternehmen und das Geben von Geschäfts-\"Tipps\". Wenn du es gut machst, wirst du Team Leader.\n\nAchtung, wichtig: Das ist KEIN MLM oder Schneeballsystem. Es ist echte B2B-Empfehlungs- und Marketingarbeit. Du hilfst dabei, Kunden zu gewinnen, und sie zahlen. Simpel.\n\nIch habe mir meinen Platz schon gesichert. Registriere dich kostenlos mit meinem Code, um deine ersten 50 DiciPoints (interne Währung für Rabatte) zu erhalten und zu sehen, worum es geht.\n\n👉 [BUTTON: Projekt ansehen und kostenlos registrieren] (VIP-Zugangscode: {{RefCode}})\n\nDu hast nichts zu verlieren, wenn du es dir ansiehst, die Registrierung ist kostenlos. Wenn du Zeit investierst, gewinnst du. Sag mir Bescheid, wenn du Fragen hast, dann quatschen wir.\n\nViele Grüße,\n\n{{Dein Name}}"
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

        const enrichedFriends = friends.map(friend => {
            const langContent = CONTENT_PREVIEWS[friend.language] || CONTENT_PREVIEWS['es'];
            const tmplContent = langContent[friend.template] || langContent['general'];

            const inviteUrl = `https://dicilo.net/registrieren?ref=${uniqueCode || currentUser?.uid}`;

            // 1. Process Body
            let body = tmplContent.body || "";
            body = body
                .replace(/\[Name\]|\[Nombre\]|\{\{Nombre\}\}|\{\{Name\}\}/g, friend.name)
                .replace(/\[Tu Nombre\]|\{\{Tu Nombre\}\}|\{\{Your Name\}\}|\{\{Dein Name\}\}/g, referrerName)
                .replace(/\[RefCode\]|\{\{RefCode\}\}/g, uniqueCode || currentUser?.uid)
                .replace(/\[(BOTÓN|BUTTON):.*?\]/g, `\n👉 ${inviteUrl}\n`);

            // 2. Process Subject
            let subject = tmplContent.subject || "";
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
                                            <Select value={currentTemplate} onValueChange={setCurrentTemplate}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('admin:invite.form.templatePlaceholder', 'Selecciona plantilla')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="general">{t('admin:invite.form.templates.general', 'Ahorro (General)')}</SelectItem>
                                                    <SelectItem value="business">{t('admin:invite.form.templates.business', 'Trabajo (Negocios)')}</SelectItem>
                                                    <SelectItem value="crypto">{t('admin:invite.form.templates.crypto', 'Cripto (DiciPoints)')}</SelectItem>
                                                    <SelectItem value="freelancer">{t('admin:invite.form.templates.freelancer', 'Busqueda (Freelancer)')}</SelectItem>
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
