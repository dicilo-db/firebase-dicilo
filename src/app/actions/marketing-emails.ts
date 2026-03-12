'use server';

import { sendSmtpEmail } from '@/lib/mail-service';

interface MarketingFriend {
    name: string;
    email: string;
    lang: string;
    generated_subject: string;
    generated_body: string;
    inviteId: string;
}

interface MarketingPayload {
    referrer_id: string;
    referrer_name: string;
    referrer_email?: string;
    friends: MarketingFriend[];
}

export async function sendBulkMarketingEmails(payload: MarketingPayload) {
    console.log(`Starting bulk email sending for ${payload.friends.length} recipients...`);
    
    const results = [];
    
    for (const friend of payload.friends) {
        try {
            const res = await sendSmtpEmail({
                to: friend.email,
                subject: friend.generated_subject,
                html: friend.generated_body.replace(/\n/g, '<br/>'), // Convert newlines to HTML for email
            });
            
            results.push({
                email: friend.email,
                success: res.success,
                messageId: res.messageId || null,
                error: res.error ? String(res.error) : null
            });
            
            console.log(`Email result for ${friend.email}:`, res.success ? 'Success' : 'Failed');
        } catch (error) {
            console.error(`Unexpected error sending to ${friend.email}:`, error);
            results.push({
                email: friend.email,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return {
        success: successCount > 0,
        totalSent: successCount,
        totalRecipients: payload.friends.length,
        // Ensure the entire object is serializable
        details: JSON.parse(JSON.stringify(results))
    };
}
