import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-2xl font-bold">404 - Seite nicht gefunden</h2>
            <p className="text-muted-foreground">
                Die angeforderte Admin-Seite existiert nicht.
            </p>
            <Link href="/admin/dashboard">
                <Button>Zum Dashboard</Button>
            </Link>
        </div>
    );
}
