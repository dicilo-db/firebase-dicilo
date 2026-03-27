import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSuperAdminDashboardStats } from '@/app/actions/superadmin-stats';

export function SuperAdminStatsGrid() {
    const [stats, setStats] = useState<{
        empresas: number | null,
        users: number | null,
        freelancers: number | null
    }>({ empresas: null, users: null, freelancers: null });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await getSuperAdminDashboardStats();
                if (result.success) {
                    setStats({
                        empresas: result.empresas || 0,
                        users: result.users || 0,
                        freelancers: result.freelancers || 0
                    });
                } else {
                    console.error("SuperAdmin stats fetch failed:", result.error);
                    // Fallback to 0 if blocked by something so it doesn't stay skeleton forever
                    setStats({ empresas: 0, users: 0, freelancers: 0 });
                }
            } catch (error) {
                console.error("Error fetching SuperAdmin stats:", error);
                setStats({ empresas: 0, users: 0, freelancers: 0 });
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="grid gap-4 md:grid-cols-3 mt-4">
            <Card className="border-indigo-100 bg-indigo-50/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-indigo-900">Empresas Registradas</CardTitle>
                    <Building2 className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-indigo-950">
                        {stats.empresas !== null ? stats.empresas : <Skeleton className="h-8 w-16" />}
                    </div>
                    <p className="text-xs text-indigo-700/70 mt-1">Registros y recomendadas</p>
                </CardContent>
            </Card>

            <Card className="border-cyan-100 bg-cyan-50/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-cyan-900">Usuarios (Activos)</CardTitle>
                    <Users className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-cyan-950">
                        {stats.users !== null ? stats.users : <Skeleton className="h-8 w-16" />}
                    </div>
                    <p className="text-xs text-cyan-700/70 mt-1">En la plataforma</p>
                </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-emerald-50/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-900">Freelancers</CardTitle>
                    <Briefcase className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-950">
                        {stats.freelancers !== null ? stats.freelancers : <Skeleton className="h-8 w-16" />}
                    </div>
                    <p className="text-xs text-emerald-700/70 mt-1">Afiliados registrados</p>
                </CardContent>
            </Card>
        </div>
    );
}
