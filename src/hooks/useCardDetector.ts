import { useEffect, useRef, useState } from 'react';
import { TextDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export const useCardDetector = (videoRef: React.RefObject<HTMLVideoElement>, isEnabled: boolean) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [confidence, setConfidence] = useState(0);
    const [isCardDetected, setIsCardDetected] = useState(false);

    const textDetectorRef = useRef<TextDetector | null>(null);
    const lastVideoTimeRef = useRef<number>(-1);
    const frameIdRef = useRef<number>(0);
    const consecutiveFramesRef = useRef<number>(0);

    useEffect(() => {
        const loadDetector = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                const textDetector = await TextDetector.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/text_detector/text_detector/float16/1/text_detector.tflite`,
                        delegate: "GPU"
                    },
                });
                textDetectorRef.current = textDetector;
                setIsLoaded(true);
                console.log("MediaPipe Text Detector Loaded");
            } catch (error) {
                console.error("Error loading MediaPipe Text Detector:", error);
            }
        };

        loadDetector();

        return () => {
            // Cleanup if needed (MediaPipe classes often don't have explicit destroy methods exposed in JS API easily, 
            // but closing the component will stop the loop)
            if (textDetectorRef.current) {
                textDetectorRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        if (!isEnabled || !isLoaded || !videoRef.current) {
            cancelAnimationFrame(frameIdRef.current);
            return;
        }

        const detect = async () => {
            const video = videoRef.current;
            if (!video || video.currentTime === lastVideoTimeRef.current) {
                frameIdRef.current = requestAnimationFrame(detect);
                return;
            }

            lastVideoTimeRef.current = video.currentTime;

            try {
                if (textDetectorRef.current) {
                    const startTimeMs = performance.now();
                    const detections = textDetectorRef.current.detectForVideo(video, startTimeMs);

                    if (detections.detections.length > 0) {
                        // Heuristic: Check if text is substantial
                        // We sum up the area of bounding boxes relative to frame size
                        // detections.detections[i].boundingBox

                        let totalTextArea = 0;
                        const frameArea = video.videoWidth * video.videoHeight;

                        detections.detections.forEach(d => {
                            if (d.boundingBox) {
                                totalTextArea += d.boundingBox.width * d.boundingBox.height;
                            }
                        });

                        const density = totalTextArea / frameArea;

                        // We simulate a "confidence" based on density relative to expected card text density (approx 5-20%)
                        // If density is > 0.05 (5%), we are fairly confident there is text.
                        const calculatedConfidence = Math.min(Math.round((density / 0.05) * 100), 100);
                        setConfidence(calculatedConfidence);

                        if (density > 0.03) { // Threshold: 3% of screen has text
                            consecutiveFramesRef.current++;
                        } else {
                            consecutiveFramesRef.current = 0;
                        }

                        // Trigger if we have 5 stable frames of text
                        if (consecutiveFramesRef.current > 10) {
                            setIsCardDetected(true);
                            // Reset slightly to debounce multiple triggers
                            // consecutiveFramesRef.current = 0; 
                        } else {
                            setIsCardDetected(false);
                        }

                    } else {
                        setConfidence(0);
                        consecutiveFramesRef.current = 0;
                        setIsCardDetected(false);
                    }
                }
            } catch (err) {
                console.warn(err);
            }

            frameIdRef.current = requestAnimationFrame(detect);
        };

        detect();

        return () => cancelAnimationFrame(frameIdRef.current);
    }, [isEnabled, isLoaded]);

    return { isLoaded, confidence, isCardDetected, resetDetection: () => { consecutiveFramesRef.current = 0; setIsCardDetected(false); } };
};
