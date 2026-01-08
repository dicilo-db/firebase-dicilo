'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Megaphone,
    Calendar,
    Globe,
    FileText,
    PieChart,
    Star,
    Link2,
    HelpCircle,
    ChevronRight,
    ChevronDown,
    LayoutTemplate,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FreelancerSidebarProps {
    className?: string;
    currentView?: string;
    onViewChange?: (view: string) => void;
    onMobileClose?: () => void;
}

export function FreelancerSidebar({ className, onViewChange, onMobileClose }: FreelancerSidebarProps) {
    const { t } = useTranslation('common');
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Helper to get current tab (default to 'dashboard')
    const currentTab = searchParams.get('tab') || 'dashboard';
    const selectedCampaignId = searchParams.get('campaignId');

    // Navigation Structure
    const navItems = [
        {
            id: 'dashboard',
            label: t('freelancer_menu.dashboard', 'Startseite'),
            icon: LayoutDashboard
        },
        {
            id: 'my_campaigns',
            label: t('freelancer_menu.my_campaigns', 'Meine Kampagnen'),
            icon: Megaphone
        },
        {
            id: 'marketing_plan',
            label: t('freelancer_menu.marketing_plan', 'Marketingplan'),
            icon: Calendar
        },
        {
            id: 'all_campaigns',
            label: t('freelancer_menu.all_campaigns', 'Campaign'),
            icon: Globe,
            children: [
                {
                    id: 'templates',
                    label: t('freelancer_menu.templates', 'Vorlagen'),
                    icon: LayoutTemplate,
                    needsCampaign: true
                }
            ]
        },
        {
            id: 'my_postings',
            label: t('freelancer_menu.my_postings', 'Meine Postings'),
            icon: FileText
        },
        {
            id: 'statistics',
            label: t('freelancer_menu.statistics', 'Meine Statistiken'),
            icon: PieChart
        },
        {
            id: 'online_reviews',
            label: t('freelancer_menu.online_reviews', 'Reseña Online'),
            icon: Star
        },
        {
            id: 'connections',
            label: t('freelancer_menu.connections', 'Conexiones'),
            icon: Link2
        },
        {
            id: 'faqs',
            label: t('freelancer_menu.faqs', 'FAQs'),
            icon: HelpCircle
        },
    ];

    const handleNavigation = (tabId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tabId);
        // If navigating to something else than campaigns/templates, maybe clear campaignId?
        if (tabId !== 'templates') {
            params.delete('campaignId');
        }
        router.push(`${pathname}?${params.toString()}`);
        if (onMobileClose) onMobileClose();
    };

    return (
        <div className={cn("pb-12 w-64 flex-shrink-0 bg-card border-r h-screen overflow-y-auto flex flex-col", className)}>



            <div className="space-y-4 py-4 flex-1">
                <div className="px-6 py-2">
                    <h2 className="text-lg font-bold tracking-tight mb-1">Freelancer</h2>
                    <p className="text-xs text-muted-foreground">{t('adsManager.dashboard.title', 'Herramientas de Campaña')}</p>
                </div>

                <div className="px-3 pb-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground hover:text-foreground mb-2"
                        onClick={() => window.location.href = '/dashboard'}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('dashboard.backToDashboard', 'Volver al Dashboard')}
                    </Button>
                </div>

                <div className="px-3 py-2">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = currentTab === item.id;
                            const hasChildren = item.children && item.children.length > 0;
                            const isExpanded = isActive || (item.id === 'all_campaigns' && !!selectedCampaignId);

                            return (
                                <div key={item.id} className="space-y-1">
                                    <button
                                        onClick={() => handleNavigation(item.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                            isActive ? "bg-accent text-accent-foreground" : "transparent"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <item.icon className="mr-2 h-4 w-4" />
                                            <span>{item.label}</span>
                                        </div>
                                        {hasChildren && (
                                            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                                        )}
                                    </button>

                                    {/* Children (Sub-menu) */}
                                    {hasChildren && isExpanded && (
                                        <div className="ml-4 pl-2 border-l border-muted space-y-1 animate-in slide-in-from-top-1 duration-200">
                                            {item.children?.map(child => {
                                                const isChildActive = currentTab === child.id;
                                                const isDisabled = child.needsCampaign && !selectedCampaignId;

                                                return (
                                                    <button
                                                        key={child.id}
                                                        disabled={isDisabled}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleNavigation(child.id);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                            isChildActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
                                                            isDisabled && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <child.icon className="mr-2 h-3.5 w-3.5" />
                                                        <span>{child.label}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

