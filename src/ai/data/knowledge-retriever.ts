import { getFirestore } from 'firebase-admin/firestore';
import { DICILO_KNOWLEDGE } from '@/ai/data/dicilo-knowledge';
import { DICICOIN_KNOWLEDGE } from '@/ai/data/dicicoin-knowledge';

export async function getDynamicKnowledgeContext(): Promise<string> {
    try {
        const db = getFirestore();
        let dynamicContext = "";

        // 1. Fetch Text Snippets
        const snippetsSnapshot = await db.collection('ai_knowledge_snippets').get();
        if (!snippetsSnapshot.empty) {
            dynamicContext += "\n\n[ADMIN CUSTOM KNOWLEDGE]\n";
            snippetsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.text) {
                    dynamicContext += `- ${data.text}\n`;
                }
            });
        }

        // 2. Fetch File Content (extracted text)
        const filesSnapshot = await db.collection('ai_knowledge_files')
            .where('status', '==', 'processed')
            .limit(10)
            .get();

        if (!filesSnapshot.empty) {
            dynamicContext += "\n\n[KNOWLEDGE FROM DOCUMENTS]\n";
            filesSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.extractedText) {
                    dynamicContext += `--- Source: ${data.name} ---\n${data.extractedText}\n\n`;
                }
            });
        }

        // 3. Fetch Businesses (Directory Data) & Clients
        const [businessesSnapshot, clientsSnapshot] = await Promise.all([
            db.collection('businesses').limit(50).get(),
            db.collection('clients').limit(50).get()
        ]);

        if (!businessesSnapshot.empty || !clientsSnapshot.empty) {
            dynamicContext += "\n\n[DIRECTORY LISTING - BUSINESSES & CLIENTS]\n";

            const processDoc = (doc: any) => {
                const data = doc.data();
                const name = data.name || data.companyName || 'Unknown';
                const category = data.category?.name || data.category || 'Uncategorized';
                const city = data.city || data.address?.city || '';
                const description = data.description || '';
                const slogan = data.slogan || ''; // "Hörsysteme und mehr..." might be here
                const services = Array.isArray(data.services) ? data.services.join(', ') : (data.services || '');

                let entry = `- **${name}** [${category}]`;
                if (city) entry += ` in ${city}`;
                if (slogan) entry += `\n  Slogan: "${slogan}"`;
                if (description) entry += `\n  Description: ${description}`;
                if (services) entry += `\n  Services: ${services}`;
                entry += '\n';

                return entry;
            };

            businessesSnapshot.forEach(doc => {
                dynamicContext += processDoc(doc);
            });
            clientsSnapshot.forEach(doc => {
                dynamicContext += processDoc(doc);
            });
        }

        // 4. Combine with Static Knowledge and DiciCoin Data
        return `${DICILO_KNOWLEDGE}\n\n[DICICOIN INFO]\n${DICICOIN_KNOWLEDGE}\n${dynamicContext}`;

    } catch (error) {
        console.error("Error fetching dynamic knowledge:", error);
        // Fallback to static knowledge
        return `${DICILO_KNOWLEDGE}\n\n[DICICOIN INFO]\n${DICICOIN_KNOWLEDGE}`;
    }
}
