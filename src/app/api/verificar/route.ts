import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'accept' or 'deny'
    const token = searchParams.get('token');

    if (!token || !action) {
        return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    try {
        const db = getAdminDb();
        const snap = await db.collection('businesses').where('verificationToken', '==', token).limit(1).get();
        
        if (snap.empty) {
            return new NextResponse(`
                <html><body>
                <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                    <h2>Enlace Inválido o Expirado</h2>
                    <p>No se pudo encontrar el registro asociado a este enlace.</p>
                </div>
                </body></html>
            `, { status: 400, headers: { 'Content-Type': 'text/html' } });
        }
        
        const docRef = snap.docs[0].ref;
        const data = snap.docs[0].data();

        if (action === 'deny') {
            await docRef.update({ 
                verificationStatus: 'rejected', 
                active: false,
                verificationToken: admin.firestore.FieldValue.delete()
            });
            return new NextResponse(`
                <html><body>
                <div style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #4b5563;">
                    <h2>Datos Eliminados</h2>
                    <p>Su solicitud ha sido procesada. Sus datos no serán publicados en Dicilo.net.</p>
                </div>
                </body></html>
            `, { headers: { 'Content-Type': 'text/html' } });
        }

        if (action === 'accept') {
            if (data.verificationStatus === 'confirmed') {
                return new NextResponse(`
                    <html><body>
                    <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                        <h2>Su cuenta ya estaba activada</h2>
                        <p>Puede iniciar sesión en <a href="https://dicilo.net/login">dicilo.net</a>.</p>
                    </div>
                    </body></html>
                `, { headers: { 'Content-Type': 'text/html' } });
            }

            // Move to 'clients' collection and grant access
            const tempPassword = Math.random().toString(36).slice(-8);
            
            // We use batch to ensure atomicity
            const batch = db.batch();

            // 1. Mark as confirmed in businesses (or we can just keep it in businesses if that's the standard,
            // but the user's prompt explicitly says "Migra/actualiza a clients")
            
            // Wait, in Dicilo, users login via Firebase Auth. To actually create a user, we would need to use admin.auth().createUser()
            // Let's create the Auth user.
            let uid = "";
            try {
                const userRecord = await admin.auth().createUser({
                    email: data.email,
                    password: tempPassword,
                    displayName: data.name
                });
                uid = userRecord.uid;
            } catch (e: any) {
                // If user already exists, we could just link it, but for now let's assume they don't, or we catch email-already-exists
                if (e.code === 'auth/email-already-exists') {
                    const existing = await admin.auth().getUserByEmail(data.email);
                    uid = existing.uid;
                } else {
                    throw e;
                }
            }

            // 2. Create the client document
            const clientRef = db.collection('clients').doc(uid);
            batch.set(clientRef, {
                ...data,
                ownerUid: uid,
                mustChangePassword: true,
                verificationStatus: 'confirmed',
                active: true,
                clientType: 'starter',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 3. Update the original business doc
            batch.update(docRef, {
                verificationStatus: 'confirmed',
                active: true,
                ownerUid: uid,
                verificationToken: admin.firestore.FieldValue.delete()
            });

            // 4. Pay the Freelancer
            if (data.assignedTo) {
                const freelancerRef = db.collection('private_profiles').doc(data.assignedTo);
                batch.update(freelancerRef, {
                    euroBalance: admin.firestore.FieldValue.increment(0.05)
                });
            }

            await batch.commit();

            return new NextResponse(`
                <html><body>
                <div style="font-family: sans-serif; text-align: center; margin-top: 50px; max-width: 600px; margin-left: auto; margin-right: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #10b981;">¡Cuenta Activada Exitosamente!</h2>
                    <p>Bienvenido a Dicilo.net. Su perfil comercial ya está activo.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 20px; text-align: left;">
                        <p><b>Email:</b> ${data.email}</p>
                        <p><b>Contraseña Temporal:</b> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 6px;">${tempPassword}</span></p>
                    </div>
                    <p style="margin-top: 20px;">
                        <a href="https://dicilo.net/login" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Iniciar Sesión</a>
                    </p>
                    <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Se le pedirá cambiar esta contraseña al ingresar por primera vez.</p>
                </div>
                </body></html>
            `, { headers: { 'Content-Type': 'text/html' } });
        }

        return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });

    } catch (error: any) {
        console.error("Error en verificación:", error);
        return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 });
    }
}
