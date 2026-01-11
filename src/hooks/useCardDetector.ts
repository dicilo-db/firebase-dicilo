import { useEffect, useRef, useState } from 'react';

/**
 * useCardDetector (Heuristic Computer Vision Version)
 * 
 * Instead of heavy AI models (MediaPipe/Tesseract), we use classical Computer Vision.
 * Logic:
 * 1. Analyze the center of the video feed (where the card user guide is).
 * 2. Calculate "Edge Density" (High frequency components) using a simplified Sobel operator.
 * 3. Text = Many Edges. Blank Table = Few Edges. Blurry Image = Weak Edges.
 * 4. If Edge Density > Threshold ==> We have a focused card with text.
 */
export const useCardDetector = (videoRef: React.RefObject<HTMLVideoElement>, isEnabled: boolean) => {
    const [confidence, setConfidence] = useState(0);
    const [isCardDetected, setIsCardDetected] = useState(false);

    // We use a small internal canvas for processing to keep it lightning fast
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameIdRef = useRef<number>(0);
    const consecutiveFramesRef = useRef<number>(0);

    // Config
    const PROCESSING_WIDTH = 160; // Low res for speed
    const PROCESSING_HEIGHT = 90;
    const EDGE_THRESHOLD = 25; // Pixel difference to count as an edge
    const DENSITY_THRESHOLD = 0.12; // 12% of pixels must be edges (text is dense)
    const STABILITY_FRAMES = 8; // Sustain detection for ~250ms

    useEffect(() => {
        if (!isEnabled || !videoRef.current) {
            cancelAnimationFrame(frameIdRef.current);
            setConfidence(0);
            setIsCardDetected(false);
            return;
        }

        const processFrame = () => {
            const video = videoRef.current;
            if (!video || !video.videoWidth) {
                frameIdRef.current = requestAnimationFrame(processFrame);
                return;
            }

            // Lazy init canvas
            if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
                canvasRef.current.width = PROCESSING_WIDTH;
                canvasRef.current.height = PROCESSING_HEIGHT;
            }

            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            // Draw center crop of video to small canvas
            // Source: Center 60% of video
            const sx = video.videoWidth * 0.2;
            const sy = video.videoHeight * 0.3;
            const sw = video.videoWidth * 0.6;
            const sh = video.videoHeight * 0.4;

            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, PROCESSING_WIDTH, PROCESSING_HEIGHT);

            // Get pixels
            const imageData = ctx.getImageData(0, 0, PROCESSING_WIDTH, PROCESSING_HEIGHT);
            const data = imageData.data;
            let edgePixels = 0;
            const totalPixels = data.length / 4;

            // Simple Edge Detection (Horizontal Gradient)
            // We check difference between pixel[i] and pixel[i+1]
            // Stride = 4 (RGBA)
            for (let i = 0; i < data.length - 4; i += 4) {
                // Convert to luminance (approx)
                // L = 0.299*R + 0.587*G + 0.114*B
                const lum1 = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const lum2 = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;

                if (Math.abs(lum1 - lum2) > EDGE_THRESHOLD) {
                    edgePixels++;
                }
            }

            const density = edgePixels / totalPixels;

            // Map density to confidence (0-100)
            // 0.0 -> 0%
            // 0.20 -> 100% (Dense text)
            const rawConfidence = Math.min(Math.round((density / 0.20) * 100), 100);
            setConfidence(rawConfidence);

            // Trigger Logic
            if (density > DENSITY_THRESHOLD) {
                consecutiveFramesRef.current++;
            } else {
                consecutiveFramesRef.current = Math.max(0, consecutiveFramesRef.current - 1);
            }

            if (consecutiveFramesRef.current > STABILITY_FRAMES) {
                setIsCardDetected(true);
            } else {
                setIsCardDetected(false);
            }

            frameIdRef.current = requestAnimationFrame(processFrame);
        };

        processFrame();

        return () => cancelAnimationFrame(frameIdRef.current);
    }, [isEnabled]);

    return {
        isLoaded: true, // Always loaded (pure JS)
        confidence,
        isCardDetected,
        resetDetection: () => { consecutiveFramesRef.current = 0; setIsCardDetected(false); }
    };
};
