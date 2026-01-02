'use server';

import { websiteChat, WebsiteChatInput } from '@/ai/flows/website-chat-flow';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';

// Helper to save messages
async function saveChatMessage(userId: string, role: 'user' | 'model', content: string) {
    try {
        const db = getAdminDb();
        await db.collection('ai_chat_history').add({
            userId,
            role,
            content,
            timestamp: FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error('Error saving chat message:', error);
    }
}

// Helper to get recent history
async function getChatHistory(userId: string, limit: number = 10): Promise<string[]> {
    try {
        const db = getAdminDb();
        const snapshot = await db.collection('ai_chat_history')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const messages: string[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const roleLabel = data.role === 'user' ? 'User' : 'Assistant';
            messages.unshift(`${roleLabel}: ${data.content}`); // Unshift to put oldest first
        });
        return messages;
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return [];
    }
}

export async function chatAction(input: WebsiteChatInput) {
    try {
        console.log('Chat Action: Received request', input);

        if (!process.env.GOOGLE_GENAI_API_KEY) {
            return { success: false, error: 'API Key configuration missing' };
        }

        let history: string[] = [];

        // MEMORY LOGIC: If we have a userId, we handle persistence
        if (input.userId) {
            // 1. Save User Question
            await saveChatMessage(input.userId, 'user', input.question);

            // 2. Fetch History (including the one just saved? No, usually previous context)
            // Ideally we want *previous* context. 
            // The prompt will include the CURRENT question separately.
            // So we fetch history, but exclude the very last one we just added? 
            // Or just fetch N and the prompt handles "User Question" as distinct from "History".
            // Let's fetch history. If it includes the current Q, that's duplicative.
            // My getChatHistory orders by desc, takes 10.
            // Since I await saveChatMessage, it WILL include the current message.
            // I should filter it or just rely on the prompt separation.
            // PROMPT DESIGN: <HISTORY> ... </HISTORY> User Question: ...
            // If History contains the Question repeats, it's slightly confusing but robust models handle it.
            // Better: getChatHistory BEFORE saving current message?
            // YES. 
        }

        // 2. Fetch History (Pre-Save) - Wait, if I do this, I scan history BEFORE adding current.
        if (input.userId) {
            history = await getChatHistory(input.userId, 10);
            // NOW Save current message
            await saveChatMessage(input.userId, 'user', input.question);
        }

        // 3. Inject History into Input
        input.history = history;

        // 4. Call AI
        const response = await websiteChat(input);
        console.log('Chat Action: Success', response);

        // 5. Save AI Response
        if (input.userId && response.answer) {
            await saveChatMessage(input.userId, 'model', response.answer);
        }

        return { success: true, answer: response.answer };
    } catch (error: any) {
        console.error('Chat Action Error:', error);
        console.dir(error, { depth: null });
        return { success: false, error: error.message || 'Failed to process chat request' };
    }
}
