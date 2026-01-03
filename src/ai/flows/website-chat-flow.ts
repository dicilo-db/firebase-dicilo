import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendMessageTool, calendarTool, retrieveCompanyInfoTool } from '@/ai/tools';
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
    async (input) => {
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
                uiComponent: 'SHARE_BUTTONS'
            };
        }


        // ---------------------------------------------------------
        // FLUJO NORMAL (Si no es solo un email)
        // ---------------------------------------------------------
        // 1. Cargar Contextos
        const historyText = await getSessionHistory(effectiveSessionId, 30);
        let dynamicContext = await getDynamicKnowledgeContext();
        if (input.context) dynamicContext += "\n\n[DOCS ADICIONALES]:\n" + input.context;

        // 2. System Prompt (CON LÓGICA RESTRICTIVA + IDIOMA FORZADO)
        const systemPrompt = `
ROL: Agente DiciBot.

=== 🌍 REGLA DE ORO: IDIOMA ===
El usuario manda: "${input.question}"
1. IDENTIFICA el idioma de esa frase.
2. RESPONDE SOLAMENTE EN ESE IDIOMA.
3. SI el contexto está en otro idioma (ej: Alemán) y el usuario pregunta en Español -> TRADUCE EL CONTENIDO.

Ejemplos de Comportamiento Obligatorio:
- Contexto: "Travelposting ist ein Unternehmen..." (Alemán)
- User Input: "¿Qué hace Travelposting?" (Español)
- Tu Respuesta: "Travelposting es una empresa de viajes..." (TRADUCIDO AL ESPAÑOL)

=== 🔍 POLITICA DE RECOMENDACIONES ===
Si encuentras un negocio que coincide en CATEGORÍA ("Agencia de Viajes") pero te faltan detalles específicos ("Familiar", "Alemania"):
1. NO digas "no tengo nada".
2. OFRECE la opción que tienes CON SUS DATOS (si los ves): "Encontré 'Club Inviajes' (Tel: ...). Es una agencia. Podríamos consultar..."
3. SIEMPRE intenta conectar al usuario con el negocio disponible.

<MEMORIA_RECIENTE>
${historyText}
</MEMORIA_RECIENTE>

<CONTEXTO_CONOCIMIENTO>
${dynamicContext}
</CONTEXTO_CONOCIMIENTO>

<SCRIPT_DICICOIN>
${DICICOIN_SCRIPT}
</SCRIPT_DICICOIN>

=== 🛑 REGLAS DE ACCIÓN (PRIORIDAD 2) ===

1. **BÚSQUEDA Y DETALLES (PRIORIDAD TÉCNICA):**
   - SIEMPRE que el usuario busque un servicio ("Busco abogados", "Agencia de viajes") o pregunte detalles:
   - **ESCANEA** el [DIRECTORY] buscando coincidencias de palabras clave en el NOMBRE o CATEGORÍA.
   - **EJEMPLO:** Si busca "viajes" y ves "Inviajes" o "Reisen" -> **ES UN MATCH.**
   - **ACCIÓN:** USA LA TOOL 'retrieveCompanyInfo' con el nombre del candidato OBLIGATORIAMENTE antes de decir que no existe.

2. **FALTA DE DATOS (CRÍTICO):**
   - Si piden enviar ("Senden") pero NO hay email en el historial:
     - **PROHIBIDO:** Decir "No puedo".
     - **ÚNICA ACCIÓN:** Preguntar "¿A qué email te lo envío?" (En el idioma del usuario).

3. **DICICOIN:**
   - Si preguntan qué es, traduce el <SCRIPT_DICICOIN> al idioma del usuario y úsalo.
`;

        let currentPrompt = `${systemPrompt}\n\nUSER INPUT: "${input.question}"\n(DETECT LANGUAGE OF INPUT -> ANSWER IN THAT LANGUAGE)`;

        // 3. Generación Inicial (Baja temperatura para obedecer reglas negativas)
        let response = await ai.generate({
            model: gemini20Flash,
            prompt: currentPrompt,
            tools: [sendMessageTool, calendarTool, retrieveCompanyInfoTool],
            config: { temperature: 0.4 }
        });

        let showShareButtons = false;
        let turns = 0;

        // 4. Bucle de Ejecución
        while (response.toolRequests && response.toolRequests.length > 0 && turns < 5) {
            // Genkit response parts access fix
            const toolPart = response.toolRequests[0];
            const toolName = toolPart.toolRequest.name;
            const toolInput = toolPart.toolRequest.input;

            if (toolName === 'sendMessage') showShareButtons = true;

            console.log(`[DiciBot] Ejecutando Tool: ${toolName}`);

            let toolResultContent: any = "Error";
            try {
                if (toolName === 'sendMessage') toolResultContent = await sendMessageTool.run(toolInput as any);
                if (toolName === 'calendar') toolResultContent = await calendarTool.run(toolInput as any);
                if (toolName === 'retrieveCompanyInfo') toolResultContent = await retrieveCompanyInfoTool.run(toolInput as any);
            } catch (e: any) {
                toolResultContent = JSON.stringify({ success: false, error: e.message });
            }

            if (toolName === 'retrieveCompanyInfo') {
                currentPrompt += `
                \n[SYSTEM EVENT: RAG Data Retrieved successfully]
                \n[KNOWLEDGE FOUND]: ${toolResultContent}
                \n[CRITICAL INSTRUCTION]: 
                1. DETECT Language of Original User Input: "${input.question}" 
                2. IGNORE the language of the [KNOWLEDGE FOUND] (it might be German/English).
                3. CONSTRUCT your valid Final Answer SOLELY in the language of the User Input.
                4. Use the facts from [KNOWLEDGE FOUND].`;
            } else {
                currentPrompt += `
                \n[SYSTEM EVENT: Tool '${toolName}' executed. Result: ${toolResultContent}.]
                \n[INSTRUCTION: Translate the status result to the USER'S LANGUAGE (${input.question}) and explain it politely.]`;
            }

            // Segunda generación (Temp media para naturalidad en la respuesta final)
            response = await ai.generate({
                model: gemini20Flash,
                prompt: currentPrompt,
                tools: [sendMessageTool, calendarTool, retrieveCompanyInfoTool],
                config: { temperature: 0.3 }
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
