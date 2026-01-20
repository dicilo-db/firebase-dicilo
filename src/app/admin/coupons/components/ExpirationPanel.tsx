'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, AlertTriangle, Clock } from 'lucide-react';

interface ExpirationPanelProps {
    coupons: any[]; // We receive the filtered list and calculate stats
}

export function ExpirationPanel({ coupons }: ExpirationPanelProps) {
    const now = new Date();
    const today = new Date().setHours(0, 0, 0, 0);
    const oneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime();
    const oneMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime();

    let expired = 0;
    let expiresToday = 0;
    let expiresWeek = 0;
    let expiresMonth = 0;

    coupons.forEach(c => {
        const end = new Date(c.endDate).getTime();

        // Check if expired
        if (new Date(c.endDate) < now) {
            expired++;
        } else {
            // Check upcoming expirations
            if (end === today) expiresToday++; // Simplified check (should probably check dates properly)
            // Better date check:
            const endDate = new Date(c.endDate);
            const isToday = endDate.getDate() === now.getDate() && endDate.getMonth() === now.getMonth() && endDate.getFullYear() === now.getFullYear();

            if (isToday) expiresToday++;
            if (end <= oneWeek) expiresWeek++;
            if (end <= oneMonth) expiresMonth++;
        }
    });

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Caducidad / Vencimientos
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-red-50 rounded text-red-700">
                    <span>Expirados</span>
                    <span className="font-bold">{expired}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded text-orange-700">
                    <span>Vence Hoy</span>
                    <span className="font-bold">{expiresToday}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded text-yellow-700">
                    <span>Esta Semana</span>
                    <span className="font-bold">{expiresWeek}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded border">
                    <span>Este Mes</span>
                    <span className="font-bold">{expiresMonth}</span>
                </div>
            </CardContent>
        </Card>
    );
}
