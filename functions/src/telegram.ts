import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { Telegraf, Context } from "telegraf";
import { defineSecret } from "firebase-functions/params";

// Define the secret for the Telegram token
const telegramToken = defineSecret("TELEGRAM_TOKEN");

// We need to initialize the bot lazily because the secret is only available at runtime
let bot: Telegraf | null = null;

const getBot = () => {
    if (bot) return bot;

    const token = telegramToken.value();
    if (!token) {
        throw new Error("TELEGRAM_TOKEN secret is not set");
    }

    bot = new Telegraf(token);

    // Basic commands
    bot.start((ctx: Context) => {
        ctx.reply("Welcome to Dicilo Intelligent Interface! 🚀\nI am your personal assistant for the Dicilo Network.\n\nTry asking me about companies or products.");
    });

    bot.help((ctx: Context) => {
        ctx.reply("I can help you find companies, products, and travel packages.\n\nCommands:\n/start - Restart the bot\n/help - Show this help message");
    });

    // Handle text messages
    bot.on("text", async (ctx: Context) => {
        // @ts-ignore
        const text = ctx.message.text;

        // Placeholder for AI logic
        await ctx.reply(`You said: "${text}".\n\nI am currently in training mode. Soon I will be able to answer your questions using the Dicilo Brain! 🧠`);
    });

    bot.catch((err: any, ctx: Context) => {
        logger.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
    });

    return bot;
};

// Export the webhook function
export const telegramWebhook = onRequest(
    { secrets: [telegramToken], region: "europe-west1" },
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
