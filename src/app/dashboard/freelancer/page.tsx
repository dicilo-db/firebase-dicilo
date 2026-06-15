'use client';

import React from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { FreelancerPanel } from '@/components/dashboard/freelancer/FreelancerPanel';

export default function FreelancerPage() {
    const allowedRoles = React.useMemo<('admin' | 'superadmin' | 'team_office' | 'team_leader' | 'freelancer')[]>(() => 
        ['admin', 'superadmin', 'freelancer', 'team_leader', 'team_office'], 
    []);

    useAuthGuard(allowedRoles, 'freelancer_tool');

    return <FreelancerPanel />;
}
