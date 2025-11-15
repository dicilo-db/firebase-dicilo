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
exports.getEmailI18n = getEmailI18n;
exports.render = render;
const admin = __importStar(require("firebase-admin"));
function getEmailI18n(lang) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Opción A: Firestore (si subes docs i18n/email.es|de|en)
            const doc = yield admin.firestore().doc(`i18n/email.${lang}`).get();
            if (doc.exists)
                return doc.data();
        }
        catch (_a) { }
        // Opción B: Fallback mínimo embebido (ajusta si quieres más claves)
        const fallback = {
            es: {
                'consent.subject': '[DICILO] ¿Aceptas recibir información recomendada por {{name}}?',
                'consent.body': 'Hola {{recipientName}},<br/>Has recibido una recomendación de {{name}}.<br/>¿Deseas recibir información de DICILO?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
                'consent.cta.accept': 'Sí, acepto',
                'consent.cta.decline': 'No, gracias',
                'reminder.subject': '[DICILO] Recordatorio de consentimiento',
            },
            de: {
                'consent.subject': '[DICILO] Akzeptieren Sie Informationen von {{name}}?',
                'consent.body': 'Hallo {{recipientName}},<br/>Sie haben eine Empfehlung von {{name}} erhalten.<br/>Möchten Sie Informationen von DICILO erhalten?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
                'consent.cta.accept': 'Ja, akzeptieren',
                'consent.cta.decline': 'Nein, danke',
                'reminder.subject': '[DICILO] Erinnerung: Einwilligung ausstehend',
            },
            en: {
                'consent.subject': '[DICILO] Do you accept info recommended by {{name}}?',
                'consent.body': 'Hi {{recipientName}},<br/>You received a recommendation from {{name}}.<br/>Would you like to receive information from DICILO?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
                'consent.cta.accept': 'Yes, I accept',
                'consent.cta.decline': 'No, thanks',
                'reminder.subject': '[DICILO] Consent reminder',
            },
        };
        return fallback[lang];
    });
}
function render(tpl, vars) {
    return tpl.replace(/{{(.*?)}}/g, (_, k) => { var _a; return (_a = vars[k.trim()]) !== null && _a !== void 0 ? _a : ''; });
}
