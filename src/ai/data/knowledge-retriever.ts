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

        // 1. Fetch GLOBAL Text Snippets (No clientId) - The 100 FAQs
        // We filter manually or use a query for non-private snippets.
        try {
            const snippetsSnapshot = await db.collection('ai_knowledge_snippets').orderBy('createdAt', 'desc').get();
            if (!snippetsSnapshot.empty) {
                dynamicContext += "\n\n[GLOBAL SYSTEM KNOWLEDGE (FAQS & RULES)]\n";
                let globalCount = 0;
                snippetsSnapshot.forEach(doc => {
                    const data = doc.data();
                    const isNoise = data.text && data.text.includes("Bereits seit 2011");
                    if (data.text && !data.clientId && !isNoise) {
                        dynamicContext += `- ${data.text}\n`;
                        globalCount++;
                    }
                });
            }
        } catch (e) {
            console.error("Warning: Could not fetch global snippets in strict order.", e);
            // Fallback without orderBy to bypass index errors if they occur
            const fallbackSnap = await db.collection('ai_knowledge_snippets').limit(200).get();
            if (!fallbackSnap.empty) {
                dynamicContext += "\n\n[GLOBAL SYSTEM KNOWLEDGE (FAQS & RULES)]\n";
                fallbackSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.text && !data.clientId && !data.text.includes("Bereits seit 2011")) {
                        dynamicContext += `- ${data.text}\n`;
                    }
                });
            }
        }

        // 2. Fetch DATA SNAPSHOT (Directory)
        // [REMOVED] - We no longer dump all businesses into the prompt to prevent Payload Too Large Errors.
        // The DiciBot will now use the searchBusinessDirectoryTool when it needs to find a company.

        // 3. Fetch PLANS (Menus / Prices) to ensure Dicibot knows what Dicilo sells
        try {
            const plansSnap = await db.collection('plans').orderBy('order').get();
            if (!plansSnap.empty) {
                dynamicContext += "\n\n[DICILO PLANS & PRICING]\n";
                plansSnap.forEach(doc => {
                    const plan = doc.data();
                    const name = plan.name?.es || plan.name?.en || plan.name?.de || 'Unknown';
                    const price = plan.price || '0';
                    const interval = plan.interval || 'month';
                    const features = (plan.features || []).slice(0, 5).join(', '); // first 5 features
                    dynamicContext += `- Plan ${name}: ${price}€/${interval}. Incluye: ${features}\n`;
                });
            }
        } catch (e) {
            console.error("Warning: Could not fetch plans", e);
        }
        
        // 4. Combine
        return `${DICILO_KNOWLEDGE}\n\n[DICICOIN INFO]\n${DICICOIN_KNOWLEDGE}\n${dynamicContext}`;

    } catch (error) {
        console.error("Error fetching dynamic knowledge:", error);
        return `${DICILO_KNOWLEDGE}\n\n[DICICOIN INFO]\n${DICICOIN_KNOWLEDGE}`;
    }
}
