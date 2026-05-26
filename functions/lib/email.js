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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const encryption_1 = require("./encryption");
const admin = __importStar(require("firebase-admin"));
// Helper to clean environment variables (remove potential quotes)
const cleanEnv = (val) => {
    if (!val)
        return undefined;
    const trimmed = val.trim();
    // Only remove quotes if they wrap the entire string as a pair
    if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
};
function sendMail(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const mode = cleanEnv(process.env.MAIL_MODE) || 'gmail'; // "gmail" | "smtp" | "disabled"
        if (mode === 'disabled')
            return { ok: true, id: 'disabled' };
        if (mode === 'gmail') {
            const gmailSender = cleanEnv(process.env.GMAIL_SENDER);
            const transporter = nodemailer_1.default.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: gmailSender,
                    clientId: cleanEnv(process.env.GMAIL_CLIENT_ID),
                    clientSecret: cleanEnv(process.env.GMAIL_CLIENT_SECRET),
                    refreshToken: cleanEnv(process.env.GMAIL_REFRESH_TOKEN),
                },
            });
            const info = yield transporter.sendMail({
                from: gmailSender,
                to: input.to,
                subject: input.subject,
                html: input.html,
            });
            return { ok: true, id: info.messageId };
        }
        const host = cleanEnv(process.env.SMTP_HOST);
        const port = Number(cleanEnv(process.env.SMTP_PORT) || 587);
        const user = cleanEnv(process.env.SMTP_USER);
        let pass = cleanEnv(process.env.SMTP_PASS);
        const encryptionKey = cleanEnv(process.env.ENCRYPTION_KEY);
        const fromAddress = cleanEnv(process.env.SMTP_FROM) || user;
        if ((pass === null || pass === void 0 ? void 0 : pass.startsWith('enc:')) && encryptionKey) {
            try {
                pass = (0, encryption_1.decrypt)(pass.substring(4), encryptionKey);
            }
            catch (e) {
                console.error("Failed to decrypt SMTP pass in function", e);
            }
        }
        const transporter = nodemailer_1.default.createTransport({
            host: host,
            port: port,
            secure: port === 465, // true for 465, false for other ports
            auth: { user: user, pass: pass },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
        });
        let logDocRef = null;
        const startTime = Date.now();
        try {
            const db = admin.firestore();
            logDocRef = db.collection('mail_logs').doc();
            yield logDocRef.set({
                to: input.to,
                subject: input.subject,
                from: fromAddress,
                status: 'pending',
                createdAt: new Date(),
                source: 'cloud-function'
            });
        }
        catch (dbError) {
            console.error("Failed to initialize mail log in Firestore (Functions):", dbError);
        }
        try {
            const info = yield transporter.sendMail({
                from: fromAddress,
                to: input.to,
                subject: input.subject,
                html: input.html,
            });
            if (logDocRef) {
                yield logDocRef.update({
                    status: 'success',
                    messageId: info.messageId,
                    durationMs: Date.now() - startTime,
                    updatedAt: new Date()
                }).catch((e) => console.error("Failed to update success log (Functions):", e));
            }
            return { ok: true, id: info.messageId };
        }
        catch (error) {
            console.error("SMTP Error in Function:", error);
            if (logDocRef) {
                yield logDocRef.update({
                    status: 'failed',
                    error: error.message || String(error),
                    errorCode: error.code,
                    durationMs: Date.now() - startTime,
                    updatedAt: new Date()
                }).catch((e) => console.error("Failed to update failure log (Functions):", e));
            }
            throw error;
        }
    });
}
