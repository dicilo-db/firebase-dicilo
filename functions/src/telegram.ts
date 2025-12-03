import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { Telegraf, Context } from "telegraf";
import { defineSecret } from "firebase-functions/params";
import { OpenAI } from "openai";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Define secrets
const telegramToken = defineSecret("TELEGRAM_TOKEN");
const openaiApiKey = defineSecret("OPENAI_API_KEY");

// Initialize Firebase Admin lazily
let dbInstance: FirebaseFirestore.Firestore | null = null;
const getDb = () => {
    if (!dbInstance) {
        if (getApps().length === 0) {
            initializeApp();
        }
        dbInstance = getFirestore();
    }
    return dbInstance;
};

// Initialize Bot and OpenAI lazily
let bot: Telegraf | null = null;
let openai: OpenAI | null = null;

const getBot = () => {
    if (bot) return bot;

    const token = telegramToken.value();
    if (!token) {
        throw new Error("TELEGRAM_TOKEN secret is not set");
    }

    bot = new Telegraf(token);

    // Basic commands
    bot.start((ctx: Context) => {
        ctx.reply("¡Hola! Soy tu asistente inteligente de Dicilo. 🚀\n\nPuedes preguntarme sobre empresas, productos o servicios en nuestra red. ¿En qué puedo ayudarte hoy?");
    });

    bot.help((ctx: Context) => {
        ctx.reply("Puedo ayudarte a encontrar lo que buscas en Dicilo.\n\nEjemplos:\n- ¿Dónde puedo comer pizza?\n- Busco un dentista en el centro.\n- ¿Qué ofertas hay hoy?");
    });

    // Handle text messages with AI
    bot.on("text", async (ctx: Context) => {
        // @ts-ignore
        const userQuery = ctx.message.text;
        const chatId = ctx.chat?.id;

        try {
            await ctx.sendChatAction("typing");

            // 1. Search for relevant businesses in Firestore
            const businesses = await searchBusinesses(userQuery);

            // 2. Generate response with OpenAI
            const aiResponse = await generateAIResponse(userQuery, businesses);

            await ctx.reply(aiResponse);
        } catch (error) {
            logger.error("Error processing message", error);
            await ctx.reply("Lo siento, tuve un problema al procesar tu solicitud. Inténtalo de nuevo más tarde.");
        }
    });

    bot.catch((err: any, ctx: Context) => {
        logger.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
    });

    return bot;
};

const getOpenAI = () => {
    if (openai) return openai;
    const apiKey = openaiApiKey.value();
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY secret is not set");
    }
    openai = new OpenAI({ apiKey });
    return openai;
};

// Helper function to search businesses (Simple RAG)
async function searchBusinesses(query: string): Promise<any[]> {
    const db = getDb();
    // In a real production scenario, use a dedicated search engine like Algolia, Typesense, or Firestore Vector Search.
    // For this MVP, we'll fetch a subset of businesses. 
    // Optimization: We could filter by category if we extract it from the query first.

    try {
        const snapshot = await db.collection("businesses").limit(20).get();
        const businesses = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name,
                category: data.category,
                description: data.description,
                address: data.address,
                offer: data.currentOfferUrl ? "Tiene oferta activa" : "Sin oferta actual"
            };
        });
        return businesses;
    } catch (error) {
        logger.error("Error searching businesses", error);
        return [];
    }
}

async function generateAIResponse(query: string, context: any[]): Promise<string> {
    const openai = getOpenAI();

    const systemPrompt = `
    Eres un asistente útil y amable para "Dicilo", una red de empresas locales.
    Tu objetivo es ayudar a los usuarios a encontrar empresas, productos o servicios basándote en la información proporcionada.
    
    Reglas:
    1. Usa SOLO la información proporcionada en el CONTEXTO para responder.
    2. Si no encuentras información relevante en el contexto, di amablemente que no tienes esa información por ahora.
    3. Sé conciso pero amigable. Usa emojis ocasionalmente.
    4. Si recomiendas una empresa, menciona su nombre y dirección si está disponible.
    
    CONTEXTO DE EMPRESAS:
    ${JSON.stringify(context)}
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query }
            ],
            temperature: 0.7,
        });

        return completion.choices[0].message.content || "Lo siento, no pude generar una respuesta.";
    } catch (error) {
        logger.error("Error generating AI response", error);
        return "Lo siento, mi cerebro está un poco lento hoy. ¿Puedes preguntar de nuevo?";
    }
}

// Export the webhook function
export const telegramWebhook = onRequest(
    { secrets: [telegramToken, openaiApiKey], region: "europe-west1" },
    async (req, res) => {
        try {
            const botInstance = getBot();
            await botInstance.handleUpdate(req.body, res);
        } catch (e: any) {
            logger.error("Error handling update", e);
            res.status(500).send("Error handling update: " + e.message);
        }
    }
);
