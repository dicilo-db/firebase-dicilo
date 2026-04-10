'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { UserPlus } from 'lucide-react';

interface LatestUser {
    id: string;
    name: string;
    country: string;
}

export function SocialProofBanner() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { t } = useTranslation('common');

    const [usersList, setUsersList] = useState<LatestUser[]>([]);
    const [currentUserIndex, setCurrentUserIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    
    // Configuration
    const baseOffset = 500000;
    const [dynamicUserNumber, setDynamicUserNumber] = useState(baseOffset);

    useEffect(() => {
        // Fetch users once on mount
        fetch('/api/users/latest-activity')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.users && data.users.length > 0) {
                    setUsersList(data.users);
                    // Set an initial offset based on random
                    setDynamicUserNumber(baseOffset + Math.floor(Math.random() * 500));
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (usersList.length === 0) return;

        const showBanner = () => {
            // Select random user from the list
            const nextIndex = Math.floor(Math.random() * usersList.length);
            setCurrentUserIndex(nextIndex);
            
            // Increment the fake counter to show growth
            setDynamicUserNumber(prev => prev + Math.floor(Math.random() * 3) + 1);
            
            setVisible(true);

            // Hide after 6 seconds
            setTimeout(() => {
                setVisible(false);
            }, 6000);
        };

        // Initial delay before first show
        const initialTimeout = setTimeout(showBanner, 5000);

        // Then repeat every 35 seconds
        const interval = setInterval(showBanner, 35000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [usersList]);

    // Visibility Logic
    if (!pathname) return null;

    const isDashboardOrAdmin = pathname.includes('/dashboard') || pathname.includes('/admin') || pathname.includes('/login') || pathname.includes('/registrieren');
    const isHomePage = pathname === '/';
    const isCommunity = pathname === '/la-comunidad' || pathname === '/comunidad';

    // Rule: Hide in admin/dashboard areas
    if (isDashboardOrAdmin) return null;

    // Rule: If logged in, only show on home or community to avoid annoyance
    if (user && !isHomePage && !isCommunity) return null;

    if (!visible || usersList.length === 0) return null;

    const currentUser = usersList[currentUserIndex];

    return (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="bg-white dark:bg-slate-800 border-l-4 border-teal-500 p-4 shadow-xl rounded-r-xl rounded-bl-xl max-w-[320px] flex items-center gap-4">
                <div className="rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 h-10 w-10 shrink-0 flex items-center justify-center shadow-inner">
                    <UserPlus className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                        <span className="font-bold">{currentUser.name}</span> {t('social_proof.joined', 'se acaba de unir a Dicilo')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {t('social_proof.from', 'desde')} {currentUser.country} <span className="opacity-75">🚀</span>
                        </p>
                    </div>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-1.5 uppercase tracking-wider">
                        {t('social_proof.user_label', 'Usr')} #{dynamicUserNumber.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
