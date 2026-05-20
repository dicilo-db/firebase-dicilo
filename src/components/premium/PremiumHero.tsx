'use client';

import React from 'react';
import Image from 'next/image';
import { ClientData } from '@/types/client';
import { cn } from '@/lib/utils';
import { MapPin, Star, ChevronDown, Award } from 'lucide-react';

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
        <div className="relative h-[75vh] md:h-[82vh] w-full overflow-hidden rounded-[2.5rem] shadow-[0_12px_50px_rgba(0,0,0,0.15)] group border border-white/10">
            {/* Language Switcher with Glass Design */}
            <div className="absolute top-6 right-6 z-50 transition-all duration-300 hover:scale-105">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full p-1 shadow-lg">
                    <LanguageSelector />
                </div>
            </div>
            
            {/* Background Image with Parallax effect */}
            <div className="absolute inset-0 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]">
                <Image
                    src={bgImage}
                    alt={clientData.clientName}
                    fill
                    className="object-cover"
                    priority
                />
            </div>
            
            {/* Sophisticated Layered Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

            {/* Main Content Area */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 pb-16 md:pb-24">
                <div className="flex flex-col md:flex-row md:items-end gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
                    
                    {/* Glassmorphism Logo Card with glowing border */}
                    {logo && (
                        <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-[2rem] overflow-hidden backdrop-blur-xl bg-white/15 border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex-shrink-0 z-10 p-2.5 transition-transform duration-500 hover:scale-[1.02]">
                            <div className="w-full h-full relative rounded-[1.5rem] overflow-hidden bg-white/95 flex items-center justify-center p-3 shadow-inner">
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
                    <div className="flex-1 space-y-4 text-left">
                        {/* Tags / Badges */}
                        <div className="flex flex-wrap gap-2.5 mb-1">
                            {clientData.verified !== false && (
                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-500/25 text-blue-100 border border-blue-400/35 backdrop-blur-md shadow-sm">
                                    <Star className="w-3.5 h-3.5 fill-blue-400 text-blue-400 animate-pulse" />
                                    Premium Partner
                                </span>
                            )}
                            {clientData.city && (
                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/25 backdrop-blur-md shadow-sm">
                                    <MapPin className="w-3.5 h-3.5 text-blue-300" />
                                    {clientData.city}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 backdrop-blur-md shadow-sm">
                                <Award className="w-3.5 h-3.5 text-emerald-300" />
                                Recomendado
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-md leading-none" style={{ fontFamily: 'var(--font-sans), sans-serif' }}>
                            {clientData.clientName}
                        </h1>
                        
                        {headerData?.welcomeText && (
                            <p className="text-lg md:text-xl text-slate-200 font-light max-w-3xl drop-shadow-sm leading-relaxed tracking-wide">
                                {headerData.welcomeText}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1 z-20 pointer-events-none opacity-80 animate-bounce">
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/50">Scroll</span>
                <ChevronDown className="w-5 h-5 text-white/70" />
            </div>

            {/* Decorative bottom fade to blend with page body */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none" />
        </div>
    );
};
