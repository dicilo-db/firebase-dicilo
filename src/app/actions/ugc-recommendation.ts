'use server';

import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Ensure Admin SDK is initialized via getters
const db = getAdminDb();
const storage = getAdminStorage();

export async function submitUGCRecommendation(formData: FormData) {
    try {
        const file = formData.get('photo') as File;
        const comment = formData.get('comment') as string;
        const businessId = formData.get('businessId') as string;
        const userId = formData.get('userId') as string;
        const userName = formData.get('userName') as string;

        if (!file || !businessId || !userId) {
            throw new Error('Missing required fields');
        }

        // 1. Upload Photo to Firebase Storage
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = `recommendations/${businessId}/${uuidv4()}_${file.name}`;
        const fileRef = storage.bucket().file(filePath);

        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
            public: true, // or use signed URLs if preferred, public for MVP
        });

        const photoUrl = `https://storage.googleapis.com/${storage.bucket().name}/${filePath}`;

        // 2. Create Recommendation Document in Firestore
        const recommendationId = uuidv4();
        const recommendationData = {
            id: recommendationId,
            businessId,
            userId,
            userName,
            photoUrl,
            comment: comment || '',
            status: 'pending', // Pending n8n validation
            createdAt: new Date(),
        };

        await db.collection('recommendations').doc(recommendationId).set(recommendationData);

        // 3. Trigger n8n Webhook (Fire and Forget)
        // We will read the Webhook URL from env or use a placeholder
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_RECOMMENDATION;

        if (n8nWebhookUrl) {
            // We don't await this to keep UI snappy, or maybe we do to confirm?
            // For MVP let's await to ensure it reached n8n? No, async is better.
            fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recommendationId, ...recommendationData }),
            }).catch(err => console.error("Failed to trigger n8n:", err));
        }

        return { success: true, recommendationId };

    } catch (error: any) {
        console.error('Error submitting UGC:', error);
        return { success: false, error: error.message };
    }
}
