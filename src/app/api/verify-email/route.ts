import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { resolveRewards } from '@/lib/rewards';
import { checkAndUpgradeRank } from '@/app/actions/mlm-actions';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, code } = body;

        if (!email || !code) {
            return NextResponse.json({ message: 'Email and code are required.' }, { status: 400 });
        }

        const db = getAdminDb();
        const auth = getAdminAuth();

        let userVerified = false;
        let errorMessage = 'Código inválido o expirado.';
        
        let registrationDocId: string | null = null;
        let registrationData: any = null;
        let registrationDocRef: any = null;
        let ownerUid: string | null = null;

        // 1. Check in private_profiles first
        const profilesSnapshot = await db.collection('private_profiles').where('email', '==', email).limit(1).get();
        if (!profilesSnapshot.empty) {
            const profileDoc = profilesSnapshot.docs[0];
            const data = profileDoc.data();
            
            if (data.emailVerificationCode === code) {
                await profileDoc.ref.update({
                    isEmailVerified: true,
                    emailVerificationCode: null // consume the code
                });
                if (data.uid) {
                    ownerUid = data.uid;
                    try {
                         await auth.updateUser(data.uid, { emailVerified: true });
                    } catch(e) {}
                }
                userVerified = true;
            } else if (data.isEmailVerified) {
                userVerified = true;
                ownerUid = data.uid || null;
            }
        }

        // 2. Check in registrations (for retailers, donors, premiums, or to find payment info)
        const registrationsSnapshot = await db.collection('registrations').where('email', '==', email).limit(1).get();
        if (!registrationsSnapshot.empty) {
            const regDoc = registrationsSnapshot.docs[0];
            const data = regDoc.data();
            registrationDocId = regDoc.id;
            registrationData = data;
            registrationDocRef = regDoc.ref;
            ownerUid = ownerUid || data.ownerUid;
            
            if (!userVerified && data.emailVerificationCode === code) {
                await regDoc.ref.update({
                    isEmailVerified: true,
                    emailVerificationCode: null
                });
                if (data.ownerUid) {
                    try {
                         await auth.updateUser(data.ownerUid, { emailVerified: true });
                    } catch(e) {}
                }
                userVerified = true;
            } else if (data.isEmailVerified) {
                userVerified = true;
            }
        }

        if (userVerified) {
            // ==========================================
            // REWARD ENGINE (Ejecutado al activar cuenta)
            // ==========================================
            if (registrationData && registrationData.referralRewardPaid === false) {
                try {
                    const inviteId = registrationData.inviteId;
                    const rewards = await resolveRewards(inviteId, email);
                    const rewardSender = rewards.rewardSender; // Bono para el Referidor (Black Card)
                    const rewardReceiver = rewards.rewardReceiver; // Bono para el Nuevo (Black Card)
                    
                    const resolvedReferrerId = rewards.referrerId || (registrationData.referrerId !== 'SYSTEM_REFONL' ? registrationData.referrerId : null);

                    if (ownerUid) {
                        // A. Pagar al Usuario Nuevo (Solo Tarjeta Negra / DiciPoints)
                        await db.runTransaction(async (t) => {
                            const walletRef = db.collection('wallets').doc(ownerUid!);
                            t.set(walletRef, {
                                balance: admin.firestore.FieldValue.increment(rewardReceiver),
                                totalEarned: admin.firestore.FieldValue.increment(rewardReceiver),
                                updatedAt: admin.firestore.FieldValue.serverTimestamp()
                            }, { merge: true });

                            const trxRef = db.collection('wallet_transactions').doc();
                            t.set(trxRef, {
                                userId: ownerUid,
                                amount: rewardReceiver,
                                type: 'WELCOME_BONUS',
                                description: `Bono de bienvenida por activación de cuenta${inviteId ? ' (Invitación)' : ''}`,
                                timestamp: admin.firestore.FieldValue.serverTimestamp()
                            });
                        });

                        // B. Pagar a la Red (MLM Depth)
                        if (resolvedReferrerId && resolvedReferrerId !== ownerUid) {
                            
                            // 1. Traverse up to 6 levels of ancestors
                            const ancestors: { uid: string, role: string }[] = [];
                            let currentAncestorId: string | null = resolvedReferrerId;
                            
                            for (let i = 0; i < 6; i++) {
                                if (!currentAncestorId || currentAncestorId === 'SYSTEM_REFONL') break;
                                
                                const profileSnap = await db.collection('private_profiles').doc(currentAncestorId).get();
                                const role = profileSnap.exists ? (profileSnap.data()?.role || 'user') : 'user';
                                ancestors.push({ uid: currentAncestorId, role });
                                
                                // Find who invited this ancestor
                                const regs = await db.collection('registrations').where('ownerUid', '==', currentAncestorId).limit(1).get();
                                if (!regs.empty && regs.docs[0].data().referrerId && regs.docs[0].data().referrerId !== 'SYSTEM_REFONL') {
                                    currentAncestorId = regs.docs[0].data().referrerId;
                                } else {
                                    currentAncestorId = null;
                                }
                            }

                            if (ancestors.length > 0) {
                                await db.runTransaction(async (t) => {
                                    // Pagar Nivel 1 (Ancestors[0])
                                    const level1 = ancestors[0];
                                    const isPro = ['freelancer', 'team_leader', 'team_office', 'admin', 'superadmin'].includes(level1.role);
                                    
                                    const walletRef = db.collection('wallets').doc(level1.uid);
                                    const updateData: any = {
                                        balance: admin.firestore.FieldValue.increment(rewardSender), // Puntos (Black Card)
                                        totalEarned: admin.firestore.FieldValue.increment(rewardSender),
                                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                    };
                                    
                                    let l1Money = 0;
                                    if (level1.role === 'freelancer') l1Money = 0.25;
                                    else if (isPro) l1Money = 0.50;

                                    if (l1Money > 0) {
                                        updateData.eurBalance = admin.firestore.FieldValue.increment(l1Money);
                                        updateData.totalEurEarned = admin.firestore.FieldValue.increment(l1Money);
                                    }
                                    
                                    t.set(walletRef, updateData, { merge: true });

                                    // Transacción Tarjeta Negra (Puntos)
                                    const trxRef = db.collection('wallet_transactions').doc();
                                    t.set(trxRef, {
                                        userId: level1.uid,
                                        amount: rewardSender,
                                        type: 'REFERRAL_REWARD_BUSINESS',
                                        description: `Bonus por activación de ${registrationData.businessName || registrationData.firstName || 'Usuario'}`,
                                        relatedUserId: ownerUid,
                                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                                    });
                                    
                                    // Transacción Tarjeta Verde (Dinero)
                                    if (l1Money > 0) {
                                        const moneyTrxRef = db.collection('wallet_transactions').doc();
                                        t.set(moneyTrxRef, {
                                            userId: level1.uid,
                                            amount: l1Money,
                                            currency: 'EUR',
                                            type: 'REFERRAL_CASH_BONUS',
                                            description: `Bono en efectivo (Directo) por activación de ${registrationData.businessName || registrationData.firstName || 'Usuario'}`,
                                            relatedUserId: ownerUid,
                                            timestamp: admin.firestore.FieldValue.serverTimestamp()
                                        });
                                    }

                                    // Pagar Niveles 2 al 6 a los Team Leaders+
                                    const deepMultipliers = [0.01, 0.02, 0.03, 0.04, 0.05];
                                    for (let i = 1; i < ancestors.length; i++) {
                                        const ancestor = ancestors[i];
                                        const isTL = ['team_leader', 'team_office', 'admin', 'superadmin'].includes(ancestor.role);
                                        if (isTL) {
                                            const payout = deepMultipliers[i - 1]; // i=1 -> 0.01
                                            if (payout) {
                                                const aWalletRef = db.collection('wallets').doc(ancestor.uid);
                                                t.set(aWalletRef, {
                                                    eurBalance: admin.firestore.FieldValue.increment(payout),
                                                    totalEurEarned: admin.firestore.FieldValue.increment(payout),
                                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                                }, { merge: true });

                                                const aTrxRef = db.collection('wallet_transactions').doc();
                                                t.set(aTrxRef, {
                                                    userId: ancestor.uid,
                                                    amount: payout,
                                                    currency: 'EUR',
                                                    type: 'REFERRAL_MLM_DEEP_BONUS',
                                                    description: `Bono MLM (Nivel ${i + 1}) por activación de ${registrationData.businessName || registrationData.firstName || 'Usuario'}`,
                                                    relatedUserId: ownerUid,
                                                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                                                });
                                            }
                                        }
                                    }
                                });
                                console.log(`[REWARD ENGINE] Paid direct and MLM deep network for ${resolvedReferrerId}`);
                            }
                        }
                    }

                    // C. Marcar Invitación como Convertida
                    if (inviteId) {
                        await db.collection('referrals_pioneers').doc(inviteId).update({
                            status: 'converted',
                            converted: true,
                            convertedAt: admin.firestore.FieldValue.serverTimestamp(),
                            convertedUid: ownerUid || null
                        });
                    }

                    // D. Marcar Registration como Pagado
                    if (registrationDocRef) {
                        await registrationDocRef.update({
                            referralRewardPaid: true,
                            referralRewardPaidAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }

                    // E. MLM Check (Asciende a Freelancer/Team Leader si aplica)
                    if (resolvedReferrerId && resolvedReferrerId !== ownerUid) {
                        await checkAndUpgradeRank(resolvedReferrerId).catch(err => 
                            console.error("[REWARD ENGINE] MLM Upgrade Error:", err)
                        );
                    }
                } catch (rewardErr) {
                    console.error("Reward Engine Error upon verification:", rewardErr);
                }
            }

            return NextResponse.json({ success: true, message: 'Email verified successfully.' }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
        }
        
    } catch (error: any) {
        console.error('Verify Email Error:', error);
        return NextResponse.json({ success: false, message: 'Server error processing verification.' }, { status: 500 });
    }
}
