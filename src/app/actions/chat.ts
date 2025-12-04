'use server';

import { websiteChat, WebsiteChatInput } from '@/ai/flows/website-chat-flow';

export async function chatAction(input: WebsiteChatInput) {
    try {
        console.log('Chat Action: Received request', input);

        if (!process.env.GOOGLE_GENAI_API_KEY) {
            return { success: false, error: 'API Key configuration missing' };
        }

        const response = await websiteChat(input);
        console.log('Chat Action: Success', response);
        return { success: true, answer: response.answer };
    } catch (error: any) {
        console.error('Chat Action Error:', error);
        // Log the full error object for debugging
        console.dir(error, { depth: null });
        return { success: false, error: error.message || 'Failed to process chat request' };
    }
}
