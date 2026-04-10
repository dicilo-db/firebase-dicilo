import { NextRequest, NextResponse } from 'next/server';
import { sendSmtpEmail } from '@/lib/mail-service';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    // Only allow manual trigger by providing a secret query param for safety
    if (req.nextUrl.searchParams.get('secret') !== 'test1234') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = getAdminDb();
        // Get a random recommendation or post with an image
        const imgSnap = await db.collection('recommendations').where('photoUrl', '!=', '').limit(1).get();
        let imageUrl = 'https://firebasestorage.googleapis.com/v0/b/dicilo.appspot.com/o/placeholders%2Fbusiness.webp?alt=media'; // fallback

        if (!imgSnap.empty) {
            imageUrl = imgSnap.docs[0].data().photoUrl || imageUrl;
        }

        const html = `
            <h2>Prueba de Conexión SMTP desde General Info</h2>
            <p>Hola Nilo,</p>
            <p>Este es un correo de prueba automatizado para verificar que el módulo SMTP funciona correctamente y que el HTML escapado y procesado llega bien.</p>
            <p>Aquí tienes una imagen extraída directamente de la base de datos de Dicilo:</p>
            <img src="${imageUrl}" alt="Prueba de Firebase" style="max-width: 400px; border-radius: 8px;" />
            <br/><br/>
            <p>Si recibes esto, el módulo de correo está operativo.</p>
        `;

        const result = await sendSmtpEmail({
            to: 'niloescolar.de@gmail.com',
            subject: 'Test de Módulo General Info - Dicilo',
            html: html
        });

        if (!result.success) {
            console.error('Test Email Failed:', result.error);
            return NextResponse.json({ success: false, error: result.error });
        }

        return NextResponse.json({ success: true, message: 'Email enviado con éxito', messageId: result.messageId });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
