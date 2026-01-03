'use server';

import { websiteChat, WebsiteChatInput } from '@/ai/flows/website-chat-flow';
import { getSessionHistory, saveInteraction } from '@/lib/chat-history';

export async function chatAction(input: WebsiteChatInput) {
    try {
        // console.log('Chat Action: Received request', input);

        if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
            return { success: false, error: 'API Key configuration missing' };
        }

        let history: string[] = [];

        // MEMORY LOGIC: Persistent Session Handling
        if (input.userId) {
            // 1. Get previous history (Formatted string from lib)
            const historyString = await getSessionHistory(input.userId, 20); // Fetch last 20 interactions
            if (historyString) {
                // Flow expects array of strings, so we wrap the formatted block
                history = [historyString];
            }
        }

        // 2. Inject History into Input
        input.history = history;

        // 3. Call AI
        const response = await websiteChat(input);
        // console.log('Chat Action: Success', response);

        // 4. Save Interaction (User Question + AI Answer)
        if (input.userId && response.answer) {
            await saveInteraction(input.userId, input.question, response.answer);
        }

        return { success: true, answer: response.answer, uiComponent: response.uiComponent };
    } catch (error: any) {
        console.error('Chat Action Error:', error);
        return { success: false, error: error.message || 'Failed to process chat request' };
    }
}
