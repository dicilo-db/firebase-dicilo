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
    const EDGE_THRESHOLD = 15; // Lower threshold to detect more text details
    const DENSITY_THRESHOLD = 0.05; // 5% of pixels needed (was 12%)
    const STABILITY_FRAMES = 4; // Faster trigger (approx 100ms)

    useEffect(() => {
        if (!isEnabled || !videoRef.current) {
            // ...
            // Simple Edge Detection (Horizontal + Vertical Gradient)
            // Stride = 4 (RGBA)
            const width = PROCESSING_WIDTH;
            for (let i = 0; i < data.length - 4; i += 4) {
                // Convert to luminance (approx)
                const lum1 = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const lum2 = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;

                // Horizontal diff
                if (Math.abs(lum1 - lum2) > EDGE_THRESHOLD) {
                    edgePixels++;
                }
                // Vertical Check (Basic Skip): If not horiz edge, check vertical?
                // For simplicity/speed, let's just stick to horizontal but with lower threshold.
                // Or better: check simply if pixel is "noisy"
            }

            const density = edgePixels / totalPixels;

            // Map density to confidence (0-100)
            // 0.0 -> 0%
            // 0.12 -> 100% (Dense text target lowered)
            const rawConfidence = Math.min(Math.round((density / 0.12) * 100), 100);
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
