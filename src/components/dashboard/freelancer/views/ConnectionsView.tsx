'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { saveSocialConnection, getUserSocialConnections, SocialConnection, SocialProvider } from '@/app/actions/social-connections';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Facebook, Instagram, Linkedin, Twitter, Save, Loader2, Link as LinkIcon, Youtube, Twitch, Pin, Video, MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SocialInput = ({
    provider,
    icon: Icon,
    placeholder,
    label,
    value,
    onChange,
    onSave,
    isSaving,
    isValid
}: {
    provider: SocialProvider,
    icon: any,
    placeholder: string,
    label: string,
    value: string,
    onChange: (val: string) => void,
    onSave: () => void,
    isSaving: boolean,
    isValid: boolean
}) => (
    <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
            <Label className="flex items-center gap-2">
                <Icon className="h-4 w-4" /> {label}
            </Label>
            <div className="relative">
                <Input
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-9"
                />
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
        </div>
        <Button
            onClick={onSave}
            disabled={isSaving || !isValid}
            size="icon"
            className="mb-0.5"
        >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>
    </div>
);

export function ConnectionsView() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [savingProvider, setSavingProvider] = useState<SocialProvider | null>(null);

    // Local state for form inputs
    const [connections, setConnections] = useState<{ [key in SocialProvider]?: string }>({});

    // Load existing connections
    useEffect(() => {
        async function load() {
            if (!user) return;
            setIsLoading(true);
            const result = await getUserSocialConnections(user.uid);
            if (result.success && result.connections) {
                const map: any = {};
                result.connections.forEach((conn: SocialConnection) => {
                    map[conn.provider] = conn.profileUrl;
                });
                setConnections(map);
            }
            setIsLoading(false);
        }
        load();
    }, [user]);

    const handleSave = async (provider: SocialProvider) => {
        if (!user) return;
        const url = connections[provider];
        if (!url) return;

        setSavingProvider(provider);
        try {
            const result = await saveSocialConnection(user.uid, provider, url);
            if (result.success) {
                toast({
                    title: t('dashboard.saved'), // "Guardado"
                    description: "Social connection updated successfully.",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: t('dashboard.errorTitle'),
                description: t('dashboard.errorDesc'),
                variant: "destructive"
            });
        } finally {
            setSavingProvider(null);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">{t('freelancer_menu.connections')}</h1>
                <p className="text-muted-foreground">
                    Verbinden Sie Ihr Konto mit Ihren Netzwerken und leiten Sie Ihre Dici-Posts über soziale Medien weiter.
                    Bitten Sie Ihre Freunde, Ihre Beiträge zu kommentieren – „Das bringt Ihnen größere wirtschaftliche Vorteile“.
                </p>
                <p className="text-sm font-semibold text-primary mt-2">
                    Todos estos canales deben estar activos / All these channels should be active.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Manual Connection</CardTitle>
                    <CardDescription>
                        Paste the direct link to your public profiles. We will verify them manually for now.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SocialInput
                            provider="whatsapp"
                            icon={MessageCircle}
                            label="WhatsApp"
                            placeholder="https://wa.me/yournumber"
                            value={connections.whatsapp || ''}
                            onChange={(val) => setConnections(prev => ({ ...prev, whatsapp: val }))}
                            onSave={() => handleSave('whatsapp')}
                            isSaving={savingProvider === 'whatsapp'}
                            isValid={!!connections.whatsapp}
                        />
                        <SocialInput
                            provider="telegram"
                            icon={Send}
                            label="Telegram"
                            placeholder="https://t.me/username"
                            value={connections.telegram || ''}
                            onChange={(val) => setConnections(prev => ({ ...prev, telegram: val }))}
                            onSave={() => handleSave('telegram')}
                            isSaving={savingProvider === 'telegram'}
                            isValid={!!connections.telegram}
                        />

                        <SocialInput
                            provider="instagram"
                            icon={Instagram}
                            label="Instagram"
                            placeholder="https://instagram.com/username"
                            value={connections.instagram || ''}
                            onChange={(val) => setConnections(prev => ({ ...prev, instagram: val }))}
                            onSave={() => handleSave('instagram')}
                            isSaving={savingProvider === 'instagram'}
                            isValid={!!connections.instagram}
                        />
                        <SocialInput
                            provider="facebook"
                            icon={Facebook}
                            label="Facebook Fanpage"
                            placeholder="https://facebook.com/page"
                            value={connections.facebook || ''}
                            onChange={(val) => setConnections(prev => ({ ...prev, facebook: val }))}
                            onSave={() => handleSave('facebook')}
                            isSaving={savingProvider === 'facebook'}
                            isValid={!!connections.facebook}
                        />

                        <SocialInput
                            provider="tiktok"
                            icon={Video}
                            label="TikTok"
                            placeholder="https://tiktok.com/@username"
                            value={connections.tiktok || ''}
                            onChange={(val) => setConnections(prev => ({ ...prev, tiktok: val }))}
                            onSave={() => handleSave('tiktok')}
                            isSaving={savingProvider === 'tiktok'}
                            isValid={!!connections.tiktok}
                        />
                        <SocialInput
                            provider="linkedin"
                            icon={Linkedin}
                            label="LinkedIn Fanpage"
                            placeholder="https://linkedin.com/company/page"
                            value={connections.linkedin || ''}
                            onChange={(val) => setConnections(prev => ({ ...prev, linkedin: val }))}
                            onSave={() => handleSave('linkedin')}
                            isSaving={savingProvider === 'linkedin'}
                            isValid={!!connections.linkedin}
                        />

                        <SocialInput
                            provider="youtube"
                            icon={Youtube}
                            label="YouTube Kanal"
                            placeholder="https://youtube.com/@channel"
                            value={connections.youtube || ''}
                            onChange={(val) => setConnections(prev => ({ ...prev, youtube: val }))}
                            onSave={() => handleSave('youtube')}
                            isSaving={savingProvider === 'youtube'}
                            isValid={!!connections.youtube}
                        />
                        <SocialInput
                            provider="twitter"
                            icon={Twitter}
                            label='"X" (Früher Twitter)'
                            placeholder="https://x.com/username"
                            value={connections.twitter || ''}
                            onChange={(val) => setConnections(prev => ({ ...prev, twitter: val }))}
                            onSave={() => handleSave('twitter')}
                            isSaving={savingProvider === 'twitter'}
                            isValid={!!connections.twitter}
                        />

                        <SocialInput
                            provider="twitch"
                            icon={Twitch}
                            label="Twitch Kanal"
                            placeholder="https://twitch.tv/username"
                            value={connections.twitch || ''}
                            onChange={(val) => setConnections(prev => ({ ...prev, twitch: val }))}
                            onSave={() => handleSave('twitch')}
                            isSaving={savingProvider === 'twitch'}
                            isValid={!!connections.twitch}
                        />
                        <SocialInput
                            provider="pinterest"
                            icon={Pin}
                            label="Pinterest Kanal"
                            placeholder="https://pinterest.com/username"
                            value={connections.pinterest || ''}
                            onChange={(val) => setConnections(prev => ({ ...prev, pinterest: val }))}
                            onSave={() => handleSave('pinterest')}
                            isSaving={savingProvider === 'pinterest'}
                            isValid={!!connections.pinterest}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> API connections (Login with Facebook/Google) are coming in Phase 2. This will allow automatic stats tracking.
                </p>
            </div>
        </div>
    );
}
