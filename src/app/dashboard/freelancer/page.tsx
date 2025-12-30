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

import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function FreelancerPage() {
    // Permission Check: Requires 'freelancer_tool' permission OR admin/superadmin/freelancer role
    // Note: We include 'freelancer' role in allowedRoles, but the 'freelancer_tool' permission 
    // is the specific gate if the role check doesn't auto-pass (depending on useAuthGuard impl).
    // Actually, useAuthGuard logic:
    // 1. If Superadmin -> Pass
    // 2. If has 'freelancer_tool' permission -> Pass
    // 3. If Role is in allowedRoles -> Pass (Wait, we want to RESTRICT this if they DON'T have permission?)
    // The current logic allows access if role matches allowedRoles OR permissions match.
    // If we want to *REQUIRE* the permission even for Freelancers (e.g. they need to activate it), then we should REMOVE 'freelancer' from allowedRoles list passed here?
    // No, standard `freelancer` role *should* have access.
    // The issue is likely users who have NO role but "Extra Permission: Freelancer Tool".
    // So:
    // - If Role=Freelancer -> Access Granted via role check.
    // - If Role=User + Permission='freelancer_tool' -> Access Granted via Permission Check.
    useAuthGuard(['admin', 'superadmin', 'freelancer', 'team_office'], 'freelancer_tool');

    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'dashboard';

    const CurrentView = VIEWS[currentTab] || DashboardHomeView;

    return (
        <div className="h-full w-full">
            <CurrentView />
        </div>
    );
}
