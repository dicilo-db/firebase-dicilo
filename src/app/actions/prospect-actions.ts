'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { getTemplate } from '@/actions/email-templates';
import { sendSmtpEmail } from '@/lib/mail-service';
import { randomBytes } from 'crypto';

export async function sendProspectInvitation(prospectId: string) {
    try {
        const db = getAdminDb();
        const prospectRef = db.collection('recommendations').doc(prospectId);
        const doc = await prospectRef.get();

        if (!doc.exists) {
            return { success: false, error: 'Prospecto no encontrado' };
        }

        const data = doc.data() as any;
        const email = data.email || data.companyEmail;
        
        if (!email || !email.includes('@')) {
            return { success: false, error: 'El prospecto no tiene un email válido' };
        }

        let securityKey = data.securityKey;
        if (!securityKey) {
            securityKey = randomBytes(4).toString('hex').toUpperCase(); // 8 chars key
            await prospectRef.update({ securityKey });
        }

        // Obtener la plantilla indicada: qVCINezvMyoMLJk7DUnL
        const templateId = 'qVCINezvMyoMLJk7DUnL';
        const template = await getTemplate(templateId);

        if (!template) {
            return { success: false, error: 'Plantilla de email no encontrada' };
        }

        // Determinar idioma (por defecto 'es')
        const lang = data.countryCode === 'DE' || data.country === 'Deutschland' || data.country === 'Alemania' ? 'de' : 'es';
        
        const templateVersion = template.versions[lang] || template.versions['es'] || Object.values(template.versions)[0];
        
        if (!templateVersion) {
            return { success: false, error: 'Versión de idioma de la plantilla no encontrada' };
        }

        let subject = templateVersion.subject;
        let body = templateVersion.body;

        // Reemplazar las variables: empresa, clave_aleatoria, ref_code
        const variables: Record<string, string> = {
            '{{empresa}}': data.companyName || '',
            '{{clave_aleatoria}}': securityKey,
            '{{ref_code}}': data.diciloCode || data.userId || ''
        };

        for (const [key, value] of Object.entries(variables)) {
            // Regex global e insensible a mayúsculas para abarcar más variaciones si las hay
            const regex = new RegExp(key, 'gi');
            subject = subject.replace(regex, value);
            body = body.replace(regex, value);
        }

        // Convertir saltos de línea a <br/> en caso de ser texto plano
        const htmlBody = body.replace(/\n/g, '<br/>');

        const emailResult = await sendSmtpEmail({
            to: email,
            subject,
            html: htmlBody
        });

        if (!emailResult.success) {
            return { success: false, error: emailResult.error };
        }

        // Actualizar el estado del prospecto
        await prospectRef.update({
            validationStatus: 'invitation_sent',
            validatedAt: new Date(),
        });

        return { success: true, securityKey };

    } catch (error: any) {
        console.error('Error in sendProspectInvitation:', error);
        return { success: false, error: error.message };
    }
}
