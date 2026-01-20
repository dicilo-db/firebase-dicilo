'use client';

import React, { useState } from 'react';
import { ClientData } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Facebook, Instagram, Mail, Globe, Send, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface PremiumRecommendationFormProps {
    clientData: ClientData;
}

export const PremiumRecommendationForm: React.FC<PremiumRecommendationFormProps> = ({ clientData }) => {
    const { t } = useTranslation('client');
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        email: '',
        country: '',
        comment: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.comment) {
            toast({ title: t('recommendationForm.errorMissingFields', 'Please fill in all required fields.'), variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const db = getFirestore(app);
            // Save to a subcollection "recommendations" under the client document
            // Note: Assuming path is clients/{docId}/recommendations
            await addDoc(collection(db, 'clients', clientData.id, 'recommendations'), {
                ...formData,
                createdAt: serverTimestamp(),
            });
            toast({ title: t('recommendationForm.success', 'Recomendación enviada con éxito!') });
            setFormData({ name: '', lastName: '', email: '', country: '', comment: '' });
        } catch (error) {
            console.error('Error submitting recommendation:', error);
            toast({ title: t('recommendationForm.errorGeneric', 'Error sending recommendation. Please try again.'), variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const socialLinks = [
        { type: 'website', url: clientData.website, icon: <Globe className="h-5 w-5" />, label: 'Website' },
        { type: 'email', url: clientData.email ? `mailto:${clientData.email}` : '', icon: <Mail className="h-5 w-5" />, label: 'Email' },
        // TODO: Add WhatsApp, Instagram, and Facebook if available in ClientData (headerData.socialLinks)
        // For now using placeholders or checking specific known fields if they existed, or searching in socialLinks array
    ];

    // Extract social links from array if available
    const headerSocials = clientData.headerData?.socialLinks || [];
    const getSocialUrl = (type: string) => headerSocials.find(s => s.icon.toLowerCase().includes(type))?.url || '';

    const fbUrl = getSocialUrl('facebook');
    const igUrl = getSocialUrl('instagram');
    const whatsUrl = getSocialUrl('whatsapp'); // Or 'phone' if mobile?

    if (fbUrl) socialLinks.push({ type: 'facebook', url: fbUrl, icon: <Facebook className="h-5 w-5" />, label: 'Facebook' });
    if (igUrl) socialLinks.push({ type: 'instagram', url: igUrl, icon: <Instagram className="h-5 w-5" />, label: 'Instagram' });
    if (whatsUrl) socialLinks.push({ type: 'whatsapp', url: whatsUrl, icon: <MessageCircle className="h-5 w-5" />, label: 'WhatsApp' });

    return (
        <div className="flex flex-col gap-6">
            {/* Module 3: Recommendation Form */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                    {t('recommendationForm.title', 'Leave a Recommendation')}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('recommendationForm.name', 'Name')}</label>
                            <Input
                                placeholder={t('recommendationForm.name', 'Name')}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('recommendationForm.lastName', 'Last Name')}</label>
                            <Input
                                placeholder={t('recommendationForm.lastName', 'Last Name')}
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('recommendationForm.email', 'Email')}</label>
                            <Input
                                type="email"
                                placeholder={t('recommendationForm.emailPlaceholder', 'Email Address')}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('recommendationForm.country', 'Country')}</label>
                            <Input
                                placeholder={t('recommendationForm.country', 'Country')}
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('recommendationForm.comment', 'Your Comment')}</label>
                        <Textarea
                            placeholder={t('recommendationForm.commentPlaceholder', 'Tell us about your experience...')}
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            required
                            className="min-h-[100px]"
                        />
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                        {isSubmitting ? t('recommendationForm.submitting', 'Sending...') : t('recommendationForm.submit', 'Submit Recommendation')} <Send className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            </div>

            {/* Module 4: Social Contacts */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col items-center">
                <h3 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-widest">{t('recommendationForm.connectTitle', 'Connect & Share')}</h3>
                <div className="flex gap-4 flex-wrap justify-center">
                    {socialLinks.filter(l => l.url).map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-primary hover:text-white hover:scale-110 shadow-sm"
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
