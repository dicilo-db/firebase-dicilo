import { ai } from './genkit';
import { z } from 'genkit';
import { getClientDeepKnowledge } from '@/ai/data/knowledge-retriever';

// --- HERRAMIENTA 3: BUSCADOR DE DIRECTORIO DE EMPRESAS (AGENTIC RAG) ---
export const searchBusinessDirectoryTool = ai.defineTool(
    {
        name: 'searchBusinessDirectory',
        description: 'Busca empresas, negocios o servicios en el directorio activo de Dicilo.net. Úsala SIEMPRE que el usuario pregunte por "empresas", "ofrecen X servicio", "dónde hay un dentista", o "quién hace X".',
        inputSchema: z.object({
            keyword: z.string().nullable().optional().describe("Palabra clave a buscar (ej: 'dentista', 'viajes', 'consultoría', 'Travelposting')."),
            city: z.string().nullable().optional().describe("Ciudad de la empresa si el usuario la menciona."),
            country: z.string().nullable().optional().describe("País de la empresa si el usuario lo menciona (ej: 'Colombia')."),
        }),
        outputSchema: z.string(),
    },
    async ({ keyword, city, country }) => {
        console.log(`[Tool:searchBusinessDirectory] Buscando: ${keyword || 'TODO'} en ${city || 'CUALQUIER CIUDAD'}, ${country || 'CUALQUIER PAIS'}`);
        try {
            const { getAdminDb } = await import('@/lib/firebase-admin');
            const db = getAdminDb();
            const businessesSnap = await db.collection('businesses').get();
            const clientsSnap = await db.collection('clients').get();
            
            let results: string[] = [];
            
            const processSearch = (doc: any, source: string) => {
                const data = doc.data();
                const name = data.clientName || data.name || data.businessName || "";
                const category = data.category?.name || data.category || "";
                const desc = data.shortDescription || data.description || data.about || "";
                const address = data.address?.city || data.city || data.location || "";
                const dataCountry = data.address?.country || data.country || "";
                
                const searchString = `${name} ${category} ${desc}`.toLowerCase();
                const cityString = `${address} ${dataCountry}`.toLowerCase();
                
                let matchesKw = true;
                if (keyword && keyword.trim().length > 0) {
                    matchesKw = searchString.includes(keyword.toLowerCase());
                }
                
                let matchesCity = true;
                if (city && city.trim().length > 0) {
                    matchesCity = cityString.includes(city.toLowerCase());
                }

                let matchesCountry = true;
                if (country && country.trim().length > 0) {
                    matchesCountry = cityString.includes(country.toLowerCase());
                }
                
                if (matchesKw && matchesCity && matchesCountry && name) {
                    const phone = data.contact?.phone || data.phone || data.phoneNumber || "No disponible";
                    const email = data.contact?.email || data.email || "No disponible";
                    const fullAddress = `${data.address?.street || data.street || ''}, ${address}`;
                    
                    results.push(`EMPRESA: ${name}\nCATEGORÍA: ${category}\nUBICACIÓN: ${fullAddress}\nCONTACTO: ${phone} / ${email}\nINFO: ${desc.substring(0, 150)}...\n---`);
                }
            };

            businessesSnap.forEach(doc => processSearch(doc, 'businesses'));
            clientsSnap.forEach(doc => processSearch(doc, 'clients'));

            if (results.length === 0) {
                return JSON.stringify({ success: true, message: "No se encontraron empresas con esos criterios en el directorio." });
            }

            // Limit to 10 results to prevent context bloat
            const truncated = results.slice(0, 10);
            return JSON.stringify({ 
                success: true, 
                count: results.length,
                data: truncated.join('\n') 
            });
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
