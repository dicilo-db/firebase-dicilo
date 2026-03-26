'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { sendSmtpEmail } from '@/lib/mail-service';

export async function unsubscribeEmail(email: string, inviteId?: string) {
    if (!email || typeof email !== 'string') {
        return { success: false, error: 'Email inválido.' };
    }

    try {
        const db = getAdminDb();
        const normalizedEmail = email.toLowerCase().trim();
        let companyName = "Desconocida";
        let referrerId = null;
        let referrerName = null;

        // 1. Add to global unsubscribes list
        await db.collection('unsubscribes').doc(normalizedEmail).set({
            email: normalizedEmail,
            inviteId: inviteId || null,
            unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const batch = db.batch();

        // 2. Mark in recommendations
        const recsQuery = await db.collection('recommendations')
            .where('email', '==', normalizedEmail)
            .get();

        recsQuery.forEach(docSnap => {
            const docData = docSnap.data();
            companyName = docData.companyName || companyName;
            referrerId = referrerId || docData.userId; // Usually userId is referrerId here
            referrerName = referrerName || docData.referrerName;
            
            batch.update(docSnap.ref, {
                status: 'unsubscribed',
                unsubscribed: true,
                validationStatus: 'unsubscribed',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        // 3. Mark in referrals_pioneers records
        const pioneerQuery = await db.collection('referrals_pioneers')
            .where('friendEmail', '==', normalizedEmail)
            .get();

        pioneerQuery.forEach(docSnap => {
            const data = docSnap.data();
            companyName = companyName === "Desconocida" ? (data.friendName || companyName) : companyName;
            referrerId = referrerId || data.referrerId;
            referrerName = referrerName || data.referrerName;
            
            batch.update(docSnap.ref, {
                status: 'unsubscribed',
                unsubscribed: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

        // 4. Send email to the person acknowledging unsubscribe
        try {
            await sendSmtpEmail({
                to: normalizedEmail,
                subject: "Baja confirmada de Dicilo.net",
                html: `
                    <p>Hola,</p>
                    <p>Le confirmamos que su solicitud se ha procesado correctamente. <strong>Usted ha sido dada de baja de la lista de dicilo.net</strong>.</p>
                    <p>Si en algún momento cambia de opinión y desea volver, puede hacerlo libremente registrándose en <a href="https://dicilo.net">dicilo.net</a>.</p>
                    <br/>
                    <p>Atentamente,<br/>El equipo de Dicilo.</p>
                `
            });
        } catch (e) {
            console.error("Error sending acknowledgment email to user:", e);
        }

        // 5. Notify the referrer if possible
        if (referrerId) {
            try {
                // Determine the referrer's email from private_profiles
                const referrerDoc = await db.collection('private_profiles').doc(referrerId).get();
                if (referrerDoc.exists) {
                    const refEmail = referrerDoc.data()?.email;
                    if (refEmail) {
                        await sendSmtpEmail({
                            to: refEmail,
                            subject: "Notificación de baja: Empresa ha declinado invitación",
                            html: `
                                <p>Hola ${referrerName || 'Compañero'},</p>
                                <p>Te notificamos que la empresa <strong>${companyName} (${normalizedEmail})</strong> que usted registró o contactó recientemente, ha manifestado que no desea ser parte de dicilo.net y se ha dado de baja de nuestras comunicaciones.</p>
                                <p>Para respetar sus tiempos, te pedimos no contactar a esta empresa nuevamente a nombre de Dicilo.</p>
                                <br/>
                                <p>Un saludo.</p>
                            `
                        });
                    }
                }
            } catch (notifyErr) {
                console.error("Error notifying referrer:", notifyErr);
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error unsubscribing:", error);
        return { success: false, error: "Ocurrió un error en el servidor." };
    }
}
