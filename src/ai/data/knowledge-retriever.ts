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
            // STRATEGY CHANGE: Instead of sensitive 'where' query, we fetch all businesses to ensure
            // we catch "Travelposting" vs "travelposting" or minor variations, matching the robustness of the context loader.
            const businessSnap = await db.collection('businesses').get();

            businessSnap.forEach(doc => {
                // If we already found a match, skip
                if (targetClientId) return;

                const data = doc.data();
                const name = normalize(data.businessName || data.name || "");
                if (name && (name.includes(normalizedQuery) || normalizedQuery.includes(name))) {
                    targetClient = data;
                    targetClientId = doc.id;
                }
            });
        }

        if (targetClientId) {
            knowledge += `\n\n[DEEP KNOWLEDGE FOR: ${queryName}]\n`;

            // 1.5 INJECT CORE PROFILE DATA (Address, Contact, etc.)
            const profile = targetClient || {};

            // Multilingual Fallbacks & 'location' field support
            const address = profile.address?.street || profile.street || profile.address ||
                profile.calle || profile.direccion || profile.strasse ||
                profile.location || ""; // Added 'location' as generic fallback

            const city = profile.address?.city || profile.city ||
                profile.ciudad || profile.stadt || profile.municipio || "";

            const zip = profile.address?.zip || profile.zip || profile.plz ||
                profile.codigo_postal || profile.cp || "";

            const country = profile.address?.country || profile.country ||
                profile.pais || profile.land || "";

            const fullAddress = `${address}, ${zip} ${city}, ${country}`.replace(/^, /, '').replace(/, $/, '');

            const phone = profile.contact?.phone || profile.phone || profile.phoneNumber || profile.celular || profile.telefono || profile.telefon || "";
            const email = profile.contact?.email || profile.email || profile.correo || "";
            const website = profile.contact?.website || profile.website || profile.url || profile.web || "";
            const desc = profile.description || profile.about || profile.shortDescription || profile.descripcion || profile.beschreibung || "";

            knowledge += `[PROFILE SUMMARY]\n`;
            // Force output of Location/Address if any part exists to ensure the AI has something to link to
            if (fullAddress.length > 3) knowledge += `Address: ${fullAddress}\n`;
            if (phone) knowledge += `Phone: ${phone}\n`;
            if (email) knowledge += `Email: ${email}\n`;
            if (website) knowledge += `Website: ${website}\n`;
            if (desc) knowledge += `Description: ${desc}\n`;
            knowledge += `----------------------------------------\n`;

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
            db.collection('businesses').get(),
            db.collection('clients').get()
        ]);

        if (!businessesSnapshot.empty || !clientsSnapshot.empty) {
            dynamicContext += "\n\n[DIRECTORY - KNOWN COMPANIES]\n(Use these names to identify who the user is asking about)\n";

            const processEntry = (doc: any) => {
                const d = doc.data();
                const name = d.clientName || d.name || d.businessName || "Unknown";
                const type = d.clientType || 'Standard';
                let cat = d.category?.name || d.category || '';

                // Fallback: Infer category from name if missing
                if (!cat) {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('reisen') || lowerName.includes('travel') || lowerName.includes('viajes')) cat = 'Agencia de Viajes / Reisebüro';
                    else if (lowerName.includes('shop') || lowerName.includes('market')) cat = 'Comercio';
                }

                // Enrich with cues for the LLM (Crucial for "Reisen" -> "Viajes" matching)
                const desc = d.shortDescription || d.description || d.about || "";
                const snippet = desc ? desc.substring(0, 80).replace(/\n/g, " ") : "";
                const phone = d.contact?.phone || d.phone || d.phoneNumber || d.celular || d.contactPhone || "";
                const city = d.address?.city || d.city || d.location || "";

                return `- ${name} (${type} / ${cat}) ${city ? `[${city}] ` : ''}[Info: ${snippet}...] [Tel: ${phone}]`;
            };

            const seenKey = new Set();

            const addToContext = (doc: any) => {
                const d = doc.data();

                // FILTER: We now allow ALL types to ensure the AI can find everything in the directory ("Travelposting", etc).
                const type = (d.clientType || 'basic').toLowerCase();
                // We match partial strings to catch 'premium-plus' or 'retailer-v1' if they exist.
                // Added: 'basic', 'free', 'standard', 'business' to ensure coverage.
                const allowedTypes = ['starter', 'retailer', 'minorista', 'premium', 'basic', 'free', 'standard', 'business'];

                if (!allowedTypes.some(t => type.includes(t)) && type !== 'unknown') {
                    // Minimal filter for truly invalid/test types if needed, but for now we open the gates.
                    // If strict filtering is invalid for "Travelposting", we must allow it.
                    // return; 
                }

                const rawName = d.clientName || d.name || d.businessName || "";

                // Dedupe strictly by Normalized Name or Slug. 
                // Ignore Doc ID for deduplication purposes to force merging of "Inviajes" (client) and "Inviajes" (business).
                const key = d.slug || normalize(rawName);

                if (key && key.length > 2 && !seenKey.has(key)) {
                    const entry = processEntry(doc);
                    dynamicContext += entry + "\n";
                    seenKey.add(key);
                } else if ((!key || key.length <= 2) && !seenKey.has(doc.id)) {
                    // Fallback for messy data without name/slug
                    const entry = processEntry(doc);
                    dynamicContext += entry + "\n";
                    seenKey.add(doc.id);
                }
            };

            clientsSnapshot.forEach(doc => addToContext(doc));
            businessesSnapshot.forEach(doc => addToContext(doc));
        }

        // 3. Combine
        return `${DICILO_KNOWLEDGE}\n\n[DICICOIN INFO]\n${DICICOIN_KNOWLEDGE}\n${dynamicContext}`;

    } catch (error) {
        console.error("Error fetching dynamic knowledge:", error);
        return `${DICILO_KNOWLEDGE}\n\n[DICICOIN INFO]\n${DICICOIN_KNOWLEDGE}`;
    }
}
