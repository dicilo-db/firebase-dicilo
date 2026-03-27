import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Briefcase } from 'lucide-react';
import { getFirestore, collection, getCountFromServer, query, where, or } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export function SuperAdminStatsGrid() {
    const [stats, setStats] = useState<{
        empresas: number | null,
        users: number | null,
        freelancers: number | null
    }>({ empresas: null, users: null, freelancers: null });

    useEffect(() => {
        const fetchStats = async () => {
            const db = getFirestore(app);
            
            try {
                // 1. Total Businesses
                const businessesCount = await getCountFromServer(collection(db, 'businesses'));
                
                // Additional: Consider recommended businesses from 'referrals_pioneers'
                // Depending on the exact definition of "empresas registradas y recomendadas"
                const referralsCount = await getCountFromServer(collection(db, 'referrals_pioneers'));
                
                const totalM1 = businessesCount.data().count + referralsCount.data().count;

                // 2. Total Registered Users
                const privateCount = await getCountFromServer(collection(db, 'private_profiles'));
                // Maybe clients too? Usually 'registrations' captures all. Let's rely on 'private_profiles' and 'clients'.
                const clientsCount = await getCountFromServer(collection(db, 'clients'));
                const totalM2 = privateCount.data().count + clientsCount.data().count;

                // 3. Total Freelancers
                const freelancerQuery = query(
                    collection(db, 'private_profiles'), 
                    or(
                        where('role', '==', 'freelancer'),
                        where('isFreelancer', '==', true),
                        where('role', '==', 'team_office')
                    )
                );
                const freelancerCount = await getCountFromServer(freelancerQuery);

                setStats({
                    empresas: totalM1,
                    users: totalM2,
                    freelancers: freelancerCount.data().count
                });
            } catch (error) {
                console.error("Error fetching SuperAdmin stats:", error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="grid gap-4 md:grid-cols-3 mt-4">
            <Card className="border-indigo-100 bg-indigo-50/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-indigo-900">M1. Empresas Registradas</CardTitle>
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
                    <CardTitle className="text-sm font-medium text-cyan-900">M2. Usuarios (Activos)</CardTitle>
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
                    <CardTitle className="text-sm font-medium text-emerald-900">M3. Freelancers</CardTitle>
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
