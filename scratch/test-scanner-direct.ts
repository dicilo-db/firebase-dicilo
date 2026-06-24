// scratch/test-scanner-direct.ts
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { processBusinessCard } from '../src/app/actions/scanner';

async function runTest() {
    console.log("Starting scanner test...");
    
    // Create a mock image file buffer
    const mockImageBuffer = Buffer.from('RIFF....WEBPVP8L....', 'binary'); // Minimal webp header
    
    // Create a File-like object (Blob + name)
    const blob = new Blob([mockImageBuffer], { type: 'image/webp' });
    const file = new File([blob], 'test_card.webp', { type: 'image/webp' });
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('recruiterId', 'TEST-001');
    formData.append('clientOcrText', 'Some mock OCR text');
    
    try {
        console.log("Calling processBusinessCard...");
        const result = await processBusinessCard(formData);
        console.log("Result:", result);
    } catch (err) {
        console.error("Caught error in test execution:", err);
    }
}

runTest().then(() => console.log("Done."));
