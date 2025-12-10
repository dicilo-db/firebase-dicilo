'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
      <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/20">
        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
      </div>
      <h2 className="mb-2 text-xl font-bold">Etwas ist schief gelaufen!</h2>
      <p className="mb-4 text-center text-muted-foreground">
        Wir entschuldigen uns für die Unannehmlichkeiten. Ein Fehler ist im Dashboard aufgetreten.
        {error.message && <span className="block mt-2 text-sm font-mono bg-slate-100 p-2 rounded">{error.message}</span>}
      </p>
      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()} variant="outline">
          Seite neu laden
        </Button>
        <Button onClick={() => reset()}>Erneut versuchen</Button>
      </div>
    </div>
  );
}
