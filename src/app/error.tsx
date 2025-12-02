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
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
            <h2 className="text-2xl font-bold">Etwas ist schief gelaufen!</h2>
            <p className="text-muted-foreground">
                Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
            </p>
            <pre className="mt-4 max-w-lg overflow-auto rounded bg-slate-100 p-4 text-left text-xs text-red-600">
                {error.message}
            </pre>
            <Button onClick={() => reset()}>Erneut versuchen</Button>
        </div>
    );
}
