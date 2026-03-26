import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

const db = getFirestore(app);

export function NotificationBell() {
    const [hasNewEvents, setHasNewEvents] = useState(false);

    useEffect(() => {
        const checkRecentEvents = async () => {
            try {
                // Fetch recent active items globally.
                // If there's no composite index for active + createdAt DESC, 
                // we fetch all active and sort locally.
                const q = query(
                    collection(db, 'general_info'),
                    where('active', '==', true)
                );
                
                const snapshot = await getDocs(q);
                
                // Sort locally by createdAt desc
                const data = snapshot.docs.map(doc => doc.data());
                data.sort((a: any, b: any) => {
                    const timeA = a.createdAt?.toMillis() || 0;
                    const timeB = b.createdAt?.toMillis() || 0;
                    return timeB - timeA;
                });

                if (data.length > 0) {
                    const latestItem = data[0] as any;
                    // Check if created within the last 3 days (3 * 24 * 60 * 60 * 1000)
                    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
                    if (latestItem.createdAt && latestItem.createdAt.toMillis() > threeDaysAgo) {
                        setHasNewEvents(true);
                    }
                }

            } catch (error) {
                console.error("Error checking for new events:", error);
            }
        };

        checkRecentEvents();
    }, []);

    const scrollToInfo = () => {
        const section = document.getElementById('general-info-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={scrollToInfo} 
            className="relative rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Ver últimos eventos"
        >
            <Bell className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            {hasNewEvents && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}
        </Button>
    );
}
