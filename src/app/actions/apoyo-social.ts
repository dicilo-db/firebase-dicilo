'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { sendSmtpEmail } from '@/lib/mail-service';

export async function approveApoyoSocialRequest(requestId: string) {
    const db = getAdminDb();
    const requestRef = db.collection('apoyo_social_requests').doc(requestId);
    
    try {
        const docSnap = await requestRef.get();
        if (!docSnap.exists) {
            return { success: false, error: 'Solicitud no encontrada.' };
        }

        const data = docSnap.data();
        if (data?.status === 'approved') {
            return { success: false, error: 'La solicitud ya estaba aprobada.' };
        }

        const userEmail = data?.email;
        const userName = data?.name || 'Socio';

        if (!userEmail) {
            return { success: false, error: 'La solicitud no contiene un email válido.' };
        }

        // 1. Create or get Auth User
        let userRecord;
        let isNewUser = false;
        try {
            userRecord = await admin.auth().getUserByEmail(userEmail);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                isNewUser = true;
                userRecord = await admin.auth().createUser({
                    email: userEmail,
                    emailVerified: true, // Auto verify since it comes from our closed loop
                    displayName: userName,
                });
            } else {
                throw error;
            }
        }

        const uid = userRecord.uid;

        // 2. Set Custom Claims and Role
        const currentClaims = userRecord.customClaims || {};
        await admin.auth().setCustomUserClaims(uid, {
            ...currentClaims,
            role: 'apoyo_social',
            admin: false
        });

        // 3. Create Private Profile bypassing public registration
        await db.collection('private_profiles').doc(uid).set({
            email: userEmail,
            firstName: userName,
            lastName: '(Apoyo Social)',
            role: 'apoyo_social',
            disabled: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            // Ensure Onboarding is skipped or gracefully handled
            country: 'Verificado',
            city: 'Dicilo',
            interests: ['Causas Sociales'],
            isFreelancer: false
        }, { merge: true });

        // 4. Update Request Status
        await requestRef.update({
            status: 'approved',
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            uid: uid
        });

        // 5. Generate Password Reset Link and Send Email
        const resetLink = await admin.auth().generatePasswordResetLink(userEmail);
        
        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #8cc63f; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">¡Solicitud Aprobada!</h1>
                </div>
                <div style="padding: 20px; color: #5a5a5a; line-height: 1.6;">
                    <p>Hola <strong>${userName}</strong>,</p>
                    <p>Nos complace informarte que tu postulación al programa <strong>Apoyo Social Dicilo</strong> ha sido aprobada por nuestro equipo de moderación.</p>
                    <p>A partir de este momento, tienes acceso a tu Panel de Control exclusivo, donde podrás generar Banners Oficiales con la marca de agua de "Causa Verificada".</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        ${isNewUser ? `<p style="font-size: 14px; margin-bottom: 5px;">Para establecer tu contraseña y acceder por primera vez, haz clic en el siguiente botón:</p>` : `<p style="font-size: 14px; margin-bottom: 5px;">Para acceder a tu panel, haz clic aquí (usa tu contraseña actual):</p>`}
                        <a href="${isNewUser ? resetLink : 'https://dicilo.net/login'}" style="background-color: #8cc63f; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">
                            ${isNewUser ? 'Crear mi Contraseña' : 'Ir a mi Panel'}
                        </a>
                    </div>
                    
                    <p style="font-size: 12px; color: #777;">* Si tienes algún problema con el enlace, puedes copiar y pegar la siguiente URL en tu navegador: <br><span style="color: #66b266;">${isNewUser ? resetLink : 'https://dicilo.net/login'}</span></p>
                    
                    <p>Gracias por confiar en Dicilo para darle visibilidad a tu causa.</p>
                    <p><strong>El equipo de Dicilo.net</strong></p>
                </div>
            </div>
        `;

        await sendSmtpEmail({
            to: userEmail,
            subject: 'Tu perfil de Apoyo Social en Dicilo ha sido Activado',
            html: htmlBody
        });


        return { success: true, message: 'Usuario aprobado. Se ha enviado un correo de bienvenida automático.' };

    } catch (error: any) {
        console.error('Error approving Apoyo Social request:', error);
        return { success: false, error: error.message };
    }
}

import { headers } from 'next/headers';

export async function sendApoyoSocialInvite(email: string, organizationName: string, lang: string = 'es') {
    try {
        const token = require('crypto').randomBytes(16).toString('hex');
        
        let baseUrl = 'https://dicilo.net';
        try {
            const originHeader = headers().get('origin');
            if (originHeader) baseUrl = originHeader;
        } catch (e) {
            // Silently fallback if headers() not available in some contexts
        }
        
        const inviteLink = `${baseUrl}/hub-solidario?invitacion=${token}&email=${encodeURIComponent(email)}&lang=${lang}`;
        
        let subject = 'Invitación Privada: Programa de Apoyo Social Dicilo';
        let title = 'Invitación Especial de Dicilo';
        let greeting = `Hola <strong>${organizationName}</strong>,`;
        let paragraph1 = 'Nos ponemos en contacto contigo porque valoramos el impacto positivo de tu causa.';
        let paragraph2 = 'Como parte de nuestro programa de <strong>Responsabilidad Social y Apoyo Social</strong>, queremos invitarte de manera exclusiva a unirte a <strong>Dicilo.net</strong> sin ningún costo.';
        let paragraph3 = 'Al registrarte, validaremos tu perfil y te proporcionaremos acceso a herramientas de difusión profesional gratuitas, para conectar tu cruzada con posibles prospectos que apoyen tu causa bajo un sello de confianza verificado.';
        let buttonText = 'Acceder al Formulario Seguro';
        let footerText = '* Este enlace ha sido generado exclusivamente para tu organización y es intransferible.';
        let signature = 'Atentamente,<br><strong>El equipo de Dicilo.net</strong>';

        if (lang === 'de') {
            subject = 'Private Einladung: Dicilo Social Support Programm';
            title = 'Besondere Einladung von Dicilo';
            greeting = `Hallo <strong>${organizationName}</strong>,`;
            paragraph1 = 'Wir kontaktieren Sie, weil wir die positiven Auswirkungen Ihres Anliegens schätzen.';
            paragraph2 = 'Im Rahmen unseres <strong>Programms zur sozialen Verantwortung</strong> möchten wir Sie exklusiv einladen, kostenlos Mitglied von <strong>Dicilo.net</strong> zu werden.';
            paragraph3 = 'Nach der Registrierung überprüfen wir Ihr Profil und bieten Ihnen Zugang zu kostenlosen professionellen Verbreitungs-Tools, um Ihre Sache mit potenziellen Unterstützern unter einem geprüften Vertrauenssiegel zu verbinden.';
            buttonText = 'Sicheres Formular aufrufen';
            footerText = '* Dieser Link wurde exklusiv für Ihre Organisation generiert und ist nicht übertragbar.';
            signature = 'Mit freundlichen Grüßen,<br><strong>Das Team von Dicilo.net</strong>';
        } else if (lang === 'en') {
            subject = 'Private Invitation: Dicilo Social Support Program';
            title = 'Special Invitation from Dicilo';
            greeting = `Hello <strong>${organizationName}</strong>,`;
            paragraph1 = 'We are reaching out to you because we value the positive impact of your cause.';
            paragraph2 = 'As part of our <strong>Social Responsibility and Support Program</strong>, we exclusively invite you to join <strong>Dicilo.net</strong> at no cost.';
            paragraph3 = 'Upon registration, we will validate your profile and provide access to free professional dissemination tools, connecting your crusade with potential prospects who support your cause under a verified trust seal.';
            buttonText = 'Access Secure Form';
            footerText = '* This link has been generated exclusively for your organization and is non-transferable.';
            signature = 'Sincerely,<br><strong>The Dicilo.net Team</strong>';
        }
        
        const htmlBody = `
            <!DOCTYPE html>
            <html lang="${lang}">
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #8cc63f; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">${title}</h1>
                </div>
                <div style="padding: 20px; color: #5a5a5a; line-height: 1.6;">
                    <p>${greeting}</p>
                    <p>${paragraph1}</p>
                    <p>${paragraph2}</p>
                    <p>${paragraph3}</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${inviteLink}" style="background-color: #8cc63f; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">
                            ${buttonText}
                        </a>
                    </div>
                    
                    <p style="font-size: 13px; color: #777; background-color: #f9f9f9; padding: 10px; border-left: 3px solid #8cc63f;">
                        ${footerText}<br>
                        URL: <span style="color: #66b266; word-break: break-all;">${inviteLink}</span>
                    </p>
                    
                    <p>${signature}</p>
                </div>
            </body>
            </html>
        `;

        await sendSmtpEmail({
            to: email,
            subject: subject,
            html: htmlBody
        });

        // Store the token/invite in a 'apoyo_social_invites' collection to trace it later.
        const db = getAdminDb();
        const inviteRef = db.collection('apoyo_social_invites').doc(email);
        const docSnap = await inviteRef.get();
        if (docSnap.exists) {
            await inviteRef.update({
                sentCount: admin.firestore.FieldValue.increment(1),
                lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
                token: token // update token
            });
        } else {
            await inviteRef.set({
                email,
                organizationName,
                token,
                sentCount: 1,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'pending' // can be used later to track if they registered
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error sending invite:', error);
        return { success: false, error: error.message };
    }
}

