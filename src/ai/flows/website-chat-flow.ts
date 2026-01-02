import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendMessageTool, calendarTool } from '@/ai/tools';
import { gemini20Flash } from '@genkit-ai/googleai';
import { getDynamicKnowledgeContext } from '@/ai/data/knowledge-retriever';
import { DICICOIN_SCRIPT } from '@/ai/data/scripts';

// --- ESQUEMAS DE ENTRADA/SALIDA ---
const WebsiteChatInputSchema = z.object({
    question: z.string(),
    context: z.string().optional(),
    history: z.array(z.string()).optional(),
    userId: z.string().optional(),
});

const WebsiteChatOutputSchema = z.object({
    answer: z.string(),
});

// --- ESQUEMA DEL CEREBRO (RAZONAMIENTO) ---
// Esto es lo que la IA "pensará" internamente antes de responderte
const AnalysisSchema = z.object({
    intent: z.enum(['INFO_QUERY', 'ACTION_REQUEST', 'DATA_INPUT', 'GREETING']),
    extractedName: z.string().nullable().describe("Nombre del usuario si aparece en el mensaje actual o historial reciente. Null si no se sabe."),
    extractedEmail: z.string().nullable().describe("Email del usuario si aparece. Null si no se sabe."),
    actionNeeded: z.enum(['NONE', 'SEND_MESSAGE', 'CALENDAR']).describe("Si el usuario quiere enviar algo o agendar."),
    missingFields: z.array(z.string()).describe("Lista de campos que faltan para ejecutar la acción ('name', 'email', 'date')."),
    finalResponseText: z.string().describe("La respuesta que se le dará al usuario."),
    emailContentSummary: z.string().optional().describe("Resumen del contenido que el usuario pidió enviar (ej: Info de la empresa X)."),
});

export async function websiteChat(input: z.infer<typeof WebsiteChatInputSchema>) {
    return websiteChatFlow(input);
}

const websiteChatFlow = ai.defineFlow(
    {
        name: 'websiteChatFlow',
        inputSchema: WebsiteChatInputSchema,
        outputSchema: WebsiteChatOutputSchema,
    },
    async (input) => {
        // 1. Contexto y Scripts
        let dynamicContext = await getDynamicKnowledgeContext();
        if (input.context) dynamicContext += "\n\n[DOCS]:\n" + input.context;
        const historyText = input.history?.join("\n") || "";

        // 2. PROMPT DE ANÁLISIS (EL MOTOR DE RAZONAMIENTO)
        const analysisPrompt = `
Eres el "Cerebro Analítico" de DiciBot. Tu trabajo NO es charlar, es ANALIZAR la conversación y extraer datos estructurados.

<CONTEXTO>
${dynamicContext}
</CONTEXTO>

<SCRIPT_DICICOIN>
${DICICOIN_SCRIPT}
</SCRIPT_DICICOIN>

<HISTORIAL_CONVERSACION>
${historyText}
</HISTORIAL_CONVERSACION>

<INPUT_ACTUAL>
"${input.question}"
</INPUT_ACTUAL>

=== TUS INSTRUCCIONES ===
0. **IDIOMA**: Responde SIEMPRE en el mismo idioma que el usuario.
   - Si pregunta en Español -> Responde en Español.
   - Si pregunta en Inglés -> Responde en Inglés.
   - Si es ambiguo -> Responde en Español.

1. **Analiza el Historial + Input Actual (BÚSQUEDA INTELIGENTE)**:
   - **INSENSIBLE A MAYÚSCULAS**: Si buscan "hörcomfort", debes encontrar "HörComfort". Si buscan "dicicoin", encuentra "DiciCoin".
   - **PRECISIÓN DE DATOS**: Lee con cuidado. NO mezcles datos de una empresa con la siguiente. Si "IndoRoutes" es de India y "HörComfort" está abajo, NO digas que HörComfort es de India.
   - Si el bot preguntó "¿Cuál es tu nombre?" y el usuario responde "Nilo Escolar", ENTONCES extractedName = "Nilo Escolar".
   - Si el usuario dice "Envíame info", actionNeeded = 'SEND_MESSAGE'.
   - **REDACCIÓN NATURAL**: Cuando des información de una empresa, NO uses términos internos como "sin categorizar", "premium" o "starter".
   - **FORMATO OBLIGATORIO**:
     "**[Nombre]** es una empresa en **[Ciudad]**. Puedes encontrarla en la web [Link Web]. Su correo electrónico es [Email] y su número de teléfono es [Teléfono].
     Su dirección es: [Dirección + Link a Google Maps]"
   
   - **CÓMO GENERAR EL LINK DE MAPS**:
     Debes generar el link así: [Calle, Ciudad...](https://www.google.com/maps/search/?api=1&query=Calle+Ciudad)
            Ejemplo: [Georg-Sasse-Straße 3, 22949 Ammersbek](https://www.google.com/maps/search/?api=1&query=Georg-Sasse-Straße+3,+22949+Ammersbek)

   - Si el nombre en la base de datos es "Unknown" pero el usuario preguntó por "HörComfort" y la web coincide, asume que es HörComfort.

2. ** Reglas de Contenido(Email) **:
    - Si el usuario menciona una empresa (ej: "HörComfort", "Travelposting") O si estábamos hablando de ella:
      TU OBLIGACIÓN es buscar sus datos (Web, Teléfono, Dirección) en el <CONTEXTO> y ponerlos en 'emailContentSummary'.
    - NUNCA envíes una descripción general de Dicilo si están preguntando por un cliente específico.
    - Si piden info de DiciCoin, 'emailContentSummary' debe ser el SCRIPT_DICICOIN.
    - Solo si NO hay ninguna empresa específica en la conversación, usa descripción general.

3. ** Reglas de Acción **:
    - Para 'SEND_MESSAGE', necesitas: Name y Email.
   - Si tienes ambos(Name y Email), missingFields DEBE ser un array vacío[].
   - Si falta uno, missingFields = ['email'] o['name'].
   - CRÍTICO: Si el usuario responde con el dato que faltaba, el nuevo estado tiene AMBOS.missingFields = [].No vuelvas a pedir lo mismo.

4. ** Generación de Respuesta **:
    - Si faltan datos, pide SOLO lo que falta amablemente(ej: "¿Me dices tu nombre?").
   - Si NO faltan datos y vas a ejecutar acción, tu respuesta debe ser "Un momento, procesando...".
`;

        // 3. EJECUTAR EL CEREBRO (Fase 1)
        // Usamos structuredOutput para forzar JSON. Esto elimina la "alucinación".
        const analysis = await ai.generate({
            model: gemini20Flash,
            prompt: analysisPrompt,
            output: { schema: AnalysisSchema }, // <--- LA CLAVE: Forzar estructura
            config: { temperature: 0.0 } // Lógica pura, cero creatividad
        });

        const thoughtProcess = analysis.output;

        if (!thoughtProcess) {
            return { answer: "Lo siento, tuve un error interno de procesamiento." };
        }

        console.log("🧠 CEREBRO PENSÓ:", JSON.stringify(thoughtProcess, null, 2));

        // 4. LÓGICA DE EJECUCIÓN (Fase 2)
        // Aquí el código decide, no la IA.

        // CASO A: Tenemos todo listo para una acción
        const isJunkData = (val: string | null) => !val || val.toLowerCase() === 'string' || val.toLowerCase() === 'null' || val.toLowerCase() === 'undefined' || val.length < 2;

        const cleanName = isJunkData(thoughtProcess.extractedName) ? null : thoughtProcess.extractedName;
        const cleanEmail = (thoughtProcess.extractedEmail && thoughtProcess.extractedEmail.includes('@') && !isJunkData(thoughtProcess.extractedEmail)) ? thoughtProcess.extractedEmail : null;

        const hasContactData = !!(cleanName && cleanEmail);
        const isSendAction = thoughtProcess.actionNeeded === 'SEND_MESSAGE';

        console.log("🔍 DEBUG BRAIN:", {
            rawName: thoughtProcess.extractedName,
            cleanName,
            rawEmail: thoughtProcess.extractedEmail,
            cleanEmail,
            action: thoughtProcess.actionNeeded,
            missing: thoughtProcess.missingFields
        });

        const saysProcessing = thoughtProcess.finalResponseText.toLowerCase().includes('procesando');

        // GUARDIA ANTI-ALUCINACIÓN & ANTI-STALL:
        const readyToExecute = (
            thoughtProcess.actionNeeded !== 'NONE' &&
            (
                (isSendAction && hasContactData) || // STRICT: SEND_MESSAGE requiere SI O SI data.
                (!isSendAction && thoughtProcess.missingFields.length === 0) || // Otras acciones confían en el array.
                (saysProcessing && hasContactData) // OVERRIDE: Si dice "procesando" y tenemos data, DISPARAMOS.
            )
        );

        if (readyToExecute) {

            console.log("⚡ EJECUTANDO ACCIÓN AUTOMÁTICA");

            // Construir el cuerpo del mensaje
            // Prioridad: 1. Resumen del Brain (Contextual) 2. Script DiciCoin 3. Generic
            let messageBody = thoughtProcess.emailContentSummary || "Aquí tienes la información solicitada de Dicilo.";

            // Fallback for DiciCoin if Brain missed it but context implies it
            const fullContext = (historyText + " " + input.question).toLowerCase();
            if ((fullContext.includes("dicicoin") || thoughtProcess.intent === 'INFO_QUERY') && !thoughtProcess.emailContentSummary) {
                messageBody = DICICOIN_SCRIPT;
            }

            console.log("⚡ EJECUTANDO ACCIÓN AUTOMÁTICA. Body Length:", messageBody.length);

            let toolResult: any = "";
            try {
                // Ejecutamos si es SEND_MESSAGE O si estamos forzados por el "Procesando" override
                if (thoughtProcess.actionNeeded === 'SEND_MESSAGE' || (saysProcessing && hasContactData)) {
                    // Correcting Tool Arguments to match tools.ts Schema: { to, message, channel, userName }
                    const payload = {
                        to: cleanEmail || "",
                        message: messageBody,
                        userName: cleanName || "Usuario",
                        channel: 'email'
                    } as const;

                    console.log("📤 TOOL PAYLOAD:", payload);
                    toolResult = await sendMessageTool.run(payload);
                } else if (thoughtProcess.actionNeeded === 'CALENDAR') {
                    // Mapping for calendar tool
                    toolResult = await calendarTool.run({
                        userEmail: cleanEmail || "",
                        intent: "Meeting Request",
                        proposedTime: "Por definir"
                    });
                }
                console.log("📥 TOOL RESULT:", JSON.stringify(toolResult));
            } catch (e: any) {
                console.error("Tool Execution Failed:", e);
                toolResult = { success: false, message: "Hubo un error técnico al conectar con el servicio de envíos. Por favor intenta más tarde." };
            }

            // Clean Response Logic
            // The toolResult comes from Genkit. If it fails inside the tool, it returns { success: false, message: ... }
            // We want to show a clean message, not JSON.
            let cleanMessage = "Acción completada.";
            if (typeof toolResult === 'string') {
                cleanMessage = toolResult;
            } else if (toolResult && toolResult.message) {
                cleanMessage = toolResult.message;
            } else {
                cleanMessage = "Proceso finalizado.";
            }

            const prefix = cleanName ? `Listo ${cleanName}, ` : "";
            return { answer: `${prefix}${cleanMessage}` };
        }

        // CASO B: Falta información, devolvemos la respuesta del cerebro (que debería pedir los datos)
        // PERO SI el cerebro creía que tenía datos (isSendAction=true) y nosotros los invalidamos (readyToExecute=false),
        // entonces forzamos nosotros la pregunta, porque el cerebro probablemente generó un "Un momento, procesando..."

        let finalReply = thoughtProcess.finalResponseText;

        // Detectar "Alucinación de Completitud": El cerebro cree que acabó (missingFields vacío) pero mi validación de datos basura dice que NO.
        // O si intentó enviar (isSendAction) pero no tenía datos reales.
        const brainThinkItsReady = (thoughtProcess.missingFields.length === 0) || isSendAction;

        if (brainThinkItsReady && !hasContactData) {
            console.log("⚠️ DETECTADA ALUCINACIÓN DE COMPLETITUD. Forzando pregunta.");
            // Forzar la pregunta correcta según lo que falte
            if (!cleanName && !cleanEmail) finalReply = "Para enviártelo, necesito tu nombre y tu email. ¿Me los podrías dar?";
            else if (!cleanName) finalReply = "Genial, tengo tu email, pero ¿me dices tu nombre para el mensaje?";
            else if (!cleanEmail) finalReply = `Gracias ${cleanName}, ¿a qué email te envío la información?`;
        }

        return { answer: finalReply };
    }
);
