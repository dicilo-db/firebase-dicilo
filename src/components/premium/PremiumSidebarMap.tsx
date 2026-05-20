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
        <div className="rounded-[2.5rem] border border-white/30 bg-white/40 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:scale-[1.01]">
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
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/95 to-transparent pointer-events-none z-[400]" />
            </div>
            
            <div className="p-8 space-y-6 relative bg-white/85 z-10 -mt-4 rounded-t-[2rem] backdrop-blur-md shadow-[0_-8px_32px_rgba(0,0,0,0.01)] border-t border-white/50">
                
                {/* Address Row */}
                <div className="group bg-white/95 p-4.5 rounded-2xl hover:bg-white border border-white/80 hover:border-blue-100 hover:shadow-md transition-all duration-300">
                    <div className="flex gap-4">
                        <div className="bg-blue-50/80 p-2.5 rounded-xl shadow-sm border border-blue-100/30 flex-shrink-0 group-hover:scale-105 group-hover:bg-blue-100/50 transition-all duration-300">
                            <MapPin className="h-5 w-5 text-blue-600 animate-bounce" style={{ animationDuration: '3s' }} />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('sidebar.address', 'Company Location')}</h3>
                            <p className="text-slate-700 text-sm font-semibold leading-relaxed">{clientData.address || 'No address provided'}</p>
                        </div>
                    </div>
                </div>
 
                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-3">
                    {clientData.phone && (
                        <a href={`tel:${clientData.phone}`} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/60 hover:bg-white group transition-all duration-300 border border-white/80 hover:border-blue-100 hover:shadow-sm">
                            <div className="bg-slate-100/80 group-hover:bg-blue-50 p-2 rounded-lg transition-colors border border-transparent group-hover:border-blue-100/30">
                                <Phone className="h-4 w-4 text-slate-500 group-hover:text-blue-600" />
                            </div>
                            <span className="text-sm font-bold text-slate-600 group-hover:text-blue-700 transition-colors">{clientData.phone}</span>
                        </a>
                    )}
 
                    {clientData.website && (
                        <a href={clientData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 rounded-xl bg-white/60 hover:bg-white group transition-all duration-300 border border-white/80 hover:border-purple-100 hover:shadow-sm">
                            <div className="bg-slate-100/80 group-hover:bg-purple-50 p-2 rounded-lg transition-colors border border-transparent group-hover:border-purple-100/30">
                                <Globe className="h-4 w-4 text-slate-500 group-hover:text-purple-600" />
                            </div>
                            <span className="text-sm font-bold text-slate-600 group-hover:text-purple-700 transition-colors truncate">{clientData.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                    )}
                </div>
 
                <div className="pt-2">
                    <Button 
                        onClick={handleDirections}
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 text-white rounded-2xl h-14 font-extrabold text-[15px] shadow-[0_8px_30px_rgba(99,102,241,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] gap-2 border border-indigo-500/20"
                    >
                        <Navigation className="h-5 w-5 animate-pulse" /> 
                        {t('actions.getDirections', 'Get Directions')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
