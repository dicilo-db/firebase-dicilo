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

                        // B. Pagar al Referidor
                        if (resolvedReferrerId && resolvedReferrerId !== ownerUid) {
                            // Obtener rol del referidor para saber si le toca dinero
                            const refProfileSnap = await db.collection('private_profiles').doc(resolvedReferrerId).get();
                            const refRole = refProfileSnap.exists ? (refProfileSnap.data()?.role || 'user') : 'user';
                            const isPro = ['freelancer', 'team_leader', 'team_office', 'admin', 'superadmin'].includes(refRole);
                            
                            // Monto en dinero fijo (ej. 0.50 €) que se paga al referidor PRO. 
                            // * Puedes ajustar esto si la variable viene de la BD.
                            const moneyReward = 0.50; 

                            await db.runTransaction(async (t) => {
                                const refWalletRef = db.collection('wallets').doc(resolvedReferrerId);
                                
                                const updateData: any = {
                                    balance: admin.firestore.FieldValue.increment(rewardSender), // Puntos (Black Card) a todos
                                    totalEarned: admin.firestore.FieldValue.increment(rewardSender),
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                };
                                
                                // Si es Freelancer o superior, se le abona dinero a la Green Card
                                if (isPro) {
                                    updateData.eurBalance = admin.firestore.FieldValue.increment(moneyReward);
                                    updateData.totalEurEarned = admin.firestore.FieldValue.increment(moneyReward);
                                }
                                
                                t.set(refWalletRef, updateData, { merge: true });

                                // Transacción Tarjeta Negra (Puntos)
                                const trxRef = db.collection('wallet_transactions').doc();
                                t.set(trxRef, {
                                    userId: resolvedReferrerId,
                                    amount: rewardSender,
                                    type: 'REFERRAL_REWARD_BUSINESS',
                                    description: `Bonus por activación de ${registrationData.businessName || registrationData.firstName || 'Usuario'} (${registrationData.uniqueCode || ''})`,
                                    relatedUserId: ownerUid,
                                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                                });
                                
                                // Transacción Tarjeta Verde (Dinero)
                                if (isPro) {
                                    const moneyTrxRef = db.collection('wallet_transactions').doc();
                                    t.set(moneyTrxRef, {
                                        userId: resolvedReferrerId,
                                        amount: moneyReward,
                                        currency: 'EUR',
                                        type: 'REFERRAL_CASH_BONUS',
                                        description: `Bono en efectivo por activación de ${registrationData.businessName || registrationData.firstName || 'Usuario'} (${registrationData.uniqueCode || ''})`,
                                        relatedUserId: ownerUid,
                                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                                    });
                                }
                            });
                            console.log(`[REWARD ENGINE] Paid ${rewardSender} DP to ${resolvedReferrerId}. Paid money? ${isPro}`);
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
