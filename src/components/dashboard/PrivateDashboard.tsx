import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import AdsDashboard from '@/components/ads-manager/AdsDashboard';
import { updatePrivateProfile, ensureUniqueCode } from '@/app/actions/profile';
import { User } from 'firebase/auth';
import { doc, getFirestore, updateDoc, setDoc, onSnapshot, addDoc, collection } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Share2, Gift, Users, Heart, Settings, Star, CreditCard, Info, Download, QrCode } from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from './DashboardLayout';
import { WalletSection } from './WalletSection';
import { InviteFriendSection } from './InviteFriendSection';
import { DiciCoinSection } from './DiciCoinSection';
import { TicketsManager } from './tickets/TicketsManager';
import { FreelancerLanding } from './freelancer/FreelancerLanding';
import { FreelancerCampaignList } from './freelancer/FreelancerCampaignList';
import FreelancerPromoComposerPage from '@/app/dashboard/freelancer/page';
import { StatisticsView } from './freelancer/views/StatisticsView';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const db = getFirestore(app);
// Private Dashboard Component

interface PrivateDashboardProps {
    user: User;
    profile: any;
}

export function PrivateDashboard({ user, profile }: PrivateDashboardProps) {
    const { toast } = useToast();
    const { t } = useTranslation('common');
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeView, setActiveView] = useState(searchParams?.get('view') || 'overview'); // overview, wallet, invite, map, settings, dicicoin, tickets
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState(profile);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const [walletData, setWalletData] = useState<{ balance: number, valueInEur: number } | null>(null);
    const [registerUrl, setRegisterUrl] = useState('');

    // Fetch wallet data for preview
    useEffect(() => {
        if (user?.uid) {
            import('@/app/actions/wallet').then(({ getWalletData }) => {
                getWalletData(user.uid).then((data) => setWalletData(data));
            });
        }
    }, [user?.uid]);

    useEffect(() => {
        if (typeof window !== 'undefined' && formData?.uniqueCode) {
            setRegisterUrl(`${window.location.origin}/registrieren?ref=${formData.uniqueCode}`);
        }
    }, [formData?.uniqueCode]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: t('dashboard.copied', 'Copied!'),
            description: t('dashboard.codeCopied', 'Code copied to clipboard.'),
        });
    };

    const handleDownloadQr = async () => {
        if (!registerUrl) return;
        try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registerUrl)}`;
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dicilo-code-${formData.uniqueCode || 'invite'}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            toast({ title: t('dashboard.errorTitle'), description: t('dashboard.errorDesc'), variant: 'destructive' });
        }
    };

    const handleShareQr = async () => {
        if (!registerUrl) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Dicilo Invitation',
                    text: t('dashboard.scanToRegister'),
                    url: registerUrl
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            copyToClipboard(registerUrl);
        }
    };

    // State initialized above

    // Sync state with URL changes if user navigates back/forward
    useEffect(() => {
        const viewParam = searchParams?.get('view');
        if (viewParam && viewParam !== activeView) {
            setActiveView(viewParam);
        }
    }, [searchParams]);

    const handleSendFeedback = async () => {
        if (!feedbackMessage.trim()) return;
        setIsSubmittingFeedback(true);
        try {
            await addDoc(collection(db, 'feedbacks'), {
                name: (formData.firstName || '') + ' ' + (formData.lastName || ''),
                email: formData.email,
                rating: feedbackRating,
                message: feedbackMessage,
                country: formData.country || 'Unknown',
                city: formData.city || 'Unknown',
                customerType: 'private',
                createdAt: new Date(),
                rewardPreference: formData.profileData?.rewardPreference || 'none',
                uid: user.uid
            });
            toast({
                title: t('benefits.feedback.successTitle'),
                description: t('benefits.feedback.successDesc')
            });
            setFeedbackMessage('');
            setFeedbackRating(0);
        } catch (error) {
            console.error(error);
            toast({
                title: t('benefits.feedback.errorTitle'),
                description: t('benefits.feedback.errorDesc'),
                variant: 'destructive'
            });
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    // Real-time updates for the profile
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'private_profiles', user.uid), (doc) => {
            if (doc.exists()) {
                setFormData(doc.data());
            }
        });
        return () => unsub();
    }, [user.uid]);

    // Ensure Unique Code exists
    useEffect(() => {
        if (user && formData) {
            if (!formData.uniqueCode) {
                ensureUniqueCode(user.uid).then((res) => {
                    if (res.success && res.uniqueCode) {
                        setFormData((prev: any) => ({ ...prev, uniqueCode: res.uniqueCode }));
                    }
                });
            }
        }
    }, [user, formData?.uniqueCode]);

    const handleUpdate = async (section: string, data: any) => {
        setIsLoading(true);
        try {
            const userRef = doc(db, 'private_profiles', user.uid);
            await setDoc(userRef, data, { merge: true });
            toast({
                title: t('dashboard.saved', 'Saved'),
                description: t('dashboard.successDesc', 'Your changes have been saved.'),
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: t('dashboard.errorTitle', 'Error'),
                description: t('dashboard.errorDesc', 'Failed to save changes.'),
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };



    // Safe Date Parsing
    const memberSinceDate = formData.createdAt?.seconds
        ? new Date(formData.createdAt.seconds * 1000).toLocaleDateString()
        : new Date().toLocaleDateString();

    const birthDateValue = formData.birthDate?.seconds
        ? new Date(formData.birthDate.seconds * 1000).toISOString().split('T')[0]
        : formData.birthDate
            ? new Date(formData.birthDate).toISOString().split('T')[0]
            : '';

    const renderView = () => {
        switch (activeView) {
            case 'overview':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.welcomeUser', { name: formData.firstName })}</h1>
                            <p className="text-muted-foreground">{t('dashboard.manageProfile')}</p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t('dashboard.profileStatus')}</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{t('dashboard.active')}</div>
                                    <p className="text-xs text-muted-foreground">{t('dashboard.memberSince', { date: memberSinceDate })}</p>
                                </CardContent>
                            </Card>
                            <Card className="cursor-pointer hover:bg-secondary/5 transition-colors" onClick={() => setActiveView('settings')}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t('dashboard.interests')}</CardTitle>
                                    <Heart className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formData.interests?.length || 0}</div>
                                    <p className="text-xs text-muted-foreground">{t('dashboard.yourInterestsDesc')}</p>
                                </CardContent>
                            </Card>
                            <Card className="cursor-pointer hover:bg-secondary/5 transition-colors" onClick={() => setActiveView('invite')}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t('dashboard.referrals')}</CardTitle>
                                    <Gift className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formData.referrals?.length || 0}</div>
                                    <p className="text-xs text-muted-foreground">{t('dashboard.friendsInvited')}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Prompts */}
                        {/* Dashboard Bottom Section */}
                        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                            {/* Quick Actions (Left) */}
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle>{t('dashboard.quickActions')}</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-3">
                                    <Button variant="outline" className="justify-start w-full h-12 text-base" onClick={() => setActiveView('wallet')}>
                                        <Users className="mr-3 h-5 w-5" /> {t('dashboard.goToWallet')}
                                    </Button>
                                    <Button variant="outline" className="justify-start w-full h-12 text-base" onClick={() => setActiveView('invite')}>
                                        <Share2 className="mr-3 h-5 w-5" /> {t('dashboard.inviteFriends')}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Wallet Card (Middle) - DiciPoints Focus (Black/Dark Background) */}
                            <Card className="h-full min-h-[220px] relative overflow-hidden border-none shadow-xl group transition-all hover:shadow-2xl bg-gradient-to-br from-[#0f1115] to-[#1a1f2c]">
                                {/* Decorative abstract shapes for the dark background */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl translate-y-5 -translate-x-5"></div>

                                <CardHeader className="relative z-10 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                DICILO WALLET
                                                <Info size={14} className="cursor-help" />
                                            </CardTitle>
                                            <div className="mt-2">
                                                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10">
                                                    {t('dashboard.wallet.personal')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10 space-y-6">
                                    <div className="space-y-1">
                                        <div className="text-4xl font-bold tracking-tight text-white">
                                            {walletData ? walletData.balance : '...'} DP
                                        </div>
                                        <p className="text-sm text-gray-400 font-medium">
                                            DiciPoints Balance
                                        </p>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        className="w-full bg-white text-black hover:bg-gray-100 font-semibold shadow-md border-0"
                                        onClick={() => setActiveView('wallet')}
                                    >
                                        <QrCode className="mr-2 h-4 w-4" />
                                        {t('dashboard.wallet.showQr', 'Mostrar QR para Pagar')}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Prepaid Card (Right) - EUR Focus (Full Card Image) */}
                            <Card className="h-full min-h-[220px] relative overflow-hidden border-none shadow-xl group transition-all hover:shadow-2xl">
                                <div className="absolute inset-0 z-0 select-none">
                                    <Image
                                        src="/assets/images/dicilo-prepaid-card.png"
                                        alt="Dicilo Prepaid Card"
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        priority
                                    />
                                    {/* Minimal overlay just for very high contrast text if needed, kept very light to show card */}
                                    <div className="absolute inset-0 bg-black/0" />
                                </div>

                                <CardContent className="relative z-20 h-full flex flex-col justify-between p-6 text-white text-shadow-sm">
                                    <div className="flex justify-between items-start w-full">
                                        {/* Floating Balance Badge - semi-transparent to integrate with card design */}
                                        <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 shadow-lg">
                                            <p className="text-[9px] font-bold text-white/90 uppercase tracking-widest mb-0.5">
                                                Ganancias
                                            </p>
                                            <div className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                                                € {walletData ? walletData.valueInEur.toFixed(2) : '0.00'}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md rounded text-[9px] font-bold tracking-wider border border-white/10 shadow-sm">
                                                PREPAID
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="flex gap-3 text-white/90 font-mono text-base tracking-widest opacity-95 pl-1 drop-shadow-md mb-2">
                                            <span>••••</span>
                                            <span>••••</span>
                                            <span>••••</span>
                                            <span>{user.uid.slice(0, 4).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="text-[7px] text-white/80 uppercase tracking-wider mb-0.5 font-semibold">Card Holder</p>
                                            <p className="text-sm font-bold tracking-widest uppercase text-white drop-shadow-md">
                                                {(formData.firstName || 'Miembro').substring(0, 20)}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Transactions & Actions Row */}
                        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                            {/* Invitation QR Card (Restored) */}
                            <Card className="flex flex-col justify-center items-center text-center p-6 relative lg:col-span-1">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold">{t('dashboard.scanToRegister')}</h3>
                                </div>

                                <Dialog>
                                    <div className="bg-white p-3 rounded-xl border shadow-sm relative mt-2 group">
                                        {/* Display Register QR */}
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-sm border text-sm text-muted-foreground whitespace-nowrap z-10">
                                            {t('dashboard.myCode')} <span className="font-mono font-bold text-black text-lg ml-2">{formData.uniqueCode}</span>
                                        </div>

                                        <DialogTrigger asChild>
                                            <div className="cursor-zoom-in hover:opacity-90 transition-all">
                                                {formData.uniqueCode && registerUrl ? (
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registerUrl)}&color=000000`}
                                                        alt="Registration QR"
                                                        className="h-32 w-32 mt-2"
                                                    />
                                                ) : (
                                                    <div className="h-32 w-32 mt-2 bg-gray-100 animate-pulse rounded" />
                                                )}
                                                <p className="text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to enlarge</p>
                                            </div>
                                        </DialogTrigger>

                                        <DialogContent className="sm:max-w-md flex flex-col items-center justify-center bg-white p-8">
                                            <div className="text-center space-y-6 w-full flex flex-col items-center">
                                                <h3 className="text-xl font-semibold text-center">{t('dashboard.scanToRegister')}</h3>

                                                <div className="bg-white p-4 rounded-xl border shadow-lg inline-block relative">
                                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full border shadow-sm text-sm text-muted-foreground whitespace-nowrap">
                                                        {t('dashboard.myCode')} <span className="font-mono font-bold text-black text-xl ml-2">{formData.uniqueCode}</span>
                                                    </div>
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(registerUrl)}&color=000000`}
                                                        alt="Registration QR Large"
                                                        className="h-64 w-64 mt-4"
                                                    />
                                                </div>

                                                <p className="text-sm text-muted-foreground break-all max-w-[80%] text-center">{registerUrl}</p>
                                            </div>
                                        </DialogContent>
                                    </div>
                                </Dialog>

                                <div className="w-full max-w-[200px] text-center mt-4">
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadQr}>
                                            <Download className="h-4 w-4 mr-2" />
                                            <span className="font-semibold">{t('dashboard.download')}</span>
                                        </Button>
                                        <Button variant="outline" size="icon" className="w-9 px-0" onClick={handleShareQr}>
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Recent Transactions Placeholder (2/3 width) */}
                            <Card className="col-span-1 lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Transacciones Recientes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="min-h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                        Aún no hay transacciones.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );
            case 'wallet':
                return <WalletSection uid={user.uid} uniqueCode={formData.uniqueCode} userProfile={formData} />;
            case 'invite':
                return <InviteFriendSection uniqueCode={formData.uniqueCode} referrals={formData.referrals} />;
            case 'dicicoin':
                return <DiciCoinSection userData={formData} onViewHistory={() => setActiveView('tickets')} />;
            case 'tickets':
                return <TicketsManager />;
            case 'ads-manager':
                return <AdsDashboard />;
            case 'freelancer':
                return <FreelancerPromoComposerPage />;
            case 'map':
                return (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                        <div className="p-6 bg-secondary/20 rounded-full">
                            <Users className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold">Map Coming Soon</h2>
                        <p className="text-muted-foreground max-w-sm">
                            We are working on visualizing all our allied partners on an interactive map. Stay tuned!
                        </p>
                    </div>
                );
            case 'settings':
                return (
                    <Tabs defaultValue="personal" className="space-y-4">
                        <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.settings')}</h2>
                        <TabsList>
                            <TabsTrigger value="personal">{t('dashboard.personalData')}</TabsTrigger>
                            <TabsTrigger value="interests">{t('dashboard.interests')}</TabsTrigger>
                            <TabsTrigger value="social">{t('dashboard.socialRewards')}</TabsTrigger>
                        </TabsList>

                        {/* Re-using existing content logic for settings sub-tabs */}
                        <TabsContent value="personal">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('dashboard.personalInfo')}</CardTitle>
                                    <CardDescription>{t('dashboard.personalInfoDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.firstName')}</Label>
                                            <Input value={formData.firstName} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.lastName')}</Label>
                                            <Input value={formData.lastName} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.dateOfBirth')}</Label>
                                            <Input
                                                type="date"
                                                value={birthDateValue}
                                                onChange={(e) => {
                                                    const date = new Date(e.target.value);
                                                    handleUpdate('birthDate', { birthDate: date });
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.gender')}</Label>
                                            <Select
                                                value={formData.gender || ''}
                                                onValueChange={(val) => handleUpdate('gender', { gender: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('dashboard.selectGender')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">{t('dashboard.male')}</SelectItem>
                                                    <SelectItem value="female">{t('dashboard.female')}</SelectItem>
                                                    <SelectItem value="diverse">{t('dashboard.diverse')}</SelectItem>
                                                    <SelectItem value="prefer_not_to_say">{t('dashboard.preferNotToSay')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t">
                                        <h3 className="text-lg font-medium">{t('dashboard.location')}</h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.country')}</Label>
                                                <Input
                                                    value={formData.country || ''}
                                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                    onBlur={() => handleUpdate('country', { country: formData.country })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('dashboard.city')}</Label>
                                                <Input
                                                    value={formData.city || ''}
                                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    onBlur={() => handleUpdate('city', { city: formData.city })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="interests">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('dashboard.yourInterests')}</CardTitle>
                                    <CardDescription>{t('dashboard.yourInterestsDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <CategorySelector
                                        selectedCategories={formData.interests || []}
                                        onChange={(newInterests) => handleUpdate('interests', { interests: newInterests })}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="social">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('dashboard.socialGroups')}</CardTitle>
                                        <CardDescription>{t('dashboard.joinCommunity')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.joinQuestion')}</Label>
                                            <RadioGroup
                                                value={formData.profileData?.socialGroup || 'none'}
                                                onValueChange={(val) => handleUpdate('socialGroup', {
                                                    profileData: { ...formData.profileData, socialGroup: val }
                                                })}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="whatsapp" id="s1" />
                                                    <Label htmlFor="s1">{t('dashboard.joinWhatsapp')}</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="telegram" id="s2" />
                                                    <Label htmlFor="s2">{t('dashboard.joinTelegram')}</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="none" id="s3" />
                                                    <Label htmlFor="s3">{t('dashboard.preferNotJoin')}</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                        {(formData.profileData?.socialGroup === 'whatsapp' || formData.profileData?.socialGroup === 'telegram') && (
                                            <div className="pt-4 flex flex-col gap-2">
                                                <Button className="w-full" onClick={() => window.open(formData.profileData?.socialGroup === 'whatsapp' ? 'https://chat.whatsapp.com/IPFpYXlHJTdH0rZosQGws4' : 'https://t.me/+XHaw-Wa4EsBmMjk6', '_blank')}>
                                                    {formData.profileData?.socialGroup === 'whatsapp' ? t('dashboard.joinWhatsapp') : t('dashboard.joinTelegram')}
                                                </Button>
                                                {formData.profileData?.socialGroup === 'whatsapp' && (
                                                    <Button variant="outline" className="w-full" onClick={() => {
                                                        const text = t('whatsappInvite');
                                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                                    }}>
                                                        <Share2 className="mr-2 h-4 w-4" /> Share WhatsApp Group
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('dashboard.rewardsFeedback')}</CardTitle>
                                        <CardDescription>{t('dashboard.tellUs')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.whatToWin')}</Label>
                                            <Select
                                                value={formData.profileData?.rewardPreference || ''}
                                                onValueChange={(val) => handleUpdate('rewardPreference', {
                                                    profileData: { ...formData.profileData, rewardPreference: val }
                                                })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('dashboard.selectOption')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="prizes">{t('dashboard.prizes')}</SelectItem>
                                                    <SelectItem value="points">{t('dashboard.points')}</SelectItem>
                                                    <SelectItem value="cash">{t('dashboard.cash')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('benefits.feedback.rating')}</Label>
                                            <div className="flex items-center space-x-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`cursor-pointer h-5 w-5 ${star <= feedbackRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                        onClick={() => setFeedbackRating(star)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('dashboard.feedback')}</Label>
                                            <Textarea
                                                placeholder={t('dashboard.feedbackPlaceholder')}
                                                value={feedbackMessage}
                                                onChange={(e) => setFeedbackMessage(e.target.value)}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                                onClick={handleSendFeedback}
                                                disabled={isSubmittingFeedback}
                                            >
                                                {isSubmittingFeedback ? t('dashboard.pending') : t('dashboard.sendFeedback')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                );
            default:
                return <div>View Not Found</div>;
        }
    };

    return (
        <DashboardLayout
            userData={formData}
            currentView={activeView}
            onViewChange={setActiveView}
        >
            {renderView()}
        </DashboardLayout>
    );
}
