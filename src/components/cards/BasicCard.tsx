import React from 'react';
import Image from 'next/image';
import { ExternalLink, MapPin, Phone, Globe, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Business } from '@/components/dicilo-search-page';
import { useTranslation } from 'react-i18next';

interface BasicCardProps {
    business: Business;
    isSelected?: boolean;
    onClick: (business: Business) => void;
    locale: string;
}

export function BasicCard({ business, isSelected, onClick, locale }: BasicCardProps) {
    const { t } = useTranslation('common');

    return (
        <div
            onClick={() => onClick(business)}
            className={cn(
                'w-full cursor-pointer overflow-hidden rounded-xl bg-card p-4 shadow-md transition-all duration-200 border hover:shadow-lg',
                isSelected
                    ? 'border-2 border-primary ring-2 ring-primary/20'
                    : 'border-border'
            )}
        >
            <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 flex-shrink-0">
                    <Image
                        className="rounded-full border-2 border-green-100 object-cover bg-green-100 p-1"
                        src={business.imageUrl || 'https://placehold.co/64x64.png'}
                        alt={`${business.name} logo`}
                        fill
                        sizes="64px"
                        data-ai-hint={business.imageHint}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-lg">{business.name}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground mt-1">
                        {business.description_translations?.[locale as 'en' | 'es' | 'de'] || business.description}
                    </p>

                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        {/* Location & Address */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{business.location}</span>
                            </div>
                            {business.address && (
                                <div className="pl-5.5 text-xs text-muted-foreground ml-5">
                                    {business.address}
                                </div>
                            )}
                            {business.mapUrl && (
                                <a href={business.mapUrl} target="_blank" rel="noopener noreferrer" className="pl-5.5 ml-5 text-xs text-blue-500 hover:underline flex items-center gap-1">
                                    {t('mapPopup.googleMaps', 'Google Maps')} <ExternalLink className="h-3 w-3" />
                                </a>
                            )}
                        </div>

                        {/* Phone */}
                        {business.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{business.phone}</span>
                            </div>
                        )}

                        {/* Email - VISIBLE NOW */}
                        {business.email && (
                            <div className="flex items-center gap-2 text-foreground/80">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                <a href={`mailto:${business.email}`} onClick={e => e.stopPropagation()} className="hover:underline hover:text-primary truncate">
                                    {business.email}
                                </a>
                            </div>
                        )}

                        {/* Website */}
                        {business.website && (
                            <div className="flex items-center gap-2">
                                <Globe className="h-3.5 w-3.5 shrink-0" />
                                <a href={business.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:underline truncate">
                                    {new URL(business.website).hostname.replace('www.', '')}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {(business.clientSlug || business.currentOfferUrl) && (
                <div onClick={(e) => e.stopPropagation()} className="mt-3 border-t pt-2">
                    <a
                        href={
                            business.clientSlug
                                ? `/client/${business.clientSlug}`
                                : business.currentOfferUrl!
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                        {t('businessCard.currentOffer')}{' '}
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            )}
        </div>
    );
}
