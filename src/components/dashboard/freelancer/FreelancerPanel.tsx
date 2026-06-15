'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardHomeView } from './views/DashboardHomeView';
import { MyCampaignsView } from './views/MyCampaignsView';
import { MarketingPlanView } from './views/MarketingPlanView';
import { AllCampaignsView } from './views/AllCampaignsView';
import { MyPostingsView } from './views/MyPostingsView';
import { StatisticsView } from './views/StatisticsView';
import { OnlineReviewsView } from './views/OnlineReviewsView';
import { ConnectionsView } from './views/ConnectionsView';
import { PromoComposerView } from './views/PromoComposerView'; // "Templates/Composer"
import { MarketingTemplatesView } from './views/MarketingTemplatesView';
import { RecommendCompanyView } from './views/RecommendCompanyView';
import { P2RecordsView } from './views/P2RecordsView';
import { AcademiaView } from './views/AcademiaView';

// Mapping of tabs to components
const VIEWS: Record<string, React.ComponentType> = {
    'dashboard': DashboardHomeView,
    'my_campaigns': MyCampaignsView,
    'marketing_plan': MarketingPlanView,
    'all_campaigns': AllCampaignsView,
    'templates': PromoComposerView,
    'marketing_templates': MarketingTemplatesView,
    'my_postings': MyPostingsView,
    'statistics': StatisticsView,
    'online_reviews': OnlineReviewsView,
    'connections': ConnectionsView,
    'recommend_company': RecommendCompanyView,
    'p2_records': P2RecordsView,
    'academia': AcademiaView
};

export function FreelancerPanel() {
    const searchParams = useSearchParams();
    const currentTab = searchParams?.get('tab') || 'dashboard';

    const CurrentView = VIEWS[currentTab] || DashboardHomeView;

    return (
        <div className="h-full w-full">
            <CurrentView />
        </div>
    );
}
