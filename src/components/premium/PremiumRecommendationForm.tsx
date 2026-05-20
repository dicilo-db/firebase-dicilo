'use client';

import React, { useState } from 'react';
import { ClientData } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Facebook, Instagram, Mail, Globe, Send, MessageCircle, User, Star, Share2, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
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
            connectTitle: "Si lo desea Conéctenos y Comparta nuestros enlaces a través de cualquiera de estas posibilidades",
            step: "Paso",
            of: "de"
        },
        steps: {
            step1: "Tus Datos",
            step2: "Su Opinión",
            step3: "Recomendar Amigos",
            step4: "Enviar"
        },
        buttons: {
            back: "Atrás",
            next: "Siguiente"
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
            connectTitle: "If you wish, connect with us and share our links via any of these possibilities",
            step: "Step",
            of: "of"
        },
        steps: {
            step1: "Your Info",
            step2: "Your Review",
            step3: "Invite Friends",
            step4: "Submit"
        },
        buttons: {
            back: "Back",
            next: "Next"
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
            connectTitle: "Wenn Sie möchten, verbinden Sie sich mit uns und teilen Sie unsere Links über eine dieser Möglichkeiten",
            step: "Schritt",
            of: "von"
        },
        steps: {
            step1: "Ihre Daten",
            step2: "Ihre Meinung",
            step3: "Freunde Einladen",
            step4: "Absenden"
        },
        buttons: {
            back: "Zurück",
            next: "Weiter"
        }
    }
};

export const PremiumRecommendationForm: React.FC<PremiumRecommendationFormProps> = ({ clientData }) => {
    const { t, i18n } = useTranslation('client');
    const lang = i18n.language?.split('-')[0] || 'de';
    const l = TRANSLATIONS[lang] || TRANSLATIONS.de;
    const { toast } = useToast();

    // Step state
    const [currentStep, setCurrentStep] = useState(1);

    // Form Data State
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

    // Dynamic referrals (up to 5)
    const [referrals, setReferrals] = useState<{ id: number; name: string; contact: string }[]>([
        { id: 1, name: '', contact: '' }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Dynamic CAPTCHA config
    const [captchaConfig, setCaptchaConfig] = useState<{ a: number, b: number, expected: number } | null>(null);

    React.useEffect(() => {
        const generateCaptcha = () => {
            const a = Math.floor(Math.random() * 20) + 1;
            const b = Math.floor(Math.random() * 20) + 1;
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

    // Step Validation
    const validateStep = (step: number): boolean => {
        if (step === 1) {
            if (!formData.name.trim()) {
                toast({ title: t('form.errorName', 'Please provide your name.'), variant: 'destructive' });
                return false;
            }
            if (!formData.email.trim() || !formData.email.includes('@')) {
                toast({ title: t('form.errorEmail', 'Please provide a valid email address.'), variant: 'destructive' });
                return false;
            }
        }
        if (step === 3) {
            if (formData.weiterempfehlen === 'ja') {
                if (!formData.bestatigung_versand) {
                    toast({ title: t('form.errorLegalConfirm', 'You must confirm the legal terms for sending invitations.'), variant: 'destructive' });
                    return false;
                }
                const filledReferrals = referrals.filter(r => r.name.trim() && r.contact.trim());
                if (filledReferrals.length === 0) {
                    toast({ title: t('form.errorReferralDetails', 'Please fill in at least one friend\'s details or select no.'), variant: 'destructive' });
                    return false;
                }
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 4));
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final validations
        if (!validateStep(1) || !validateStep(3)) return;

        if (!formData.datenschutz) {
            toast({ title: t('form.errorRequiredFields', 'Please accept the privacy policy to submit.'), variant: 'destructive' });
            return;
        }

        if (!captchaConfig || parseInt(formData.captcha.trim()) !== captchaConfig.expected) {
            toast({ title: t('form.errorCaptcha', 'Incorrect CAPTCHA answer.'), variant: 'destructive' });
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
            
            // Reset form
            setFormData({
                name: '', email: '', gutschein: '', newsletter: 'ja', producto_recomendado: '', comment: '',
                fuente: '', weiterempfehlen: 'nein', helfen_community: false, datenschutz: false,
                bestatigung_versand: false, mitglied_status: 'mitglied', captcha: ''
            });
            setReferrals([{ id: 1, name: '', contact: '' }]);
            setCurrentStep(1);
            
            // Regenerate captcha
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

    // Step configuration helper for UI indicators
    const stepsList = [
        { id: 1, label: l.steps.step1, icon: <User className="w-4 h-4" /> },
        { id: 2, label: l.steps.step2, icon: <Star className="w-4 h-4" /> },
        { id: 3, label: l.steps.step3, icon: <Share2 className="w-4 h-4" /> },
        { id: 4, label: l.steps.step4, icon: <ShieldCheck className="w-4 h-4" /> }
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Main Viral Form */}
            <div className="rounded-[2.5rem] border border-white/30 bg-white/40 backdrop-blur-xl p-8 shadow-[0_15px_45px_rgba(0,0,0,0.03)] relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:scale-[1.005]">
                {/* Decorative background glow circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 focus:outline outline-blue-200 rounded-full blur-3xl -z-10 opacity-30 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 focus:outline outline-purple-200 rounded-full blur-3xl -z-10 opacity-30 pointer-events-none" />

                {/* Form Stepper Header Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                            {l.ui.step} {currentStep} {l.ui.of} 4
                        </span>
                        <span className="text-sm font-extrabold text-blue-600 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-100/30 shadow-sm">
                            {stepsList[currentStep - 1].label}
                        </span>
                    </div>

                    {/* Stepper Dots & Line */}
                    <div className="relative flex items-center justify-between w-full">
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200/60 -z-10" />
                        <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 -z-10 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                        />
                        {stepsList.map((step) => {
                            const isCompleted = currentStep > step.id;
                            const isActive = currentStep === step.id;
                            return (
                                <button
                                    key={step.id}
                                    type="button"
                                    onClick={() => {
                                        // Allow jumping to completed steps or current step
                                        if (step.id <= currentStep) {
                                            setCurrentStep(step.id);
                                        } else {
                                            // Validate intermediate steps before jumping forward
                                            let valid = true;
                                            for (let s = 1; s < step.id; s++) {
                                                if (s >= currentStep && !validateStep(s)) {
                                                    valid = false;
                                                    break;
                                                }
                                            }
                                            if (valid) {
                                                setCurrentStep(step.id);
                                            }
                                        }
                                    }}
                                    className={`relative flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-500 shadow-sm focus:outline-none ${
                                        isCompleted
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-transparent text-white scale-105'
                                            : isActive
                                            ? 'bg-white border-blue-500 text-blue-600 scale-110 ring-4 ring-blue-100/50 font-bold'
                                            : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-50'
                                    }`}
                                >
                                    {step.icon}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* STEP 1: Your Information */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold">{t('leadForm.name', 'Ihr Vorname & Nachname')} *</Label>
                                    <Input
                                        className="bg-white/90 backdrop-blur-sm border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/30 rounded-xl h-12 transition-all font-semibold"
                                        placeholder={l.placeholders.name}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold">{t('leadForm.email', 'Ihre E-Mail-Adresse')} *</Label>
                                    <Input
                                        type="email"
                                        className="bg-white/90 backdrop-blur-sm border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/30 rounded-xl h-12 transition-all font-semibold"
                                        placeholder={l.placeholders.email}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold">{t('leadForm.coupon', 'Ihr Gutschein (Optional)')}</Label>
                                    <Input
                                        className="bg-white/90 backdrop-blur-sm border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/30 rounded-xl h-12 transition-all font-semibold"
                                        placeholder={l.placeholders.code}
                                        value={formData.gutschein}
                                        onChange={(e) => setFormData({ ...formData, gutschein: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold">{t('leadForm.source', 'Wie haben Sie von uns erfahren?')}</Label>
                                    <Select value={formData.fuente} onValueChange={(v) => setFormData({ ...formData, fuente: v })}>
                                        <SelectTrigger className="bg-white/90 backdrop-blur-sm border-slate-200 rounded-xl h-12 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/30 transition-all text-slate-700 font-semibold">
                                            <SelectValue placeholder={l.placeholders.select} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200">
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
                        </div>
                    )}

                    {/* STEP 2: Recommendation Details */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-bold">{t('leadForm.productRec', 'Welches Produkt möchten Sie empfehlen? Bitte tragen Sie es hier ein.')}</Label>
                                <Input
                                    className="bg-white/90 backdrop-blur-sm border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/30 rounded-xl h-12 transition-all font-semibold"
                                    placeholder={l.placeholders.product}
                                    value={formData.producto_recomendado}
                                    onChange={(e) => setFormData({ ...formData, producto_recomendado: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-slate-700 font-bold">{t('leadForm.comment', 'Ihre persönliche Nachricht an Ihre Freunde (Optional)')}</Label>
                                <textarea
                                    className="w-full bg-white/90 backdrop-blur-sm border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/30 rounded-xl p-4 min-h-[120px] transition-all font-medium text-slate-700 shadow-inner resize-y"
                                    placeholder={l.placeholders.msg}
                                    value={formData.comment}
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">{l.ui.msgDisclaimer}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold">{t('leadForm.newsletter', 'Möchten Sie unsere Newsletter erhalten?')}</Label>
                                    <Select value={formData.newsletter} onValueChange={(v) => setFormData({ ...formData, newsletter: v })}>
                                        <SelectTrigger className="bg-white/90 backdrop-blur-sm border-slate-200 rounded-xl h-12 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/30 text-slate-700 font-semibold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="ja">{l.ui.yesNews}</SelectItem>
                                            <SelectItem value="nein">{l.ui.noNews}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold">{t('leadForm.member', 'Sind Sie Mitglied bei DICILO?')}</Label>
                                    <Select value={formData.mitglied_status} onValueChange={(v) => setFormData({ ...formData, mitglied_status: v })}>
                                        <SelectTrigger className="bg-white/90 backdrop-blur-sm border-slate-200 rounded-xl h-12 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/30 text-slate-700 font-semibold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="mitglied">{l.ui.isMember}</SelectItem>
                                            <SelectItem value="kein_mitglied">{l.ui.notMember}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Share with Friends (Growth Engine) */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-2xl p-6 border border-blue-100/30">
                                <div className="space-y-4">
                                    <Label className="text-slate-800 font-extrabold text-lg flex items-center gap-2">
                                        <Share2 className="text-blue-600 w-5 h-5 animate-bounce" style={{ animationDuration: '3s' }} />
                                        {t('leadForm.refer', 'Möchten Sie uns weiterempfehlen?')}
                                    </Label>
                                    <Select value={formData.weiterempfehlen} onValueChange={(v) => setFormData({ ...formData, weiterempfehlen: v })}>
                                        <SelectTrigger className="bg-white border-blue-200/60 focus:border-blue-500 rounded-xl h-12 text-slate-850 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="nein">{l.ui.noReferral}</SelectItem>
                                            <SelectItem value="ja">{l.ui.yesReferral}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Referral Slots */}
                                {formData.weiterempfehlen === 'ja' && (
                                    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="p-4 bg-amber-50/80 border border-amber-100 rounded-2xl mb-4 text-xs font-medium text-amber-800 flex gap-3 items-start shadow-sm">
                                            <ShieldCheck className="w-5.5 h-5.5 flex-shrink-0 text-amber-600 mt-0.5" />
                                            <div>
                                                <strong className="text-sm font-extrabold">{l.legal2Title} *</strong><br/>
                                                <label className="flex items-start gap-2.5 mt-2.5 cursor-pointer">
                                                    <Checkbox 
                                                        checked={formData.bestatigung_versand}
                                                        onCheckedChange={(checked) => setFormData({ ...formData, bestatigung_versand: checked as boolean })}
                                                        className="mt-0.5 border-amber-400"
                                                        required
                                                    />
                                                    <span className="leading-relaxed">
                                                        {l.legal2Text}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        {referrals.map((ref, index) => (
                                            <Card key={ref.id} className="border-blue-100/60 shadow-sm rounded-2xl bg-white/90 overflow-hidden transition-all duration-300 hover:border-blue-200">
                                                <CardContent className="p-5 shadow-inner">
                                                    <h4 className="text-xs font-black text-blue-600 mb-4 uppercase tracking-widest">{l.ui.friendTitle} {index + 1}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{l.ui.friendNameLabel}</Label>
                                                            <Input
                                                                className="h-11 rounded-xl text-sm bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 transition-all font-semibold"
                                                                placeholder={l.placeholders.friendName}
                                                                value={ref.name}
                                                                onChange={(e) => handleReferralChange(ref.id, 'name', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{l.ui.friendContactLabel}</Label>
                                                            <Input
                                                                className="h-11 rounded-xl text-sm bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 transition-all font-semibold"
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
                                                className="w-full border-dashed border-2 border-blue-300 text-blue-600 bg-blue-50/50 hover:bg-blue-100/50 rounded-2xl h-13 font-bold transition-all"
                                            >
                                                {l.ui.addFriendBtn}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Verification & Agreement */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Privacy Policy & Terms Checkbox */}
                            <div className="p-4 bg-white/70 border border-slate-200/50 rounded-2xl shadow-inner flex items-start gap-3">
                                <Checkbox 
                                    id="datenschutz" 
                                    checked={formData.datenschutz}
                                    onCheckedChange={(checked) => setFormData({ ...formData, datenschutz: checked as boolean })}
                                    className="mt-1"
                                    required
                                />
                                <Label htmlFor="datenschutz" className="text-xs text-slate-500 leading-relaxed cursor-pointer font-medium">
                                    <strong className="text-sm text-slate-700 font-extrabold">{l.legal1Title} *</strong><br/>
                                    <span className="block mt-1">{l.legal1Text}</span>
                                    <a href="https://dicilo.net/datenschutz" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 underline font-bold inline-block mt-2">
                                        ({l.privacyLink})
                                    </a>
                                </Label>
                            </div>

                            {/* Captcha Section */}
                            <div className="flex items-center gap-4 bg-slate-50/90 p-5 rounded-2xl border border-slate-100 shadow-sm">
                                <Label className="whitespace-nowrap font-black text-2xl text-slate-800 tracking-wider">
                                    {captchaConfig ? `${captchaConfig.a} + ${captchaConfig.b} =` : '... + ... ='}
                                </Label>
                                <Input
                                    type="number"
                                    required
                                    value={formData.captcha}
                                    onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
                                    className="w-28 text-center text-xl font-black border-slate-200 h-13 rounded-xl bg-white shadow-inner focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    placeholder="?"
                                />
                                <span className="text-xs font-bold text-slate-400 tracking-wide uppercase leading-tight">{l.ui.solveCaptcha}</span>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons Row */}
                    <div className="flex justify-between items-center gap-4 pt-4 border-t border-slate-100/50">
                        {currentStep > 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                className="bg-white/80 hover:bg-white text-slate-700 border border-slate-200/50 rounded-2xl h-13 font-bold px-6 shadow-sm gap-2 transition-all hover:scale-[1.02]"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {l.buttons.back}
                            </Button>
                        ) : (
                            <div /> // Spacer
                        )}

                        {currentStep < 4 ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 text-white rounded-2xl h-13 font-extrabold px-8 shadow-[0_8px_30px_rgba(99,102,241,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] gap-2 border border-indigo-500/20 ml-auto"
                            >
                                {l.buttons.next}
                                <ArrowRight className="w-4 h-4 animate-pulse" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 text-white rounded-2xl h-13 font-extrabold px-8 shadow-[0_8px_30px_rgba(99,102,241,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] gap-2 border border-indigo-500/20 ml-auto"
                            >
                                {isSubmitting ? l.ui.sending : l.ui.submitBtn}
                                <Send className="w-4 h-4 animate-pulse" />
                            </Button>
                        )}
                    </div>
                </form>
            </div>

            {/* Module: Social Contacts */}
            <div className="rounded-[2rem] border border-white/30 bg-white/40 backdrop-blur-xl p-6 shadow-[0_15px_45px_rgba(0,0,0,0.02)] flex flex-col items-center">
                <h3 className="mb-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center px-4 leading-normal">
                  {l.ui.connectTitle}
                </h3>
                <div className="flex gap-5 flex-wrap justify-center">
                    {socialLinks.filter(l => l.url).map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 border border-white shadow-sm text-slate-400 transition-all hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-650 hover:text-white hover:border-transparent hover:shadow-lg hover:-translate-y-1 hover:scale-105"
                            title={link.label}
                        >
                            {link.icon}
                        </a>
                    ))}
                    {socialLinks.filter(l => l.url).length === 0 && (
                        <p className="text-sm text-center text-slate-400 italic font-semibold">{t('recommendationForm.noLinks', 'No contact links available.')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
