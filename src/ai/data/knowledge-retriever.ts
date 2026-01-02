import { getAdminDb } from '@/lib/firebase-admin';
import { DICILO_KNOWLEDGE } from '@/ai/data/dicilo-knowledge';
import { DICICOIN_KNOWLEDGE } from '@/ai/data/dicicoin-knowledge';

// --- HELPER: Normalize strings for search ---
function normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function getClientDeepKnowledge(queryName: string): Promise<string> {
    if (!queryName || queryName.length < 3) return "";

    const db = getAdminDb();
    const normalizedQuery = normalize(queryName);
    let knowledge = "";

    try {
        // 1. Find the Client ID first (Search in 'clients' and 'businesses')
        // This is a naive search. Ideal: Text Search / Vector. 
        // For V1/Firebase: We iterate or use a simple query if we had a keywords field.
        // We'll fetch 'clients' (smaller collection usually) and filter.
        const clientsSnap = await db.collection('clients').get(); // Potentially expensive if 1000s, but okay for active list.

        let targetClient: any = null;
        let targetClientId = "";

        // Fuzzy Match
        clientsSnap.forEach(doc => {
            const data = doc.data();
            const name = normalize(data.clientName || data.name || "");
            if (name.includes(normalizedQuery) || normalizedQuery.includes(name)) {
                targetClient = data;
                targetClientId = doc.id;
            }
        });

        if (!targetClientId) {
            // Try businesses collection if not in clients (Retailers might be in businesses?)
            // Assuming Premium/Retailers are synced to 'clients' or we check 'businesses' too.
            const businessSnap = await db.collection('businesses').where('name', '>=', queryName).limit(5).get(); // Basic prefix search
            if (!businessSnap.empty) {
                targetClientId = businessSnap.docs[0].id; // Fallback ID
            }
        }

        if (targetClientId) {
            knowledge += `\n\n[DEEP KNOWLEDGE FOR: ${queryName}]\n`;

            // 2. Fetch Targeted Snippets
            const snippets = await db.collection('ai_knowledge_snippets')
                .where('clientId', '==', targetClientId)
                .get();

            snippets.forEach(doc => {
                knowledge += `➤ ${doc.data().text}\n`;
            });

            // 3. Fetch Targeted Files (PDFs)
            const files = await db.collection('ai_knowledge_files')
                .where('clientId', '==', targetClientId)
                .where('status', '==', 'processed')
                .limit(3) // Limit valid docs
                .get();

            files.forEach(doc => {
                const f = doc.data();
                if (f.extractedText) {
                    knowledge += `\n📄 DOCUMENT: ${f.name}\n${f.extractedText.slice(0, 3000)}\n... (truncated)\n`;
                }
            });

            if (!snippets.empty || !files.empty) {
                console.log(`✅ [RGA] Found deep knowledge for ${queryName} (${targetClientId})`);
            } else {
                console.log(`ℹ️ [RGA] Client found (${queryName}) but has no specific RGA data.`);
            }
        }

    } catch (e) {
        console.error("[RGA] Error fetching deep knowledge:", e);
    }
    return knowledge;
}

export async function getDynamicKnowledgeContext(): Promise<string> {
    try {
        const db = getAdminDb();
        let dynamicContext = "";

        // 1. Fetch GLOBAL Text Snippets (No clientId)
        // We filter manually or use a query for non-private snippets.
        // Determining "Global" via missing clientId.
        const snippetsSnapshot = await db.collection('ai_knowledge_snippets').orderBy('createdAt', 'desc').get();
        if (!snippetsSnapshot.empty) {
            dynamicContext += "\n\n[GLOBAL SYSTEM KNOWLEDGE]\n";
            let globalCount = 0;
            snippetsSnapshot.forEach(doc => {
                const data = doc.data();
                // Include ONLY if NO clientId (Global) 
                // CRITICAL: Filter out specific "HörComfort" or displaced text that ended up as global noise
                const isNoise = data.text && data.text.includes("Bereits seit 2011");
                if (data.text && !data.clientId && !isNoise) {
                    dynamicContext += `- ${data.text}\n`;
                    globalCount++;
                }
            });
            // If we have very few globals, maybe include recent client updates? No, privacy/confusion risk.
        }

        // 2. Fetch DATA SNAPSHOT (Directory)
        // This remains the "Wide Net" to let the Brain know WHO exists.
        const [businessesSnapshot, clientsSnapshot] = await Promise.all([
            db.collection('businesses').limit(150).get(), // Reduced limit for speed, assuming search will handle deep dive
            db.collection('clients').limit(150).get()
        ]);

        if (!businessesSnapshot.empty || !clientsSnapshot.empty) {
            dynamicContext += "\n\n[DIRECTORY - KNOWN COMPANIES]\n(Use these names to identify who the user is asking about)\n";

            const processEntry = (doc: any) => {
                const d = doc.data();
                const name = d.clientName || d.name || d.businessName || "Unknown";
                const type = d.clientType || 'Standard';
                const cat = d.category?.name || d.category || '';
                return `- ${name} (${type} / ${cat})`;
            };

            const seen = new Set();

            clientsSnapshot.forEach(doc => {
                const entry = processEntry(doc);
                if (!seen.has(entry)) { dynamicContext += entry + "\n"; seen.add(entry); }
            });
            businessesSnapshot.forEach(doc => {
                const entry = processEntry(doc);
                if (!seen.has(entry)) { dynamicContext += entry + "\n"; seen.add(entry); }
            });
        }

        // 3. Combine
        return `${DICILO_KNOWLEDGE}\n\n[DICICOIN INFO]\n${DICICOIN_KNOWLEDGE}\n${dynamicContext}`;

    } catch (error) {
        console.error("Error fetching dynamic knowledge:", error);
        return `${DICILO_KNOWLEDGE}\n\n[DICICOIN INFO]\n${DICICOIN_KNOWLEDGE}`;
    }
}
