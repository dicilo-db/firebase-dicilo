'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardHomeView } from '@/components/dashboard/freelancer/views/DashboardHomeView';
import { MyCampaignsView } from '@/components/dashboard/freelancer/views/MyCampaignsView';
import { MarketingPlanView } from '@/components/dashboard/freelancer/views/MarketingPlanView';
import { AllCampaignsView } from '@/components/dashboard/freelancer/views/AllCampaignsView';
import { MyPostingsView } from '@/components/dashboard/freelancer/views/MyPostingsView';
import { StatisticsView } from '@/components/dashboard/freelancer/views/StatisticsView';
import { OnlineReviewsView } from '@/components/dashboard/freelancer/views/OnlineReviewsView';
import { ConnectionsView } from '@/components/dashboard/freelancer/views/ConnectionsView';
import { FaqsView } from '@/components/dashboard/freelancer/views/FaqsView';
import { PromoComposerView } from '@/components/dashboard/freelancer/views/PromoComposerView'; // "Templates/Composer"

// Mapping of tabs to components
const VIEWS: Record<string, React.ComponentType> = {
    'dashboard': DashboardHomeView,
    'my_campaigns': MyCampaignsView,
    'marketing_plan': MarketingPlanView,
    'all_campaigns': AllCampaignsView,
    'templates': PromoComposerView,
    'my_postings': MyPostingsView,
    'statistics': StatisticsView,
    'online_reviews': OnlineReviewsView,
    'connections': ConnectionsView,
    'faqs': FaqsView
};

export default function FreelancerPage() {
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'dashboard';

    const CurrentView = VIEWS[currentTab] || DashboardHomeView;

    return (
        <div className="h-full w-full">
            <CurrentView />
        </div>
    );
}
