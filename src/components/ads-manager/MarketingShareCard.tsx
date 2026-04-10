'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Send, Eye, Share2, MessageCircle, Facebook, Mail, Copy, Twitter, MailSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

import { getTemplates, EmailTemplate } from '@/actions/email-templates';
import { awardMarketingSharePoints } from '@/app/actions/dicipoints';
import { EmailMarketingComposer } from './EmailMarketingComposer';

interface MarketingShareCardProps {
    onManage?: (template: EmailTemplate) => void;
}

export function MarketingShareCard({ onManage }: MarketingShareCardProps) {
    const { t, i18n } = useTranslation(['common', 'admin']);
    const { toast } = useToast();
    const auth = getAuth(app);
    const db = getFirestore(app);

    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [referrerName, setReferrerName] = useState('');
    const [uniqueCode, setUniqueCode] = useState('');
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'es');
    const [currentTemplateId, setCurrentTemplateId] = useState('');

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const fetched = await getTemplates();
                // Filter only 'email_marketing'
                const mktTemplates = fetched.filter(t => t.category === 'email_marketing');
                setTemplates(mktTemplates);
                if (mktTemplates.length > 0) {
                    setCurrentTemplateId(mktTemplates[0].id || '');
                }
            } catch (e) {
                console.error("Failed to fetch templates", e);
            } finally {
                setLoadingTemplates(false);
            }
        };
        fetchTemplates();
    }, []);

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
    }, [auth.currentUser]);

    const getPreviewContent = () => {
        const dbTemplate = templates.find(t => t.id === currentTemplateId);
        if (dbTemplate) {
            const ver = dbTemplate.versions[currentLanguage] || dbTemplate.versions['es'] || dbTemplate.versions['en'];
            return { subject: ver?.subject || '', body: ver?.body || '' };
        }
        return { subject: '', body: '' };
    };

    const previewData = getPreviewContent();

    const handleReward = async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            const res = await awardMarketingSharePoints(user.uid, currentTemplateId);
            if (res.success) {
                toast({
                    title: "+10 DP",
                    description: "Has ganado 10 DiciPoints por compartir esta campaña.",
                });
            }
        } catch (e) {
            console.error("Error awarding points", e);
        }
    };

    const handleSocialShare = async (platform: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser && !uniqueCode) {
            toast({ title: "Esperando datos...", description: "Cargando tu perfil, intenta en un momento." });
            return;
        }

        const inviteUrl = `https://dicilo.net?ref=${uniqueCode || currentUser?.uid}`;
        let rawBody = previewData.body || "";
        const genericName = currentLanguage === 'es' ? 'Empresa' : currentLanguage === 'de' ? 'Unternehmen' : 'Company';

        let processedBody = rawBody
            .replace(/\[Name\]|\[Nombre\]|\{\{Nombre\}\}|\{\{Name\}\}/g, genericName)
            .replace(/\[Tu Nombre\]|\{\{Tu Nombre\}\}|\{\{Your Name\}\}|\{\{Dein Name\}\}/g, referrerName || (currentLanguage === 'es' ? 'Tu Contacto' : 'Your Contact'))
            .replace(/\[RefCode\]|\{\{RefCode\}\}/g, uniqueCode || currentUser?.uid);

        processedBody = processedBody.replace(/\[(BOTÓN|BUTTON):.*?\]/g, `\n👉 ${inviteUrl}\n`);
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
            case 'copy':
                try {
                    await navigator.clipboard.writeText(inviteUrl);
                    toast({ title: t('share.copied', 'Enlace copiado al portapapeles') });
                } catch (err) {
                    console.error('Clipboard failed');
                }
                break;
        }

        // Award points after sharing attempt
        if (platform !== 'copy') {
            await handleReward();
        }
    };

    // Removed internal onOpen check to move navigation to AdsDashboard


    return (
        <Card className="border-emerald-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 p-3">
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                    {t('admin:dashboard.cards.active', 'Activo')}
                </Badge>
            </div>
            
            <CardHeader className="flex-1 pb-4">
                <div className="mb-4 group-hover:scale-110 transition-transform origin-left">
                    <MailSearch className="h-10 w-10 text-emerald-600 drop-shadow-sm" strokeWidth={1.5} />
                </div>
                <CardTitle className="text-xl">{t('adsManager.cards.programs.emailMarketing.title', 'Email Marketing')}</CardTitle>
                <CardDescription className="leading-relaxed mt-2">
                    {t('adsManager.cards.programs.emailMarketing.description', 'Envía ofertas y promociones a empresas. Gana 10 DiciPoints por cada campaña compartida.')}
                </CardDescription>
            </CardHeader>

            <CardFooter className="pt-2">
                <Button 
                    onClick={() => {
                        const selectedTemplate = templates.find(t => t.id === currentTemplateId) || templates[0];
                        if (selectedTemplate && onManage) {
                            onManage(selectedTemplate);
                        }
                    }} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-11"
                >
                    Gestionar Campaña
                    <Send className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
