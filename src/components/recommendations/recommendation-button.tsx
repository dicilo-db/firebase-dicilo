'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { RecommendationModal } from './recommendation-modal';

interface RecommendationButtonProps {
    businessId: string;
}

export function RecommendationButton({ businessId }: RecommendationButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-6 left-6 z-50">
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 hover:scale-105 transition-transform"
                    size="icon"
                >
                    <Camera className="h-6 w-6 text-white" />
                    <span className="sr-only">Recomendar</span>
                </Button>
            </div>

            <RecommendationModal
                businessId={businessId}
                open={isOpen}
                onOpenChange={setIsOpen}
            />
        </>
    );
}
