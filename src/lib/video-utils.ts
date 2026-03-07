/**
 * Client-side video compression utility.
 * Attempts to reduce video bitrate/resolution using MediaRecorder API.
 */

export interface CompressionProgress {
    percentage: number;
    status: string;
}

export async function compressVideo(
    file: File,
    maxSizeMB: number = 50,
    onProgress?: (progress: CompressionProgress) => void
): Promise<File> {
    const fileSizeMB = file.size / (1024 * 1024);
    
    // If file is already smaller than the max size, return as is
    if (fileSizeMB <= maxSizeMB) {
        return file;
    }

    onProgress?.({ percentage: 10, status: 'Preparando video para compresión...' });

    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const videoUrl = URL.createObjectURL(file);
        
        video.src = videoUrl;
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            onProgress?.({ percentage: 20, status: 'Analizando formato...' });
            
            const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
            
            if (!stream) {
                URL.revokeObjectURL(videoUrl);
                console.warn("CaptureStream not supported, falling back to original file.");
                return resolve(file);
            }

            // Options for compression
            const options = {
                mimeType: 'video/webm;codecs=vp8',
                videoBitsPerSecond: 1500000, // 1.5 Mbps for roughly 720p-ish quality
            };

            // Check for support
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm';
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webm", {
                    type: 'video/webm'
                });
                
                URL.revokeObjectURL(videoUrl);
                onProgress?.({ percentage: 100, status: 'Compresión completada' });
                resolve(compressedFile);
            };

            onProgress?.({ percentage: 30, status: 'Comprimiendo...' });
            
            mediaRecorder.start();
            video.play();

            // Monitor progress based on video time
            const interval = setInterval(() => {
                if (video.duration) {
                    const progress = Math.min(30 + (video.currentTime / video.duration) * 60, 90);
                    onProgress?.({ percentage: Math.round(progress), status: 'Procesando fotogramas...' });
                }
            }, 500);

            video.onended = () => {
                clearInterval(interval);
                mediaRecorder.stop();
            };

            video.onerror = (e) => {
                clearInterval(interval);
                mediaRecorder.stop();
                reject(e);
            };
        };

        video.onerror = (e) => {
            URL.revokeObjectURL(videoUrl);
            reject(e);
        };
    });
}
