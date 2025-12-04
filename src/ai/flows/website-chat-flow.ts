import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WebsiteChatInputSchema = z.object({
    question: z.string().describe('The user\'s message or question.'),
});
export type WebsiteChatInput = z.infer<typeof WebsiteChatInputSchema>;

const WebsiteChatOutputSchema = z.object({
    answer: z.string().describe('The AI assistant\'s response.'),
});
export type WebsiteChatOutput = z.infer<typeof WebsiteChatOutputSchema>;

export async function websiteChat(
    input: WebsiteChatInput
): Promise<WebsiteChatOutput> {
    return websiteChatFlow(input);
}

import { DICILO_KNOWLEDGE } from '@/ai/data/dicilo-knowledge';

const prompt = ai.definePrompt({
    name: 'websiteChatPrompt',
    input: { schema: WebsiteChatInputSchema },
    output: { schema: WebsiteChatOutputSchema },
    prompt: `
    You are a helpful, friendly, and knowledgeable AI assistant for the Dicilo website.
    
    Here is the official information about Dicilo. Use this context to answer the user's questions accurately.
    If the answer is not in this context, you can use your general knowledge but prioritize the provided information.
    
    <CONTEXT>
    ${DICILO_KNOWLEDGE}
    </CONTEXT>
    
    Your goal is to assist users with their questions about the platform, businesses listed, or general inquiries.
    Be concise, professional, and welcoming.
    
    User Question: {{{question}}}
  `,
});

const websiteChatFlow = ai.defineFlow(
    {
        name: 'websiteChatFlow',
        inputSchema: WebsiteChatInputSchema,
        outputSchema: WebsiteChatOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
