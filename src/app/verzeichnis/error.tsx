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
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
            <h2 className="text-xl font-bold">Varias cosas salieron mal!</h2>
            <p className="text-muted-foreground">
                No se pudo cargar la lista de categorías.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()}>Intentar de nuevo</Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Recargar página
                </Button>
            </div>
        </div>
    );
}
