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
// Define the secret for the Telegram token
const telegramToken = (0, params_1.defineSecret)("TELEGRAM_TOKEN");
// We need to initialize the bot lazily because the secret is only available at runtime
let bot = null;
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
        ctx.reply("Welcome to Dicilo Intelligent Interface! 🚀\nI am your personal assistant for the Dicilo Network.\n\nTry asking me about companies or products.");
    });
    bot.help((ctx) => {
        ctx.reply("I can help you find companies, products, and travel packages.\n\nCommands:\n/start - Restart the bot\n/help - Show this help message");
    });
    // Handle text messages
    bot.on("text", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        // @ts-ignore
        const text = ctx.message.text;
        // Placeholder for AI logic
        yield ctx.reply(`You said: "${text}".\n\nI am currently in training mode. Soon I will be able to answer your questions using the Dicilo Brain! 🧠`);
    }));
    bot.catch((err, ctx) => {
        logger.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
    });
    return bot;
};
// Export the webhook function
exports.telegramWebhook = (0, https_1.onRequest)({ secrets: [telegramToken], region: "europe-west1" }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const botInstance = getBot();
        yield botInstance.handleUpdate(req.body, res);
    }
    catch (e) {
        logger.error("Error handling update", e);
        res.status(500).send("Error handling update: " + e.message);
    }
}));
