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
        // 2. System Prompt (CON LÓGICA RESTRICTIVA + IDIOMA FORZADO)
        // Reducimos historial a 10 items (5 turnos de pregunta/respuesta) para evitar alucinaciones con contexto viejo
        const historyText = await getSessionHistory(effectiveSessionId, 10);
        let dynamicContext = await getDynamicKnowledgeContext();
        if (input.context) dynamicContext += "\n\n[DOCS ADICIONALES]:\n" + input.context;

        const systemPrompt = `
ROL: Agente DiciBot.

<CONTEXTO_CONOCIMIENTO>
${dynamicContext}
</CONTEXTO_CONOCIMIENTO>

<MEMORIA_RECIENTE>
${historyText}
</MEMORIA_RECIENTE>

<SCRIPT_DICICOIN>
${DICICOIN_SCRIPT}
</SCRIPT_DICICOIN>

=== 🧠 REGLA DE ATENCIÓN (FRESH START) ===
- Analiza el "INPUT DEL USUARIO" actual por sí mismo.
- Si el usuario cambia de tema (ej: estaba hablando de "Travelposting" y ahora dice "quiero viajar a Hamburgo"), IGNORA el fracaso anterior.
- NO repitas "No encontré X" si el usuario ya no pregunta por X. ¡Busca lo nuevo!

=== ⚠️ REGLAS NEGATIVAS (PROHIBICIONES) ===
1. [MODO SILENCIO]: PROHIBIDO DECIR "Voy a usar la herramienta...". ¡Simplemente úsala!
2. [NO INVENTAR]: Si no hay empresas de ese tipo en [CONTEXTO_CONOCIMIENTO], di "No encuentro coincidencias exactas en el directorio, pero puedo buscar otros servicios".
3. [IDIOMA]: PROHIBIDO hablar en un idioma diferente al del usuario.

=== 🌍 PROTOCOLO DE IDIOMA (PRIORIDAD MÁXIMA) ===
- INPUT DEL USUARIO: "${input.question}"
- TU TAREA: Detecta el idioma del input. 
- RESPUESTA: TODA tu salida debe estar EN ESE MISMO IDIOMA.
- TRADUCCIÓN OBLIGATORIA: Si lees datos en alemán/inglés de la base de datos, TRADÚCELOS antes de hablar.
- EJEMPLO: Si el usuario pregunta en Español y la ficha dice "Zahnklinik Hamburg", tú respondes: "Aquí tienes una Clínica Dental en Hamburgo..."

=== 🔍 ESTRATEGIA DE BÚSQUEDA ===
1. Si el usuario busca Categoría ("Dentista", "Abogado", "Viaje") -> ESCANEA el [CONTEXTO_CONOCIMIENTO].
2. Si ves algo relevante -> EJECUTA 'retrieveCompanyInfo' con el nombre de esa empresa.
3. Si el usuario pregunta "¿Dónde está...?" o "¿Dirección de...?" -> ¡OBLIGATORIO USAR 'retrieveCompanyInfo'!
4. NO preguntes "¿Cuál nombre?" si ya ves candidatos probables.

=== 🔗 FORMATO DE ENLACES ===
- Cuando menciones una UBICACIÓN o DIRECCIÓN (aunque sea solo CIUDAD), DEBES convertirla en un enlace de Google Maps.
- Formato: [Ubicación](https://www.google.com/maps/search/?api=1&query=Ubicación)
- Ejemplo: [Musterstraße 123, Hamburgo](https://www.google.com/maps/search/?api=1&query=Musterstraße+123,+Hamburgo)

=== ⚠️ REGLA DE "DIRECCIÓN EXACTA" ===
- Si la base de datos solo dice "Hamburg, Germany", **ESA ES LA DIRECCIÓN**.
- NO digas "no tengo la dirección exacta".
- Di: "Está ubicada en [Hamburg, Germany](...)."
- ¡Cualquier ubicación geográfica cuenta como dirección!
`;

        let currentPrompt = `${systemPrompt}\n\nUSER INPUT: "${input.question}"\n\n[SYSTEM]: REPLY IN THE LANGUAGE OF THE USER INPUT ONLY. TRANSLATE DATA IF NEEDED.`;

        // 3. Generación Inicial
        let response = await ai.generate({
            model: gemini20Flash,
            prompt: currentPrompt,
            tools: [sendMessageTool, calendarTool, retrieveCompanyInfoTool],
            config: { temperature: 0.2 }
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
                \n[KNOWLEDGE FOUND (RAW DATA, DO NOT COPY LANGUAGE)]: ${toolResultContent}
                \n[FINAL INSTRUCTION]: 
                You have retrieved detailed data. Now you must ANSWER the user's question "${input.question}".
                
                CRITICAL LANGUAGE RULE:
                1. The USER speaks: "${input.question}" (Detect Language!).
                2. The DATA is likely in German/English.
                3. YOU MUST TRANSLATE the key concepts from the DATA into the USER'S LANGUAGE.
                4. DO NOT OUTPUT GERMAN if the user spoke Spanish.
                5. Answer directly.`;
            } else {
                currentPrompt += `
                \n[SYSTEM EVENT: Tool '${toolName}' executed. Result: ${toolResultContent}.]
                \n[INSTRUCTION: Translate the result to the language of "${input.question}" and explain it politely.]`;
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
