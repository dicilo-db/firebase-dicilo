'use client';

import React from 'react';
import Image from 'next/image';
import { ClientData } from '@/types/client';
import { cn } from '@/lib/utils';

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

    return (
        <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden rounded-b-2xl md:rounded-2xl shadow-lg">
            {/* Language Switcher */}
            <div className="absolute top-4 right-4 z-50">
                <LanguageSelector />
            </div>
            <div className="absolute inset-0">
                <Image
                    src={bgImage}
                    alt={clientData.clientName}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl font-extrabold text-white md:text-6xl tracking-tight drop-shadow-md">
                        {clientData.clientName}
                    </h1>
                    {headerData?.welcomeText && (
                        <p className="mt-3 text-lg md:text-xl text-gray-200 font-light max-w-2xl drop-shadow-sm">
                            {headerData.welcomeText}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
