'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { sendSmtpEmail } from '@/lib/mail-service';

export interface MLMUserNode {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    uniqueCode: string;
    role: string;
    directsCount: number;
    teamCount: number;
    directs: MLMUserNode[];
    createdAt: string;
}

/**
 * Valid roles logic for the MLM system:
 * user -> freelancer -> team_leader
 */
export async function checkAndUpgradeRank(uid: string) {
    const db = getAdminDb();
    
    // 1. Get User Profile
    const profileRef = db.collection('private_profiles').doc(uid);
    const profileSnap = await profileRef.get();
    
    if (!profileSnap.exists) return null;
    const profile = profileSnap.data();
    
    if (['admin', 'superadmin'].includes(profile?.role)) {
        return null; // Don't touch admins
    }

    // 2. Compute Direct Referrals
    const directsSnap = await db.collection('private_profiles')
        .where('referredBy', '==', uid)
        .get();
        
    const directsCount = directsSnap.size;
    
    // 3. Compute Directs with at least 1 referral of their own
    let directsWithAtLeastOne = 0;
    
    for (const doc of directsSnap.docs) {
        const subDirectsSnap = await db.collection('private_profiles')
            .where('referredBy', '==', doc.id)
            .count()
            .get();
        if (subDirectsSnap.data().count >= 1) {
            directsWithAtLeastOne++;
        }
    }

    let newRole = profile?.role || 'user';
    let upgraded = false;

    // Conditions:
    if (directsCount >= 20 && directsWithAtLeastOne >= 3) {
        if (newRole !== 'team_leader') {
            newRole = 'team_leader';
            upgraded = true;
        }
    } else if (directsCount >= 10) {
        if (newRole !== 'freelancer' && newRole !== 'team_leader') {
            newRole = 'freelancer';
            upgraded = true;
        }
    }

    // 4. Update and Notify
    if (upgraded) {
        await profileRef.update({
            role: newRole,
            isFreelancer: newRole === 'freelancer' || newRole === 'team_leader',
            mlmLastUpgradedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const lang = 'es'; // default
        await notifyRankUpgrade(profile?.email, profile?.firstName || '', newRole, lang);
        
        return { success: true, oldRole: profile?.role, newRole };
    }

    return { success: false, reason: 'No upgrade needed' };
}

async function notifyRankUpgrade(email: string | undefined, name: string, newRole: string, lang: string) {
    if (!email) return;
    
    let subject = '';
    let body = '';
    
    if (newRole === 'freelancer') {
        subject = '¡Felicidades! Te has convertido en Freelancer';
        body = `Hola ${name},<br><br>Has alcanzado los 10 referidos. ¡Felicidades, te acabas de convertir en Freelancer!<br><br>Ahora tienes acceso a nuevas herramientas y comisiones.`;
    } else if (newRole === 'team_leader') {
        subject = '¡Increíble! Eres nuestro nuevo Team Leader';
        body = `Hola ${name},<br><br>Has superado los 20 referidos y lideras un equipo activo. ¡Felicidades, ahora eres Team Leader!<br><br>Este es el rango aristocrático más alto, con beneficios y bonos por servicio.`;
    }
    
    if (body) {
        await sendSmtpEmail({
            to: email,
            subject,
            html: body
        }).catch(e => console.error("Error sending rank upgrade email:", e));
    }
}

/**
 * Builds the MLM tree down to a specified depth.
 */
export async function getNetworkTree(uid: string, maxDepth: number = 3, currentDepth: number = 1): Promise<MLMUserNode | null> {
    const db = getAdminDb();
    
    const profileSnap = await db.collection('private_profiles').doc(uid).get();
    if (!profileSnap.exists) return null;
    
    const data = profileSnap.data() as any;
    
    const node: MLMUserNode = {
        uid: profileSnap.id,
        firstName: data.firstName || 'Usuario',
        lastName: data.lastName || '',
        email: data.email || '',
        uniqueCode: data.uniqueCode || '',
        role: data.role || 'user',
        directsCount: 0,
        teamCount: 0,
        directs: [],
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
    };
    
    if (currentDepth <= maxDepth) {
        const directsSnap = await db.collection('private_profiles')
            .where('referredBy', '==', uid)
            .get();
            
        node.directsCount = directsSnap.size;
        
        for (const directDoc of directsSnap.docs) {
            const childNode = await getNetworkTree(directDoc.id, maxDepth, currentDepth + 1);
            if (childNode) {
                node.directs.push(childNode);
                node.teamCount += 1 + childNode.teamCount;
            }
        }
    }
    
    return node;
}

/**
 * Retrieves a list of users who have reached Freelancer or Team Leader status.
 */
export async function getMlmLeaders() {
    const db = getAdminDb();
    
    const snap = await db.collection('private_profiles')
        .where('role', 'in', ['freelancer', 'team_leader'])
        .get();

    const leaders = [];
    for (const doc of snap.docs) {
        const data = doc.data();
        
        // Count directs quickly
        const directsSnap = await db.collection('private_profiles')
            .where('referredBy', '==', doc.id)
            .get();
            
        leaders.push({
            uid: doc.id,
            firstName: data.firstName || 'Usuario',
            lastName: data.lastName || '',
            email: data.email || '--',
            uniqueCode: data.uniqueCode || '--',
            role: data.role,
            directsCount: directsSnap.size,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : '--'
        });
    }

    // Sort: Team Leaders first, then by directsCount
    return leaders.sort((a, b) => {
        if (a.role === 'team_leader' && b.role !== 'team_leader') return -1;
        if (a.role !== 'team_leader' && b.role === 'team_leader') return 1;
        return b.directsCount - a.directsCount;
    });
}
