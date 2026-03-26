'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { getTemplate } from '@/actions/email-templates';
import { sendSmtpEmail } from '@/lib/mail-service';

export interface BroadcastPayload {
    type: 'note' | 'event';
    title: string;
    description: string;
    url: string;
    date?: string;
    time?: string;
    endTime?: string;
}

const TEMPLATE_ID_NOTE = '9NZAP74oNGLwtZrgiJIT';
const TEMPLATE_ID_EVENT = 'NRyMkTfJ7Q06V8d9rsgD';

export async function broadcastGeneralInfoNewsletter(payload: BroadcastPayload) {
    try {
        const db = getAdminDb();
        const templateId = payload.type === 'event' ? TEMPLATE_ID_EVENT : TEMPLATE_ID_NOTE;

        const template = await getTemplate(templateId);
        if (!template) {
            console.error('Template not found for id:', templateId);
            return { success: false, error: 'Template not found' };
        }

        // Fetch all private users
        const profilesSnap = await db.collection('private_profiles').get();
        if (profilesSnap.empty) {
            return { success: true, count: 0 };
        }

        const users = profilesSnap.docs.map(doc => doc.data()).filter(data => data.email);

        const emailPromises = users.map(async (user) => {
            // Determine user language based on profile preference or country
            let lang = 'es'; // Default
            if (user.language) {
                lang = user.language.toLowerCase().substring(0, 2);
            } else if (user.country) {
                const c = user.country.toLowerCase();
                if (c.includes('germany') || c.includes('deutschland') || c.includes('austria') || c.includes('switzerland')) lang = 'de';
                else if (c.includes('usa') || c.includes('united states') || c.includes('kingdom') || c.includes('england')) lang = 'en';
                else if (c.includes('france') || c.includes('belgium')) lang = 'fr';
                else if (c.includes('brazil') || c.includes('portugal') || c.includes('brasil')) lang = 'pt';
                else if (c.includes('italy') || c.includes('italia')) lang = 'it';
            }

            // Ensure we fallback properly
            let templateVersion = template.versions[lang] || template.versions['es'] || Object.values(template.versions)[0];

            if (!templateVersion || !templateVersion.subject || !templateVersion.body) {
                return null;
            }

            let { subject, body } = templateVersion;

            // Variables Replacement
            const vars: Record<string, string> = {
                '{{nombre}}': user.firstName || 'Usuario',
                '{{titulo}}': payload.title || '',
                '{{descripcion}}': payload.description || '',
                '{{enlace}}': payload.url || '#',
                '{{fecha}}': payload.date ? new Date(payload.date).toLocaleDateString() : '',
                '{{hora_inicio}}': payload.time || '',
                '{{hora_fin}}': payload.endTime || ''
            };

            for (const [key, value] of Object.entries(vars)) {
                const regex = new RegExp(key, 'gi');
                subject = subject.replace(regex, value);
                body = body.replace(regex, value);
            }

            // Fallbacks for older variables without underscore e.g. {{hora inicio}}
            body = body.replace(/{{hora inicio}}/gi, payload.time || '');
            body = body.replace(/{{hora fin}}/gi, payload.endTime || '');

            // Preservar los saltos de línea (párrafos) para el cuerpo HTML del correo
            body = body.replace(/\n/g, '<br />');

            return sendSmtpEmail({
                to: user.email,
                subject,
                html: body
            });
        });

        const results = await Promise.allSettled(emailPromises);
        const sentCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
        const failedCount = results.filter(r => r.status === 'fulfilled' && r.value && r.value.success === false).length;
        const firstError = results.find(r => r.status === 'fulfilled' && r.value && r.value.success === false) as any;

        console.log(`GeneralInfo Broadcast completed. Sent ${sentCount} out of ${users.length} users. Failed: ${failedCount}`);

        if (sentCount === 0 && failedCount > 0) {
            return { success: false, error: firstError?.value?.error || 'Error desconocido de SMTP' };
        }

        return { success: true, count: sentCount };
    } catch (error: any) {
        console.error('Failed to broadcast general info newsletter:', error);
        return { success: false, error: error.message || String(error) };
    }
}
