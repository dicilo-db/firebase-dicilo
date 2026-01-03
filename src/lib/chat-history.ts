import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface ChatMessage {
    role: 'user' | 'model' | 'tool';
    content: string;
    timestamp?: number;
}

// 1. Recuperar historial reciente (Últimos 50 mensajes)
export async function getSessionHistory(sessionId: string, limitCount = 50): Promise<string> {
    if (!sessionId) return "";

    try {
        const db = getAdminDb();
        const docRef = db.collection('chat_sessions').doc(sessionId);
        const doc = await docRef.get();

        if (!doc.exists) return "";

        const data = doc.data();
        const messages: ChatMessage[] = data?.messages || [];

        // Cortamos para no saturar el contexto de Gemini
        const recentMessages = messages.slice(-limitCount);

        // Formateamos en texto plano para el prompt
        return recentMessages.map(m =>
            `${m.role.toUpperCase()}: ${m.content}`
        ).join('\n');
    } catch (error) {
        console.error("Error leyendo historial:", error);
        return ""; // Fallback silencioso
    }
}

// 2. Guardar interacción (Lo que dijo el usuario + lo que respondió el bot)
export async function saveInteraction(sessionId: string, userMsg: string, aiMsg: string) {
    if (!sessionId) return;

    try {
        const db = getAdminDb();
        const docRef = db.collection('chat_sessions').doc(sessionId);

        // Create objects compatible with Firestore serialization
        // Not using custom classes, just plain objects.
        const newMessages = [
            { role: 'user', content: userMsg, timestamp: Date.now() },
            { role: 'model', content: aiMsg, timestamp: Date.now() }
        ];

        // Usamos set con merge para crear el doc si no existe
        await docRef.set({
            messages: FieldValue.arrayUnion(...newMessages),
            lastUpdated: Date.now(),
            metadata: {
                platform: 'web',
                lastInteraction: new Date().toISOString()
            }
        }, { merge: true });

    } catch (error) {
        console.error("Error guardando historial:", error);
    }
}
