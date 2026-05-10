import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getAdminDb } from './src/lib/firebase-admin';

async function seedTemplate() {
    const db = getAdminDb();
    const docRef = db.collection('email_templates').doc('profile_reminder');

    const templateData = {
        name: 'Recordatorio de Perfil Incompleto',
        category: 'system',
        visibleTo: 'all',
        variables: ['clientName', 'missingListHtml', 'editUrl', 'unsubscribeUrl'],
        versions: {
            es: {
                subject: '¡Tu perfil en Dicilo está casi listo! 🚀',
                body: `
<div style="font-family: 'Inter', Arial, sans-serif; color: #334155; line-height: 1.6;">
    <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">¡Tu perfil en Dicilo está casi listo!</h2>
    <p>Hola, <strong>{{clientName}}</strong>,</p>
    <p>Hemos notado que aún faltan algunos detalles importantes en tu perfil para que tu negocio pueda aparecer correctamente en la primera página de nuestro portal y sea visible para los clientes.</p>
    
    <p>Actualmente, aún necesitas completar algunos datos importantes, como:</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 20px 20px 40px; margin: 25px 0;">
        <ul style="margin: 0; padding: 0; list-style-type: none;">
            {{missingListHtml}}
        </ul>
    </div>
    
    <p>Es muy importante que la ubicación esté correctamente detallada y visible en el mapa del formulario, ya que esto permite que tu empresa aparezca correctamente dentro de nuestro portal y facilite que los clientes puedan encontrarte.</p>
    <p>También es importante que tu empresa cuente con un logo visible, ya sea subiendo la imagen directamente o agregando la dirección URL del logo.</p>
    
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">📌 <strong>Recuerda:</strong> Todos los campos del formulario son importantes, con excepción de:</p>
        <ul style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">
            <li>Coordenadas</li>
            <li>Pista de Imagen (IA)</li>
            <li>Calificación URL</li>
            <li>Oferta actual (si no cuentas con una)</li>
        </ul>
    </div>
    
    <p>Además, te recomendamos agregar una descripción corta de tu negocio para que los clientes puedan conocer mejor tus servicios.</p>
    <p>💡 <em><strong>Tip:</strong> Puedes copiar la URL de tu ubicación directamente desde Google Maps y pegarla en el formulario.</em></p>
    
    <div style="text-align: center; margin: 40px 0;">
        <a href="{{editUrl}}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">👉 Completar mi perfil ahora</a>
    </div>
    
    <p><em>(Si aún no has iniciado sesión o no estás registrado, el enlace te pedirá que ingreses a tu cuenta primero para poder llenar los datos faltantes).</em></p>
    
    <p>No dudes en comunicarte con nosotros si tienes alguna complicación o necesitas ayuda para completar tu perfil.</p>
    
    <p>Atentamente,<br><strong>El equipo de Dicilo</strong></p>
    
    <p>Gracias por ser parte de Dicilo.<br>Ten siempre en cuenta que Dicilo está para apoyarte y esperamos poder contactar contigo muy pronto.</p>
    
    <p style="font-style: italic; color: #059669; font-weight: 600; margin-top: 15px;">
        PS: Recuerda que tu registro Básico es 100% gratis.<br><br>
        ¿No ha sido usted el que registró la empresa o su propio negocio?<br>
        <a href="{{unsubscribeUrl}}" style="color: #ef4444; text-decoration: underline;">En este enlace puede dar de baja su registro completamente gratis.</a>
    </p>
</div>`
            },
            en: {
                subject: 'Your Dicilo profile is almost ready! 🚀',
                body: `
<div style="font-family: 'Inter', Arial, sans-serif; color: #334155; line-height: 1.6;">
    <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Your Dicilo profile is almost ready!</h2>
    <p>Hello, <strong>{{clientName}}</strong>,</p>
    <p>We noticed that your profile is still missing some important details so that your business can appear correctly on the first page of our portal and be visible to customers.</p>
    
    <p>Currently, you still need to complete some important data, such as:</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 20px 20px 40px; margin: 25px 0;">
        <ul style="margin: 0; padding: 0; list-style-type: none;">
            {{missingListHtml}}
        </ul>
    </div>
    
    <p>It is very important that the location is correctly detailed and visible on the form map, as this allows your company to appear correctly within our portal and makes it easier for customers to find you.</p>
    <p>It is also important that your company has a visible logo, either by uploading the image directly or adding the logo URL.</p>
    
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">📌 <strong>Remember:</strong> All form fields are important, except for:</p>
        <ul style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">
            <li>Coordinates</li>
            <li>Image Hint (AI)</li>
            <li>Rating URL</li>
            <li>Current offer (if you don't have one)</li>
        </ul>
    </div>
    
    <p>In addition, we recommend adding a short description of your business so that customers can better understand your services.</p>
    <p>💡 <em><strong>Tip:</strong> You can copy your location URL directly from Google Maps and paste it into the form.</em></p>
    
    <div style="text-align: center; margin: 40px 0;">
        <a href="{{editUrl}}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">👉 Complete my profile now</a>
    </div>
    
    <p><em>(If you have not logged in or registered yet, the link will ask you to log into your account first to fill in the missing data).</em></p>
    
    <p>Do not hesitate to contact us if you have any complications or need help completing your profile.</p>
    
    <p>Sincerely,<br><strong>The Dicilo Team</strong></p>
    
    <p>Thank you for being part of Dicilo.<br>Always keep in mind that Dicilo is here to support you and we hope to contact you very soon.</p>
    
    <p style="font-style: italic; color: #059669; font-weight: 600; margin-top: 15px;">
        PS: Remember that your Basic registration is 100% free.<br><br>
        Were you not the one who registered the company or your own business?<br>
        <a href="{{unsubscribeUrl}}" style="color: #ef4444; text-decoration: underline;">In this link you can unsubscribe your registration completely free of charge.</a>
    </p>
</div>`
            },
            de: {
                subject: 'Dein Dicilo-Profil ist fast fertig! 🚀',
                body: `
<div style="font-family: 'Inter', Arial, sans-serif; color: #334155; line-height: 1.6;">
    <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Dein Dicilo-Profil ist fast fertig!</h2>
    <p>Hallo <strong>{{clientName}}</strong>,</p>
    <p>Wir haben festgestellt, dass in deinem Profil noch einige wichtige Details fehlen, damit dein Unternehmen korrekt auf der ersten Seite unseres Portals erscheint und für Kunden sichtbar ist.</p>
    
    <p>Aktuell musst du noch einige wichtige Daten ergänzen, wie zum Beispiel:</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 20px 20px 40px; margin: 25px 0;">
        <ul style="margin: 0; padding: 0; list-style-type: none;">
            {{missingListHtml}}
        </ul>
    </div>
    
    <p>Es ist sehr wichtig, dass der Standort auf der Formularkarte korrekt detailliert und sichtbar ist, da dein Unternehmen dadurch korrekt in unserem Portal angezeigt wird und Kunden dich leichter finden können.</p>
    <p>Außerdem ist es wichtig, dass dein Unternehmen über ein sichtbares Logo verfügt. Lade dazu entweder das Bild direkt hoch oder gib die Logo-URL ein.</p>
    
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">📌 <strong>Zur Erinnerung:</strong> Alle Formularfelder sind wichtig, mit Ausnahme von:</p>
        <ul style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">
            <li>Koordinaten</li>
            <li>Bildhinweis (KI)</li>
            <li>Bewertungs-URL</li>
            <li>Aktuelles Angebot (falls nicht vorhanden)</li>
        </ul>
    </div>
    
    <p>Zudem empfehlen wir, eine kurze Beschreibung deines Unternehmens hinzuzufügen, damit Kunden deine Dienstleistungen besser kennenlernen können.</p>
    <p>💡 <em><strong>Tipp:</strong> Du kannst deine Standort-URL direkt aus Google Maps kopieren und in das Formular einfügen.</em></p>
    
    <div style="text-align: center; margin: 40px 0;">
        <a href="{{editUrl}}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">👉 Mein Profil jetzt vervollständigen</a>
    </div>
    
    <p><em>(Wenn du dich noch nicht angemeldet oder registriert hast, fordert dich der Link auf, dich zuerst in dein Konto einzuloggen, um die fehlenden Daten einzugeben).</em></p>
    
    <p>Zögere nicht, uns zu kontaktieren, falls du Schwierigkeiten hast oder Hilfe beim Ausfüllen deines Profils benötigst.</p>
    
    <p>Mit freundlichen Grüßen,<br><strong>Das Dicilo-Team</strong></p>
    
    <p>Danke, dass du Teil von Dicilo bist.<br>Denke immer daran, dass Dicilo hier ist, um dich zu unterstützen, und wir hoffen, dich bald kontaktieren zu können.</p>
    
    <p style="font-style: italic; color: #059669; font-weight: 600; margin-top: 15px;">
        PS: Denk daran, dass deine Basis-Registrierung zu 100% kostenlos ist.<br><br>
        Warst du nicht derjenige, der das Unternehmen oder dein eigenes Geschäft registriert hat?<br>
        <a href="{{unsubscribeUrl}}" style="color: #ef4444; text-decoration: underline;">Unter diesem Link kannst du deine Registrierung völlig kostenlos abmelden.</a>
    </p>
</div>`
            }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await docRef.set(templateData, { merge: true });
    console.log("Template 'profile_reminder' seeded successfully!");
}

seedTemplate();
