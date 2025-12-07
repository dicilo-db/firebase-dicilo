'use client';

import React, { useState } from 'react';
import { ClientData } from '@/types/client';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Play, ImageIcon, FileText, Globe } from 'lucide-react';

interface PremiumActionCardsProps {
    clientData: ClientData;
}

interface CardTab {
    id: string;
    label: string;
    type: 'video' | 'image' | 'text' | 'link';
    content: any;
    icon: React.ReactNode;
}

export const PremiumActionCards: React.FC<PremiumActionCardsProps> = ({ clientData }) => {
    // Construct tabs dynamically based on available data
    const tabs: CardTab[] = [];

    // 1. Video (Priority 1)
    if (clientData.bodyData?.videoUrl) {
        tabs.push({
            id: 'video',
            label: 'Video',
            type: 'video',
            content: clientData.bodyData.videoUrl,
            icon: <Play className="h-4 w-4" />,
        });
    }

    // 2. Banner/Hero Image (Priority 2)
    if (clientData.headerData?.bannerImageUrl) {
        tabs.push({
            id: 'banner',
            label: 'Featured',
            type: 'image',
            content: clientData.headerData.bannerImageUrl,
            icon: <ImageIcon className="h-4 w-4" />,
        });
    }

    // 3. About (Text)
    if (clientData.bodyData?.description || clientData.bodyData?.subtitle) {
        tabs.push({
            id: 'about',
            label: 'About Us',
            type: 'text',
            content: clientData.bodyData?.description || clientData.bodyData?.subtitle,
            icon: <FileText className="h-4 w-4" />,
        });
    }

    // 4. Gallery (Multiple Images) - simplified to just first few images for now or a specific tab
    if (clientData.galleryImages && clientData.galleryImages.length > 0) {
        tabs.push({
            id: 'gallery',
            label: 'Gallery',
            type: 'image',
            content: clientData.galleryImages[0], // Show first image as main, could be a grid
            icon: <ImageIcon className="h-4 w-4" />
        })
    }

    // 5. Website Link
    if (clientData.website) {
        tabs.push({
            id: 'website',
            label: 'Website',
            type: 'link',
            content: clientData.website,
            icon: <Globe className="h-4 w-4" />
        })
    }

    // Ensure between 2 and 7 cards (fill with placeholders if needed, but for now just show available)
    // If < 2, maybe force some defaults? For now let's trust data or show empty states.

    const [activeTabId, setActiveTabId] = useState<string>(tabs[0]?.id || '');

    if (tabs.length === 0) return null;

    const activeTab = tabs.find((t) => t.id === activeTabId);

    return (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
            {/* Folder Tabs Header */}
            <div className="flex overflow-x-auto bg-gray-50 border-b px-2 pt-2 scrollbar-none">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={cn(
                            'flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-xl transition-all mr-1 min-w-[120px] justify-center',
                            activeTabId === tab.id
                                ? 'bg-white text-primary border-t border-x border-b-0 shadow-sm relative top-[1px] z-10'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent'
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white p-6 relative overflow-hidden">
                {activeTab && (
                    <div
                        key={activeTab.id}
                        className="w-full h-full animate-in fade-in duration-500"
                    >
                        {activeTab.type === 'video' && (
                            <div className="w-full h-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                                {/* Simple iframe for standard video urls, ideally use a robust player */}
                                <iframe
                                    src={activeTab.content.replace('watch?v=', 'embed/')}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title="Video Content"
                                />
                            </div>
                        )}
                        {activeTab.type === 'image' && (
                            <div className="w-full h-full relative rounded-xl overflow-hidden">
                                <Image src={activeTab.content} alt={activeTab.label} fill className="object-cover" />
                            </div>
                        )}
                        {activeTab.type === 'text' && (
                            <div className="prose max-w-none h-full overflow-y-auto pr-4">
                                <h3 className="text-2xl font-bold mb-4 text-gray-800">{clientData.clientName}</h3>
                                <div className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                                    {activeTab.content}
                                </div>
                            </div>
                        )}
                        {activeTab.type === 'link' && (
                            <div className="flex items-center justify-center h-full flex-col gap-4">
                                <Globe className="h-16 w-16 text-gray-300" />
                                <a
                                    href={activeTab.content}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors font-medium shadow-md"
                                >
                                    Visit Website
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
