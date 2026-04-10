'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function AdsCalculator() {
    const [budget, setBudget] = useState<number>(10);
    const [clicks, setClicks] = useState<number>(200);
    const COST_PER_CLICK = 0.05;

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            setBudget(val);
            setClicks(Math.round(val / COST_PER_CLICK));
        } else {
            setBudget(0);
            setClicks(0);
        }
    };

    const handleClicksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) {
            setClicks(val);
            setBudget(parseFloat((val * COST_PER_CLICK).toFixed(2)));
        } else {
            setClicks(0);
            setBudget(0);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Calculator className="mr-2 h-4 w-4" /> Calculator
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ads Credits Calculator</DialogTitle>
                    <DialogDescription>
                        Calculate how many clicks you can get for your budget.
                        Current rate: <strong>{COST_PER_CLICK}€ / click</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="budget">Budget (EUR)</Label>
                        <Input
                            id="budget"
                            type="number"
                            min="0"
                            step="0.01"
                            value={budget}
                            onChange={handleBudgetChange}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="clicks">Estimated Clicks</Label>
                        <Input
                            id="clicks"
                            type="number"
                            min="0"
                            step="1"
                            value={clicks}
                            onChange={handleClicksChange}
                        />
                    </div>

                    <div className="rounded-md bg-muted p-4 text-sm text-center">
                        With <span className="font-bold text-primary">{budget.toFixed(2)}€</span>,
                        you can get approximately <span className="font-bold text-primary">{clicks}</span> clicks
                        on your banners.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
