'use server';

import { adminStorage } from '@/lib/firebase-admin';

export async function uploadAdBannerAction(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        // 1. Convert File to ArrayBuffer -> Uint8Array
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Sanitize Filename
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `ads/${timestamp}_${sanitizedName}`;

        // 3. Upload using Firebase Admin SDK
        const bucket = adminStorage.bucket('geosearch-fq4i9.appspot.com'); // Explicitly set bucket name from config
        const fileRef = bucket.file(fileName);

        console.log(`[ServerAction] Uploading ${fileName} (${buffer.length} bytes) via Admin SDK`);

        await fileRef.save(buffer, {
            contentType: file.type,
            metadata: {
                metadata: {
                    originalName: file.name,
                    uploadedVia: 'server-action-admin'
                }
            }
        });

        // 4. Make Public and Get URL
        await fileRef.makePublic();

        // Construct the public URL manually or use getSignedUrl if private
        // For public files: https://storage.googleapis.com/BUCKET_NAME/FILE_PATH
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        console.log(`[ServerAction] Upload success: ${publicUrl}`);

        return { success: true, url: publicUrl };
    } catch (error: any) {
        console.error('[ServerAction] Upload failed:', error);
        return { success: false, error: error.message || 'Unknown server error' };
    }
}
