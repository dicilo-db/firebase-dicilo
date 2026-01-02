import { getAdminDb } from '@/lib/firebase-admin';
import { DICILO_KNOWLEDGE } from '@/ai/data/dicilo-knowledge';
import { DICICOIN_KNOWLEDGE } from '@/ai/data/dicicoin-knowledge';

export async function getDynamicKnowledgeContext(): Promise<string> {
    try {
        const db = getAdminDb();
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
        // Gemini 2.0 Flash has a large context window, so we can afford to fetch more entries (e.g. 300 each)
        // to ensure we don't miss companies like "HörComfort".
        const [businessesSnapshot, clientsSnapshot] = await Promise.all([
            db.collection('businesses').limit(300).get(),
            db.collection('clients').limit(300).get()
        ]);

        if (!businessesSnapshot.empty || !clientsSnapshot.empty) {
            dynamicContext += "\n\n[DIRECTORY LISTING - BUSINESSES & CLIENTS]\n";

            const processDoc = (doc: any) => {
                const data = doc.data();

                // DEBUG: Inspect data structure for HörComfort
                if (JSON.stringify(data).toLowerCase().includes('comfort') || JSON.stringify(data).toLowerCase().includes('hoer')) {
                    console.log("🔍 DEBUG DATA STRUCTURE:", JSON.stringify(data, null, 2));
                }

                // EMERGENCY DUMP: Concatenate all potential name fields so the LLM sees them all.
                // This prevents "logic" from hiding the data.
                const nameCandidates = [data.name, data.companyName, data.businessName, data.title, data.id].filter(s => s && typeof s === 'string').join(" | ");
                const name = nameCandidates || 'Empresa sin nombre';

                const clientType = data.clientType || 'Standard'; // Starter, Premium, etc.
                const category = data.category?.name || data.category || 'Uncategorized';

                // Address Logic
                const addrObj = data.address || {};
                const street = addrObj.street || data.street || '';
                const zip = addrObj.zip || data.zip || '';
                const city = addrObj.city || data.city || '';
                const country = addrObj.country || data.country || '';
                const fullAddress = [street, zip, city, country].filter(Boolean).join(', ');

                // Contact Logic
                const website = data.website || data.url || data.web || '';
                const phone = data.phone || data.mobile || data.celular || data.telefon || data.telephone || '';
                const email = data.email || data.contactEmail || '';

                const description = data.description || '';
                const slogan = data.slogan || '';
                const services = Array.isArray(data.services) ? data.services.join(', ') : (data.services || '');

                let entry = `- **${name}** [${clientType} - ${category}]`;
                if (fullAddress) entry += `\n  📍 Dirección: ${fullAddress}`;
                if (phone) entry += `\n  📞 Teléfono: ${phone}`;
                if (website) entry += `\n  🌐 Web: ${website}`;
                if (email) entry += `\n  ✉️ Email: ${email}`;

                if (slogan) entry += `\n  Slogan: "${slogan}"`;
                if (description) entry += `\n  Info: ${description}`;
                if (services) entry += `\n  Servicios: ${services}`;
                if (services) entry += `\n  Services: ${services}`;
                entry += '\n\n'; // Double newline for clear separation

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
