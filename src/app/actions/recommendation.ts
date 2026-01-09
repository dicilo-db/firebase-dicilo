import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Initialize Admin SDK via shared lib
const db = getAdminDb();
const storage = getAdminStorage();

const recommendationSchema = z.object({
    businessId: z.string().min(1),
    userId: z.string().optional(), // If logged in
    userName: z.string().min(1, 'Name is required'),
    userContact: z.string().optional(), // Email or Phone for guests
    comment: z.string().optional(),
});

export async function submitRecommendation(prevState: any, formData: FormData) {
    try {
        const file = formData.get('photo') as File;
        const businessId = formData.get('businessId') as string;
        const userId = formData.get('userId') as string || 'guest';
        const userName = formData.get('userName') as string;
        const userContact = formData.get('userContact') as string;
        const comment = formData.get('comment') as string;

        // Validate textual data
        const validatedFields = recommendationSchema.parse({
            businessId,
            userId,
            userName,
            userContact,
            comment,
        });

        if (!file || file.size === 0) {
            return { success: false, message: 'Please upload a photo.' };
        }

        // validate file type
        if (!file.type.startsWith('image/')) {
            return { success: false, message: 'Only image files are allowed.' };
        }

        // 1. Upload Image to Storage
        const buffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `recommendations/${businessId}/${randomUUID()}.${ext}`;
        const bucket = storage.bucket();
        const fileRef = bucket.file(filename);

        await fileRef.save(Buffer.from(buffer), {
            metadata: {
                contentType: file.type,
            },
        });

        // Make public (or sign URL later? For now let's assume public or signed access needed. 
        // Usually we make it public or use a download token. For simplicity in this MVP, we might leave it private 
        // and rely on Admin SDK to generate signed URLs or client to use getDownloadURL if allowed.)
        // But typically we want a public URL for display.
        await fileRef.makePublic();
        const publicUrl = fileRef.publicUrl();

        // 2. Create Firestore Document
        const docRef = db.collection('recommendations').doc();
        await docRef.set({
            businessId: validatedFields.businessId,
            userId: validatedFields.userId,
            userName: validatedFields.userName,
            userContact: validatedFields.userContact || null,
            photoUrl: publicUrl,
            storagePath: filename,
            comment: validatedFields.comment || '',
            status: 'pending',
            createdAt: new Date(), // Admin SDK uses native Date or Timestamp
            aiAnalysis: null, // Will be filled by n8n
        });

        return { success: true, message: 'Recommendation submitted successfully!' };
    } catch (error: any) {
        console.error('Error submitting recommendation:', error);
        return { success: false, message: error.message || 'Failed to submit recommendation.' };
    }
}
