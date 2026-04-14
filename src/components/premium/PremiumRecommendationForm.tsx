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

export const PremiumRecommendationForm: React.FC<PremiumRecommendationFormProps> = ({ clientData }) => {
    const { t } = useTranslation('client');
    const { toast } = useToast();

    // Estado principal del Formulario "Growth Engine"
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        gutschein: '',
        newsletter: 'ja',
        producto_recomendado: '',
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
    const expectedCaptcha = '17'; // 15 + 2

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

        if (formData.captcha.trim() !== expectedCaptcha) {
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

            const submitData = {
                ...formData,
                referrals: validReferrals,
                formType: 'growth_engine',
                clientName: clientData.clientName || 'Unknown Business',
                clientId: clientData.id,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'clients', clientData.id, 'recommendations'), submitData);
            
            toast({ title: t('form.success', 'Information successfully submitted! Thank you.') });
            
            // Reset
            setFormData({
                name: '', email: '', gutschein: '', newsletter: 'ja', producto_recomendado: '',
                fuente: '', weiterempfehlen: 'nein', helfen_community: false, datenschutz: false,
                bestatigung_versand: false, mitglied_status: 'mitglied', captcha: ''
            });
            setReferrals([{ id: 1, name: '', contact: '' }]);

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
                                placeholder="Max Mustermann"
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
                                placeholder="max@example.com"
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
                                placeholder="Code eingeben"
                                value={formData.gutschein}
                                onChange={(e) => setFormData({ ...formData, gutschein: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">{t('leadForm.source', 'Wie haben Sie von uns erfahren?')}</Label>
                            <Select value={formData.fuente} onValueChange={(v) => setFormData({ ...formData, fuente: v })}>
                                <SelectTrigger className="bg-white/50 backdrop-blur-sm border-gray-200 rounded-xl h-12">
                                    <SelectValue placeholder="Bitte wählen..." />
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
                                    <SelectItem value="Empfehlung">Empfehlung</SelectItem>
                                    <SelectItem value="Dicilo Repräsentant">Bin Dicilo Repräsentant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">{t('leadForm.productRec', 'Welches Produkt möchten Sie empfehlen? Bitte tragen Sie es hier ein.')}</Label>
                        <Input
                            className="bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500 rounded-xl h-12"
                            placeholder="Z.B. Hörgerät Modell X"
                            value={formData.producto_recomendado}
                            onChange={(e) => setFormData({ ...formData, producto_recomendado: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">{t('leadForm.newsletter', 'Möchten Sie unsere Newsletter erhalten?')}</Label>
                            <Select value={formData.newsletter} onValueChange={(v) => setFormData({ ...formData, newsletter: v })}>
                                <SelectTrigger className="bg-white/50 backdrop-blur-sm border-gray-200 rounded-xl h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ja">Ja, gerne. Ich möchte Ihre Newsletter erhalten.</SelectItem>
                                    <SelectItem value="nein">Nein, danke. Ich möchte keine Newsletter erhalten.</SelectItem>
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
                                    <SelectItem value="mitglied">Ich bin Mitglied bei DICILO.</SelectItem>
                                    <SelectItem value="kein_mitglied">Ich bin kein Mitglied bei DICILO und möchte mich anmelden.</SelectItem>
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
                                    <SelectItem value="nein">Nein danke, momentan nicht</SelectItem>
                                    <SelectItem value="ja">Ich freue mich, meine Bekannten/Freunde einzuladen.</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            <div className="flex items-center space-x-3 pt-2">
                                <Checkbox 
                                    id="community" 
                                    checked={formData.helfen_community}
                                    onCheckedChange={(checked) => setFormData({ ...formData, helfen_community: checked as boolean })}
                                    className="border-blue-400 text-blue-600 focus:ring-blue-500 rounded-md"
                                />
                                <Label htmlFor="community" className="text-gray-700 font-medium cursor-pointer">
                                    Das hört sich toll an! Ich bin dabei!
                                </Label>
                            </div>
                        </div>

                        {/* Referral Slots Condicionales */}
                        {formData.weiterempfehlen === 'ja' && (
                            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4 text-sm text-yellow-800 flex gap-3 items-start">
                                    <ShieldCheck className="w-5 h-5 flex-shrink-0 text-yellow-600 mt-0.5" />
                                    <div>
                                        <strong>{t('leadForm.legalConfirmTitle', 'Bestätigung des Versands')} *</strong><br/>
                                        <label className="flex items-start gap-2 mt-2 cursor-pointer">
                                            <Checkbox 
                                                checked={formData.bestatigung_versand}
                                                onCheckedChange={(checked) => setFormData({ ...formData, bestatigung_versand: checked as boolean })}
                                                className="mt-1"
                                                required
                                            />
                                            <span className="text-xs leading-tight">
                                                Diese E-Mail versende ich vollkommen unabhängig von Dicilo.net. Ich treffe diese Entscheidung eigenständig und versichere, dass die Empfänger dem Erhalt zustimmen.
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {referrals.map((ref, index) => (
                                    <Card key={ref.id} className="border-blue-100 shadow-sm rounded-xl bg-white/80 overflow-hidden">
                                        <CardContent className="p-4 py-5 shadow-inner">
                                            <h4 className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-wider">Freund #{index + 1}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-gray-500">Vorname & Nachname des Geworbenen</Label>
                                                    <Input
                                                        className="h-10 rounded-lg text-sm bg-gray-50 border-gray-200 focus:bg-white"
                                                        placeholder="Name des Freundes"
                                                        value={ref.name}
                                                        onChange={(e) => handleReferralChange(ref.id, 'name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-gray-500">E-Mail oder Whatsapp</Label>
                                                    <Input
                                                        className="h-10 rounded-lg text-sm bg-gray-50 border-gray-200 focus:bg-white"
                                                        placeholder="Email oder Nummer"
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
                                        + Weiteren Freund hinzufügen
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
                                <strong>Einverstanden *</strong><br/>
                                Indem Sie diese Empfehlung absenden, erklären Sie sich mit unserer Datenschutzerklärung einverstanden und willigen in die Verarbeitung Ihrer Daten ein.
                            </Label>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <Label className="whitespace-nowrap font-bold text-xl text-gray-700 tracking-wider">15 + 2 =</Label>
                            <Input
                                type="number"
                                required
                                value={formData.captcha}
                                onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
                                className="w-24 text-center text-lg font-bold border-gray-300 h-12 rounded-xl"
                                placeholder="?"
                            />
                            <span className="text-xs text-gray-400">Sicherheitsfrage lösen</span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-14 font-bold text-lg shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2 mt-4"
                    >
                        {isSubmitting ? 'Wird gesendet...' : 'Senden / Empfehlen'} 
                        <Send className="ml-2 h-5 w-5" />
                    </Button>
                </form>
            </div>

            {/* Module: Social Contacts */}
            <div className="rounded-[2rem] border border-gray-100 bg-white/70 backdrop-blur-xl p-6 shadow-sm flex flex-col items-center">
                <h3 className="mb-5 text-sm font-bold text-gray-500 uppercase tracking-widest text-center px-4">
                  {t('recommendationForm.connectTitle', 'Si lo desea Conectanos y Comparta nuestros enlaces a traves de cualquiera de estas posibilidades')}
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
