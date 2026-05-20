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
        <div className="rounded-[2.5rem] border border-white/30 bg-white/40 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col min-h-[580px] md:h-[580px] relative transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            {/* Ambient lighting glows inside cards */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/10 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-300/10 rounded-full blur-[90px] pointer-events-none" />

            {/* Segmented Control Header with glassy effect */}
            <div className="relative z-10 px-6 pt-6 pb-3">
                <div className="flex overflow-x-auto bg-slate-900/5 backdrop-blur-md p-1.5 rounded-2xl scrollbar-none shadow-inner border border-white/60 snap-x snap-mandatory hide-scrollbar">
                    {tabs.map((tab) => {
                        const isActive = activeTabId === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-5 py-2.5 text-[14px] md:text-[15px] font-bold rounded-xl transition-all duration-300 min-w-max md:min-w-[150px] justify-center whitespace-nowrap relative flex-shrink-0 snap-start',
                                    isActive
                                        ? 'text-blue-700 shadow-md bg-white border border-gray-200/40 hover:scale-[1.01]'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                                )}
                            >
                                <span className={cn('transition-transform duration-300', isActive && 'scale-110')}>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area with sophisticated cards */}
            <div className="flex-1 px-6 pb-6 relative z-10 overflow-hidden">
                <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] border border-white/60 h-full shadow-[0_8px_32px_rgba(0,0,0,0.01)] p-2.5 relative overflow-hidden">
                    {activeTab && (
                        <div key={activeTab.id} className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                            
                            {activeTab.type === 'video' && (
                                <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-black shadow-lg relative border border-white/10">
                                    <iframe
                                        src={activeTab.content.replace('watch?v=', 'embed/')}
                                        className="w-full h-full"
                                        allowFullScreen
                                        title="Video Content"
                                    />
                                </div>
                            )}

                            {activeTab.type === 'image' && (
                                <div className="w-full h-full relative rounded-[1.5rem] overflow-hidden group shadow-md border border-white/10">
                                    <Image 
                                        src={activeTab.content} 
                                        alt={activeTab.label} 
                                        fill 
                                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                                </div>
                            )}

                            {activeTab.type === 'text' && (
                                <div className="prose max-w-none h-full overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                    <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                                        <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-100/50 shadow-sm">
                                            <FileText className="w-6 h-6 text-blue-600 animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-extrabold text-slate-800 m-0">{clientData.clientName}</h3>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Über uns</p>
                                        </div>
                                    </div>
                                    <div className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap font-medium font-sans">
                                        {activeTab.content}
                                    </div>
                                </div>
                            )}

                            {activeTab.type === 'html' && (
                                <div className="prose max-w-none h-full overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                    <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                                        <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-100/50 shadow-sm">
                                            <Info className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-extrabold text-slate-800 m-0">{activeTab.label}</h3>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Info</p>
                                        </div>
                                    </div>
                                    <div
                                        className="text-slate-600 text-lg leading-relaxed font-medium prose-p:mb-4 prose-headings:text-slate-800 prose-headings:font-extrabold prose-strong:text-slate-800 prose-ul:list-disc prose-li:mb-2 prose-a:text-blue-600 hover:prose-a:text-blue-800"
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
