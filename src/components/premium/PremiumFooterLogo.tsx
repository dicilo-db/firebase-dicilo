'use client';

import React from 'react';
import Image from 'next/image';
import { ClientData } from '@/types/client';

interface PremiumFooterLogoProps {
    clientData: ClientData;
}

export const PremiumFooterLogo: React.FC<PremiumFooterLogoProps> = ({ clientData }) => {
    if (!clientData.clientLogoUrl) return null;

    return (
        <div className="w-full flex justify-end py-8 px-4 border-t mt-8 bg-gray-50">
            <div className="relative h-16 w-48 opacity-80 hover:opacity-100 transition-opacity">
                <Image
                    src={clientData.clientLogoUrl}
                    alt={`${clientData.clientName} Logo`}
                    fill
                    className="object-contain object-right"
                />
            </div>
        </div>
    );
};
