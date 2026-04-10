// src/ai/flows/ask-gemini-flow.ts
'use server';
/**
 * @fileOverview A flow to ask Gemini about code.
 *
 * - askGemini - A function that handles asking Gemini about code.
 * - AskGeminiInput - The input type for the askGemini function.
 * - AskGeminiOutput - The return type for the askGemini function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AskGeminiInputSchema = z.object({
  code: z.string().describe('The code to ask Gemini about.'),
  question: z.string().describe('The question to ask Gemini.'),
});
export type AskGeminiInput = z.infer<typeof AskGeminiInputSchema>;

const AskGeminiOutputSchema = z.object({
  answer: z.string().describe('The answer from Gemini.'),
});
export type AskGeminiOutput = z.infer<typeof AskGeminiOutputSchema>;

export async function askGemini(
  input: AskGeminiInput
): Promise<AskGeminiOutput> {
  return askGeminiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askGeminiPrompt',
  input: { schema: AskGeminiInputSchema },
  output: { schema: AskGeminiOutputSchema },
  prompt: `
    You are an expert software engineer.
    Analyze the following code and answer the user's question.

    Code:
    \'\'\'
    {{{code}}}
    \'\'\'

    Question: {{{question}}}
  `,
});

const askGeminiFlow = ai.defineFlow(
  {
    name: 'askGeminiFlow',
    inputSchema: AskGeminiInputSchema,
    outputSchema: AskGeminiOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
