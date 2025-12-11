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
import { getDynamicKnowledgeContext } from '@/ai/data/knowledge-retriever';

// Define a Prompt Input Schema that includes context
const PromptInputSchema = z.object({
    question: z.string(),
    context: z.string(),
});

const prompt = ai.definePrompt({
    name: 'websiteChatPrompt',
    input: { schema: PromptInputSchema },
    output: { schema: WebsiteChatOutputSchema },
    prompt: `
    You are a helpful, friendly, and knowledgeable AI assistant for the Dicilo website.
    
    Here is the official information about Dicilo and its database. Use this context to answer the user's questions accurately.
    If the answer is not in this context, you can use your general knowledge but prioritize the provided information.
    
    <CONTEXT>
    {{context}}
    </CONTEXT>
    
    Your goal is to assist users with their questions about the platform, businesses listed, or general inquiries.
    Be concise, professional, and welcoming.
    
    User Question: {{question}}
  `,
});

const websiteChatFlow = ai.defineFlow(
    {
        name: 'websiteChatFlow',
        inputSchema: WebsiteChatInputSchema,
        outputSchema: WebsiteChatOutputSchema,
    },
    async (input) => {
        // 1. Fetch Dynamic Context
        const dynamicContext = await getDynamicKnowledgeContext();

        // 2. Call Prompt with Question + Context
        const { output } = await prompt({
            question: input.question,
            context: dynamicContext
        });
        return output!;
    }
);
