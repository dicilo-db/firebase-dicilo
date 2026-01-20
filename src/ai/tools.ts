import { ai } from './genkit';
import { z } from 'genkit';
import { getClientDeepKnowledge } from '@/ai/data/knowledge-retriever';

// --- HERRAMIENTA 3: BUSCADOR DE INFORMACIÓN DE EMPRESA (RAG) ---
export const retrieveCompanyInfoTool = ai.defineTool(
    {
        name: 'retrieveCompanyInfo',
        description: 'Busca información detallada sobre una empresa específica (Dirección, Servicios, Descripción). Úsala SIEMPRE que el usuario pregunte "Qué es", "Qué hace" o "Dónde está" una empresa del directorio.',
        inputSchema: z.object({
            companyName: z.string().describe("El nombre exacto de la empresa a buscar."),
        }),
        outputSchema: z.string(),
    },
    async ({ companyName }) => {
        console.log(`[Tool:retrieveCompanyInfo] Buscando: ${companyName}`);
        try {
            const knowledge = await getClientDeepKnowledge(companyName);
            if (!knowledge || knowledge.length < 10) {
                return JSON.stringify({ success: false, error: "No se encontró información detallada para esta empresa." });
            }
            return JSON.stringify({ success: true, data: knowledge });
        } catch (error: any) {
            return JSON.stringify({ success: false, error: error.message });
        }
    }
);
const WEBHOOK_MESSAGE = 'https://dicilo.app.n8n.cloud/webhook/dicibot-message';
const WEBHOOK_CALENDAR = 'https://dicilo.app.n8n.cloud/webhook/dicibot-calendar';

// --- HERRAMIENTA 1: ENVÍO DE MENSAJES ---
export const sendMessageTool = ai.defineTool(
    {
        name: 'sendMessage',
        description: 'Envía información por Email o WhatsApp. Retorna JSON con éxito o error.',
        inputSchema: z.object({
            userName: z.string(),
            contactInfo: z.string(),
            messageBody: z.string().describe("El contenido o resumen a enviar."),
            channel: z.enum(['email', 'whatsapp']).default('email'),
        }),
        outputSchema: z.string(),
    },
    async ({ userName, contactInfo, messageBody, channel }) => {
        console.log(`[Tool:sendMessage] Enviando a ${channel} -> ${contactInfo}`);

        try {
            const response = await fetch(WEBHOOK_MESSAGE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actionType: channel === 'whatsapp' ? 'send_whatsapp' : 'send_email',
                    payload: { userName, email: contactInfo, phone: contactInfo, details: messageBody }
                }),
            });

            if (!response.ok) {
                return JSON.stringify({ success: false, error: `Error servidor n8n: ${response.status} ${response.statusText}` });
            }

            // LOGGING TO FIRESTORE (Legacy Support)
            try {
                const { getAdminDb } = await import('@/lib/firebase-admin');
                const db = getAdminDb();
                await db.collection('email_logs').add({
                    to: contactInfo,
                    message: messageBody,
                    channel: channel,
                    userName: userName,
                    sentAt: new Date(),
                    status: 'success',
                    metadata: { n8n_status: response.status }
                });
            } catch (e) {
                console.error('[Tool:sendMessage] Log failed', e);
            }

            return JSON.stringify({ success: true, message: "Envío procesado correctamente por n8n." });

        } catch (error: any) {
            return JSON.stringify({ success: false, error: `Fallo de conexión: ${error.message}` });
        }
    }
);

// --- HERRAMIENTA 2: CALENDARIO ---
export const calendarTool = ai.defineTool(
    {
        name: 'calendar',
        description: 'Agenda una cita en el calendario. Retorna JSON.',
        inputSchema: z.object({
            userName: z.string(),
            date: z.string().describe("Fecha y hora ISO"),
            contactInfo: z.string(),
            details: z.string().optional()
        }),
        outputSchema: z.string(),
    },
    async (payload) => {
        console.log(`[Tool:calendar] Agendando para ${payload.date}`);
        try {
            const response = await fetch(WEBHOOK_CALENDAR, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actionType: 'calendar_booking', payload }),
            });

            if (!response.ok) {
                return JSON.stringify({ success: false, error: `Error servidor n8n: ${response.status}` });
            }
            return JSON.stringify({ success: true, message: "Cita agendada." });
        } catch (error: any) {
            return JSON.stringify({ success: false, error: `Fallo de conexión: ${error.message}` });
        }
    }
);
