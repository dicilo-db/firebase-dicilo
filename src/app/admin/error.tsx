'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Etwas ist schief gelaufen!</h2>
            <p className="text-muted-foreground mb-6 max-w-[500px]">
                Es ist ein Fehler im Admin-Dashboard aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support, wenn das Problem weiterhin besteht.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()}>Erneut versuchen</Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Seite neu laden
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-8 p-4 bg-slate-100 rounded">
                Fehlercode: {error.digest || 'Unknown'} - {error.message}
            </p>
        </div>
    );
}
