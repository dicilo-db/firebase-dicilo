import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Laden...</p>
            </div>
        </div>
    );
}
