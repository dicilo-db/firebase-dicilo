import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import * as admin from 'firebase-admin';

async function init() {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local");
        process.exit(1);
    }
    
    let keyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    if ((keyStr.startsWith("'") && keyStr.endsWith("'")) || (keyStr.startsWith('"') && keyStr.endsWith('"'))) {
        keyStr = keyStr.slice(1, -1);
    }
    keyStr = keyStr.replace(/\\\\n/g, '\\n');
    const serviceAccount = JSON.parse(keyStr);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'geosearch-fq4i9',
    });
}

async function run() {
    await init();
    const db = admin.firestore();
    
    console.log("Fetching all basic businesses...");
    const snapshot = await db.collection('businesses').where('tier_level', '==', 'basic').get();
    
    const businesses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as any[];

    console.log(`Total basic businesses found: ${businesses.length}`);

    // Group by Name + Address + City to ensure precision
    const groups: Record<string, any[]> = {};
    
    for (const b of businesses) {
        const name = b.name?.trim().toLowerCase() || '';
        const address = b.address?.trim().toLowerCase() || '';
        const city = b.city?.trim().toLowerCase() || '';
        const key = `${name}|${address}|${city}`;
        
        if (!groups[key]) groups[key] = [];
        groups[key].push(b);
    }

    let exactDuplicates = 0;
    const toDelete: string[] = [];

    for (const [key, group] of Object.entries(groups)) {
        if (group.length > 1) {
            // Sort by createdAt ascending (keep oldest)
            group.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateA - dateB;
            });
            
            // The first one is the original, the rest are duplicates
            const duplicates = group.slice(1);
            exactDuplicates += duplicates.length;
            duplicates.forEach(d => toDelete.push(d.id));
        }
    }

    console.log(`Found ${exactDuplicates} duplicates to delete.`);
    
    if (process.argv.includes('--execute')) {
        if (toDelete.length === 0) {
            console.log("Nothing to delete.");
            return;
        }
        console.log("Executing deletion...");
        
        // Delete in batches of 400
        const BATCH_SIZE = 400;
        let currentBatch = db.batch();
        let ops = 0;
        let totalDeleted = 0;

        for (const id of toDelete) {
            currentBatch.delete(db.collection('businesses').doc(id));
            ops++;
            totalDeleted++;

            if (ops >= BATCH_SIZE) {
                await currentBatch.commit();
                console.log(`Deleted ${totalDeleted} documents...`);
                currentBatch = db.batch();
                ops = 0;
            }
        }
        
        if (ops > 0) {
            await currentBatch.commit();
            console.log(`Deleted ${totalDeleted} documents...`);
        }
        
        console.log("Deletion complete.");
    } else {
        console.log("DRY RUN COMPLETE. Run with --execute to actually delete.");
    }
}

run().catch(console.error);
