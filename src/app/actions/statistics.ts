'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Ensure env var is set

export async function sendStatisticsEmail(
    toEmail: string,
    clientName: string,
    pdfBase64: string,
    dateRange: string
) {
    try {
        // Decode base64 to buffer
        const pdfBuffer = Buffer.from(pdfBase64.split(',')[1], 'base64');

        const { data, error } = await resend.emails.send({
            from: 'Dicilo Analytics <analytics@dicilo.net>', // Update with verified domain
            to: [toEmail],
            subject: `Statistics Report: ${clientName} (${dateRange})`,
            html: `
        <h1>Monthly Statistics Report</h1>
        <p>Dear ${clientName},</p>
        <p>Please find attached your detailed statistics report for the period <strong>${dateRange}</strong>.</p>
        <p>Best regards,<br/>The Dicilo Team</p>
      `,
            attachments: [
                {
                    filename: `Report_${clientName.replace(/\s+/g, '_')}_${dateRange}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error('Server Action Error:', err);
        return { success: false, error: err.message };
    }
}
