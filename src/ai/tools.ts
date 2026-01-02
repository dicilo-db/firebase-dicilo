import { ai } from './genkit';
import { z } from 'genkit';

// Tool 1: Messaging Tool (Email/WhatsApp/Telegram)
// This tool calls the n8n webhook to send messages outside the chat.
export const sendMessageTool = ai.defineTool(
    {
        name: 'sendMessageTool',
        description: 'Sends a message to a user via Email, WhatsApp, or Telegram. Use this when the user asks to receive information outside of this chat.',
        inputSchema: z.object({
            to: z.string().describe('The destination email address or phone number. If unknown, ask the user.'),
            message: z.string().describe('The content of the message to send.'),
            channel: z.enum(['email', 'whatsapp']).describe('The channel to use for sending the message.'),
            userName: z.string().describe('The name of the user sending the request.'),
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string(),
        }),
    },
    async (input) => {
        try {
            console.log(`[Tool: sendMessageTool] Sending ${input.channel} to ${input.to}`);

            // n8n expects specific structure: userName, details (mapped from message)
            const payload = {
                details: input.message, // Map 'message' to 'details' for n8n
                email: input.to,        // Send email as 'email' just in case
                ...input
            };

            const response = await fetch('https://dicilo.app.n8n.cloud/webhook/dicibot-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // Try to get error text if possible
                const errorText = await response.text();
                throw new Error(`n8n webhook failed with status ${response.status}: ${errorText}`);
            }

            return { success: true, message: 'Message sent successfully.' };
        } catch (error: any) {
            console.error('[Tool: sendMessageTool] Error:', error);
            return { success: false, message: `Failed to send message: ${error.message}` };
        }
    }
);

// Tool 2: Calendar Tool
// This tool calls the n8n webhook to schedule meetings.
export const calendarTool = ai.defineTool(
    {
        name: 'calendarTool',
        description: 'Schedules a meeting or appointment in the Google Calendar. Use this when the user explicitly asks to book a meeting or appointment.',
        inputSchema: z.object({
            userEmail: z.string().describe('The email address of the user participating in the meeting. Ask if unknown.'),
            intent: z.string().describe('The purpose or topic of the meeting (e.g., "Consulting", "Demo", "Support").'),
            proposedTime: z.string().describe('The proposed date and time for the meeting in ISO format (e.g., 2023-10-27T10:00:00Z) or a clear natural language description.'),
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string(),
        }),
    },
    async (input) => {
        try {
            console.log(`[Tool: calendarTool] Scheduling for ${input.userEmail} at ${input.proposedTime}`);

            const response = await fetch('https://dicilo.app.n8n.cloud/webhook/dicibot-calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            });

            if (!response.ok) {
                throw new Error(`n8n webhook failed with status ${response.status}`);
            }

            return { success: true, message: 'Meeting scheduled successfully.' };
        } catch (error: any) {
            console.error('[Tool: calendarTool] Error:', error);
            return { success: false, message: `Failed to schedule meeting: ${error.message}` };
        }
    }
);
