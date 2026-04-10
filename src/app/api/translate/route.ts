
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API Key is missing. Please add OPENAI_API_KEY to your .env.local file." },
                { status: 500 }
            );
        }

        const { text, targetLanguages, sourceLanguage } = await req.json();

        if (!text || !targetLanguages || !Array.isArray(targetLanguages)) {
            return NextResponse.json(
                { error: "Invalid request. Provide 'text' and 'targetLanguages' array." },
                { status: 400 }
            );
        }

        const prompt = `You are a professional translator. Translate the following text from ${sourceLanguage || "auto-detect"} into these languages: ${targetLanguages.join(", ")}.
        
        Rules:
        - Maintain the tone and intent of the original text.
        - Return ONLY a valid JSON object.
        - Keys must be the 2-letter language codes (e.g., "en", "de", "es").
        - Values must be the translated text strings.
        - Do not include any explanations or markdown formatting (no \`\`\`json).

        Text to translate:
        "${text}"
        `;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant that translates text precisely into the requested languages returning pure JSON." },
                { role: "user", content: prompt }
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new Error("No content received from OpenAI");
        }

        const translations = JSON.parse(content);

        return NextResponse.json({ translations });
    } catch (error: any) {
        console.error("Translation error:", error);
        return NextResponse.json(
            { error: error.message || "Translation failed" },
            { status: 500 }
        );
    }
}
