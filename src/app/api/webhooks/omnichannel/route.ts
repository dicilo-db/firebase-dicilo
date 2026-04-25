import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// Webhook central para recibir datos de n8n, Calendly, WhatsApp o Telegram
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // Si es un evento de Calendly reenviado por n8n o directo
        if (payload.event === 'invitee.created' || payload.type === 'calendly') {
            const data = payload.payload ? payload.payload : payload;
            
            const appointmentRef = getAdminDb().collection('crm_appointments').doc();
            await appointmentRef.set({
                source: 'calendly',
                eventId: data.event || '',
                inviteeName: data.name || '',
                inviteeEmail: data.email || '',
                inviteePhone: data.text_reminder_number || data.phone || '',
                timezone: data.timezone || '',
                startTime: data.start_time || new Date().toISOString(),
                createdAt: new Date().toISOString(),
                status: 'active'
            });

            // Opcional: También inyectar un "Lead" o actualizar el CRM general.
            return NextResponse.json({ success: true, message: 'Calendly mapped correctly' }, { status: 200 });
        }

        // Si es un evento de Comunicación (WhatsApp, etc)
        if (payload.event === 'incoming_message' || payload.type === 'message') {
            const data = payload.data || payload;
            
            const messageRef = getAdminDb().collection('crm_communications').doc();
            await messageRef.set({
                source_channel: data.source || 'whatsapp', // whatsapp, telegram, web
                senderId: data.sender_id || '',
                senderName: data.sender_name || 'Desconocido',
                content: data.text || data.message || '',
                direction: 'inbound',
                timestamp: new Date().toISOString(),
                read: false,
                requires_action: true
            });

            return NextResponse.json({ success: true, message: 'Message logged in unified inbox' }, { status: 200 });
        }

        return NextResponse.json({ success: false, message: 'Event type not strictly matched, payload dumped' }, { status: 400 });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
