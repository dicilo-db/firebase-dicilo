'use client';

import React from 'react';
import Image from 'next/image';
import { ClientData } from '@/types/client';
import { cn } from '@/lib/utils';
import { MapPin, Star } from 'lucide-react';

import { LanguageSelector } from '../LanguageSelector';

interface PremiumHeroProps {
    clientData: ClientData;
}

export const PremiumHero: React.FC<PremiumHeroProps> = ({ clientData }) => {
    const { headerData } = clientData;
    const bgImage =
        headerData?.headerBackgroundImageUrl ||
        headerData?.headerImageUrl ||
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80'; // Fallback

    const logo = clientData.clientLogoUrl;

    return (
        <div className="relative h-[75vh] md:h-[80vh] w-full overflow-hidden rounded-3xl shadow-2xl group">
            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-50">
                <LanguageSelector />
            </div>
            
            {/* Background Image with Parallax effect */}
            <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105">
                <Image
                    src={bgImage}
                    alt={clientData.clientName}
                    fill
                    className="object-cover"
                    priority
                />
            </div>
            
            {/* Sophisticated Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-900/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/70 via-transparent to-transparent" />

            {/* Main Content Area */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16">
                <div className="flex flex-col md:flex-row md:items-end gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    
                    {/* Glassmorphism Logo Card */}
                    {logo && (
                        <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex-shrink-0 z-10 p-2">
                            <div className="w-full h-full relative rounded-xl overflow-hidden bg-white/90">
                              <Image
                                  src={logo}
                                  alt={`${clientData.clientName} Logo`}
                                  fill
                                  className="object-contain p-4"
                              />
                            </div>
                        </div>
                    )}

                    {/* Text and Badges */}
                    <div className="flex-1 space-y-4">
                        {/* Tags / Badges */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {clientData.verified !== false && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-500/30 backdrop-blur-md">
                                    <Star className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
                                    Premium Partner
                                </span>
                            )}
                            {clientData.city && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-200 border border-white/20 backdrop-blur-md">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {clientData.city}
                                </span>
                            )}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg" style={{ fontFamily: 'var(--font-sans), sans-serif' }}>
                            {clientData.clientName}
                        </h1>
                        
                        {headerData?.welcomeText && (
                            <p className="text-xl md:text-2xl text-gray-300 font-light max-w-3xl drop-shadow-md leading-relaxed">
                                {headerData.welcomeText}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Decorative bottom fade to blend with page body */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
    );
};
