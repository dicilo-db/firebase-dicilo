'use server';

import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { getTemplate } from '@/actions/email-templates';
import { sendSmtpEmail } from '@/lib/mail-service';
import { v4 as uuidv4 } from 'uuid';

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
            return { success: false, error: 'La plantilla de correo (Template) no fue encontrada en la base de datos.' };
        }

        // Fetch all private users
        const profilesSnap = await db.collection('private_profiles').get();
        if (profilesSnap.empty) {
            return { success: true, count: 0, failed: 0 };
        }

        const users = profilesSnap.docs.map(doc => doc.data()).filter(data => data.email);
        if (users.length === 0) {
            return { success: true, count: 0, failed: 0 };
        }

        let sentCount = 0;
        let failedCount = 0;
        let firstErrorMsg = '';

        // Batch processing (chunks of 50 to avoid server/nodemailer socket exhaustion)
        const BATCH_SIZE = 50;
        for (let i = 0; i < users.length; i += BATCH_SIZE) {
            const batchUsers = users.slice(i, i + BATCH_SIZE);

            const emailPromises = batchUsers.map(async (user) => {
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
                    throw new Error('Versión de plantilla o contenido no válido para el idioma ' + lang);
                }

                let { subject, body } = templateVersion;

                function escapeHTML(str: string) {
                    if (!str) return '';
                    return str.replace(/[&<>'"]/g, 
                        tag => ({
                            '&': '&amp;',
                            '<': '&lt;',
                            '>': '&gt;',
                            "'": '&#39;',
                            '"': '&quot;'
                        }[tag as any] || tag)
                    );
                }

                // Variables Replacement
                const vars: Record<string, string> = {
                    '{{nombre}}': escapeHTML(user.firstName) || 'Usuario',
                    '{{titulo}}': escapeHTML(payload.title) || '',
                    '{{descripcion}}': escapeHTML(payload.description) || '',
                    '{{enlace}}': escapeHTML(payload.url) || '#',
                    '{{fecha}}': escapeHTML(payload.date ? new Date(payload.date).toLocaleDateString() : ''),
                    '{{hora_inicio}}': escapeHTML(payload.time) || '',
                    '{{hora_fin}}': escapeHTML(payload.endTime) || ''
                };

                for (const [key, value] of Object.entries(vars)) {
                    const regex = new RegExp(key, 'gi');
                    subject = subject.replace(regex, value);
                    body = body.replace(regex, value);
                }

                // Fallbacks for older variables without underscore e.g. {{hora inicio}}
                body = body.replace(/{{hora inicio}}/gi, payload.time || '');
                body = body.replace(/{{hora fin}}/gi, payload.endTime || '');

                // Ensure the media/link is visible in the email.
                if (payload.url) {
                    const buttonText = payload.url.includes('.mp4') || payload.url.includes('.webm') ? 'Ver Video Adjunto 🎬' : 'Ver Enlace Adjunto 🔗';
                    const mediaButton = `
                    <div style="text-align:center; margin-top:30px; margin-bottom: 20px;">
                        <a href="${payload.url}" target="_blank" style="background-color:#0d9488;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-family:Arial, sans-serif;display:inline-block;">
                            ${buttonText}
                        </a>
                    </div>`;
                    
                    if (body.includes('</body>')) {
                        body = body.replace('</body>', mediaButton + '\n</body>');
                    } else {
                        body += mediaButton;
                    }
                }

                // Preservar los saltos de línea (párrafos) para el cuerpo HTML del correo
                body = body.replace(/\n/g, '<br />');

                return sendSmtpEmail({
                    to: user.email,
                    subject,
                    html: body
                });
            });

            const results = await Promise.allSettled(emailPromises);
            
            for (const r of results) {
                if (r.status === 'fulfilled') {
                    if (r.value && r.value.success) {
                        sentCount++;
                    } else {
                        failedCount++;
                        if (!firstErrorMsg) {
                            firstErrorMsg = (r.value as any)?.error || 'Error desconocido al enviar email SMTP';
                        }
                    }
                } else if (r.status === 'rejected') {
                    failedCount++;
                    if (!firstErrorMsg) {
                        firstErrorMsg = r.reason?.message || String(r.reason);
                    }
                }
            }
        }

        console.log(`GeneralInfo Broadcast completed. Sent ${sentCount} out of ${users.length} users. Failed: ${failedCount}`);

        if (sentCount === 0 && failedCount > 0) {
            return { success: false, error: firstErrorMsg || 'Hubo múltiples errores al enviar correos. Revisa las configuraciones SMTP.' };
        }

        if (sentCount === 0 && failedCount === 0 && users.length > 0) {
            return { success: false, error: 'Ningún correo se pudo enviar (Verifique si la plantilla tiene asuntos y cuerpos válidos)' };
        }

        return { success: true, count: sentCount, failed: failedCount };
    } catch (error: any) {
        console.error('Failed to broadcast general info newsletter:', error);
        return { success: false, error: error?.message ? error.message : 'Error interno en el servidor al compilar la campaña' };
    }
}


export async function saveGeneralInfoAction(formData: FormData) {
    try {
        const db = getAdminDb();
        const storage = getAdminStorage();

        const id = formData.get('id') as string;
        const title = formData.get('title') as string;
        const type = formData.get('type') as string;
        const date = formData.get('date') as string;
        const time = formData.get('time') as string;
        const endTime = formData.get('endTime') as string;
        const url = formData.get('url') as string;
        const description = formData.get('description') as string;
        const active = formData.get('active') === 'true';
        const adminComment = formData.get('adminComment') as string || '';

        const fileEntries = formData.getAll('files') as File[];
        // Also keep legacy paths support just in case
        let media_paths: string[] = [];
        try {
            const legacyPaths = JSON.parse(formData.get('legacyPaths') as string || '[]');
            if (Array.isArray(legacyPaths)) media_paths.push(...legacyPaths);
        } catch { }

        // Process up to 10 files
        for (const file of fileEntries.slice(0, 10)) {
            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer() as any);
                const contentType = file.type;
                let uploadBuffer = buffer;
                let finalContentType = contentType;
                let extension = file.name.split('.').pop() || '';
                let storagePath = '';

                if (contentType === 'application/pdf') {
                    storagePath = `general_info/${uuidv4()}.pdf`;
                } else if (contentType.startsWith('video/')) {
                    if (buffer.length > 25 * 1024 * 1024) throw new Error(`El video ${file.name} excede los 25MB permitidos.`);
                    storagePath = `general_info/${uuidv4()}.${extension}`;
                } else if (contentType.startsWith('image/')) {
                    try {
                        const sharp = (await import('sharp')).default;
                        uploadBuffer = await sharp(buffer)
                            .webp({ quality: 80 })
                            .resize({ width: 1920, withoutEnlargement: true })
                            .toBuffer();
                        finalContentType = 'image/webp';
                        extension = 'webp';
                    } catch (sharpError) {
                        console.warn("Sharp error in General Info fallback to original:", sharpError);
                    }
                    storagePath = `general_info/${uuidv4()}.${extension}`;
                }

                // Save to Firebase Storage
                if (storagePath) {
                    const fileRef = storage.bucket().file(storagePath);
                    await fileRef.save(uploadBuffer, { metadata: { contentType: finalContentType }, public: true });
                    const publicUrl = `https://storage.googleapis.com/${storage.bucket().name}/${storagePath}`;
                    media_paths.push(publicUrl);
                }
            }
        }

        const dataToSave = {
            title,
            type,
            date: date || null,
            time: time || null,
            endTime: endTime || null,
            url: url || '',
            description: description || '',
            active,
            admin_comment: adminComment,
            updatedAt: new Date(),
            ...(media_paths.length > 0 && { media_paths }),
        };

        let newId = id;
        if (id) {
            await db.collection('general_info').doc(id).update(dataToSave);
        } else {
            const docRef = await db.collection('general_info').add({
                ...dataToSave,
                createdAt: new Date(),
            });
            newId = docRef.id;
        }

        return { success: true, id: newId, dataToSave };
    } catch (e: any) {
        console.error("General Info Save Action error:", e);
        return { success: false, error: e.message };
    }
}
