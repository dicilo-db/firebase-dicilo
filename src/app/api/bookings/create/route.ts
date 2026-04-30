import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendSmtpEmail } from '@/lib/mail-service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Basic validation
        if (!body.client_name || !body.client_phone || !body.date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = getAdminDb();
        
        // Store in Firestore using Server SDK which bypasses security rules!
        const docRef = await db.collection('crm_appointments').add({
            title: `Asesoría B2B: ${body.client_name}`,
            date: body.date,
            startTime: body.date, // Added for Calendar component
            duration: 30, // minutes
            status: 'pending',
            client_name: body.client_name,
            inviteeName: body.client_name, // Added for Calendar component
            client_phone: body.client_phone,
            client_reason: body.client_reason,
            source: 'native_web_booking',
            created_at: new Date().toISOString()
        });

        // Send email notification to Admin
        try {
            await sendSmtpEmail({
                to: 'support@dicilo.net',
                subject: `Nueva Reserva de Asesoría: ${body.client_name}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h2>Nueva Reserva de Asesoría B2B</h2>
                        <p>Se ha agendado una nueva reunión desde dicilo.net/contacto.</p>
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                            <p><strong>Cliente:</strong> ${body.client_name}</p>
                            <p><strong>WhatsApp/Teléfono:</strong> ${body.client_phone}</p>
                            <p><strong>Fecha y Hora:</strong> ${new Date(body.date).toLocaleString('es-ES', { timeZone: 'Europe/Berlin' })} (Hora de Berlín)</p>
                            <p><strong>Motivo:</strong> ${body.client_reason || 'No especificado'}</p>
                        </div>
                        <p>Inicia sesión en el Dashboard para gestionarla.</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send admin notification email:', emailError);
            // We do not fail the request if the email fails.
        }

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error('Error creating booking:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
