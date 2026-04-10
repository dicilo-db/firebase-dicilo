'use server';

import { websiteChat } from '@/ai/flows/website-chat-flow';
import { saveInteraction } from '@/lib/chat-history';

// Define input type locally to match schema, avoiding import issues
type WebsiteChatInput = {
    question: string;
    sessionId?: string;
    userId?: string;
    context?: string;
    history?: string[];
};

export async function chatAction(input: WebsiteChatInput) {
    try {
        console.log('Chat Action: Received request', input.question);

        if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
            console.error('Chat Action: API Key Missing');
            return { success: false, error: 'API Key configuration missing' };
        }

        // Note: History is now handled internally by the Flow (using getSessionHistory there)
        // We do NOT need to fetch it here and pass it.

        // Call AI Flow
        const response = await websiteChat(input);

        // Save Interaction
        const userId = input.userId || input.sessionId;
        if (userId && response.answer) {
            try {
                await saveInteraction(userId, input.question, response.answer);
            } catch (err) {
                console.error("Error saving interaction:", err);
            }
        }

        return {
            success: true,
            answer: response.answer,
            uiComponent: response.uiComponent
        };

    } catch (error: any) {
        console.error('Chat Action CRITICAL Error:', error);
        return { success: false, error: error.message || 'Failed to process chat request' };
    }
}
