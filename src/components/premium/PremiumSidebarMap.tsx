'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ClientData } from '@/types/client';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Globe, Navigation, Clock, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Dynamic import for Leaflet map to avoid window undefined errors in Next.js
const DiciloMap = dynamic(() => import('@/components/dicilo-map'), {
    ssr: false,
    loading: () => <div className="h-56 w-full bg-gray-100 animate-pulse" />,
});

interface PremiumSidebarMapProps {
    clientData: ClientData;
}

export const PremiumSidebarMap: React.FC<PremiumSidebarMapProps> = ({ clientData }) => {
    const { t } = useTranslation('client');

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

    const handleDirections = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`;
        window.open(url, '_blank');
    };

    return (
        <div className="rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            {/* Map Section */}
            <div className="h-64 w-full relative z-0">
                <DiciloMap
                    center={coords}
                    zoom={15}
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
                
                {/* Floating Map Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 to-transparent pointer-events-none z-[400]" />
            </div>
            
            <div className="p-8 space-y-6 relative bg-white/90 z-10 -mt-4 rounded-t-3xl backdrop-blur-sm shadow-[0_-4px_16px_rgb(0,0,0,0.02)]">
                
                {/* Address Row */}
                <div className="group bg-gray-50/80 p-4 rounded-2xl hover:bg-gray-100 transition-colors">
                    <div className="flex gap-4">
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex-shrink-0 group-hover:scale-105 transition-transform">
                            <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{t('sidebar.address', 'Company Location')}</h3>
                            <p className="text-gray-800 text-sm font-medium leading-relaxed">{clientData.address || 'No address provided'}</p>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-3">
                    {clientData.phone && (
                        <a href={`tel:${clientData.phone}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 group transition-colors border border-transparent hover:border-blue-100">
                            <div className="bg-gray-100 group-hover:bg-blue-100 p-2 rounded-lg transition-colors">
                                <Phone className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{clientData.phone}</span>
                        </a>
                    )}

                    {clientData.website && (
                        <a href={clientData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 group transition-colors border border-transparent hover:border-purple-100">
                            <div className="bg-gray-100 group-hover:bg-purple-100 p-2 rounded-lg transition-colors">
                                <Globe className="h-4 w-4 text-gray-600 group-hover:text-purple-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 truncate">{clientData.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                    )}
                </div>

                <div className="pt-2">
                    <Button 
                        onClick={handleDirections}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-14 font-semibold text-[15px] shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] gap-2"
                    >
                        <Navigation className="h-5 w-5" /> 
                        {t('actions.getDirections', 'Get Directions')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
