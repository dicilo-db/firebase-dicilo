import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { sendMail } from './email';

export const sendWeeklyAuditReport = onSchedule({
    schedule: '0 0 * * 0', // Todos los domingos a las 00:00
    timeZone: 'America/Bogota', // LATAM
    memory: '512MiB',
    timeoutSeconds: 540
}, async (event) => {
    logger.info('Starting weekly audit report...');
    const db = admin.firestore();
    
    // Calculate 7 days ago date
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get registrations from the last 7 days
    const registrationsSnap = await db.collection('registrations')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(oneWeekAgo))
        .get();

    let totalNew = 0;
    let totalActive = 0;
    let totalInactive = 0;
    const referrersMap = new Map<string, {
        name: string;
        active: number;
        inactive: number;
        paid: number;
    }>();

    registrationsSnap.forEach((doc) => {
        const data = doc.data();
        totalNew++;

        const isActive = data.isEmailVerified === true;
        if (isActive) {
            totalActive++;
        } else {
            totalInactive++;
        }

        const referrerId = data.referrerId || 'SIN_REFERIDOR';
        const referrerName = data.referrerName || 'Desconocido';
        const isPaid = data.referralRewardPaid === true;

        if (!referrersMap.has(referrerId)) {
            referrersMap.set(referrerId, { name: referrerName, active: 0, inactive: 0, paid: 0 });
        }

        const refData = referrersMap.get(referrerId)!;
        if (isActive) {
            refData.active++;
            if (isPaid) refData.paid++;
        } else {
            refData.inactive++;
        }
    });

    // Build the email HTML
    let tableRows = '';
    referrersMap.forEach((stats, refId) => {
        tableRows += `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${stats.name} <br><small>(${refId})</small></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${stats.active + stats.inactive}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; color: green;">${stats.active}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; color: red;">${stats.inactive}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${stats.paid}</td>
            </tr>
        `;
    });

    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0f172a;">Reporte Semanal de Auditoría (Usuarios Nuevos)</h2>
            <p>Se adjunta el resumen de actividad de la última semana (Domingo a Domingo).</p>
            
            <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <p><strong>Total Nuevos Registros:</strong> ${totalNew}</p>
                <p><strong>Cuentas Activadas:</strong> ${totalActive}</p>
                <p><strong>Cuentas Sin Activar:</strong> ${totalInactive}</p>
            </div>

            <h3 style="color: #0f172a;">Rendimiento por Referidor</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #f1f5f9;">
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1;">Referidor</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e1;">Traídos</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e1;">Activos</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e1;">Inactivos</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e1;">Pagados</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            
            <p style="margin-top: 30px; font-size: 0.9em; color: #64748b;">Este reporte es generado automáticamente. Puedes ver más detalles en el panel de control de Superadmin.</p>
        </div>
    `;

    try {
        await sendMail({
            to: 'reporte@dicilo.de',
            subject: '📊 Dicilo: Reporte Semanal de Crecimiento y Comisiones',
            html: html
        });
        logger.info('Weekly audit report sent successfully.');
    } catch (e) {
        logger.error('Error sending weekly audit report:', e);
    }
});
