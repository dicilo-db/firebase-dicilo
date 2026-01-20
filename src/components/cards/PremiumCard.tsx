import React from 'react';
import Image from 'next/image';
import { ExternalLink, MapPin, Phone, Globe, Mail, BadgeCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Business } from '@/components/dicilo-search-page';
import { useTranslation } from 'react-i18next';

interface PremiumCardProps {
    business: Business;
    isSelected?: boolean;
    onClick: (business: Business) => void;
    locale: string;
}

export function PremiumCard({ business, isSelected, onClick, locale }: PremiumCardProps) {
    const { t } = useTranslation('common');

    // Media Logic: Convert single imageUrl to array or use future media array
    // If we had a media array in business, we'd use it. For now, we mock/adapt.
    // Hypothetical: business.mediaItems = [{type: 'image', url: '...'}, {type: 'video', url: '...'}]
    // Fallback: Use business.imageUrl as first item.

    const mediaItems = [];
    if (business.imageUrl) {
        mediaItems.push({ type: 'image', url: business.imageUrl });
    }
    // If we had a second image/video field, push it here.
    // For demo/refactor purposes, if only 1 exists, we show 1 big slot or 1 slot. 
    // The requirement asks for a "grid de 2 espacios".
    // If only 1 media, we can make it full width or show a placeholder?
    // Let's assume for now valid data would populate this. 
    // If only 1, render 1. If 0, render placeholder.

    const renderMedia = (media: { type: string, url: string }, index: number) => {
        if (media.type === 'video') {
            return (
                <video
                    key={index}
                    controls
                    playsInline
                    className="h-48 w-full rounded-lg object-cover bg-black"
                    src={media.url}
                />
            );
        }
        return (
            <div key={index} className="relative h-48 w-full overflow-hidden rounded-lg bg-green-50">
                <Image
                    src={media.url}
                    alt={`${business.name} media ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                />
            </div>
        );
    };

    return (
        <div
            onClick={() => onClick(business)}
            className={cn(
                'w-full cursor-pointer overflow-hidden rounded-xl bg-card p-0 shadow-xl transition-all duration-300 border-2',
                // Premium Styles: Gold Border, Deeper Shadow
                isSelected
                    ? 'border-yellow-500 ring-4 ring-yellow-500/30'
                    : 'border-yellow-400 hover:border-yellow-500'
            )}
        >
            {/* Premium Header / Badge area */}
            <div className="bg-gradient-to-r from-yellow-50 to-white p-4 border-b border-yellow-100 flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-full border-2 border-yellow-400 overflow-hidden shadow-sm">
                        <Image
                            src={business.imageUrl || 'https://placehold.co/64x64.png'}
                            alt="Logo"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
                            {business.name}
                            <BadgeCheck className="h-5 w-5 text-blue-500 fill-blue-100" />
                        </h3>
                        <div className="flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full w-fit mt-1 border border-yellow-200">
                            <Star className="h-3 w-3 fill-yellow-600" />
                            <span>PREMIUM PARTNER</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                <p className="text-sm text-foreground/90 leading-relaxed">
                    {business.description_translations?.[locale as 'en' | 'es' | 'de'] || business.description}
                </p>

                {/* Multimedia Grid */}
                {mediaItems.length > 0 && (
                    <div className={cn("grid gap-3", mediaItems.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                        {mediaItems.map((item, idx) => renderMedia(item, idx))}
                    </div>
                )}

                {/* Contact Info (More stylized than Basic) */}
                <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground pt-2">
                    {/* Location & Address Block */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate font-medium text-foreground">{business.location}</span>
                        </div>
                        {business.address && (
                            <div className="pl-6 text-xs">
                                {business.address}
                            </div>
                        )}
                        {business.mapUrl && (
                            <a href={business.mapUrl} target="_blank" rel="noopener noreferrer" className="pl-6 text-xs text-blue-600 hover:underline flex items-center gap-1">
                                {t('mapPopup.googleMaps', 'Google Maps')} <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {(business.phone) && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary shrink-0" />
                                <span className="truncate">{business.phone}</span>
                            </div>
                        )}
                        {(business.email) && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-primary shrink-0" />
                                <a href={`mailto:${business.email}`} onClick={e => e.stopPropagation()} className="hover:text-foreground transition-colors truncate">
                                    {business.email}
                                </a>
                            </div>
                        )}
                    </div>

                    {(business.website) && (
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary shrink-0" />
                            <a href={business.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:text-foreground transition-colors truncate">
                                {new URL(business.website).hostname.replace('www.', '')}
                            </a>
                        </div>
                    )}
                </div>

                {/* CTA Footer */}
                {(business.clientSlug || business.currentOfferUrl) && (
                    <div className="pt-2">
                        <button className="w-full bg-primary/5 hover:bg-primary/10 text-primary font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                            {t('businessCard.currentOffer')}
                            <ExternalLink className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
