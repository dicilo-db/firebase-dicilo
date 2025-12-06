
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export interface Ad {
    id: string;
    clientId?: string;
    imageUrl: string;
    linkUrl: string;
    title?: string;
    shareText?: string;
    [key: string]: any;
}

interface AdBannerProps {
    ad: Ad;
    className?: string;
    showBadge?: boolean;
}

export const AdBanner = ({ ad, className, showBadge = true }: AdBannerProps) => {
    const { t, i18n } = useTranslation('common');
    const locale = i18n.language;
    const pathname = usePathname();
    const [hasViewed, setHasViewed] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // View Logging (Intersection Observer)
    useEffect(() => {
        if (hasViewed || !cardRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setHasViewed(true);
                    // Fire and forget view logging (No charge, just stats)
                    fetch('/api/ads/view', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ adId: ad.id }),
                    }).catch((err) => console.error('Ad view log error', err));
                    observer.disconnect();
                }
            },
            { threshold: 0.5 } // 50% visible to count
        );

        observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [hasViewed, ad.id]);

    // Click Logging
    const handleClick = async (e: React.MouseEvent) => {
        // Allow default behavior (opening link) but log first if possible without blocking too much.
        // Or we can prevent default, log, then open.
        // Ideally we want to ensure the cost is charged.

        // We will not prevent default to keep UX fast, but we fire the request.
        // If the browser navigates away immediately (same tab), request might be cancelled.
        // For `target="_blank"`, it's usually fine.

        try {
            fetch('/api/ads/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adId: ad.id,
                    clientId: ad.clientId, // Optional, API resolves it if missing
                    path: pathname,
                    device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
                }),
            });
        } catch (error) {
            console.error('Ad click log error', error);
        }
    };

    const badgeText = useMemo(() => {
        const lang = locale?.split('-')[0] || 'de';
        if (lang === 'de') return 'Werbung';
        if (lang === 'en') return 'Advertising';
        return 'Publicidad';
    }, [locale]);

    return (
        <div
            ref={cardRef}
            onClick={(e) => e.stopPropagation()}
            className={cn(
                "w-full overflow-hidden rounded-xl bg-card p-4 shadow-md border border-yellow-200/50 relative group select-none transition-all hover:shadow-lg",
                className
            )}
        >
            {showBadge && (
                <div className="absolute top-2 right-2 z-10">
                    <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-200 uppercase tracking-wide">
                        {badgeText}
                    </span>
                </div>
            )}

            <div className="flex items-start gap-4">
                <Image
                    className="h-16 w-16 rounded-full border-2 border-yellow-100 object-cover bg-yellow-50 p-1"
                    src={ad.imageUrl || 'https://placehold.co/64x64.png'}
                    alt={ad.title || "Ad"}
                    width={64}
                    height={64}
                />
                <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-foreground">
                        {/* Uses translation if available, or fallback */}
                        {t('ad.sponsored', 'Gesponsert')}
                    </h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {ad.shareText || ad.title || t('ad.visitDescription', 'Besuchen Sie unsere Website für mehr Informationen.')}
                    </p>
                </div>
            </div>

            <a
                href={ad.linkUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="mt-3 flex items-center justify-between w-full rounded-md bg-secondary/50 px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary transition-colors"
            >
                <span>{t('ad.visit', 'Webseite besuchen')}</span>
                <ExternalLink className="h-4 w-4" />
            </a>
        </div>
    );
};
