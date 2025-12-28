'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { verifyMasterPassword } from './wallet';

/**
 * Audit Retroactive Points (Script de Reconocimiento Retroactivo)
 * 
 * Inputs: email_freelancer, codigo_unico_freelancer, masterPass
 * Logic:
 * 1. Find freelancer by email and uniqueCode in 'private_profiles'.
 * 2. Count recommendations (prospects) where userId == freelancer.uid AND pointsPaid is missing/false.
 * 3. Calculate total = count * 10.
 * 4. Update wallet (balance + total).
 * 5. Add transaction record (RETROACTIVE_BONUS).
 * 6. Mark recommendations as pointsPaid = true.
 */
export async function auditRetroactivePoints(email: string, uniqueCode: string, masterPass: string) {
    const isValid = await verifyMasterPassword(masterPass);
    if (!isValid) {
        return { success: false, message: 'Invalid Master Password' };
    }

    const db = getAdminDb();

    try {
        // 1. Find Freelancer
        const profilesSnap = await db.collection('private_profiles')
            .where('email', '==', email)
            .get();

        let freelancerDoc = null;

        if (!profilesSnap.empty) {
            const found = profilesSnap.docs.find(d => d.data().uniqueCode === uniqueCode);
            if (found) freelancerDoc = found;
        }

        if (!freelancerDoc) {
            return { success: false, message: `Freelancer not found with Email: ${email} and Code: ${uniqueCode}` };
        }

        const freelancerId = freelancerDoc.id;
        const freelancerName = freelancerDoc.data().firstName + ' ' + freelancerDoc.data().lastName;

        // 2. Find Historical Prospects (By ID and by Email for orphans)
        const recsByUserId = await db.collection('recommendations')
            .where('userId', '==', freelancerId)
            .get();

        const recsByEmail = await db.collection('recommendations')
            .where('email', '==', email)
            .get();

        // Merge and Deduplicate
        const allDocsMap = new Map();
        recsByUserId.docs.forEach(d => allDocsMap.set(d.id, d));
        recsByEmail.docs.forEach(d => allDocsMap.set(d.id, d));

        const validProspects = Array.from(allDocsMap.values()).filter(doc => {
            const data = doc.data();
            return !data.pointsPaid; // Only unpaid ones
        });

        const count = validProspects.length;

        if (count === 0) {
            return { success: true, message: `No unpaid prospects found for ${freelancerName}.` };
        }

        // 3. Calculate
        const POINTS_PER_PROSPECT = 10;
        const totalPoints = count * POINTS_PER_PROSPECT;

        // 4. Transaction
        await db.runTransaction(async (t) => {
            // A. Update/Create Wallet
            const walletRef = db.collection('wallets').doc(freelancerId);
            const walletDoc = await t.get(walletRef);

            if (!walletDoc.exists) {
                t.set(walletRef, {
                    balance: totalPoints,
                    totalEarned: totalPoints,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                t.update(walletRef, {
                    balance: admin.firestore.FieldValue.increment(totalPoints),
                    totalEarned: admin.firestore.FieldValue.increment(totalPoints),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            // B. Add Transaction History
            const trxRef = db.collection('wallet_transactions').doc();
            t.set(trxRef, {
                userId: freelancerId,
                amount: totalPoints,
                type: 'RETROACTIVE_BONUS',
                description: `Bono Retroactivo por Prospectos Históricos (${count} prospectos)`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                adminId: 'SYSTEM_AUDIT'
            });

            // C. Mark Prospects as Paid
            validProspects.forEach(doc => {
                t.update(doc.ref, {
                    pointsPaid: true,
                    pointsPaidAt: admin.firestore.FieldValue.serverTimestamp(),
                    userId: freelancerId, // Backfill/Link correct owner
                    originalOwnerId: doc.data().userId || 'orphaned_recovered'
                });
            });
        });

        return {
            success: true,
            message: `Acción Exitosa: Se han acreditado ${totalPoints} Dicipoints a ${freelancerName} por ${count} prospectos antiguos.`
        };

    } catch (error: any) {
        console.error('Retroactive Audit Error:', error);
        return { success: false, message: `Error crítico: ${error.message}` };
    }
}

/**
 * Register a new prospect automatically with +10 points.
 * Call this when a new recommendation is created.
 */
export async function registerNewProspect(userId: string, prospectId: string) {
    const db = getAdminDb();
    const POINTS = 10;

    try {
        await db.runTransaction(async (t) => {
            // 1. Give Points
            const walletRef = db.collection('wallets').doc(userId);
            t.set(walletRef, {
                balance: admin.firestore.FieldValue.increment(POINTS),
                totalEarned: admin.firestore.FieldValue.increment(POINTS),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // 2. Log Transaction
            const trxRef = db.collection('wallet_transactions').doc();
            t.set(trxRef, {
                userId: userId,
                amount: POINTS,
                type: 'PROSPECT_REWARD',
                description: `Recompensa por nuevo prospecto (ID: ${prospectId})`,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            // 3. Mark Prospect as Paid
            const prospectRef = db.collection('recommendations').doc(prospectId);
            t.update(prospectRef, { pointsPaid: true, pointsPaidAt: admin.firestore.FieldValue.serverTimestamp() });
        });
        return { success: true };
    } catch (e) {
        console.error("Failed to register prospect points", e);
        return { success: false };
    }
}

/**
 * Reassign Prospect (Tool de Reasignación Manual)
 * 
 * Permite cambiar el dueño de un prospecto y ajustar puntos flexiblemente.
 */
export async function reassignProspect(
    prospectId: string,
    freelancerCode: string,
    freelancerEmail: string,
    pointsAmount: number,
    masterPass: string
) {
    const isValid = await verifyMasterPassword(masterPass);
    if (!isValid) return { success: false, message: 'Invalid Master Password' };

    const db = getAdminDb();

    try {
        // 1. Validate Freelancer (New Owner)
        const profilesSnap = await db.collection('private_profiles')
            .where('email', '==', freelancerEmail)
            .get();

        let newOwnerDoc = null;
        if (!profilesSnap.empty) {
            newOwnerDoc = profilesSnap.docs.find(d => d.data().uniqueCode === freelancerCode);
        }

        if (!newOwnerDoc) {
            return { success: false, message: 'ERROR: El usuario no coincide. Verifique Código y Email.' };
        }

        const newOwnerId = newOwnerDoc.id;
        const newOwnerName = newOwnerDoc.data().firstName || 'Freelancer';

        // 2. Find Prospect
        const prospectRef = db.collection('recommendations').doc(prospectId);
        const prospectSnap = await prospectRef.get();

        if (!prospectSnap.exists) {
            return { success: false, message: 'Prospecto no encontrado (ID inválido).' };
        }

        const prospectData = prospectSnap.data() || {};
        const oldOwnerId = prospectData.userId;
        const wasPaid = prospectData.pointsPaid || false;
        const prospectName = prospectData.companyName || 'Unknown Company';

        await db.runTransaction(async (t) => {
            // A. Update Prospect Owner
            t.update(prospectRef, {
                userId: newOwnerId,
                reassignedAt: admin.firestore.FieldValue.serverTimestamp(),
                reassignedBy: 'SUPERADMIN',
                originalOwnerId: oldOwnerId,
                pointsPaid: true, // Ensure it's marked as paid for the new owner
                pointsPaidAt: admin.firestore.FieldValue.serverTimestamp() // Update timestamp to now
            });

            // B. Flexible Points Logic (Wallet)

            // 1. Deduct from Old Owner if previously paid
            if (wasPaid && oldOwnerId && oldOwnerId !== newOwnerId) {
                const oldWalletRef = db.collection('wallets').doc(oldOwnerId);
                const oldWalletSnap = await t.get(oldWalletRef);

                if (oldWalletSnap.exists) {
                    // Deduct standard 10 or check history? Let's use 10 safe default.
                    // Python script says "Restar (opcional)". We will subtract to keep economy balanced.
                    t.update(oldWalletRef, {
                        balance: admin.firestore.FieldValue.increment(-10),
                        // Don't touch totalEarned usually on deduction? Or yes? 
                        // Usually TotalEarned is historical gross. Balance is net. Let's only reduce Balance.
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    const dedTrxRef = db.collection('wallet_transactions').doc();
                    t.set(dedTrxRef, {
                        userId: oldOwnerId,
                        amount: -10,
                        type: 'ADJUSTMENT',
                        description: `Reasignación de prospecto ${prospectName} (Deducción)`,
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        adminId: 'SUPERADMIN'
                    });
                }
            }

            // 2. Add to New Owner (Flexible Amount)
            const newWalletRef = db.collection('wallets').doc(newOwnerId);
            t.set(newWalletRef, {
                balance: admin.firestore.FieldValue.increment(pointsAmount),
                totalEarned: admin.firestore.FieldValue.increment(pointsAmount),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            const addTrxRef = db.collection('wallet_transactions').doc();
            t.set(addTrxRef, {
                userId: newOwnerId,
                amount: pointsAmount,
                type: 'MANUAL_ASSIGNMENT',
                description: `Asignación Manual Prospecto ${prospectName} (Valor modificado: ${pointsAmount} pts)`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                adminId: 'SUPERADMIN'
            });
        });

        return {
            success: true,
            message: `Asignado correctamente a ${newOwnerName}. Se acreditaron ${pointsAmount} Dicipoints.`
        };


    } catch (error: any) {
        console.error('Reassignment Error:', error);
        return { success: false, message: `Error técnico: ${error.message}` };
    }
}

/**
 * Get Freelancer Report Data (For PDF Generation)
 * 
 * Inputs: uniqueCode, email, masterPass
 * Returns: { success, data: { user, wallet, transactions }, message }
 */
export async function getFreelancerReportData(uniqueCode: string, email: string, masterPass: string) {
    const isValid = await verifyMasterPassword(masterPass);
    if (!isValid) return { success: false, message: 'Invalid Master Password' };

    const db = getAdminDb();

    try {
        // 1. Authenticate Freelancer (Double Check)
        const profilesSnap = await db.collection('private_profiles')
            .where('email', '==', email)
            .get();

        let freelancerDoc = null;
        if (!profilesSnap.empty) {
            freelancerDoc = profilesSnap.docs.find(d => d.data().uniqueCode === uniqueCode);
        }

        if (!freelancerDoc) {
            return { success: false, message: 'Freelancer not found. Verify Code and Email.' };
        }

        const userId = freelancerDoc.id;
        const userData = freelancerDoc.data();

        // 2. Get Wallet Info (Balance)
        const walletSnap = await db.collection('wallets').doc(userId).get();
        const walletData = walletSnap.exists ? walletSnap.data() : { balance: 0, totalEarned: 0 };

        // 3. Get Transactions
        const trxSnap = await db.collection('wallet_transactions')
            .where('userId', '==', userId)
            .get();

        const transactions = trxSnap.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Serialize timestamp for client
                    timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
                };
            })
            // Sort by timestamp desc in memory to avoid index requirement
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // 4. Prepare Response Data
        return {
            success: true,
            data: {
                user: {
                    id: userId,
                    name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                    email: userData.email,
                    uniqueCode: userData.uniqueCode,
                    phone: userData.phoneNumber || 'N/A'
                },
                wallet: {
                    balance: walletData?.balance || 0,
                    totalEarned: walletData?.totalEarned || 0
                },
                transactions: transactions,
                generatedAt: new Date().toISOString()
            }
        };

    } catch (error: any) {
        console.error('Report Generation Error:', error);
        return { success: false, message: `System Error: ${error.message}` };
    }
}

