'use client';

import React from 'react';
import Image from 'next/image';
import { ClientData } from '@/types/client';
import { cn } from '@/lib/utils';
import { MapPin, Star, Share2, Heart, Check, Wifi, Car, Coffee } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import { AdBanner } from '@/components/AdBanner';

const DiciloMap = dynamic(() => import('./dicilo-map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse" />
});

interface LayoutBlock {
    id: string;
    type: 'hero' | 'text' | 'products' | 'contact' | 'gallery' | 'map' | 'video' | 'reviews' | 'amenities';
    content: any;
}

const PremiumHero = ({ clientData }: { clientData: ClientData }) => {
    const { headerData } = clientData;
    const bgImage = headerData?.headerBackgroundImageUrl || headerData?.headerImageUrl;

    return (
        <div className="relative h-[400px] w-full overflow-hidden rounded-xl md:h-[500px]">
            {bgImage ? (
                <Image
                    src={bgImage}
                    alt={clientData.clientName}
                    fill
                    className="object-cover"
                    priority
                />
            ) : (
                <div className="h-full w-full bg-gray-200" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white md:p-10">
                <h1 className="text-3xl font-bold md:text-5xl">{clientData.clientName}</h1>
                {headerData?.welcomeText && (
                    <p className="mt-2 text-lg opacity-90">{headerData.welcomeText}</p>
                )}
                <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">4.8</span>
                        <span className="text-sm opacity-80">(120 Reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">Madrid, Spain</span>
                    </div>
                </div>
            </div>
            <div className="absolute right-6 top-6 flex gap-2">
                <Button variant="secondary" size="icon" className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white">
                    <Share2 className="h-5 w-5 text-gray-700" />
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white">
                    <Heart className="h-5 w-5 text-gray-700" />
                </Button>
            </div>
        </div>
    );
};

const PremiumGallery = ({ images }: { images: string[] }) => {
    if (!images || images.length === 0) return null;

    // Trip.com style: 1 large on left, 4 small on right grid
    return (
        <div className="grid h-[400px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl">
            <div className="col-span-2 row-span-2 relative">
                <Image src={images[0]} alt="Gallery 1" fill className="object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            {images.slice(1, 5).map((img, idx) => (
                <div key={idx} className="relative col-span-1 row-span-1">
                    <Image src={img} alt={`Gallery ${idx + 2}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                </div>
            ))}
        </div>
    );
};

const AmenitiesBlock = ({ items }: { items: string }) => {
    const list = items?.split(',').map(i => i.trim()) || ['Wifi', 'Parking', 'Air Conditioning', 'Pool'];

    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold">Amenities & Features</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {list.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StickySidebar = ({ clientData, ad }: { clientData: ClientData; ad?: any }) => {
    const { t } = useTranslation('common');

    // Use client coordinates or fallback to Madrid (Robust check for lat/lng or latitude/longitude)
    const getCoords = (): [number, number] => {
        if (!clientData.coordinates) return [40.4168, -3.7038];
        // Handle both simple object structure and Firestore GeoPoint structure
        const lat = (clientData.coordinates as any).lat || (clientData.coordinates as any).latitude;
        const lng = (clientData.coordinates as any).lng || (clientData.coordinates as any).longitude;

        if (typeof lat === 'number' && typeof lng === 'number') {
            return [lat, lng];
        }
        return [40.4168, -3.7038];
    };

    const coords = getCoords();

    return (
        <div className="sticky top-24 space-y-6">
            {ad && (
                <div className="mb-6">
                    <AdBanner ad={ad} />
                </div>
            )}
            <div className="overflow-hidden rounded-xl border bg-white shadow-lg">
                <div className="h-48 w-full relative">
                    <DiciloMap
                        center={coords}
                        zoom={13}
                        businesses={[{
                            id: clientData.id,
                            name: clientData.clientName,
                            coords: coords,
                            address: clientData.address || "Address not available",
                            category: "Business"
                        }]}
                        t={t}
                    />
                </div>
                <div className="p-6">
                    <h3 className="mb-2 text-lg font-bold">Location</h3>
                    <p className="mb-4 text-sm text-gray-600">{clientData.address || "Address not available"}</p>
                    {clientData.phone && <p className="mb-2 text-sm text-gray-600">📞 {clientData.phone}</p>}
                    {clientData.website && (
                        <a href={clientData.website} target="_blank" rel="noopener noreferrer" className="mb-4 block text-sm text-blue-600 hover:underline">
                            🌐 Visit Website
                        </a>
                    )}
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Get Directions</Button>
                </div>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-bold">Book Now</h3>
                <p className="mb-4 text-sm text-gray-600">Best prices guaranteed for this location.</p>
                <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">Check Availability</Button>
            </div>
        </div>
    );
};

const VideoBlock = ({ url }: { url: string }) => {
    if (!url) return null;
    // Simple embed logic for YouTube
    const videoId = url.includes('v=') ? url.split('v=')[1] : url.split('/').pop();
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    return (
        <div className="rounded-xl overflow-hidden shadow-sm border bg-black aspect-video">
            <iframe
                width="100%"
                height="100%"
                src={embedUrl}
                title="Video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        </div>
    )
}

export default function ClientPremiumLayout({ clientData, ad }: { clientData: ClientData; ad?: any }) {
    // Use layout from data or default structure
    const layout: LayoutBlock[] = (clientData as any).layout || [
        { id: '1', type: 'hero', content: {} },
        { id: '2', type: 'amenities', content: { items: 'Free Wifi, Parking, Restaurant, Bar, 24h Service' } },
        { id: '3', type: 'text', content: { text: clientData.bodyData?.body1Text || 'Welcome to our premium establishment.' } },
        { id: '4', type: 'reviews', content: {} }
    ];

    // Helper to get images for gallery
    const galleryImages = (clientData as any).galleryImages?.length > 0
        ? (clientData as any).galleryImages
        : [
            clientData.headerData?.headerImageUrl,
            clientData.headerData?.headerBackgroundImageUrl,
            clientData.headerData?.bannerImageUrl,
            // Add placeholders if not enough images
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
            'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80'
        ].filter(Boolean) as string[];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Navigation Bar (could be sticky) */}
            <nav className="sticky top-0 z-50 border-b bg-white/80 px-4 py-4 backdrop-blur-md">
                <div className="container mx-auto flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">{clientData.clientName}</span>
                    <div className="hidden gap-6 text-sm font-medium text-gray-600 md:flex">
                        <a href="#overview" className="hover:text-primary">Overview</a>
                        <a href="#amenities" className="hover:text-primary">Amenities</a>
                        <a href="#reviews" className="hover:text-primary">Reviews</a>
                        <a href="#location" className="hover:text-primary">Location</a>
                    </div>
                    <Button size="sm">Book Now</Button>
                </div>
            </nav>

            <div className="container mx-auto mt-6 px-4">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Main Content (Left Column) */}
                    <div className="lg:col-span-2 space-y-8">
                        {layout.map((block) => {
                            switch (block.type) {
                                case 'hero':
                                    // If we have a gallery block, maybe hero is different? 
                                    // For now, Hero is the main banner.
                                    return <PremiumHero key={block.id} clientData={clientData} />;

                                case 'gallery':
                                    return <PremiumGallery key={block.id} images={galleryImages} />;

                                case 'text':
                                    return (
                                        <div key={block.id} className="rounded-xl border bg-white p-6 shadow-sm">
                                            <h3 className="mb-4 text-xl font-bold">About Us</h3>
                                            <div className="prose max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: block.content.text || '' }} />
                                        </div>
                                    );

                                case 'amenities':
                                    return <AmenitiesBlock key={block.id} items={block.content.items} />;

                                case 'video':
                                    return <VideoBlock key={block.id} url={block.content.videoUrl} />;

                                case 'reviews':
                                    return (
                                        <div key={block.id} className="rounded-xl border bg-white p-6 shadow-sm" id="reviews">
                                            <h3 className="mb-4 text-xl font-bold">Guest Reviews</h3>
                                            <div className="space-y-4">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="border-b pb-4 last:border-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="h-8 w-8 rounded-full bg-gray-200" />
                                                            <div>
                                                                <p className="text-sm font-bold">User {i}</p>
                                                                <div className="flex text-yellow-400"><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /></div>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-600">Great place! Highly recommended.</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );

                                default:
                                    return null;
                            }
                        })}
                    </div>

                    {/* Sidebar (Right Column) */}
                    <div className="lg:col-span-1">
                        <StickySidebar clientData={clientData} ad={ad} />
                    </div>
                </div>
            </div>
        </div>
    );
}
