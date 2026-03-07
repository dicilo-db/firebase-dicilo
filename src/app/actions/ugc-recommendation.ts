'use server';

import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Ensure Admin SDK is initialized via getters
const db = getAdminDb();
const storage = getAdminStorage();

export async function submitUGCRecommendation(formData: FormData) {
    try {
        const mediaFiles = formData.getAll('media') as File[];
        const comment = formData.get('comment') as string;
        const businessId = formData.get('businessId') as string;
        const userId = formData.get('userId') as string;
        const userName = formData.get('userName') as string;

        if (mediaFiles.length === 0 || !businessId || !userId) {
            throw new Error('Missing required fields');
        }

        const uploadPromises = mediaFiles.map(async (file) => {
            if (!file || file.size === 0) return null;

            try {
                const buffer = Buffer.from(await file.arrayBuffer() as any);
                const contentType = file.type;
                const isVideo = contentType.startsWith('video/');
                const mediaType = isVideo ? 'video' : 'image';
                
                const extension = contentType.split('/')[1] || (isVideo ? 'mp4' : 'img');
                const filePath = `recommendations/${businessId}/${uuidv4()}.${extension}`;
                const fileRef = storage.bucket().file(filePath);

                await fileRef.save(buffer, {
                    metadata: { contentType: contentType },
                    public: true,
                });

                const publicUrl = `https://storage.googleapis.com/${storage.bucket().name}/${filePath}`;
                return { type: mediaType, url: publicUrl } as { type: 'image' | 'video', url: string };
            } catch (err) {
                console.error("Single file upload error in UGC:", err);
                return null;
            }
        });

        const uploadResults = await Promise.all(uploadPromises);
        const mediaItems = uploadResults.filter((item): item is { type: 'image' | 'video', url: string } => item !== null);
        const firstImageUrl = mediaItems.find(item => item.type === 'image')?.url || null;

        // 2. Create Recommendation Document in Firestore
        const recommendationId = uuidv4();
        const recommendationData = {
            id: recommendationId,
            businessId,
            userId,
            userName,
            photoUrl: firstImageUrl || (mediaItems.length > 0 ? mediaItems[0].url : ''),
            media: mediaItems,
            comment: comment || '',
            status: 'pending', // Pending n8n validation
            createdAt: new Date(),
        };

        await db.collection('recommendations').doc(recommendationId).set(recommendationData);

        // 3. Trigger n8n Webhook (Fire and Forget)
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_RECOMMENDATION;

        if (n8nWebhookUrl) {
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
