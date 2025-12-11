import { getFirestore } from 'firebase-admin/firestore';
import { DICILO_KNOWLEDGE } from '@/ai/data/dicilo-knowledge';

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

        // 3. Fetch Businesses (Directory Data)
        const businessesSnapshot = await db.collection('businesses')
            .limit(50) // Reasonable limit for context window
            .get();

        if (!businessesSnapshot.empty) {
            dynamicContext += "\n\n[DIRECTORY LISTING (PARTIAL)]\n";
            businessesSnapshot.forEach(doc => {
                const data = doc.data();
                // Format: Name (Category) - City
                const name = data.name || data.companyName || 'Unknown';
                const category = data.category?.name || data.category || 'Uncategorized';
                const city = data.city || data.address?.city || '';
                dynamicContext += `- ${name} [${category}] ${city ? `(${city})` : ''}\n`;
            });
        }

        // 3. Combine with Static Knowledge
        return `${DICILO_KNOWLEDGE}\n${dynamicContext}`;

    } catch (error) {
        console.error("Error fetching dynamic knowledge:", error);
        // Fallback to static knowledge
        return DICILO_KNOWLEDGE;
    }
}
