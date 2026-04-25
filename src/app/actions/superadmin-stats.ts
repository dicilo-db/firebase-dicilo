'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export async function getSuperAdminDashboardStats() {
    try {
        const db = getAdminDb();

        // 1. Empresas registradas (Recomendaciones + Marketing Campaigns + Base de Datos Principal)
        const [recommendationsSnap, marketingSnap, businessesSnap] = await Promise.all([
            db.collection('recommendations').count().get(),
            db.collection('referrals_pioneers').count().get(),
            db.collection('businesses').count().get()
        ]);
        const totalEmpresas = recommendationsSnap.data().count + marketingSnap.data().count + businessesSnap.data().count;

        // 2 & 3. Usuarios activos y Freelancers
        const allProfilesSnap = await db.collection('private_profiles').select('role').get();
        let usersCount = 0;
        let freelancersCount = 0;
        
        allProfilesSnap.forEach((doc) => {
            const data = doc.data();
            const role = data.role || 'user'; // Si no tiene rol definido, es un usuario base
            
            if (role === 'freelancer') {
                freelancersCount++;
            } else if (role === 'user') {
                usersCount++;
            }
            // staff (team_office), admins y superadmins NO se contabilizan en estas métricas de usuarios públicos
        });

        // Verificación extra en consola de admin para depurar discrepancias
        console.log(`[SuperAdmin Stats] Analizados: Empresas(Recomendaciones+Mkt)=${totalEmpresas}, Usuarios(Puros)=${usersCount}, Freelancers=${freelancersCount}`);

        return {
            success: true,
            empresas: totalEmpresas,
            users: usersCount,
            freelancers: freelancersCount
        };
    } catch (error: any) {
        console.error('Error fetching SuperAdmin stats from server:', error);
        return { success: false, error: error.message };
    }
}
