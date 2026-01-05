'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
    Wallet,
    Users,
    Map as MapIcon,
    Settings,
    LogOut,
    Home,
    Gift,
    Camera,
    Coins,
    LifeBuoy,
    Shield,
    Info,
    Briefcase,
    Megaphone,
    ChevronDown,
    ChevronRight,
    Scan
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { uploadImage } from '@/app/actions/upload';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { updatePrivateProfile } from '@/app/actions/private-users';

interface SidebarProps {
    userData: any;
    onViewChange: (view: string) => void;
    currentView: string;
}

type NavItem = {
    id: string;
    label: string;
    icon: React.ElementType;
    type: 'view' | 'link' | 'dialog';
    href?: string;
};

export function Sidebar({ userData, onViewChange, currentView }: SidebarProps) {
    const { t } = useTranslation('common');
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isUploading, setIsUploading] = React.useState(false);


    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', `avatars/${user.uid}`);

            const result = await uploadImage(formData);
            if (result.success && result.url) {
                // Update profile
                await updatePrivateProfile(user.uid, { photoURL: result.url });
                // We should ideally update local state or trigger a reload/refetch
                // For now, assuming parent component handles real-time updates or we force reload
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: t('errors.imageUploadFailed'),
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const levelBadge = (points: number) => {
        if (points >= 1000) return "Gold";
        if (points >= 500) return "Silver";
        return "Bronze";
    };

    // Determine role (fallback to isFreelancer legacy)
    const role = userData?.role || (userData?.isFreelancer ? 'freelancer' : 'user');
    const permissions = userData?.permissions || [];

    // Map role to display string
    const roleDisplayMap: Record<string, string> = {
        'superadmin': 'SuperAdmin',
        'admin': 'Admin',
        'team_office': 'Team Office',
        'freelancer': 'Freelancer',
        'user': 'Member'
    };
    const userLevel = roleDisplayMap[role] || 'Member';

    // Permission Helpers
    const hasPermission = (perm: string) => permissions.includes(perm);

    const canSeeAdmin = ['team_office', 'admin', 'superadmin'].includes(role) || hasPermission('access_admin_panel');
    const canSeeAdsManager = ['admin', 'superadmin'].includes(role) || hasPermission('access_ads_manager');
    const isFreelancerOrHigher = ['freelancer', 'team_office', 'admin', 'superadmin'].includes(role) || hasPermission('freelancer_tool');

    // Explicitly type the array to avoid discriminated union inference issues
    const navItems: NavItem[] = [
        { id: 'overview', label: t('dashboard.overview'), icon: Home, type: 'view' },
        { id: 'freelancer', label: 'Freelancer / Representante', icon: Briefcase, type: 'view' },
        { id: 'ads-manager', label: 'Ads Manager', icon: Megaphone, type: 'view' },
        { id: 'wallet', label: t('dashboard.myWallet'), icon: Wallet, type: 'view' },
        { id: 'invite', label: t('dashboard.inviteFriends'), icon: Users, type: 'view' },
        { id: 'map', label: t('dashboard.alliesMap'), icon: MapIcon, type: 'view' },
        { id: 'settings', label: t('dashboard.settings'), icon: Settings, type: 'view' },
        // Added items from header - NOW VIEWS for SPA
        { id: 'dicicoin', label: 'DiciCoin', icon: Coins, type: 'view' },
        { id: 'tickets', label: t('tickets.title', 'Tickets'), icon: LifeBuoy, type: 'view' },
        { id: 'dicipoints-info', label: t('dicipoints.whatIs.title', 'What are DiciPoints?'), icon: Info, type: 'dialog' },
    ];

    // Add Admin conditionally
    if (canSeeAdmin) {
        navItems.push({ id: 'admin', label: 'Admin Panel', icon: Shield, type: 'link', href: '/admin' });
    }

    // Add Scanner Pro for Freelancers+
    const canUseScanner = ['freelancer', 'team_office', 'admin', 'superadmin'].includes(role) || hasPermission('use_scanner');
    if (canUseScanner) {
        navItems.push({ id: 'scanner', label: 'Scanner Pro', icon: Scan, type: 'link', href: '/admin/scan' });
    }

    // Dialog state for info
    const [showInfo, setShowInfo] = React.useState(false);

    return (
        <div className="flex h-full w-64 flex-col border-r bg-white">
            {/* Logo Isotype */}


            {/* Info Dialog */}
            <Dialog open={showInfo} onOpenChange={setShowInfo}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dicipoints.whatIs.title')}</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-gray-500 whitespace-pre-line leading-relaxed">
                        {t('dicipoints.whatIs.description')}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Profile Header */}
            <div className="flex flex-col items-center border-b p-6">
                {/* ... existing avatar code ... keep as is, just ensure wrapper structure matches */}
                <div className="relative mb-4">
                    <Avatar className="h-20 w-20 cursor-pointer border-2 border-primary/20 hover:border-primary">
                        <AvatarImage src={userData?.photoURL} />
                        <AvatarFallback>{userData?.firstName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md transition-colors hover:bg-primary/90"
                    >
                        <Camera size={12} />
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>

                <h2 className="text-lg font-bold text-gray-900 line-clamp-1">
                    {userData?.firstName} {userData?.lastName}
                </h2>
                <p className="text-xs text-muted-foreground">{userData?.email}</p>

                <Badge variant="secondary" className="mt-2">
                    {userLevel}
                </Badge>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                {navItems.map((item) => {
                    if (item.type === 'link' && item.href) {
                        return (
                            <Button
                                key={item.id}
                                variant={currentView === item.id ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3",
                                    currentView === item.id && "bg-primary/10 text-primary hover:bg-primary/20"
                                )}
                                asChild
                            >
                                <Link href={item.href}>
                                    <item.icon size={18} />
                                    {item.label}
                                </Link>
                            </Button>
                        );
                    }
                    if (item.type === 'dialog') {
                        return (
                            <Button
                                key={item.id}
                                variant="ghost"
                                className="w-full justify-start gap-3"
                                onClick={() => setShowInfo(true)}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Button>
                        );
                    }

                    if (item.id === 'ads-manager' && !canSeeAdsManager) {
                        return null;
                    }

                    // Special handling for Freelancer accordion
                    if (item.id === 'freelancer') {
                        if (!isFreelancerOrHigher) return null; // Hide if no permission

                        const isExpanded = currentView === 'freelancer'; // Auto-expand if active
                        // Use useSearchParams safely
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        const searchParams = useSearchParams();
                        const currentTab = searchParams?.get('tab') || 'explore';

                        return (
                            <div key={item.id} className="space-y-1">
                                <Button
                                    variant={currentView === item.id ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-between",
                                        currentView === item.id && "bg-primary/5 text-primary"
                                    )}
                                    onClick={() => router.push('?view=freelancer&tab=explore')}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={18} />
                                        <span>{item.label}</span>
                                    </div>
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </Button>

                                {isExpanded && (
                                    <div className="ml-9 border-l pl-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn("w-full justify-start h-8 text-xs font-normal", currentTab === 'explore' && "bg-muted font-medium text-primary")}
                                            onClick={() => router.push('?view=freelancer&tab=explore')}
                                        >
                                            Explorar Campañas
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn("w-full justify-start h-8 text-xs font-normal", currentTab === 'stats' && "bg-muted font-medium text-primary")}
                                            onClick={() => router.push('?view=freelancer&tab=stats')}
                                        >
                                            Mis Estadísticas
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn("w-full justify-start h-8 text-xs font-normal", currentTab === 'payments' && "bg-muted font-medium text-primary")}
                                            onClick={() => router.push('?view=freelancer&tab=payments')}
                                        >
                                            Pagos
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Button
                            key={item.id}
                            variant={currentView === item.id ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-3",
                                currentView === item.id && "bg-primary/10 text-primary hover:bg-primary/20",
                            )}
                            onClick={() => onViewChange(item.id)}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </Button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => logout()}
                >
                    <LogOut size={18} />
                    {t('auth.logout', 'Logout')}
                </Button>
            </div>
        </div>
    );
}
