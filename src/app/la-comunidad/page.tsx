'use client';

import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { CommunityView } from '@/components/dashboard/CommunityView';
import { Header } from '@/components/header';
import Footer from '@/components/footer';

const auth = getAuth(app);

export default function PublicCommunityPage() {
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
                <CommunityView defaultNeighborhood="Hamburg" currentUser={user} />
            </main>
            <Footer />
        </div>
    );
}
