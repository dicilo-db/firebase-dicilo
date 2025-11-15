"use strict";
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
function sendMail(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const mode = process.env.MAIL_MODE || 'gmail'; // "gmail" | "smtp" | "disabled"
        if (mode === 'disabled')
            return { ok: true, id: 'disabled' };
        if (mode === 'gmail') {
            const transporter = nodemailer_1.default.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: process.env.GMAIL_SENDER,
                    clientId: process.env.GMAIL_CLIENT_ID,
                    clientSecret: process.env.GMAIL_CLIENT_SECRET,
                    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
                },
            });
            const info = yield transporter.sendMail({
                from: process.env.GMAIL_SENDER,
                to: input.to,
                subject: input.subject,
                html: input.html,
            });
            return { ok: true, id: info.messageId };
        }
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: false,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        const info = yield transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: input.to,
            subject: input.subject,
            html: input.html,
        });
        return { ok: true, id: info.messageId };
    });
}
