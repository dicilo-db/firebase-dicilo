
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { ExternalLink, Share2 } from 'lucide-react';
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
    rank?: number; // [NEW] Position in the list (0-indexed)
}

export const AdBanner = ({ ad, className, showBadge = true, rank }: AdBannerProps) => {
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
                        body: JSON.stringify({ adId: ad.id, rank }),
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
        try {
            fetch('/api/ads/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adId: ad.id,
                    clientId: ad.clientId,
                    path: pathname,
                    device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
                }),
            });
        } catch (error) {
            console.error('Ad click log error', error);
        }
    };

    // Share Handler
    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Log Share Event (counts as socialClick for stats)
        try {
            fetch('/api/analytics/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'socialClick',
                    businessId: ad.clientId || ad.id, // Use clientId if available, else adId
                    businessName: ad.title || 'Ad',
                    clickedElement: 'banner_share',
                    details: 'share_action',
                    isAd: true
                }),
            }).catch(console.error);
        } catch (err) { }

        // 2. Trigger Native Share
        if (navigator.share) {
            try {
                await navigator.share({
                    title: ad.title || 'Dicilo Ad',
                    text: ad.shareText || 'Check this out on Dicilo!',
                    url: ad.linkUrl || window.location.href,
                });
            } catch (err) {
                console.log('Share dismissed', err);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(ad.linkUrl || window.location.href);
                alert(t('ad.linkCopied', 'Link copied to clipboard!'));
            } catch (err) {
                console.error('Clipboard failed', err);
            }
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
                "group relative w-full overflow-hidden rounded-xl bg-black shadow-md transition-all hover:shadow-lg select-none",
                // Aspect ratio container for better display of background image
                "h-48",
                className
            )}
        >
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={ad.imageUrl || 'https://placehold.co/600x400.png'}
                    alt={ad.title || "Ad"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 flex h-full flex-col justify-between p-4 text-white">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-sm uppercase tracking-wider text-white/90 shadow-sm">
                            {t('ad.sponsored', 'Gesponsert')}
                        </h3>
                        <p className="mt-1 text-lg font-bold leading-tight shadow-sm text-white">
                            {ad.title || ad.shareText || "Partner"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {showBadge && (
                            <span className="shrink-0 rounded bg-yellow-400/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black shadow-sm backdrop-blur-sm">
                                {badgeText}
                            </span>
                        )}
                        <button
                            onClick={handleShare}
                            className="shrink-0 rounded-full bg-white/20 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-white/40 shadow-sm"
                            aria-label="Share"
                        >
                            <Share2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <a
                    href={ad.linkUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleClick}
                    className="mt-auto flex w-full items-center justify-between rounded-lg bg-white/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30"
                >
                    <span>{t('ad.visit', 'Webseite besuchen')}</span>
                    <ExternalLink className="h-4 w-4" />
                </a>
            </div>
        </div>
    );
};
