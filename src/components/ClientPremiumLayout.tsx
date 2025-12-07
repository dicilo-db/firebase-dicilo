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

export default function ClientPremiumLayout({ clientData, ad }: { clientData: ClientData; ad?: any }) {
    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Module 1: Hero Section */}
            <div className="container mx-auto px-4 pt-4 mb-8">
                <PremiumHero clientData={clientData} />
            </div>

            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">

                    {/* Left Column (Content) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Module 2: Action Cards / Folder */}
                        <section id="gallery">
                            <PremiumActionCards clientData={clientData} />
                        </section>

                        {/* Module 3 & 4: Recommendation Form & Social */}
                        <section id="contact">
                            <PremiumRecommendationForm clientData={clientData} />
                        </section>
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="lg:col-span-1 space-y-8 sticky top-24">
                        {/* Module 5: Map & Info */}
                        <section id="location">
                            <PremiumSidebarMap clientData={clientData} />
                        </section>

                        {/* Module 6: Product List */}
                        <section id="products">
                            <PremiumProductList clientData={clientData} />
                        </section>

                        {/* Module 7: Reviews */}
                        <section id="reviews">
                            <PremiumReviews clientData={clientData} />
                        </section>

                        {/* Ad Placeholder (Optional) */}
                        {ad && (
                            <div className="rounded-xl overflow-hidden shadow-sm">
                                {/* Render ad component here if needed */}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Module 8: Client Logo Footer */}
            <div className="container mx-auto px-4">
                <PremiumFooterLogo clientData={clientData} />
            </div>
        </div>
    );
}
