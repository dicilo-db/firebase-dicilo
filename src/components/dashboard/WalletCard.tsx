
import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, AlertCircle, Euro } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WalletCardProps {
    clientId: string;
    clientEmail?: string;
    currentBudget: number;
    totalInvested: number;
}

export function WalletCard({ clientId, clientEmail, currentBudget, totalInvested }: WalletCardProps) {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [amount, setAmount] = useState<string>("50");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Constants
    const MIN_INVESTMENT = 50;
    const COST_PER_VIEW = 0.05;

    // Calculations
    const viewsRemaining = Math.floor(currentBudget / COST_PER_VIEW);
    const percentRemaining = Math.min(100, Math.max(0, (currentBudget / MIN_INVESTMENT) * 100)); // Rough estimate based on min top-up
    // Or better: percentage of "healthy budget". Let's say 100 EUR is full tank.
    const tankPercentage = Math.min(100, (currentBudget / 100) * 100);

    const handleRequestTopUp = async () => {
        if (Number(amount) < MIN_INVESTMENT) {
            toast({
                title: "Betrag zu niedrig",
                description: `Der Mindestbetrag für eine Aufladung beträgt ${MIN_INVESTMENT}€.`,
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/wallet/request-topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    clientEmail,
                    amount: Number(amount),
                }),
            });

            if (!response.ok) throw new Error('Request failed');

            setIsDialogOpen(false);
            toast({
                title: "Anfrage gesendet",
                description: "Wir haben Ihre Aufladeanfrage erhalten und melden uns in Kürze.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Fehler",
                description: "Die Anfrage konnte nicht gesendet werden.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Euro className="h-5 w-5 text-blue-500" />
                        Werbe-Budget (Wallet)
                    </CardTitle>
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold text-blue-600">{currentBudget.toFixed(2)} €</span>
                        <span className="text-xs text-muted-foreground">Verfügbares Guthaben</span>
                    </div>
                </div>
                <CardDescription>
                    Steuern Sie Ihre Sichtbarkeit im Dicilo Netzwerk.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {/* Progress Bar "Gas Tank" */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Tankfüllung</span>
                        <span className={currentBudget < 10 ? "text-red-500 font-bold" : "text-green-600"}>
                            {currentBudget < 5 ? "Fast leer!" : "Aktiv"}
                        </span>
                    </div>
                    <Progress value={tankPercentage} className="h-3" color={currentBudget < 10 ? "bg-red-500" : "bg-blue-500"} />
                    <p className="text-xs text-muted-foreground mt-1">
                        Gesamt investiert: {totalInvested.toFixed(2)} €
                    </p>
                </div>

                {/* Impact Calculator / Stats */}
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-secondary/20 p-4">
                    <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-foreground">{viewsRemaining}</span>
                        <span className="text-xs text-muted-foreground">Verbleibende Views</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center border-l border-border">
                        <span className="text-2xl font-bold text-foreground">{COST_PER_VIEW.toFixed(2)}€</span>
                        <span className="text-xs text-muted-foreground">Kosten pro View</span>
                    </div>
                </div>

                {currentBudget < 10 && (
                    <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 border border-yellow-200">
                        <AlertCircle className="h-4 w-4" />
                        <p>Ihr Guthaben ist niedrig. Ihre Anzeigen werden bald pausiert.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-[1.01]">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Guthaben aufladen
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Guthaben aufladen</DialogTitle>
                            <DialogDescription>
                                Wählen Sie einen Betrag. Wir senden Ihnen eine Rechnung und schalten das Guthaben nach Zahlungseingang frei.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">
                                    Betrag (€)
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="col-span-3"
                                    min={MIN_INVESTMENT}
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                {[50, 100, 200, 500].map((val) => (
                                    <Button
                                        key={val}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAmount(val.toString())}
                                        className={Number(amount) === val ? "border-blue-500 bg-blue-50" : ""}
                                    >
                                        {val}€
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleRequestTopUp} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Kostenpflichtig anfragen
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardFooter>
        </Card>
    );
}
