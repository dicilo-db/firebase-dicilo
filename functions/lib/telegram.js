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
exports.telegramWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const telegraf_1 = require("telegraf");
const params_1 = require("firebase-functions/params");
const openai_1 = require("openai");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
// Define secrets
const telegramToken = (0, params_1.defineSecret)("TELEGRAM_TOKEN");
const openaiApiKey = (0, params_1.defineSecret)("OPENAI_API_KEY");
// Initialize Firebase Admin lazily
let dbInstance = null;
const getDb = () => {
    if (!dbInstance) {
        if ((0, app_1.getApps)().length === 0) {
            (0, app_1.initializeApp)();
        }
        dbInstance = (0, firestore_1.getFirestore)();
    }
    return dbInstance;
};
// Initialize Bot and OpenAI lazily
let bot = null;
let openai = null;
const getBot = () => {
    if (bot)
        return bot;
    const token = telegramToken.value();
    if (!token) {
        throw new Error("TELEGRAM_TOKEN secret is not set");
    }
    bot = new telegraf_1.Telegraf(token);
    // Basic commands
    bot.start((ctx) => {
        ctx.reply("¡Hola! Soy tu asistente inteligente de Dicilo. 🚀\n\nPuedes preguntarme sobre empresas, productos o servicios en nuestra red. ¿En qué puedo ayudarte hoy?");
    });
    bot.help((ctx) => {
        ctx.reply("Puedo ayudarte a encontrar lo que buscas en Dicilo.\n\nEjemplos:\n- ¿Dónde puedo comer pizza?\n- Busco un dentista en el centro.\n- ¿Qué ofertas hay hoy?");
    });
    // Handle text messages with AI
    bot.on("text", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        // @ts-ignore
        const userQuery = ctx.message.text;
        const chatId = (_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id;
        try {
            yield ctx.sendChatAction("typing");
            // 1. Search for relevant businesses in Firestore
            const businesses = yield searchBusinesses(userQuery);
            // 2. Generate response with OpenAI
            const aiResponse = yield generateAIResponse(userQuery, businesses);
            yield ctx.reply(aiResponse);
        }
        catch (error) {
            logger.error("Error processing message", error);
            yield ctx.reply("Lo siento, tuve un problema al procesar tu solicitud. Inténtalo de nuevo más tarde.");
        }
    }));
    bot.catch((err, ctx) => {
        logger.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
    });
    return bot;
};
const getOpenAI = () => {
    if (openai)
        return openai;
    const apiKey = openaiApiKey.value();
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY secret is not set");
    }
    openai = new openai_1.OpenAI({ apiKey });
    return openai;
};
// Helper function to search businesses (Simple RAG)
function searchBusinesses(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = getDb();
        // In a real production scenario, use a dedicated search engine like Algolia, Typesense, or Firestore Vector Search.
        // For this MVP, we'll fetch a subset of businesses. 
        // Optimization: We could filter by category if we extract it from the query first.
        try {
            const snapshot = yield db.collection("businesses").limit(20).get();
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
        }
        catch (error) {
            logger.error("Error searching businesses", error);
            return [];
        }
    });
}
function generateAIResponse(query, context) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const completion = yield openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query }
                ],
                temperature: 0.7,
            });
            return completion.choices[0].message.content || "Lo siento, no pude generar una respuesta.";
        }
        catch (error) {
            logger.error("Error generating AI response", error);
            return "Lo siento, mi cerebro está un poco lento hoy. ¿Puedes preguntar de nuevo?";
        }
    });
}
// Export the webhook function
exports.telegramWebhook = (0, https_1.onRequest)({ secrets: [telegramToken, openaiApiKey], region: "europe-west1" }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const botInstance = getBot();
        yield botInstance.handleUpdate(req.body, res);
    }
    catch (e) {
        logger.error("Error handling update", e);
        res.status(500).send("Error handling update: " + e.message);
    }
}));
