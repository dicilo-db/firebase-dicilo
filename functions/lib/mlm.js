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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAllMlmRanksDaily = void 0;
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const email_1 = require("./email");
exports.checkAllMlmRanksDaily = (0, scheduler_1.onSchedule)({
    schedule: '0 0 * * *',
    timeZone: 'America/Bogota',
    memory: '512MiB',
    timeoutSeconds: 540
}, (event) => __awaiter(void 0, void 0, void 0, function* () {
    logger.info('Starting daily MLM rank check...');
    const db = admin.firestore();
    // Get all users
    const profilesSnap = yield db.collection('private_profiles').get();
    const allUsers = profilesSnap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
    let upgradedCount = 0;
    for (const user of allUsers) {
        if (['admin', 'superadmin', 'team_office'].includes(user.role))
            continue;
        // Find their directs
        const directs = allUsers.filter(u => u.referredBy === user.id);
        const directsCount = directs.length;
        let freelancersCount = 0;
        for (const direct of directs) {
            if (['freelancer', 'team_leader', 'team_office', 'admin', 'superadmin'].includes(direct.role)) {
                freelancersCount++;
            }
        }
        let newRole = user.role || 'user';
        let upgraded = false;
        if (directsCount >= 20 && freelancersCount >= 3) {
            if (newRole !== 'team_leader') {
                newRole = 'team_leader';
                upgraded = true;
            }
        }
        else if (directsCount >= 10) {
            if (newRole !== 'freelancer' && newRole !== 'team_leader') {
                newRole = 'freelancer';
                upgraded = true;
            }
        }
        if (upgraded) {
            logger.info(`Upgrading user ${user.id} (${user.email}) to ${newRole}`);
            yield db.collection('private_profiles').doc(user.id).update({
                role: newRole,
                isFreelancer: newRole === 'freelancer' || newRole === 'team_leader',
                mlmLastUpgradedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            upgradedCount++;
            // Enviar email de felicitaciones
            if (newRole === 'team_leader' && user.email) {
                const subject = '¡Increíble! Eres nuestro nuevo Team Leader';
                const html = `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #0f172a;">¡Felicidades, ${user.firstName || 'Usuario'}!</h2>
                        <p>Has superado los <strong>20 referidos activos</strong> y lideras un equipo con al menos <strong>3 Freelancers</strong>.</p>
                        <p>El sistema te ha ascendido automáticamente a <strong>Team Leader</strong>.</p>
                        <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
                            <p>Este es el rango aristocrático más alto, con beneficios y bonos por servicio exclusivos para líderes de equipo.</p>
                        </div>
                        <p>Accede a tu panel de control para ver tus nuevas opciones y estadísticas de equipo.</p>
                        <p>Saludos,<br/>El Equipo de Dicilo</p>
                    </div>
                `;
                yield (0, email_1.sendMail)({
                    to: user.email,
                    subject,
                    html: html
                }).catch(e => logger.error(`Error sending rank upgrade email to ${user.email}:`, e));
            }
            else if (newRole === 'freelancer' && user.email) {
                const subject = '¡Felicidades! Te has convertido en Freelancer';
                const html = `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #0f172a;">¡Felicidades, ${user.firstName || 'Usuario'}!</h2>
                        <p>Has alcanzado los <strong>10 referidos activos</strong>.</p>
                        <p>El sistema te ha ascendido automáticamente a <strong>Freelancer</strong>.</p>
                        <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                            <p>Ahora tienes acceso a nuevas herramientas, sistema de prospectos P2, y comisiones mejoradas.</p>
                        </div>
                        <p>Accede a tu panel de control para descubrir las nuevas ventajas.</p>
                        <p>Saludos,<br/>El Equipo de Dicilo</p>
                    </div>
                `;
                yield (0, email_1.sendMail)({
                    to: user.email,
                    subject,
                    html: html
                }).catch(e => logger.error(`Error sending rank upgrade email to ${user.email}:`, e));
            }
        }
    }
    logger.info(`Daily MLM rank check completed. ${upgradedCount} users upgraded.`);
}));
