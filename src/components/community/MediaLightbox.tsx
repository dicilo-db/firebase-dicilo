'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Download } from 'lucide-react';
import Image from 'next/image';
import { MediaItem } from '@/types/community';
import { cn } from '@/lib/utils';

interface MediaLightboxProps {
    isOpen: boolean;
    onClose: () => void;
    media: MediaItem[];
    initialIndex: number;
}

export function MediaLightbox({ isOpen, onClose, media, initialIndex }: MediaLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex, isOpen]);

    const handlePrevious = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
    }, [media.length]);

    const handleNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
    }, [media.length]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'ArrowLeft') handlePrevious();
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'Escape') onClose();
    }, [isOpen, handlePrevious, handleNext, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!media || media.length === 0) return null;

    const currentItem = media[currentIndex];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[100vw] h-screen p-0 bg-black/95 border-none flex flex-col items-center justify-center sm:rounded-none outline-none">
                <DialogTitle className="sr-only">Visualizador de Media</DialogTitle>
                <DialogDescription className="sr-only">
                    Viendo archivo {currentIndex + 1} de {media.length}
                </DialogDescription>
                
                {/* Header Controls */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
                    <div className="text-white text-sm font-medium">
                        {currentIndex + 1} / {media.length}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={() => window.open(currentItem.url, '_blank')}
                        >
                            <Download className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12 overflow-hidden">
                    {currentItem.type === 'image' ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={currentItem.url}
                                alt={`Media ${currentIndex}`}
                                fill
                                className="object-contain"
                                priority
                                unoptimized // To avoid double-optimization issues with already compressed WebP
                            />
                        </div>
                    ) : (
                        <video
                            src={currentItem.url}
                            controls
                            autoPlay
                            className="max-w-full max-h-full rounded-lg"
                        />
                    )}

                    {/* Navigation Arrows */}
                    {media.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60 border-none transition-all hidden sm:flex"
                                onClick={handlePrevious}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60 border-none transition-all hidden sm:flex"
                                onClick={handleNext}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                        </>
                    )}
                </div>

                {/* Thumbnails (Mobile-only or optional) */}
                {media.length > 1 && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 p-4 overflow-x-auto no-scrollbar">
                        {media.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={cn(
                                    "relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all",
                                    currentIndex === idx ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-100"
                                )}
                            >
                                {item.type === 'image' ? (
                                    <Image
                                        src={item.url}
                                        alt={`Thumb ${idx}`}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                        <ChevronRight className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
