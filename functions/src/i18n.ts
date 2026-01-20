import { Firestore } from 'firebase-admin/firestore';

export type Lang = 'es' | 'de' | 'en';

export async function getEmailI18n(lang: Lang, db?: Firestore) {
  try {
    // Opción A: Firestore (si subes docs i18n/email.es|de|en)
    if (db) {
      const doc = await db.doc(`i18n/email.${lang}`).get();
      if (doc.exists) return doc.data() as any;
    }
  } catch { }
  // Opción B: Fallback mínimo embebido (ajusta si quieres más claves)
  const fallback: Record<Lang, any> = {
    es: {
      'consent.subject':
        '[DICILO] ¿Aceptas recibir información recomendada por {{name}}?',
      'consent.body':
        'Hola {{recipientName}},<br/>Has recibido una recomendación de {{name}}.<br/>¿Deseas recibir información de DICILO?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
      'consent.cta.accept': 'Sí, acepto',
      'consent.cta.decline': 'No, gracias',
      'reminder.subject': '[DICILO] Recordatorio de consentimiento',
    },
    de: {
      'consent.subject': '[DICILO] Akzeptieren Sie Informationen von {{name}}?',
      'consent.body':
        'Hallo {{recipientName}},<br/>Sie haben eine Empfehlung von {{name}} erhalten.<br/>Möchten Sie Informationen von DICILO erhalten?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
      'consent.cta.accept': 'Ja, akzeptieren',
      'consent.cta.decline': 'Nein, danke',
      'reminder.subject': '[DICILO] Erinnerung: Einwilligung ausstehend',
    },
    en: {
      'consent.subject': '[DICILO] Do you accept info recommended by {{name}}?',
      'consent.body':
        'Hi {{recipientName}},<br/>You received a recommendation from {{name}}.<br/>Would you like to receive information from DICILO?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
      'consent.cta.accept': 'Yes, I accept',
      'consent.cta.decline': 'No, thanks',
      'reminder.subject': '[DICILO] Consent reminder',
    },
  };
  return fallback[lang];
}

export function render(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/{{(.*?)}}/g, (_, k) => vars[k.trim()] ?? '');
}
