import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { sendMail } from './email';

/**
 * Cron Job para enviar recordatorios a los perfiles incompletos (basic, starter, premium)
 * Se ejecuta todos los días a las 10:00 AM (Europe/Berlin o según región configurada).
 */
export const checkIncompleteProfiles = onSchedule('every day 10:00', async (event) => {
    const db = getFirestore();
    const now = Date.now();
    const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;

    try {
        const businessesSnapshot = await db.collection('businesses')
            .where('clientType', 'in', ['basic', 'starter', 'premium'])
            .get();

        const BATCH_SIZE = 30;
        let emailsSent = 0;
        const allDocs = businessesSnapshot.docs;

        for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
            const batchDocs = allDocs.slice(i, i + BATCH_SIZE);
            const batchPromises = batchDocs.map(async (doc) => {
            const data = doc.data();
            const email = data.email;
            const clientName = data.clientName || data.name || 'Usuario';
            const clientType = data.clientType;

            // Saltar si no hay email
            if (!email) return;

            // Verificar si el recordatorio se envió hace menos de 3 días
            if (data.profileReminderLastSentAt) {
                const lastSentAt = data.profileReminderLastSentAt.toMillis();
                if (now - lastSentAt < threeDaysInMillis) {
                    return; // Han pasado menos de 3 días, saltar
                }
            }

            // Revisar qué campos faltan
            const missingFields: string[] = [];
            
            if (!data.clientLogoUrl && !data.imageUrl) missingFields.push('✅ Logo de tu empresa o la URL del logo');
            if (!data.phone) missingFields.push('✅ Número de contacto (Teléfono)');
            if (!data.address) missingFields.push('✅ Dirección física (Calle y número)');
            if (!data.zip) missingFields.push('✅ Código Postal (PLZ / Zip)');
            if (!data.city) missingFields.push('✅ Ciudad');
            if (!data.neighborhood) missingFields.push('✅ Barrio o Sector (Stadtteil / Neighborhood)');
            if (!data.country) missingFields.push('✅ País');
            if (!data.website) missingFields.push('✅ Sitio Web');
            if (!data.mapUrl && !data.location) missingFields.push('✅ Ubicación real de tu negocio (URL Mapa)');

            // Si el perfil está completo
            if (missingFields.length === 0) {
                return;
            }

            // Generar lista HTML
            const missingListHtml = missingFields.map(f => `<li style="margin-bottom: 8px; color: #4b5563;">${f}</li>`).join('');

            // Construir el enlace directo basado en el tipo de cliente
            const editUrl = `https://dicilo.net/admin/${clientType}/${doc.id}/edit`;

            const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }
                    .container { background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                    .header { background-color: #1e293b; padding: 30px 20px; display: flex; align-items: center; justify-content: center; gap: 15px; }
                    .header img { height: 40px; display: block; }
                    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
                    .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
                    .content h2 { color: #0f172a; font-size: 20px; margin-top: 0; }
                    .missing-list { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 20px 20px 40px; margin: 25px 0; }
                    .missing-list ul { margin: 0; padding: 0; list-style-type: none; }
                    .note-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
                    .note-box p { margin: 0; font-size: 14px; color: #92400e; }
                    .note-box ul { margin: 10px 0 0 0; font-size: 14px; color: #92400e; }
                    .button-container { text-align: center; margin: 40px 0; }
                    .button { background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s; }
                    .button:hover { background-color: #2563eb; }
                    .footer { text-align: center; padding: 30px; background-color: #f8fafc; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
                    .ps-text { font-style: italic; color: #059669; font-weight: 600; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://dicilo.net/logo.png" alt="Dicilo Logo">
                        <h1>Dicilo.net</h1>
                    </div>
                    <div class="content">
                        <h2>¡Tu perfil en Dicilo está casi listo!</h2>
                        <p>Hola, <strong>${clientName}</strong>,</p>
                        <p>Hemos notado que aún faltan algunos detalles importantes en tu perfil para que tu negocio pueda aparecer correctamente en la primera página de nuestro portal y sea visible para los clientes.</p>
                        
                        <p>Actualmente, aún necesitas completar algunos datos importantes, como:</p>
                        
                        <div class="missing-list">
                            <ul>
                                ${missingListHtml}
                            </ul>
                        </div>
                        
                        <p>Es muy importante que la ubicación esté correctamente detallada y visible en el mapa del formulario, ya que esto permite que tu empresa aparezca correctamente dentro de nuestro portal y facilite que los clientes puedan encontrarte.</p>
                        <p>También es importante que tu empresa cuente con un logo visible, ya sea subiendo la imagen directamente o agregando la dirección URL del logo.</p>
                        
                        <div class="note-box">
                            <p>📌 <strong>Recuerda:</strong> Todos los campos del formulario son importantes, con excepción de:</p>
                            <ul>
                                <li>Coordenadas</li>
                                <li>Pista de Imagen (IA)</li>
                                <li>Calificación URL</li>
                                <li>Oferta actual (si no cuentas con una)</li>
                            </ul>
                        </div>
                        
                        <p>Además, te recomendamos agregar una descripción corta de tu negocio para que los clientes puedan conocer mejor tus servicios.</p>
                        <p>💡 <em><strong>Tip:</strong> Puedes copiar la URL de tu ubicación directamente desde Google Maps y pegarla en el formulario.</em></p>
                        
                        <div class="button-container">
                            <a href="${editUrl}" class="button" style="color: white !important;">👉 Completar mi perfil ahora</a>
                        </div>
                        
                        <p><em>(Si aún no has iniciado sesión o no estás registrado, el enlace te pedirá que ingreses a tu cuenta primero para poder llenar los datos faltantes).</em></p>
                        
                        <p>No dudes en comunicarte con nosotros si tienes alguna complicación o necesitas ayuda para completar tu perfil.</p>
                        
                        <p>Atentamente,<br><strong>El equipo de Dicilo</strong></p>
                        
                        <p>Gracias por ser parte de Dicilo.<br>Ten siempre en cuenta que Dicilo está para apoyarte y esperamos poder contactar contigo muy pronto.</p>
                        
                        <p class="ps-text">
                            PS: Recuerda que tu registro Básico es 100% gratis.<br><br>
                            ¿No ha sido usted el que registró la empresa o su propio negocio?<br>
                            <a href="https://dicilo.net/api/unsubscribe?email=\${encodeURIComponent(email)}&lang=es" style="color: #ef4444; text-decoration: underline;">En este enlace puede dar de baja su registro completamente gratis.</a>
                        </p>
                    </div>
                    <div class="footer">
                        &copy; 2026 Dicilo Network. Todos los derechos reservados.
                    </div>
                </div>
            </body>
            </html>
            `;

            const promise = sendMail({
                to: email,
                subject: '¡Tu perfil en Dicilo está casi listo! 🚀',
                html: emailHtml
            }).then(() => {
                logger.info(`Recordatorio enviado a ${email} (${clientName})`);
                // Actualizar el timestamp en la base de datos
                return doc.ref.update({
                    profileReminderLastSentAt: Timestamp.now()
                });
            }).catch((err) => {
                logger.error(`Error enviando email a ${email}:`, err);
            });

            await promise;
            emailsSent++;
        });

        await Promise.all(batchPromises);

        if (i + BATCH_SIZE < allDocs.length) {
            // Esperar 2 segundos entre lotes para no saturar el servidor SMTP
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    logger.info(`Cron job de recordatorios finalizado. Correos intentados: ${emailsSent}`);
        
    } catch (error) {
        logger.error('Error en el cron job checkIncompleteProfiles:', error);
    }
});
