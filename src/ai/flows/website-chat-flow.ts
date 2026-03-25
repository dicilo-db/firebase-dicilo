import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendMessageTool, calendarTool, searchBusinessDirectoryTool } from '@/ai/tools';
import { gemini20Flash } from '@genkit-ai/googleai';
import { getDynamicKnowledgeContext } from '@/ai/data/knowledge-retriever';
import { getSessionHistory, saveInteraction } from '@/lib/chat-history';
import { DICICOIN_SCRIPT } from '@/ai/data/scripts';

// Esquemas
const WebsiteChatInputSchema = z.object({
    question: z.string(),
    sessionId: z.string().optional(),
    context: z.string().optional(),
    // Optional compatibility fields if needed by caller
    userId: z.string().optional(),
});

const WebsiteChatOutputSchema = z.object({
    answer: z.string(),
    uiComponent: z.enum(['NONE', 'SHARE_BUTTONS', 'CALENDAR_WIDGET']).optional(),
});

export async function websiteChat(input: z.infer<typeof WebsiteChatInputSchema>) {
    // Ensure sessionId is populated if missing
    if (!input.sessionId && input.userId) {
        input.sessionId = input.userId;
    }
    const result = await websiteChatFlow(input);
    return result;
}

const websiteChatFlow = ai.defineFlow(
    {
        name: 'websiteChatFlow',
        inputSchema: WebsiteChatInputSchema,
        outputSchema: WebsiteChatOutputSchema,
    },
    async (input: z.infer<typeof WebsiteChatInputSchema>) => {
        // 0. ID DE SESIÓN
        const effectiveSessionId = input.sessionId || input.userId || 'unknown-session';

        // ---------------------------------------------------------
        // TRAMPA DETERMINISTA DE EMAIL (Para romper bucles)
        // ---------------------------------------------------------
        // Si el usuario manda algo que parece un email (y es corto),
        // ASUMIMOS que es para completar el envío pendiente.
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
        const emailMatch = input.question.match(emailRegex);
        const isEmailInput = !!emailMatch && input.question.length < 100;

        if (isEmailInput) {
            const userEmail = emailMatch[0];
            console.log(`[DiciBot] Email detectado por Regex: ${userEmail}. Ejecutando envío Forzoso.`);

            let toolResultContent: any;
            try {
                // Ejecución directa, sin preguntar a la IA
                toolResultContent = await sendMessageTool.run({
                    channel: 'email',
                    contactInfo: userEmail,
                    messageBody: "(Envío solicitado por chat)",
                    userName: "Usuario"
                });
            } catch (e: any) {
                toolResultContent = JSON.stringify({ success: false, error: e.message });
            }

            // Generar respuesta final (Traducción del resultado)
            const resultPrompt = `
ROL: DiciBot.
SITUACIÓN: El usuario acaba de dar su email (${userEmail}) para recibir información.
ACCIÓN REALIZADA: El sistema YA ejecutó el envío.
RESULTADO TÉCNICO: ${JSON.parse(JSON.stringify(toolResultContent))}

TU TAREA:
1. Dile al usuario el resultado (Éxito o Error) basado en "RESULTADO TÉCNICO".
2. IMPRESCINDIBLE: Responde en el MISMO IDIOMA que el usuario venía usando en la sesión anterior (o detecta por el contexto).
3. Sé breve y amable. No uses Markdown complejo.
`;
            // Recuperamos historial breve solo para contexto de idioma si es necesario
            const prevHistory = await getSessionHistory(effectiveSessionId, 5);

            const response = await ai.generate({
                model: gemini20Flash,
                prompt: `${resultPrompt}\n\nCONTEXTO PREVIO:\n${prevHistory}`,
                config: { temperature: 0.3 }
            });

            const finalText = response.text;
            await saveInteraction(effectiveSessionId, input.question, finalText);

            return {
                answer: finalText,
                uiComponent: 'SHARE_BUTTONS' as const
            };
        }


        // ---------------------------------------------------------
        // FLUJO NORMAL (Si no es solo un email)
        // ---------------------------------------------------------
        // 1. Cargar Contextos
        // 2. System Prompt (CON LÓGICA RESTRICTIVA + IDIOMA FORZADO)
        // Reducimos historial a 10 items (5 turnos de pregunta/respuesta) para evitar alucinaciones con contexto viejo
        const historyText = await getSessionHistory(effectiveSessionId, 10);
        let dynamicContext = await getDynamicKnowledgeContext();
        if (input.context) dynamicContext += "\n\n[DOCS ADICIONALES]:\n" + input.context;

        const systemPrompt = `
ROL: Agente DiciBot, el Asistente Inteligente de Dicilo.net.
PERSONALIDAD: Eres cálido, proactivo, tienes "vida" y muestras empatía con los usuarios. Piensas rápido, das respuestas claras y amables. Conoces Dicilo.net a la perfección.

<CONTEXTO_CONOCIMIENTO_GLOBAL_Y_PLANES>
${dynamicContext}
</CONTEXTO_CONOCIMIENTO_GLOBAL_Y_PLANES>

<MEMORIA_RECIENTE>
${historyText}
</MEMORIA_RECIENTE>

<SCRIPT_DICICOIN>
${DICICOIN_SCRIPT}
</SCRIPT_DICICOIN>

=== 🧠 REGLA DE ATENCIÓN (FRESH START) ===
- Analiza la intención actual del usuario con mucha agudeza.
- Si el usuario pregunta cosas generales sobre Dicilo, mira el CONTEXTO_CONOCIMIENTO_GLOBAL_Y_PLANES (ahí están todas las FAQs y Planes).

=== ⚠️ REGLAS Y RESTRICCIONES ===
1. [MODO SILENCIO METADATOS]: NUNCA digas "Voy a usar la herramienta...". ¡Úsala y ya!
2. Si el usuario busca Categorías, Empresas, o cualquier negocio de terceros en el mundo real -> ¡USA LA HERRAMIENTA 'searchBusinessDirectory' INMEDIATAMENTE! No asumas que no existe solo porque no lo ves en tu contexto estático. Recuerda que no tienes todo el directorio en la memoria; debes consultar la herramienta.
3. [IDIOMA]: Mimetízate con el idioma del usuario. Si pregunta en español, tu empatía debe fluir en español puro y cálido. Si está en alemán, habla un alemán cortés.

=== 🌍 PROTOCOLO DE IDIOMA E INTERNACIONALIZACIÓN ===
- INPUT DEL USUARIO: "${input.question}"
- Detecta el idioma y asegúrate de que toda tu salida respete ese idioma.

=== 🔗 FORMATO DE ENLACES PARA EMPRESAS ===
- Si encuentras y recomiendas una EMPRESA usando 'searchBusinessDirectory', enlaza su Ubicación así:
- [Hamburgo](https://www.google.com/maps/search/?api=1&query=Hamburgo)
`;

        let currentPrompt = `${systemPrompt}\n\nUSER INPUT: "${input.question}"\n\n[SYSTEM]: REPLY IN THE LANGUAGE OF THE USER INPUT ONLY. BE WARM, EMPATHETIC AND DIRECT. TRANSLATE DATA IF NEEDED.`;

        // 3. Generación Inicial
        let response = await ai.generate({
            model: gemini20Flash,
            prompt: currentPrompt,
            tools: [sendMessageTool, calendarTool, searchBusinessDirectoryTool],
            config: { temperature: 0.3 }
        });

        let showShareButtons = false;
        let turns = 0;

        // 4. Bucle de Ejecución
        while (response.toolRequests && response.toolRequests.length > 0 && turns < 5) {
            const toolPart = response.toolRequests[0];
            const toolName = toolPart.toolRequest.name;
            const toolInput = toolPart.toolRequest.input;

            if (toolName === 'sendMessage') showShareButtons = true;

            console.log(`[DiciBot] Ejecutando Tool: ${toolName}`);

            let toolResultContent: any = "Error";
            try {
                if (toolName === 'sendMessage') toolResultContent = await sendMessageTool.run(toolInput as any);
                if (toolName === 'calendar') toolResultContent = await calendarTool.run(toolInput as any);
                if (toolName === 'searchBusinessDirectory') toolResultContent = await searchBusinessDirectoryTool.run(toolInput as any);
            } catch (e: any) {
                toolResultContent = JSON.stringify({ success: false, error: e.message });
            }

            if (toolName === 'searchBusinessDirectory') {
                currentPrompt += `
                \n[SYSTEM EVENT: Búsqueda RAG en el Directorio completada]
                \n[RESULTADOS DE LA BASE DE DATOS]: ${toolResultContent}
                \n[INSTRUCCIÓN FINAL]: 
                Basado estrictamente en estos resultados, responde con empatía y precisión a la consulta del usuario. Si no hay empresas, ofrécele ayuda con otros servicios. Si hay empresas, recomiéndalas con entusiasmo.`;
            } else {
                currentPrompt += `
                \n[SYSTEM EVENT: Herramienta '${toolName}' ejecutada. Resultado: ${toolResultContent}.]
                \n[INSTRUCCIÓN: Traduce el resultado al idioma de "${input.question}" y explícalo amablemente.]`;
            }

            // Segunda generación (Temp un poco más alta para naturalidad)
            response = await ai.generate({
                model: gemini20Flash,
                prompt: currentPrompt,
                tools: [sendMessageTool, calendarTool, searchBusinessDirectoryTool],
                config: { temperature: 0.4 }
            });

            turns++;
        }

        // 5. Fallback Share Buttons
        const lowerQ = input.question.toLowerCase();
        if (lowerQ.includes('share') || lowerQ.includes('teilen') || lowerQ.includes('compartir') || showShareButtons) {
            showShareButtons = true;
        }

        // 6. Guardar y Salir
        const finalAnswerText = response.text;
        await saveInteraction(effectiveSessionId, input.question, finalAnswerText);

        return {
            answer: finalAnswerText,
            uiComponent: showShareButtons ? 'SHARE_BUTTONS' as const : 'NONE' as const
        };
    }
);
