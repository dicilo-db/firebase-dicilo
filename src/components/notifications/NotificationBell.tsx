'use client';

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    onSnapshot,
    doc,
    updateDoc
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Notification } from '@/types/notifications';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function NotificationBell() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user?.uid) return;

        const db = getFirestore(app);
        const q = query(
            collection(db, 'notifications'),
            where('toUserId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs: Notification[] = [];
            let unread = 0;
            snapshot.forEach((doc) => {
                const data = doc.data() as Notification;
                notifs.push({ ...data, id: doc.id });
                if (!data.read) unread++;
            });
            setNotifications(notifs);
            setUnreadCount(unread);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const markAsRead = async (notificationId: string) => {
        const db = getFirestore(app);
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleNotificationClick = (notif: Notification) => {
        markAsRead(notif.id);
        if (notif.postId) {
            router.push(`/post/${notif.postId}`);
        } else if (notif.type === 'friend_request') {
            // Social panel is in /dashboard
            router.push('/dashboard');
        }
    };

    const markAllAsRead = async () => {
        const db = getFirestore(app);
        const unreadNotifs = notifications.filter(n => !n.read);
        try {
            await Promise.all(unreadNotifs.map(n => 
                updateDoc(doc(db, 'notifications', n.id), { read: true })
            ));
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">{t('community.notifications', 'Notificaciones')}</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-auto p-0 text-primary hover:bg-transparent" onClick={markAllAsRead}>
                            {t('community.mark_all_read', 'Marcar todo como leído')}
                        </Button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            {t('community.no_notifications', 'No tienes notificaciones por ahora.')}
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <DropdownMenuItem 
                                key={notif.id} 
                                className={cn(
                                    "flex items-start gap-3 p-4 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-900 border-b last:border-0",
                                    !notif.read && "bg-blue-50/50 dark:bg-blue-900/10"
                                )}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <Avatar className="h-10 w-10 mt-0.5">
                                    <AvatarImage src={notif.fromUserAvatar} alt={notif.fromUserName} />
                                    <AvatarFallback>{notif.fromUserName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm leading-tight text-slate-900 dark:text-white">
                                        <span className="font-bold">{notif.fromUserName}</span> 
                                        {' '}
                                        {notif.type === 'new_post' && (
                                            notif.neighborhood 
                                                ? t('community.notif_new_post', { neighborhood: notif.neighborhood })
                                                : t('community.notif_new_post_generic')
                                        )}
                                        {notif.type === 'friend_request' && (
                                            t('community.notif_friend_request', 'te ha enviado una solicitud de amistad.')
                                        )}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {notif.createdAt?.toDate 
                                            ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: es }) 
                                            : t('community.just_now', 'Hace un momento')}
                                    </p>
                                </div>
                                {!notif.read && (
                                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                                )}
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
                {notifications.length > 0 && (
                    <div className="p-2 border-t text-center">
                        <p className="text-[10px] text-muted-foreground">
                            {t('community.showing_recent', 'Mostrando últimas 10 actualizaciones')}
                        </p>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
