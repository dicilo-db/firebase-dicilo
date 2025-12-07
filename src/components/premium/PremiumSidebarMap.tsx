'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ClientData } from '@/types/client';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Globe, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Dynamic import for Leaflet map to avoid window undefined errors in Next.js
const DiciloMap = dynamic(() => import('@/components/dicilo-map'), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-200 animate-pulse rounded-t-xl" />,
});

interface PremiumSidebarMapProps {
    clientData: ClientData;
}

export const PremiumSidebarMap: React.FC<PremiumSidebarMapProps> = ({ clientData }) => {
    const { t } = useTranslation('common');

    // Robust Coordinate Extraction
    const getCoords = (): [number, number] => {
        if (!clientData.coordinates) return [40.4168, -3.7038]; // Default Madrid
        const lat = (clientData.coordinates as any).lat || (clientData.coordinates as any).latitude;
        const lng = (clientData.coordinates as any).lng || (clientData.coordinates as any).longitude;

        if (typeof lat === 'number' && typeof lng === 'number') {
            return [lat, lng];
        }
        return [40.4168, -3.7038];
    };

    const coords = getCoords();

    return (
        <div className="rounded-2xl border bg-white shadow-lg overflow-hidden">
            {/* Module 5: Map + Address + Phone */}
            <div className="h-56 w-full relative z-0">
                <DiciloMap
                    center={coords}
                    zoom={14}
                    businesses={[
                        {
                            id: clientData.id,
                            name: clientData.clientName,
                            coords: coords,
                            address: clientData.address || 'Address not available',
                            category: 'Business',
                        },
                    ]}
                    t={t}
                />
            </div>
            <div className="p-6 space-y-4 relative bg-white z-10">
                <div>
                    <h3 className="text-lg font-bold mb-1">Company Address</h3>
                    <div className="flex items-start gap-2 text-gray-600 text-sm">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                        <p>{clientData.address || 'No address provided'}</p>
                    </div>
                </div>

                {clientData.phone && (
                    <div>
                        <h3 className="text-lg font-bold mb-1">Phone</h3>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${clientData.phone}`} className="hover:text-primary transition-colors">{clientData.phone}</a>
                        </div>
                    </div>
                )}

                {clientData.website && (
                    <div>
                        <h3 className="text-lg font-bold mb-1">Website</h3>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Globe className="h-4 w-4" />
                            <a href={clientData.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors truncate max-w-full block">
                                {clientData.website.replace(/^https?:\/\//, '')}
                            </a>
                        </div>
                    </div>
                )}

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 mt-2">
                    <Navigation className="h-4 w-4" /> Get Directions
                </Button>
            </div>
        </div>
    );
};
