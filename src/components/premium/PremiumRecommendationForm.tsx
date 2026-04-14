'use client';

import React, { useState } from 'react';
import { ClientData } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Facebook, Instagram, Mail, Globe, Send, MessageCircle, UserPlus, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface PremiumRecommendationFormProps {
    clientData: ClientData;
}

const TRANSLATIONS: Record<string, any> = {
    es: {
        legal1Title: "De Acuerdo",
        legal1Text: "Al enviar esta recomendación, declara estar de acuerdo con nuestra Política de Privacidad. Nos pondremos en contacto con usted y con la persona que nos indicó a la mayor brevedad posible para aclarar los detalles de su descuento exclusivo. ¡Muchas gracias por su apoyo!",
        legal2Title: "Confirmación del Envío:",
        legal2Text: "Envío este correo electrónico de manera completamente independiente de Dicilo.net. Tomo esta decisión por cuenta propia y asumo toda la responsabilidad al respecto. Mis amigos serán informados de que los contacto por iniciativa propia.",
        privacyLink: "Política de Privacidad",
        placeholders: {
            name: "Juan Pérez",
            email: "juan@ejemplo.com",
            code: "Ingresar código",
            select: "Por favor seleccione...",
            product: "Ej. Audífono Modelo X",
            msg: "¡Hola! Estuve en este negocio y me encantó. ¡Lo recomiendo totalmente!",
            friendName: "Nombre de su amigo/a",
            friendContact: "Email o Teléfono"
        },
        ui: {
            msgDisclaimer: "Este mensaje se enviará en el correo de recomendación a sus amigos si participa en el programa.",
            yesNews: "Sí, por favor. Quiero recibir sus boletines.",
            noNews: "No, gracias. No quiero recibir boletines.",
            isMember: "Soy miembro de DICILO.",
            notMember: "No soy miembro de DICILO y quiero registrarme.",
            noReferral: "No gracias, por el momento no",
            yesReferral: "Con gusto invitaré a mis conocidos/amigos.",
            friendTitle: "Amigo/a #",
            friendNameLabel: "Nombre y Apellido del Referido",
            friendContactLabel: "E-Mail o Whatsapp",
            addFriendBtn: "+ Añadir otro amigo",
            solveCaptcha: "Resolver pregunta de seguridad",
            sending: "Enviando...",
            submitBtn: "Enviar / Recomendar",
            repDicilo: "Soy Representante Dicilo",
            referralCat: "Recomendación",
            connectTitle: "Si lo desea Conéctenos y Comparta nuestros enlaces a través de cualquiera de estas posibilidades"
        }
    },
    en: {
        legal1Title: "I Agree",
        legal1Text: "By submitting this recommendation, you agree to our Privacy Policy. We will contact you and the person you mentioned immediately to clarify the details of your exclusive discount. Thank you for your support!",
        legal2Title: "Confirmation of Sending:",
        legal2Text: "I am sending this email completely independently of Dicilo.net. I make this decision independently and take full responsibility for it. My friends will be informed that I am contacting them on my own initiative.",
        privacyLink: "Privacy Policy",
        placeholders: {
            name: "John Doe",
            email: "john@example.com",
            code: "Enter code",
            select: "Please select...",
            product: "E.g. Hearing Aid Model X",
            msg: "Hi! I visited this business and I loved it. I highly recommend it!",
            friendName: "Friend's name",
            friendContact: "Email or Phone"
        },
        ui: {
            msgDisclaimer: "This message will be sent in the recommendation email to your friends if you participate in the program.",
            yesNews: "Yes, please. I want to receive your newsletters.",
            noNews: "No, thanks. I do not want to receive newsletters.",
            isMember: "I am a DICILO member.",
            notMember: "I am not a DICILO member and want to sign up.",
            noReferral: "No thanks, not at the moment",
            yesReferral: "I am happy to invite my friends/acquaintances.",
            friendTitle: "Friend #",
            friendNameLabel: "Referred Person's Name & Surname",
            friendContactLabel: "E-Mail or Whatsapp",
            addFriendBtn: "+ Add another friend",
            solveCaptcha: "Solve security question",
            sending: "Sending...",
            submitBtn: "Submit / Recommend",
            repDicilo: "I am a Dicilo Representative",
            referralCat: "Recommendation",
            connectTitle: "If you wish, connect with us and share our links via any of these possibilities"
        }
    },
    de: {
        legal1Title: "Einverstanden",
        legal1Text: "Indem Sie diese Empfehlung absenden, erklären Sie sich mit unserer Datenschutzerklärung einverstanden. Wir melden uns umgehend bei Ihnen und der von Ihnen genannten Person, um die Details zu Ihrem exklusiven Rabatt zu klären. Vielen Dank für Ihre Unterstützung!",
        legal2Title: "Bestätigung des Versands:",
        legal2Text: "Diese E-Mail versende ich vollkommen unabhängig von Dicilo.net. Ich treffe diese Entscheidung eigenständig und übernehme dafür die volle Verantwortung. Meine Freunde werden darüber informiert, dass ich sie aus eigener Initiative kontaktiere.",
        privacyLink: "Datenschutzerklärung",
        placeholders: {
            name: "Max Mustermann",
            email: "max@example.com",
            code: "Code eingeben",
            select: "Bitte wählen...",
            product: "Z.B. Hörgerät Modell X",
            msg: "Hallo! Ich war bei diesem Geschäft und es hat mir super gefallen. Kann ich nur weiterempfehlen!",
            friendName: "Name des Freundes",
            friendContact: "Email oder Nummer"
        },
        ui: {
            msgDisclaimer: "Diese Nachricht wird in der Empfehlungs-E-Mail an Ihre Freunde gesendet, falls Sie am Wachstumsprogramm teilnehmen.",
            yesNews: "Ja, gerne. Ich möchte Ihre Newsletter erhalten.",
            noNews: "Nein, danke. Ich möchte keine Newsletter erhalten.",
            isMember: "Ich bin Mitglied bei DICILO.",
            notMember: "Ich bin kein Mitglied bei DICILO und möchte mich anmelden.",
            noReferral: "Nein danke, momentan nicht",
            yesReferral: "Ich freue mich, meine Bekannten/Freunde einzuladen.",
            friendTitle: "Freund #",
            friendNameLabel: "Vorname & Nachname des Geworbenen",
            friendContactLabel: "E-Mail oder Whatsapp",
            addFriendBtn: "+ Weiteren Freund hinzufügen",
            solveCaptcha: "Sicherheitsfrage lösen",
            sending: "Wird gesendet...",
            submitBtn: "Senden / Empfehlen",
            repDicilo: "Bin Dicilo Repräsentant",
            referralCat: "Empfehlung",
            connectTitle: "Wenn Sie möchten, verbinden Sie sich mit uns und teilen Sie unsere Links über eine dieser Möglichkeiten"
        }
    }
};

export const PremiumRecommendationForm: React.FC<PremiumRecommendationFormProps> = ({ clientData }) => {
    const { t, i18n } = useTranslation('client');
    const lang = i18n.language?.split('-')[0] || 'de';
    const l = TRANSLATIONS[lang] || TRANSLATIONS.de;
    const { toast } = useToast();

    // Estado principal del Formulario "Growth Engine"
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        gutschein: '',
        newsletter: 'ja',
        producto_recomendado: '',
        comment: '',
        fuente: '',
        weiterempfehlen: 'nein',
        helfen_community: false,
        datenschutz: false,
        bestatigung_versand: false,
        mitglied_status: 'mitglied',
        captcha: '',
    });

    // Referidos Dinámicos (hasta 5)
    const [referrals, setReferrals] = useState<{ id: number; name: string; contact: string }[]>([
        { id: 1, name: '', contact: '' }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // CAPTCHA Dinámico y Aleatorio
    const [captchaConfig, setCaptchaConfig] = useState<{ a: number, b: number, expected: number } | null>(null);

    React.useEffect(() => {
        // Generar un captcha aleatorio al cargar el componente
        const generateCaptcha = () => {
            const a = Math.floor(Math.random() * 20) + 1; // 1 to 20
            const b = Math.floor(Math.random() * 20) + 1; // 1 to 20
            setCaptchaConfig({ a, b, expected: a + b });
        };
        generateCaptcha();
    }, []);

    const handleAddReferral = () => {
        if (referrals.length < 5) {
            setReferrals([...referrals, { id: referrals.length + 1, name: '', contact: '' }]);
        }
    };

    const handleReferralChange = (id: number, field: 'name' | 'contact', value: string) => {
        setReferrals(referrals.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones Manuales Básicas
        if (!formData.name || !formData.email || !formData.datenschutz) {
            toast({ title: t('form.errorRequiredFields', 'Please fill in all required fields and accept privacy policy.'), variant: 'destructive' });
            return;
        }

        if (!captchaConfig || parseInt(formData.captcha.trim()) !== captchaConfig.expected) {
            toast({ title: t('form.errorCaptcha', 'Incorrect CAPTCHA answer.'), variant: 'destructive' });
            return;
        }

        if (formData.weiterempfehlen === 'ja' && !formData.bestatigung_versand) {
            toast({ title: t('form.errorLegalConfirm', 'You must confirm the legal terms for sending invitations.'), variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const db = getFirestore(app);
            const validReferrals = formData.weiterempfehlen === 'ja' ? referrals.filter(r => r.name && r.contact) : [];
            const clientName = clientData.clientName || 'Unknown Business';

            const submitData = {
                ...formData,
                referrals: validReferrals,
                formType: 'growth_engine',
                clientName: clientName,
                clientId: clientData.id,
                country: clientData.country || 'Deutschland',
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'clients', clientData.id, 'recommendations'), submitData);
            
            // Send emails to the referrals if applicable
            if (validReferrals.length > 0) {
                await fetch('/api/send-referral-emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        senderName: formData.name,
                        senderEmail: formData.email,
                        comment: formData.comment,
                        clientName: clientName,
                        referrals: validReferrals,
                        lang: lang
                    })
                });
            }
            
            toast({ title: t('form.success', 'Information successfully submitted! Thank you.') });
            
            // Reset
            setFormData({
                name: '', email: '', gutschein: '', newsletter: 'ja', producto_recomendado: '', comment: '',
                fuente: '', weiterempfehlen: 'nein', helfen_community: false, datenschutz: false,
                bestatigung_versand: false, mitglied_status: 'mitglied', captcha: ''
            });
            setReferrals([{ id: 1, name: '', contact: '' }]);
            
            // Regenerate captcha for next time
            const a = Math.floor(Math.random() * 20) + 1;
            const b = Math.floor(Math.random() * 20) + 1;
            setCaptchaConfig({ a, b, expected: a + b });

        } catch (error) {
            console.error('Error submitting form:', error);
            toast({ title: t('form.errorGeneric', 'Error sending form. Please try again.'), variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const socialLinks = [
        { type: 'website', url: clientData.website, icon: <Globe className="h-5 w-5" />, label: 'Website' },
        { type: 'email', url: clientData.email ? `mailto:${clientData.email}` : '', icon: <Mail className="h-5 w-5" />, label: 'Email' },
    ];

    const headerSocials = clientData.headerData?.socialLinks || [];
    const getSocialUrl = (type: string) => headerSocials.find(s => s.icon.toLowerCase().includes(type))?.url || '';

    const fbUrl = getSocialUrl('facebook');
    const igUrl = getSocialUrl('instagram');
    const whatsUrl = getSocialUrl('whatsapp');

    if (fbUrl) socialLinks.push({ type: 'facebook', url: fbUrl, icon: <Facebook className="h-5 w-5" />, label: 'Facebook' });
    if (igUrl) socialLinks.push({ type: 'instagram', url: igUrl, icon: <Instagram className="h-5 w-5" />, label: 'Instagram' });
    if (whatsUrl) socialLinks.push({ type: 'whatsapp', url: whatsUrl, icon: <MessageCircle className="h-5 w-5" />, label: 'WhatsApp' });

    return (
        <div className="flex flex-col gap-6">
            {/* Main Viral Form */}
            <div className="rounded-[2rem] border border-gray-100 bg-white/70 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 focus:outline outline-blue-100 rounded-full blur-3xl -z-10 opacity-60 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50 focus:outline outline-purple-100 rounded-full blur-3xl -z-10 opacity-60 pointer-events-none" />

                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
                        <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        {t('leadForm.title', 'Empfehlungs-Programm & Kontakt')}
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Phase 1: Identificación y Segmentación Temprana */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">{t('leadForm.name', 'Ihr Vorname & Nachname')} *</Label>
                            <Input
                                className="bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500 rounded-xl h-12"
                                placeholder={l.placeholders.name}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">{t('leadForm.email', 'Ihre E-Mail-Adresse')} *</Label>
                            <Input
                                type="email"
                                className="bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500 rounded-xl h-12"
                                placeholder={l.placeholders.email}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">{t('leadForm.coupon', 'Ihr Gutschein (Optional)')}</Label>
                            <Input
                                className="bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500 rounded-xl h-12"
                                placeholder={l.placeholders.code}
                                value={formData.gutschein}
                                onChange={(e) => setFormData({ ...formData, gutschein: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">{t('leadForm.source', 'Wie haben Sie von uns erfahren?')}</Label>
                            <Select value={formData.fuente} onValueChange={(v) => setFormData({ ...formData, fuente: v })}>
                                <SelectTrigger className="bg-white/50 backdrop-blur-sm border-gray-200 rounded-xl h-12">
                                    <SelectValue placeholder={l.placeholders.select} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Facebook">Facebook</SelectItem>
                                    <SelectItem value="Instagram">Instagram</SelectItem>
                                    <SelectItem value="Telegram">Telegram</SelectItem>
                                    <SelectItem value="Twitter">Twitter</SelectItem>
                                    <SelectItem value="YouTube">YouTube</SelectItem>
                                    <SelectItem value="Pinterest">Pinterest</SelectItem>
                                    <SelectItem value="Linkedin">Linkedin</SelectItem>
                                    <SelectItem value="Tik Tok">Tik Tok</SelectItem>
                                    <SelectItem value="Empfehlung">{l.ui.referralCat}</SelectItem>
                                    <SelectItem value="Dicilo Repräsentant">{l.ui.repDicilo}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-gray-700 font-semibold">{t('leadForm.productRec', 'Welches Produkt möchten Sie empfehlen? Bitte tragen Sie es hier ein.')}</Label>
                        <Input
                            className="bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500 rounded-xl h-12"
                            placeholder={l.placeholders.product}
                            value={formData.producto_recomendado}
                            onChange={(e) => setFormData({ ...formData, producto_recomendado: e.target.value })}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-gray-700 font-semibold">{t('leadForm.comment', 'Ihre persönliche Nachricht an Ihre Freunde (Optional)')}</Label>
                        <textarea
                            className="w-full bg-white/50 backdrop-blur-sm border border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl p-4 min-h-[100px] shadow-sm resize-y"
                            placeholder={l.placeholders.msg}
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        />
                        <p className="text-xs text-gray-400">{l.ui.msgDisclaimer}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">{t('leadForm.newsletter', 'Möchten Sie unsere Newsletter erhalten?')}</Label>
                            <Select value={formData.newsletter} onValueChange={(v) => setFormData({ ...formData, newsletter: v })}>
                                <SelectTrigger className="bg-white/50 backdrop-blur-sm border-gray-200 rounded-xl h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ja">{l.ui.yesNews}</SelectItem>
                                    <SelectItem value="nein">{l.ui.noNews}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">{t('leadForm.member', 'Sind Sie Mitglied bei DICILO?')}</Label>
                            <Select value={formData.mitglied_status} onValueChange={(v) => setFormData({ ...formData, mitglied_status: v })}>
                                <SelectTrigger className="bg-white/50 backdrop-blur-sm border-gray-200 rounded-xl h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mitglied">{l.ui.isMember}</SelectItem>
                                    <SelectItem value="kein_mitglied">{l.ui.notMember}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Phase 2: Growth Engine / Viralität */}
                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50 mt-8">
                        <div className="space-y-4">
                            <Label className="text-gray-800 font-bold text-lg">{t('leadForm.refer', 'Möchten Sie uns weiterempfehlen?')}</Label>
                            <Select value={formData.weiterempfehlen} onValueChange={(v) => setFormData({ ...formData, weiterempfehlen: v })}>
                                <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500 rounded-xl h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="nein">{l.ui.noReferral}</SelectItem>
                                    <SelectItem value="ja">{l.ui.yesReferral}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Referral Slots Condicionales */}
                        {formData.weiterempfehlen === 'ja' && (
                            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4 text-sm text-yellow-800 flex gap-3 items-start">
                                    <ShieldCheck className="w-5 h-5 flex-shrink-0 text-yellow-600 mt-0.5" />
                                    <div>
                                        <strong>{l.legal2Title} *</strong><br/>
                                        <label className="flex items-start gap-2 mt-2 cursor-pointer">
                                            <Checkbox 
                                                checked={formData.bestatigung_versand}
                                                onCheckedChange={(checked) => setFormData({ ...formData, bestatigung_versand: checked as boolean })}
                                                className="mt-1"
                                                required
                                            />
                                            <span className="text-xs leading-tight">
                                                {l.legal2Text}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {referrals.map((ref, index) => (
                                    <Card key={ref.id} className="border-blue-100 shadow-sm rounded-xl bg-white/80 overflow-hidden">
                                        <CardContent className="p-4 py-5 shadow-inner">
                                            <h4 className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-wider">{l.ui.friendTitle}{index + 1}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-gray-500">{l.ui.friendNameLabel}</Label>
                                                    <Input
                                                        className="h-10 rounded-lg text-sm bg-gray-50 border-gray-200 focus:bg-white"
                                                        placeholder={l.placeholders.friendName}
                                                        value={ref.name}
                                                        onChange={(e) => handleReferralChange(ref.id, 'name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-gray-500">{l.ui.friendContactLabel}</Label>
                                                    <Input
                                                        className="h-10 rounded-lg text-sm bg-gray-50 border-gray-200 focus:bg-white"
                                                        placeholder={l.placeholders.friendContact}
                                                        value={ref.contact}
                                                        onChange={(e) => handleReferralChange(ref.id, 'contact', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {referrals.length < 5 && (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={handleAddReferral}
                                        className="w-full border-dashed border-2 border-blue-300 text-blue-600 bg-blue-50/50 hover:bg-blue-100/50 rounded-xl h-12"
                                    >
                                        {l.ui.addFriendBtn}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Phase 3: Legal & Security */}
                    <div className="pt-4 border-t border-gray-100 space-y-5">
                        <div className="flex items-start gap-3">
                            <Checkbox 
                                id="datenschutz" 
                                checked={formData.datenschutz}
                                onCheckedChange={(checked) => setFormData({ ...formData, datenschutz: checked as boolean })}
                                className="mt-1"
                                required
                            />
                            <Label htmlFor="datenschutz" className="text-sm text-gray-600 leading-relaxed cursor-pointer font-normal">
                                <strong>{l.legal1Title} *</strong><br/>
                                {l.legal1Text}{' '}
                                <a href="https://dicilo.net/datenschutz" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                    ({l.privacyLink})
                                </a>
                            </Label>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <Label className="whitespace-nowrap font-bold text-xl text-gray-700 tracking-wider">
                                {captchaConfig ? `${captchaConfig.a} + ${captchaConfig.b} =` : '... + ... ='}
                            </Label>
                            <Input
                                type="number"
                                required
                                value={formData.captcha}
                                onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
                                className="w-24 text-center text-lg font-bold border-gray-300 h-12 rounded-xl"
                                placeholder="?"
                            />
                            <span className="text-xs text-gray-400">{l.ui.solveCaptcha}</span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-14 font-bold text-lg shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2 mt-4"
                    >
                        {isSubmitting ? l.ui.sending : l.ui.submitBtn} 
                        <Send className="ml-2 h-5 w-5" />
                    </Button>
                </form>
            </div>

            {/* Module: Social Contacts */}
            <div className="rounded-[2rem] border border-gray-100 bg-white/70 backdrop-blur-xl p-6 shadow-sm flex flex-col items-center">
                <h3 className="mb-5 text-sm font-bold text-gray-500 uppercase tracking-widest text-center px-4">
                  {l.ui.connectTitle}
                </h3>
                <div className="flex gap-5 flex-wrap justify-center">
                    {socialLinks.filter(l => l.url).map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 text-gray-500 transition-all hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent hover:shadow-lg hover:-translate-y-1"
                            title={link.label}
                        >
                            {link.icon}
                        </a>
                    ))}
                    {socialLinks.filter(l => l.url).length === 0 && (
                        <p className="text-sm text-center text-gray-400 italic">{t('recommendationForm.noLinks', 'No contact links available.')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
