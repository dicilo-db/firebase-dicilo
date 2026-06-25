'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
    ChevronLeft, 
    User, 
    CreditCard, 
    Coins, 
    Settings, 
    Globe, 
    LifeBuoy, 
    HelpCircle, 
    Lock, 
    LogOut, 
    ChevronRight,
    Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from './NotificationBell';
import { LanguageSelector, languageOptions } from '../LanguageSelector';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FreelancerSidebar } from './freelancer/FreelancerSidebar';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

interface MobileHeaderProps {
    userData: any;
    currentView: string;
    onViewChange: (view: string) => void;
}

export function MobileHeader({ userData, currentView, onViewChange }: MobileHeaderProps) {
    const isFreelancerContext = currentView === 'freelancer';
    const { logout } = useAuth();
    const { t, i18n } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const [isFreelancerMenuOpen, setIsFreelancerMenuOpen] = useState(false);

    const role = (userData?.role || (userData?.isFreelancer ? 'freelancer' : 'user')).toLowerCase();

    const memberSinceDate = userData?.createdAt?.seconds
        ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString()
        : userData?.createdAt
            ? new Date(userData.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString();

    const navigateTo = (view: string) => {
        onViewChange(view);
        setIsOpen(false);
    };

    const handleLocaleChange = (newLocale: string) => {
        i18n.changeLanguage(newLocale);
        localStorage.setItem('dicilo_lang', newLocale);
        localStorage.setItem('i18nextLng', newLocale);
        
        const cookieString = "; path=/; max-age=31536000; SameSite=Lax";
        document.cookie = `dicilo_lang=${newLocale}${cookieString}`;
        document.cookie = `i18next=${newLocale}${cookieString}`;
    };

    const UserAvatar = () => (
        <Avatar className="h-9 w-9 border border-slate-200 cursor-pointer active:scale-95 transition-transform">
            <AvatarImage src={userData?.photoURL || userData?.photoUrl} />
            <AvatarFallback>{userData?.firstName?.[0] || 'U'}</AvatarFallback>
        </Avatar>
    );

    const MenuContent = () => (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header info */}
            <div className="p-5 bg-white border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-orange-200">
                        <AvatarImage src={userData?.photoURL || userData?.photoUrl} />
                        <AvatarFallback>{userData?.firstName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-extrabold text-sm text-slate-800 leading-tight">
                            {userData?.firstName} {userData?.lastName}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold truncate max-w-[170px]">
                            {userData?.email}
                        </p>
                    </div>
                </div>
                {/* Visual Integration of Notification Bell */}
                <NotificationBell />
            </div>

            {/* Scrollable menu details */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* User status & role */}
                <div className="mx-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider">{t('avatarMenu.role', 'Rol actual')}</span>
                        <Badge variant="secondary" className="bg-orange-50 text-orange-600 border border-orange-100 font-bold capitalize">
                            {t('roles.' + role, role)}
                        </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t pt-2">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider">{t('avatarMenu.accountStatus', 'Estado de cuenta')}</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {userData?.status || t('avatarMenu.active', 'Activo')}
                        </span>
                    </div>
                </div>

                {/* User metadata grid */}
                <div className="mx-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2 text-xs">
                    <h4 className="font-bold text-slate-700 mb-2">{t('avatarMenu.profileInfo', 'Información del usuario')}</h4>
                    
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-slate-400">{t('avatarMenu.country', 'País')}</span>
                        <span className="font-bold text-slate-700">{userData?.country || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-slate-400">{t('avatarMenu.language', 'Idioma seleccionado')}</span>
                        <span className="font-bold text-slate-700 capitalize">
                            {i18n.language === 'es' ? 'Español' : i18n.language === 'de' ? 'Deutsch' : 'English'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">{t('avatarMenu.memberSince', 'Fecha de registro')}</span>
                        <span className="font-bold text-slate-700">{memberSinceDate}</span>
                    </div>
                </div>

                {/* Action Items List */}
                <div className="mx-4 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-50">
                    <button 
                        onClick={() => navigateTo('settings')}
                        className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <User className="h-4.5 w-4.5 text-slate-400" />
                            <span>{t('avatarMenu.myProfile', 'Mi Perfil')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>

                    <button 
                        onClick={() => navigateTo('wallet')}
                        className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-4.5 w-4.5 text-slate-400" />
                            <span>{t('avatarMenu.myWallet', 'Mi Wallet')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>

                    <button 
                        onClick={() => navigateTo('dicicoin')}
                        className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Coins className="h-4.5 w-4.5 text-slate-400" />
                            <span>{t('avatarMenu.myDiciCoin', 'Mis DiciCoin')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>

                    <button 
                        onClick={() => navigateTo('settings')}
                        className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Settings className="h-4.5 w-4.5 text-slate-400" />
                            <span>{t('avatarMenu.settings', 'Configuración')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>

                    <button 
                        onClick={() => navigateTo('tickets')}
                        className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <LifeBuoy className="h-4.5 w-4.5 text-slate-400" />
                            <span>{t('avatarMenu.support', 'Soporte')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>

                    <button 
                        onClick={() => navigateTo('faqs')}
                        className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <HelpCircle className="h-4.5 w-4.5 text-slate-400" />
                            <span>{t('avatarMenu.helpCenter', 'Centro de Ayuda')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                </div>

                {/* Inline Language Selector */}
                <div className="mx-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {t('avatarMenu.languageOpt', 'Idioma')}
                    </p>
                    <div className="flex gap-2">
                        {languageOptions.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLocaleChange(lang.code)}
                                className={`flex items-center justify-center gap-1.5 flex-grow py-2 rounded-xl border text-xs font-bold transition-all ${
                                    i18n.language === lang.code
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {lang.flag}
                                <span>{lang.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Sign Out */}
            <div className="p-4 bg-white border-t">
                <Button 
                    variant="destructive" 
                    onClick={() => logout()}
                    className="w-full font-bold flex items-center justify-center gap-2 rounded-2xl py-6 shadow-sm shadow-red-100"
                >
                    <LogOut className="h-4.5 w-4.5" />
                    <span>{t('avatarMenu.logout', 'Cerrar Sesión')}</span>
                </Button>
            </div>
        </div>
    );

    return (
        <header className="relative flex h-16 w-full items-center justify-between border-b bg-white px-4 shrink-0 z-20 md:hidden">
            {isFreelancerContext ? (
                // Freelancer Context Header
                <>
                    {/* Left: Hamburger menu for freelancer navigation */}
                    <Sheet open={isFreelancerMenuOpen} onOpenChange={setIsFreelancerMenuOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-11 w-11 text-slate-700 hover:bg-slate-100 rounded-xl"
                                aria-label="Abrir menú Freelancer"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[280px] p-0 overflow-hidden" side="left">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Menú Freelancer</SheetTitle>
                            </SheetHeader>
                            <FreelancerSidebar
                                className="w-full h-full border-none"
                                onMobileClose={() => setIsFreelancerMenuOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>

                    <h1 className="text-base font-bold text-slate-900 absolute left-1/2 -translate-x-1/2">
                        Freelancer
                    </h1>

                    {/* Right: User avatar menu */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <div>
                                <UserAvatar />
                            </div>
                        </SheetTrigger>
                        <SheetContent className="w-[85vw] max-w-[360px] p-0 overflow-hidden" side="right">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Menú del Avatar</SheetTitle>
                            </SheetHeader>
                            <MenuContent />
                        </SheetContent>
                    </Sheet>
                </>
            ) : (
                // General Context Header
                <>
                    <div className="flex items-center">
                        <Image
                            src="/logo.png"
                            alt="Dicilo Logo"
                            width={110}
                            height={28}
                            className="h-7 w-auto object-contain"
                            priority
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <LanguageSelector 
                            variant="ghost" 
                            className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-11 w-11 flex items-center justify-center border-0 text-slate-600 dark:text-slate-300"
                        />
                        
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <div>
                                    <UserAvatar />
                                </div>
                            </SheetTrigger>
                            <SheetContent className="w-[85vw] max-w-[360px] p-0 overflow-hidden" side="right">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Menú del Avatar</SheetTitle>
                                </SheetHeader>
                                <MenuContent />
                            </SheetContent>
                        </Sheet>
                    </div>
                </>
            )}
        </header>
    );
}
