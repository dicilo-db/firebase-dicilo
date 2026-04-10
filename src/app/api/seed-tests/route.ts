import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

const TEST_ACCOUNTS = [
    {
        email: 'basico@dicilo.net',
        password: 'Basico_2026!**',
        plan: 'basic',
        name: 'Pruebas Empresa Básica'
    },
    {
        email: 'starter@dicilo.net',
        password: 'Starter_2026!**',
        plan: 'starter',
        name: 'Pruebas Empresa Starter'
    },
    {
        email: 'minorista@dicilo.net',
        password: 'Minorista_2026!**',
        plan: 'retailer',
        name: 'Pruebas Empresa Minorista'
    },
    {
        email: 'premium@dicilo.net',
        password: 'Premium_2026!**',
        plan: 'premium',
        name: 'Pruebas Empresa Premium'
    }
];

export async function POST() {
    try {
        const db = getAdminDb();
        const auth = getAdminAuth();
        const results = [];

        // Hacemos el proceso secuencialmente
        for (const account of TEST_ACCOUNTS) {
            let userRecord;
            try {
                // Check if user exists
                userRecord = await auth.getUserByEmail(account.email);
                await auth.updateUser(userRecord.uid, { password: account.password });
                console.log(`Updated auth for ${account.email}`);
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    // Create if not exists
                    userRecord = await auth.createUser({
                        email: account.email,
                        password: account.password,
                        displayName: account.name,
                    });
                    console.log(`Created auth for ${account.email}`);
                } else {
                    throw error;
                }
            }

            const uid = userRecord.uid;

            // 1. Create Private Profile
            await db.collection('private_profiles').doc(uid).set({
                email: account.email,
                firstName: account.name,
                lastName: 'Test',
                role: 'user', // base role, business access granted dynamically
                isTestAccount: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // 2. Create Business Document
            // First check if a test business for this uid already exists
            const existingBusQuery = await db.collection('businesses')
                .where('userId', '==', uid)
                .where('isTestAccount', '==', true)
                .limit(1).get();

            let businessId = '';
            let busRef;
            if (existingBusQuery.empty) {
                busRef = await db.collection('businesses').add({
                    name: account.name,
                    email: account.email,
                    userId: uid,
                    category: 'Test Category',
                    isTestAccount: true,
                    active: true,
                    dpBalance: 500, // 50 EUR en DP de regalo inicial falso
                    eurBalance: 120.50, // 120 EUR de comisiones falsas
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                businessId = busRef.id;
            } else {
                busRef = existingBusQuery.docs[0].ref;
                businessId = existingBusQuery.docs[0].id;
                // Just update balances to reset
                await busRef.update({
                    dpBalance: 500,
                    eurBalance: 120.50
                });
            }

            // 3. Create Client Document IF NOT BASIC
            if (account.plan !== 'basic') {
                const existingClientQuery = await db.collection('clients')
                    .where('businessId', '==', businessId)
                    .where('isTestAccount', '==', true)
                    .limit(1).get();

                if (existingClientQuery.empty) {
                    await db.collection('clients').add({
                        clientName: account.name,
                        email: account.email,
                        clientType: account.plan, // starter, retailer, premium
                        businessId: businessId,
                        isTestAccount: true,
                        active: true,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    await existingClientQuery.docs[0].ref.update({
                        clientType: account.plan // reset exactly to what it should be
                    });
                }
            }
            
            results.push(`Successfully seeded/updated: ${account.email} (${account.plan})`);
        }

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        console.error("SEEDING EXCEPTION:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
