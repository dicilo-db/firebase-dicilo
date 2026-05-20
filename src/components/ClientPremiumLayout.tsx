// src/components/ClientPremiumLayout.tsx
'use client';

import React from 'react';
import { ClientData } from '@/types/client';
import { PremiumHero } from './premium/PremiumHero';
import { PremiumActionCards } from './premium/PremiumActionCards';
import { PremiumRecommendationForm } from './premium/PremiumRecommendationForm';
import { PremiumSidebarMap } from './premium/PremiumSidebarMap';
import { PremiumProductList } from './premium/PremiumProductList';
import { PremiumReviews } from './premium/PremiumReviews';
import { PremiumFooterLogo } from './premium/PremiumFooterLogo';
import {
  DynamicTextBlock,
  DynamicGalleryBlock,
  DynamicAmenitiesBlock,
  DynamicVideoBlock,
} from './premium/PremiumBlocks';

export default function ClientPremiumLayout({ clientData, ad }: { clientData: ClientData; ad?: any }) {
  const hasCustomLayout = clientData.layout && Array.isArray(clientData.layout) && clientData.layout.length > 0;

  const renderBlock = (block: any) => {
    switch (block.type) {
      case 'hero':
        return (
          <PremiumHero
            clientData={clientData}
            title={block.content?.title}
            subtitle={block.content?.subtitle}
          />
        );
      case 'text':
        return <DynamicTextBlock text={block.content?.text} />;
      case 'gallery':
        return (
          <DynamicGalleryBlock
            images={clientData.galleryImages}
            clientName={clientData.clientName}
          />
        );
      case 'amenities':
        return <DynamicAmenitiesBlock items={block.content?.items} />;
      case 'video':
        return (
          <DynamicVideoBlock
            videoUrl={block.content?.videoUrl}
            fallbackUrl={clientData.videoUrl}
          />
        );
      case 'products':
        return <PremiumProductList clientData={clientData} />;
      case 'contact':
        return <PremiumRecommendationForm clientData={clientData} />;
      case 'map':
        return <PremiumSidebarMap clientData={clientData} />;
      case 'reviews':
        return <PremiumReviews clientData={clientData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden pb-12">
      {/* Ambient background glows for rich premium aesthetics */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50vh] rounded-full bg-purple-400/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-15%] w-[60%] h-[60vh] rounded-full bg-blue-400/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-[35%] left-[55%] w-[45%] h-[40vh] rounded-full bg-pink-400/5 blur-[110px] pointer-events-none" />
      <div className="absolute top-[80%] left-[-10%] w-[50%] h-[50vh] rounded-full bg-indigo-400/5 blur-[130px] pointer-events-none" />

      {hasCustomLayout ? (
        /* Dynamic Layout Mode (Page Builder) */
        <div className="max-w-5xl mx-auto px-4 pt-6 space-y-12 relative z-10">
          {clientData.layout!.map((block: any) => (
            <div key={block.id} className="transition-all duration-300">
              {renderBlock(block)}
            </div>
          ))}
        </div>
      ) : (
        /* Standard Fallback Layout Mode */
        <>
          {/* Module 1: Hero Section */}
          <div className="container mx-auto px-4 pt-6 mb-10 relative z-10">
            <PremiumHero clientData={clientData} />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
              {/* Left Column (Content) */}
              <div className="lg:col-span-2 space-y-10">
                {/* Module 2: Action Cards / Folder */}
                <section id="gallery" className="transition-all duration-300">
                  <PremiumActionCards clientData={clientData} />
                </section>

                {/* Module 3 & 4: Recommendation Form & Social */}
                <section id="contact" className="transition-all duration-300">
                  <PremiumRecommendationForm clientData={clientData} />
                </section>
              </div>

              {/* Right Column (Sidebar) */}
              <div className="lg:col-span-1 space-y-10 lg:sticky lg:top-24">
                {/* Module 5: Map & Info */}
                <section id="location" className="transition-all duration-300">
                  <PremiumSidebarMap clientData={clientData} />
                </section>

                {/* Module 6: Product List */}
                <section id="products" className="transition-all duration-300">
                  <PremiumProductList clientData={clientData} />
                </section>

                {/* Module 7: Reviews */}
                <section id="reviews" className="transition-all duration-300">
                  <PremiumReviews clientData={clientData} />
                </section>

                {/* Ad Placeholder (Optional) */}
                {ad && (
                  <div className="rounded-2xl overflow-hidden shadow-md border border-white/40 bg-white/20 backdrop-blur-sm p-1">
                    {/* Render ad component here if needed */}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Module 8: Client Logo Footer */}
      <div className="container mx-auto px-4 relative z-10 mt-12">
        <PremiumFooterLogo clientData={clientData} />
      </div>
    </div>
  );
}
