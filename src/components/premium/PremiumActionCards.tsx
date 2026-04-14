'use client';

import React, { useState } from 'react';
import { ClientData } from '@/types/client';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Play, ImageIcon, FileText, Globe, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PremiumActionCardsProps {
    clientData: ClientData;
}

interface CardTab {
    id: string;
    label: string;
    type: 'video' | 'image' | 'text' | 'link' | 'html';
    content: any;
    icon: React.ReactNode;
}

export const PremiumActionCards: React.FC<PremiumActionCardsProps> = ({ clientData }) => {
    const { t } = useTranslation('client');
    const tabs: CardTab[] = [];

    // --- PRIORITY 1: About Us ---
    if (clientData.bodyData?.description || clientData.bodyData?.subtitle) {
        tabs.push({
            id: 'about',
            label: t('tabs.about', 'About Us'),
            type: 'text',
            content: clientData.bodyData?.description || clientData.bodyData?.subtitle,
            icon: <FileText className="h-4 w-4" />,
        });
    }

    // --- PRIORITY 2: Video ---
    if (clientData.bodyData?.videoUrl) {
        tabs.push({
            id: 'video',
            label: t('tabs.video', 'Video'),
            type: 'video',
            content: clientData.bodyData.videoUrl,
            icon: <Play className="h-4 w-4" />,
        });
    }

    // --- PRIORITY 3: Featured (Banner) ---
    if (clientData.headerData?.bannerImageUrl) {
        tabs.push({
            id: 'banner',
            label: t('tabs.featured', 'Featured'),
            type: 'image',
            content: clientData.headerData.bannerImageUrl,
            icon: <ImageIcon className="h-4 w-4" />,
        });
    }

    // --- PRIORITY 4: Custom Info Cards ---
    if (clientData.infoCards && clientData.infoCards.length > 0) {
        clientData.infoCards.forEach((card, index) => {
            if (card.title && card.content && card.isActive !== false) {
                tabs.push({
                    id: `infocard-${index}`,
                    label: card.title,
                    type: 'html',
                    content: card.content,
                    icon: <Info className="h-4 w-4" />,
                });
            }
        });
    }

    // --- PRIORITY 5: Gallery (First Image) ---
    if (clientData.galleryImages && clientData.galleryImages.length > 0) {
        tabs.push({
            id: 'gallery',
            label: t('tabs.gallery', 'Gallery'),
            type: 'image',
            content: clientData.galleryImages[0],
            icon: <ImageIcon className="h-4 w-4" />
        })
    }

    const [activeTabId, setActiveTabId] = useState<string>(tabs[0]?.id || '');

    if (tabs.length === 0) return null;

    const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

    return (
        <div className="rounded-[2rem] border border-gray-100 bg-white/60 backdrop-blur-3xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[550px] relative">
            {/* Background Glows */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Segmented Control Header */}
            <div className="relative z-10 px-6 pt-6 pb-2">
                <div className="flex overflow-x-auto bg-gray-100/80 backdrop-blur-md p-1.5 rounded-2xl scrollbar-none shadow-inner border border-white/50">
                    {tabs.map((tab) => {
                        const isActive = activeTabId === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-5 py-2.5 text-[15px] font-semibold rounded-xl transition-all duration-300 min-w-[140px] justify-center whitespace-nowrap relative',
                                    isActive
                                        ? 'text-blue-700 shadow-sm bg-white border border-gray-200/50'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 hover:scale-[1.02]'
                                )}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 relative z-10 overflow-hidden">
                <div className="bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-white h-full shadow-[0_4px_24px_rgb(0,0,0,0.02)] p-2 relative overflow-hidden">
                    {activeTab && (
                        <div key={activeTab.id} className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                            
                            {activeTab.type === 'video' && (
                                <div className="w-full h-full rounded-[1.25rem] overflow-hidden bg-black/5 shadow-inner">
                                    <iframe
                                        src={activeTab.content.replace('watch?v=', 'embed/')}
                                        className="w-full h-full"
                                        allowFullScreen
                                        title="Video Content"
                                    />
                                </div>
                            )}

                            {activeTab.type === 'image' && (
                                <div className="w-full h-full relative rounded-[1.25rem] overflow-hidden group">
                                    <Image 
                                        src={activeTab.content} 
                                        alt={activeTab.label} 
                                        fill 
                                        className="object-cover transition-transform duration-1000 group-hover:scale-[1.03]" 
                                    />
                                </div>
                            )}

                            {activeTab.type === 'text' && (
                                <div className="prose max-w-none h-full overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-blue-50 p-3 rounded-2xl">
                                            <FileText className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <h3 className="text-3xl font-extrabold text-gray-900 m-0">{clientData.clientName}</h3>
                                    </div>
                                    <div className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                                        {activeTab.content}
                                    </div>
                                </div>
                            )}

                            {activeTab.type === 'html' && (
                                <div className="prose max-w-none h-full overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-purple-50 p-3 rounded-2xl">
                                            <Info className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <h3 className="text-3xl font-extrabold text-gray-900 m-0">{activeTab.label}</h3>
                                    </div>
                                    <div
                                        className="text-gray-600 text-lg leading-relaxed font-medium prose-p:mb-4 prose-headings:text-gray-800"
                                        dangerouslySetInnerHTML={{ __html: activeTab.content }}
                                    />
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
