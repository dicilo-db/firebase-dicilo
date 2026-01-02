import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendMessageTool, calendarTool } from '@/ai/tools';
import { gemini20Flash } from '@genkit-ai/googleai';
import { getDynamicKnowledgeContext, getClientDeepKnowledge } from '@/ai/data/knowledge-retriever';
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
const AnalysisSchema = z.object({
    intent: z.enum(['INFO_QUERY', 'ACTION_REQUEST', 'DATA_INPUT', 'GREETING']),
    targetCompanyName: z.string().nullable().describe("Nombre de la EMPRESA/CLIENTE por la que pregunta el usuario (ej: 'Travelposting', 'HörComfort'). Null si no pregunta por empresa."),
    extractedName: z.string().nullable().describe("Nombre del USUARIO (Humano) si aparece en el mensaje actual. Null si no se sabe."),
    extractedEmail: z.string().nullable().describe("Email del USUARIO si aparece. Null si no se sabe."),
    actionNeeded: z.enum(['NONE', 'SEND_MESSAGE', 'CALENDAR']).describe("Si el usuario quiere enviar algo o agendar."),
    missingFields: z.array(z.string()).describe("Lista de campos que faltan para ejecutar la acción ('name', 'email', 'date')."),
    finalResponseText: z.string().describe("La respuesta preliminar que se le daría al usuario."),
    emailContentSummary: z.string().optional().describe("Resumen del contenido que el usuario pidió enviar."),
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
        // 1. Contexto Inicial (Global + Directorio Ligero)
        let baseContext = await getDynamicKnowledgeContext();
        if (input.context) baseContext += "\n\n[DOCS ADICIONALES]:\n" + input.context;
        const historyText = input.history?.join("\n") || "";

        // 2. PROMPT DE ANÁLISIS (Fase 1: Identificación)
        const analysisPrompt = `
Eres el "Cerebro Analítico" de DiciBot. Analiza y extrae entidades.

<CONTEXTO_DIRECTORIO>
${baseContext}
</CONTEXTO_DIRECTORIO>

<HISTORIAL>
${historyText}
</HISTORIAL>

<INPUT_ACTUAL>
"${input.question}"
</INPUT_ACTUAL>

=== INSTRUCCIONES ===
1. **IDIOMA**: Responde en el idioma del usuario.
2. **IDENTIFICAR EMPRESA**: 
   - Si el usuario menciona explícitamente una empresa, extráela en 'targetCompanyName'.
   - **CRÍTICO - CONTEXTO HISTÓRICO**: Si el usuario pregunta de forma implícita (ej: "¿dónde queda?", "dame más info", "su teléfono") y en el <HISTORIAL> reciente se estaba hablando de una empresa, **ASUME** que se refiere a esa misma empresa y pon su nombre en 'targetCompanyName'.
   - Si no hay empresa clara, devuelve null.
3. **IDENTIFICAR USUARIO**: Si el usuario dice "Soy Nilo", 'extractedName' = "Nilo".
4. **FORMATO**: Devuelve JSON exacto.
`;

        // 3. EJECUTAR EL CEREBRO (Fase 1)
        const analysis = await ai.generate({
            model: gemini20Flash,
            prompt: analysisPrompt,
            output: { schema: AnalysisSchema },
            config: { temperature: 0.1 }
        });

        const thoughtProcess = analysis.output;
        if (!thoughtProcess) return { answer: "Error interno de procesamiento de IA." };

        console.log("🧠 FASE 1 (Analisis):", { intent: thoughtProcess.intent, target: thoughtProcess.targetCompanyName, user: thoughtProcess.extractedName });

        // 4. LÓGICA DE PROFUNDIDAD (DEEP DIVE RGA)
        // Si detectamos una empresa objetivo, buscamos su conocimiento profundo (PDFs, Snippets)
        let deepContext = "";
        if (thoughtProcess.targetCompanyName) {
            console.log(`🔎 [RGA] Buscando conocimiento profundo para: ${thoughtProcess.targetCompanyName}`);
            deepContext = await getClientDeepKnowledge(thoughtProcess.targetCompanyName);
        }

        // 5. GENERACIÓN DE RESPUESTA FINAL
        // Si encontramos info profunda, o si simplemente queremos refinar la respuesta,
        // podríamos volver a llamar al LLM con el contexto completo.
        // PERO para ahorrar latencia, si NO hay deepContext, usamos la 'finalResponseText' de Fase 1.
        // SI hay deepContext, DEBEMOS regenerar la respuesta para incluir los detalles del PDF.

        let finalAnswer = thoughtProcess.finalResponseText;

        if (deepContext) {
            console.log("💡 [RGA] Regenerando respuesta con Deep Context...");
            // Fase 2: Generación con Contexto Rico
            const deepPrompt = `
ACTÚA COMO: Agente Experto de Katei/Dicilo.
TAREA: Responder la pregunta del usuario usando el CONOCIMIENTO PROFUNDO encontrado.

<CONOCIMIENTO_PROFUNDO_PARA_${thoughtProcess.targetCompanyName?.toUpperCase()}>
${deepContext}
</CONOCIMIENTO_PROFUNDO_PARA_${thoughtProcess.targetCompanyName?.toUpperCase()}>

<CONTEXTO_GLOBAL>
${baseContext}
</CONTEXTO_GLOBAL>

<PREGUNTA_USUARIO>
"${input.question}"
</PREGUNTA_USUARIO>

<HISTORIAL>
${historyText}
</HISTORIAL>

INSTRUCCIONES:
1. Usa la información de CONOCIMIENTO PROFUNDO (PDFs, Hechos) para dar una respuesta detallada y precisa.
2. Si la info está en el PDF, cítala naturalmente (no digas "según el PDF").
3. Mantén el tono servicial y profesional.
4. Si el usuario pidió contactar, confirma que tienes los datos si aparecen en el texto profundo.
`;
            const deepGeneration = await ai.generate({
                model: gemini20Flash,
                prompt: deepPrompt,
                config: { temperature: 0.1 } // Un poco de creatividad para redactar bien el resumen del PDF
            });
            finalAnswer = deepGeneration.text;
        }


        // 6. LÓGICA DE ACCIÓN (Email / Calendar) - Igual que antes
        const isJunkData = (val: string | null) => !val || val.length < 2 || val.toLowerCase().includes('null');
        const cleanName = isJunkData(thoughtProcess.extractedName) ? null : thoughtProcess.extractedName;
        const cleanEmail = (thoughtProcess.extractedEmail && thoughtProcess.extractedEmail.includes('@') && !isJunkData(thoughtProcess.extractedEmail)) ? thoughtProcess.extractedEmail : null;

        const hasContactData = !!(cleanName && cleanEmail);
        const isSendAction = thoughtProcess.actionNeeded === 'SEND_MESSAGE';
        const saysProcessing = finalAnswer.toLowerCase().includes('procesando') || finalAnswer.toLowerCase().includes('momento');

        // Execute Action Logic
        if ((isSendAction && hasContactData) || (saysProcessing && hasContactData && thoughtProcess.actionNeeded !== 'NONE')) {
            console.log("⚡ EJECUTANDO ACCIÓN AUTOMÁTICA (RGA ENHANCED)");

            // Si tenemos Deep Context, el resumen del email debería incluirlo?
            // El brain Phase 1 no tenía el deep context para generar 'emailContentSummary'.
            // Podríamos usar 'finalAnswer' como el cuerpo del mensaje si es informativo.
            // O simplemente enviar el 'emailContentSummary' original si era bueno.
            // Mejor: Si regeneramos respuesta con Deep Context, eso es lo que el usuario ve en el chat.
            // Para el EMAIL, idealmente querríamos enviar esa misma info detallada.

            let messageBody = thoughtProcess.emailContentSummary || finalAnswer;
            if (deepContext && thoughtProcess.emailContentSummary) {
                // Append deep context hint to email body? 
                // Simple: Use the original summary + "Based on our extended files."
            }

            // ... [Rest of Tool Execution Logic - Keeping simple for this update] ...
            // (Copying existing tool execution logic briefly for safety)

            let toolResult: any = "";
            try {
                const payload = {
                    to: cleanEmail || "",
                    message: messageBody,
                    userName: cleanName || "Usuario",
                    channel: 'email'
                } as const;
                toolResult = await sendMessageTool.run(payload);

                let cleanMessage = "Acción completada.";
                if (typeof toolResult === 'string') cleanMessage = toolResult;
                else if (toolResult?.message) cleanMessage = toolResult.message;

                const prefix = cleanName ? `Listo ${cleanName}, ` : "";
                return { answer: `${prefix}${cleanMessage}` };

            } catch (e) {
                return { answer: "Hubo un error técnico al enviar el email." };
            }
        }

        // Anti-Hallucination Fallback (If Brain wanted to send but lacked data)
        const brainThinkItsReady = (thoughtProcess.missingFields.length === 0) || isSendAction;
        if (brainThinkItsReady && !hasContactData && isSendAction) {
            if (!cleanName && !cleanEmail) finalAnswer = "Para enviártelo, necesito tu nombre y tu email.";
            else if (!cleanName) finalAnswer = "Genial, tengo tu email, pero ¿me dices tu nombre?";
            else if (!cleanEmail) finalAnswer = `Gracias ${cleanName}, ¿a qué email te envío la información?`;
        }

        return { answer: finalAnswer };
    }
);
