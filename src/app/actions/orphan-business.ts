'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function processOrphanBusiness(clientId: string, newEmail: string, sourceCollection: string = 'clients') {
    try {
        const auth = getAdminAuth();
        const db = getAdminDb();

        const defaultPassword = 'DiciloAcceso2026*';

        let user;
        try {
            user = await auth.getUserByEmail(newEmail);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // Crear al usuario
                user = await auth.createUser({
                    email: newEmail,
                    password: defaultPassword,
                    emailVerified: true
                });
            } else {
                throw error;
            }
        }

        // Recuperar la entidad original
        const entityRef = db.collection(sourceCollection).doc(clientId);
        const doc = await entityRef.get();
        
        if (!doc.exists) {
            return { success: false, error: 'Empresa no encontrada en la base de datos' };
        }

        const data = doc.data() || {};
        
        // Actualizamos base de datos original
        await entityRef.update({
            email: newEmail,
            ownerUid: user.uid
        });

        // Si viene de 'businesses', necesitamos asegurarnos de que exista un registro en 'clients'
        // para que el usuario pueda hacer login en el Dashboard (ya que este busca en clients)
        if (sourceCollection === 'businesses') {
            const existingClients = await db.collection('clients').where('businessId', '==', clientId).get();
            if (existingClients.empty) {
                const newClientRef = db.collection('clients').doc();
                await newClientRef.set({
                    businessId: clientId,
                    clientName: data.name || data.clientName || 'Desconocido',
                    clientType: 'starter', // Nivel básico con acceso al Dashboard
                    email: newEmail,
                    phone: data.phone || '',
                    active: true,
                    createdAt: new Date(),
                    ownerUid: user.uid
                });
            } else {
                // Actualizar el cliente existente vinculado
                await existingClients.docs[0].ref.update({
                    email: newEmail,
                    ownerUid: user.uid
                });
            }
        } else if (data.businessId) {
            // Si el origen era 'clients', pero tiene un businessId vinculado, le asignamos el ownerUid también al business
            const linkedBusinessRef = db.collection('businesses').doc(data.businessId);
            const linkedBusinessSnap = await linkedBusinessRef.get();
            if (linkedBusinessSnap.exists) {
                await linkedBusinessRef.update({
                    ownerUid: user.uid,
                    email: newEmail
                });
            }
        }

        // Crear registro en la colección "users" para habilitar el loginCount (Max 5 accesos)
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            await userRef.set({
                email: newEmail,
                role: 'client', // o 'business', dependiendo del esquema
                loginCount: 0,
                mustChangePassword: true,
                createdAt: new Date().toISOString()
            });
        } else {
            await userRef.update({
                loginCount: 0,
                mustChangePassword: true
            });
        }

        return { 
            success: true, 
            message: `Acceso generado correctamente`,
            uid: user.uid,
            credentials: {
                email: newEmail,
                password: defaultPassword
            }
        };
    } catch (e: any) {
        console.error("Error processOrphanBusiness:", e);
        return { success: false, error: e.message || 'Error desconocido' };
    }
}

export async function sendOrphanBusinessEmail(clientId: string, email: string, templateId: string, password: string = 'DiciloAcceso2026*', sourceCollection: string = 'clients') {
    try {
        const { getTemplate } = await import('@/actions/email-templates');
        const { sendSmtpEmail } = await import('@/lib/mail-service');
        const db = getAdminDb();

        const entityRef = db.collection(sourceCollection).doc(clientId);
        const doc = await entityRef.get();
        
        if (!doc.exists) {
            return { success: false, error: 'Cliente no encontrado' };
        }

        const data = doc.data() || {};
        const template = await getTemplate(templateId);
        if (!template) return { success: false, error: 'Template no encontrado' };

        // Attempt to guess language or default to es
        const lang = (data.country === 'Deutschland' || data.country === 'Alemania') ? 'de' : 'es';
        let templateVersion = template.versions[lang] || template.versions['es'] || Object.values(template.versions)[0];
        
        if (!templateVersion || !templateVersion.subject || !templateVersion.body) {
            return { success: false, error: 'Versión de plantilla no válida' };
        }

        let subject = templateVersion.subject;
        let body = templateVersion.body;

        const unsubscribeUrl = `https://dicilo.net/baja?email=${encodeURIComponent(email)}`;
        let generatedLink = `https://dicilo.net/login`;

        // Replace variables
        const vars: Record<string, string> = {
            '{{nombre}}': 'Usuario',
            '{{Name}}': 'Usuario',
            '{{empresa}}': data.clientName || data.name || 'su empresa',
            '{{Company}}': data.clientName || data.name || 'su empresa',
            '{{Empresa}}': data.clientName || data.name || 'su empresa',
            '{{tu_nombre}}': 'Equipo Dicilo',
            '{{referrer_name}}': 'Equipo Dicilo',
            '{{clave_aleatoria}}': password, // Maps the password to clave_aleatoria for templates that use it
            '{{password}}': password,
            '{{Greeting}}': lang === 'de' ? 'Hallo' : 'Hola',
            '{{Baja}}': `<a href="${unsubscribeUrl}" style="color: #64748b; font-size: 11px; text-decoration: underline;" target="_blank" rel="noopener noreferrer">Darse de baja / Unsubscribe</a>`
        };

        for (const [key, val] of Object.entries(vars)) {
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedKey, 'gi');
            subject = subject.replace(regex, val);
            body = body.replace(regex, val);
        }

        // Action button
        body = body.replace(/\[BOTÓN:\s*(.+?)\]/gi, (match, buttonText) => {
            return `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${generatedLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-family: sans-serif; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" target="_blank" rel="noopener noreferrer">
                    ${buttonText}
                </a>
            </div>
            `;
        });

        const html = body.replace(/\n/g, '<br/>');

        const result = await sendSmtpEmail({ to: email, subject, html });
        if (!result.success) return { success: false, error: result.error };

        return { success: true };
    } catch (e: any) {
        console.error("Error sendOrphanBusinessEmail:", e);
        return { success: false, error: e.message || 'Error desconocido' };
    }
}
