'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { CommunityView } from '@/components/dashboard/CommunityView';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

const auth = getAuth(app);

export default function PublicCommunityPage() {
    const { t } = useTranslation('apoyo_vzla');
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // While determining auth state, don't show the feed yet to avoid flashing a login layout
    // then immediately switching to logged out, or vice-versa.
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-purple-600"></div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 flex flex-col">
            <Header />
            <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* 
                  Render the Community View. 
                  If user is null, the view will adapt to readOnly mode.
                */}
                {/* Emergency Venezuela banner */}
                <Link href="/la-comunidad/apoyo-vzla" className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1A3C6E] p-4 text-white transition-opacity hover:opacity-90">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇻🇪</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{t('banner.badge')}</span>
                        <span className="text-xs font-semibold text-amber-300">{t('banner.date')}</span>
                      </div>
                      <p className="mt-0.5 text-sm font-bold text-white">{t('banner.cta')}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-amber-300">{t('banner.link')}</span>
                </Link>
                <CommunityView defaultNeighborhood="Hamburg" currentUser={user} />
            </main>
            <Footer />
        </div>
    );
}
