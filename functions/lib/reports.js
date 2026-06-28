"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMonthlyReferralReports = exports.runMonthlyReport = exports.generateAdminPDF = exports.generateFreelancerPDF = exports.sendWeeklyAuditReport = void 0;
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const email_1 = require("./email");
const jspdf_1 = require("jspdf");
const jspdf_autotable_1 = __importDefault(require("jspdf-autotable"));
exports.sendWeeklyAuditReport = (0, scheduler_1.onSchedule)({
    schedule: '0 0 * * 0', // Todos los domingos a las 00:00
    timeZone: 'America/Bogota', // LATAM
    memory: '512MiB',
    timeoutSeconds: 540
}, (event) => __awaiter(void 0, void 0, void 0, function* () {
    logger.info('Starting weekly audit report...');
    const db = admin.firestore();
    // Calculate 7 days ago date
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    // Get registrations from the last 7 days
    const registrationsSnap = yield db.collection('registrations')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(oneWeekAgo))
        .get();
    let totalNew = 0;
    let totalActive = 0;
    let totalInactive = 0;
    const referrersMap = new Map();
    registrationsSnap.forEach((doc) => {
        const data = doc.data();
        totalNew++;
        const isActive = data.isEmailVerified !== false;
        if (isActive) {
            totalActive++;
        }
        else {
            totalInactive++;
        }
        const referrerId = data.referrerId || 'SIN_REFERIDOR';
        const referrerName = data.referrerName || 'Desconocido';
        const isPaid = data.referralRewardPaid !== false;
        if (!referrersMap.has(referrerId)) {
            referrersMap.set(referrerId, { name: referrerName, active: 0, inactive: 0, paid: 0 });
        }
        const refData = referrersMap.get(referrerId);
        if (isActive) {
            refData.active++;
            if (isPaid)
                refData.paid++;
        }
        else {
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
        yield (0, email_1.sendMail)({
            to: 'reporte@dicilo.de',
            subject: '📊 Dicilo: Reporte Semanal de Crecimiento y Comisiones',
            html: html
        });
        logger.info('Weekly audit report sent successfully.');
    }
    catch (e) {
        logger.error('Error sending weekly audit report:', e);
    }
}));
// Helper to generate Freelancer PDF report
function generateFreelancerPDF(referrerName, referrerCode, referrerRole, periodStr, guests, totalDP, totalCash) {
    const doc = new jspdf_1.jsPDF();
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("DICILO - REPORTE MENSUAL", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Periodo de Liquidacion: ${periodStr}`, 14, 27);
    doc.text(`Fecha de Emision: ${new Date().toLocaleDateString()}`, 14, 32);
    // Line separator
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, 37, 196, 37);
    // Referrer Info Box
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Datos del Patrocinador:`, 14, 45);
    doc.setFontSize(10);
    doc.text(`Nombre: ${referrerName}`, 14, 52);
    doc.text(`Codigo Unico: ${referrerCode}`, 14, 57);
    doc.text(`Rango / Rol: ${referrerRole.toUpperCase()}`, 14, 62);
    // Earnings Summary Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(120, 42, 76, 23, "F");
    doc.setFontSize(11);
    doc.text(`Resumen de Ganancias:`, 124, 48);
    doc.setFontSize(9);
    doc.text(`Puntos Ganados: ${totalDP.toFixed(1)} DP`, 124, 54);
    doc.text(`Efectivo Ganado: EUR ${totalCash.toFixed(2)}`, 124, 59);
    // Title for Guest List
    doc.setFontSize(12);
    doc.text(`Detalle de Afiliados Registrados (${guests.length}):`, 14, 75);
    // Guests Table
    const tableBody = guests.map((g, idx) => {
        var _a;
        let dateStr = g.createdAt;
        if ((_a = g.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) {
            dateStr = g.createdAt.toDate().toLocaleDateString();
        }
        else if (g.createdAt) {
            dateStr = new Date(g.createdAt).toLocaleDateString();
        }
        return [
            idx + 1,
            `${g.firstName || ''} ${g.lastName || ''}`.trim() || 'Sin Nombre',
            g.email || 'Sin Email',
            dateStr
        ];
    });
    (0, jspdf_autotable_1.default)(doc, {
        startY: 80,
        head: [['#', 'Nombre Completo', 'Email', 'Fecha Registro']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
        styles: { fontSize: 9 }
    });
    // Footer message
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Este documento es un comprobante de control interno generado automaticamente por el sistema Dicilo.", 14, finalY + 15);
    const ab = doc.output('arraybuffer');
    return Buffer.from(ab);
}
exports.generateFreelancerPDF = generateFreelancerPDF;
// Helper to generate Admin Consolidated PDF report
function generateAdminPDF(periodStr, registrations, summary) {
    const doc = new jspdf_1.jsPDF();
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("DICILO - REPORTE GLOBAL ADMINISTRATIVO", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Periodo de Liquidacion: ${periodStr}`, 14, 27);
    doc.text(`Fecha de Emision: ${new Date().toLocaleDateString()}`, 14, 32);
    // Line separator
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, 37, 196, 37);
    // Summary Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(14, 42, 182, 30, "F");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Resumen Estadistico:`, 18, 48);
    doc.setFontSize(9);
    doc.text(`Total Nuevos Registros: ${summary.totalRegistrations}`, 18, 55);
    doc.text(`Registros con Patrocinador: ${summary.totalWithReferrer}`, 18, 60);
    doc.text(`Patrocinadores Activos: ${summary.activeReferrers}`, 18, 65);
    doc.text(`Total Puntos a Acreditar: ${summary.platformTotalDP.toFixed(1)} DP`, 110, 55);
    doc.text(`Total Efectivo a Liquidar: EUR ${summary.platformTotalCash.toFixed(2)}`, 110, 60);
    // Title for Registrations
    doc.setFontSize(12);
    doc.text(`Detalle Completo de Registros en el Periodo:`, 14, 82);
    // Table content
    const tableBody = registrations.map((r, idx) => {
        var _a;
        let dateStr = r.createdAt;
        if ((_a = r.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) {
            dateStr = r.createdAt.toDate().toLocaleDateString();
        }
        else if (r.createdAt) {
            dateStr = new Date(r.createdAt).toLocaleDateString();
        }
        return [
            idx + 1,
            `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Sin Nombre',
            r.email || 'Sin Email',
            r.referredBy ? 'Afiliado' : 'Organico',
            dateStr
        ];
    });
    (0, jspdf_autotable_1.default)(doc, {
        startY: 87,
        head: [['#', 'Nombre Completo', 'Email', 'Tipo de Registro', 'Fecha Registro']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] }, // red-500
        styles: { fontSize: 8 }
    });
    const ab = doc.output('arraybuffer');
    return Buffer.from(ab);
}
exports.generateAdminPDF = generateAdminPDF;
// Consolidate monthly execution logic
function runMonthlyReport(year, month, isTest, testEmailOverride) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = admin.firestore();
        const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        logger.info(`Running MLM monthly report for ${year}-${month} (${start.toISOString()} to ${end.toISOString()})...`);
        const profilesSnap = yield db.collection('private_profiles').get();
        const allProfiles = profilesSnap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        const newUsers = allProfiles.filter(p => {
            if (!p.createdAt)
                return false;
            let date;
            if (typeof p.createdAt.toDate === 'function') {
                date = p.createdAt.toDate();
            }
            else {
                date = new Date(p.createdAt);
            }
            return date >= start && date <= end;
        });
        logger.info(`Found ${newUsers.length} new registrations in ${year}-${month}.`);
        const groupedByReferrer = {};
        newUsers.forEach(user => {
            const refId = user.referredBy;
            if (!refId)
                return;
            if (!groupedByReferrer[refId]) {
                groupedByReferrer[refId] = [];
            }
            groupedByReferrer[refId].push(user);
        });
        const summaryList = [];
        let platformTotalDP = 0;
        let platformTotalCash = 0;
        for (const [refId, invitedUsers] of Object.entries(groupedByReferrer)) {
            const referrer = allProfiles.find(p => p.id === refId);
            if (!referrer)
                continue;
            const role = referrer.role || (referrer.isFreelancer ? 'freelancer' : 'user');
            let rateEUR = 0.25;
            let rateDP = 25.0;
            if (['team_leader', 'team_office', 'admin', 'superadmin'].includes(role)) {
                rateEUR = 0.50;
                rateDP = 50.0;
            }
            const count = invitedUsers.length;
            const earnedDP = count * rateDP;
            const earnedCash = count * rateEUR;
            platformTotalDP += earnedDP;
            platformTotalCash += earnedCash;
            summaryList.push({
                referrerId: refId,
                name: `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim() || 'No Name',
                email: referrer.email,
                code: referrer.uniqueCode || 'N/A',
                role,
                invitedCount: count,
                earnedDP,
                earnedCash,
                invitedUsers
            });
        }
        summaryList.sort((a, b) => b.invitedCount - a.invitedCount);
        const monthNamesEs = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const monthName = monthNamesEs[month - 1];
        for (const summary of summaryList) {
            if (!['freelancer', 'team_leader', 'team_office', 'admin', 'superadmin'].includes(summary.role)) {
                continue;
            }
            const pdfBuffer = generateFreelancerPDF(summary.name, summary.code, summary.role, `${monthName} ${year}`, summary.invitedUsers, summary.earnedDP, summary.earnedCash);
            let tableRows = '';
            summary.invitedUsers.forEach((inv, index) => {
                var _a;
                let regDateStr = inv.createdAt;
                if ((_a = inv.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) {
                    regDateStr = inv.createdAt.toDate().toISOString().split('T')[0];
                }
                else if (inv.createdAt) {
                    regDateStr = new Date(inv.createdAt).toISOString().split('T')[0];
                }
                tableRows += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${index + 1}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inv.firstName || ''} ${inv.lastName || ''}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inv.email || ''}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${regDateStr}</td>
                </tr>
            `;
            });
            const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Reporte Mensual de Rendimiento - ${monthName} ${year}</h2>
                <p>Hola <strong>${summary.name}</strong>,</p>
                <p>Te enviamos el resumen de tu esfuerzo y ganancias correspondientes al mes de <strong>${monthName}</strong>.</p>
                
                <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 4px 0;"><strong>Tu Codigo Unico:</strong> <code>${summary.code}</code></p>
                    <p style="margin: 4px 0;"><strong>Tu Rol actual:</strong> <code>${summary.role.toUpperCase()}</code></p>
                    <p style="margin: 4px 0;"><strong>Total Invitados Registrados:</strong> ${summary.invitedCount}</p>
                    <p style="margin: 4px 0; color: #16a34a; font-size: 1.1em;"><strong>Comision en Puntos:</strong> ${summary.earnedDP.toFixed(1)} DP</p>
                    <p style="margin: 4px 0; color: #3b82f6; font-size: 1.1em;"><strong>Comision en Efectivo:</strong> EUR ${summary.earnedCash.toFixed(2)}</p>
                </div>
                
                <h3 style="color: #0f172a; margin-top: 20px;">Listado de Invitados</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em;">
                    <thead>
                        <tr style="background-color: #f1f5f9;">
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; width: 40px;">#</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1;">Nombre</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1;">Email</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1;">Fecha Registro</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                
                <p style="margin-top: 25px;">Adjunto a este correo encontraras el reporte formal en formato **PDF** para tus registros personales.</p>
                <p style="font-size: 0.85em; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                    Este es un correo automatico de control del ecosistema Dicilo. Si tienes alguna duda, puedes contactar al soporte en support@dicilo.net.
                </p>
            </div>
        `;
            const recipientEmail = isTest && testEmailOverride ? testEmailOverride : summary.email;
            if (!recipientEmail)
                continue;
            try {
                yield (0, email_1.sendMail)({
                    to: recipientEmail,
                    subject: `📊 Dicilo: Reporte Mensual de Comisiones - ${monthName} ${year}`,
                    html: html,
                    attachments: [
                        {
                            filename: `Reporte_Dicilo_${summary.name.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`,
                            content: pdfBuffer
                        }
                    ]
                });
                logger.info(`Monthly report email sent to ${recipientEmail} for referrer ${summary.name}`);
            }
            catch (e) {
                logger.error(`Error sending monthly report email to ${recipientEmail}:`, e);
            }
        }
        const adminPdfBuffer = generateAdminPDF(`${monthName} ${year}`, newUsers, {
            totalRegistrations: newUsers.length,
            totalWithReferrer: newUsers.filter(u => u.referredBy).length,
            activeReferrers: summaryList.length,
            platformTotalDP,
            platformTotalCash
        });
        let adminTableRows = '';
        summaryList.forEach((sum, idx) => {
            adminTableRows += `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${sum.name}</strong><br/><code>${sum.code}</code> (${sum.role})</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${sum.invitedCount}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${sum.earnedDP.toFixed(1)} DP</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">EUR ${sum.earnedCash.toFixed(2)}</td>
            </tr>
        `;
        });
        const adminHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 700px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">📊 Ecosistema Dicilo: Reporte Global Mensual - ${monthName} ${year}</h2>
            <p>Hola Nilo,</p>
            <p>Te enviamos el reporte consolidado de registros y comisiones del mes de <strong>${monthName} de ${year}</strong>.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 4px 0;"><strong>Total Nuevos Registros:</strong> ${newUsers.length}</p>
                <p style="margin: 4px 0;"><strong>Registros con Patrocinador:</strong> ${newUsers.filter(u => u.referredBy).length}</p>
                <p style="margin: 4px 0;"><strong>Patrocinadores Activos:</strong> ${summaryList.length}</p>
                <p style="margin: 4px 0; color: #16a34a; font-size: 1.1em;"><strong>Total DP a Liquidar:</strong> ${platformTotalDP.toFixed(1)} DP</p>
                <p style="margin: 4px 0; color: #3b82f6; font-size: 1.1em;"><strong>Total Efectivo a Liquidar:</strong> EUR ${platformTotalCash.toFixed(2)}</p>
            </div>
            
            <h3 style="color: #0f172a; margin-top: 20px;">Resumen por Patrocinador</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em;">
                <thead>
                    <tr style="background-color: #f1f5f9;">
                        <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; width: 40px;">#</th>
                        <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1;">Patrocinador</th>
                        <th style="padding: 8px; text-align: center; border-bottom: 2px solid #cbd5e1;">Invitados</th>
                        <th style="padding: 8px; text-align: center; border-bottom: 2px solid #cbd5e1;">DP Odo</th>
                        <th style="padding: 8px; text-align: center; border-bottom: 2px solid #cbd5e1;">Efectivo Odo</th>
                    </tr>
                </thead>
                <tbody>
                    ${adminTableRows}
                </tbody>
            </table>
            
            <p style="margin-top: 25px;">Adjunto a este correo encontraras el reporte consolidado formal en **PDF** con el listado completo de todos los registrados del mes.</p>
        </div>
    `;
        const adminEmailAddress = isTest && testEmailOverride ? testEmailOverride : 'support@dicilo.net';
        try {
            yield (0, email_1.sendMail)({
                to: adminEmailAddress,
                subject: `📊 Dicilo: Reporte Mensual Global - ${monthName} ${year}`,
                html: adminHtml,
                attachments: [
                    {
                        filename: `Reporte_Global_Dicilo_${monthName}_${year}.pdf`,
                        content: adminPdfBuffer
                    }
                ]
            });
            logger.info(`Global monthly report email sent to admin at ${adminEmailAddress}`);
        }
        catch (e) {
            logger.error(`Error sending global monthly report email:`, e);
        }
    });
}
exports.runMonthlyReport = runMonthlyReport;
// Scheduled Cloud Function Trigger
exports.sendMonthlyReferralReports = (0, scheduler_1.onSchedule)({
    schedule: '0 0 1 * *', // El primer dia de cada mes a las 00:00
    timeZone: 'America/Bogota', // Timezone para Colombia/LATAM
    memory: '1GiB',
    timeoutSeconds: 540
}, (event) => __awaiter(void 0, void 0, void 0, function* () {
    logger.info('Starting scheduled monthly referral report...');
    const now = new Date();
    // Run for the previous month
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth(); // previous month (since now.getMonth() is 0-indexed and represents previous month number, e.g. on June 1, targetMonth is 5 = May 1-indexed)
    if (targetMonth === 0) {
        targetMonth = 12;
        targetYear -= 1;
    }
    try {
        yield runMonthlyReport(targetYear, targetMonth, false);
        logger.info('Scheduled monthly referral report completed successfully.');
    }
    catch (e) {
        logger.error('Error running scheduled monthly referral report:', e);
    }
}));
