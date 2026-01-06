'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Wallet, ArrowUpRight, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FreelancerPaymentsPage() {
    return (
        <div className="p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pagos y Carteras</h1>
                <p className="text-muted-foreground mt-2">Gestiona tus ganancias, retiros y métodos de pago.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Main Wallet Card */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-slate-100">
                            <span>Saldo Disponible</span>
                            <Wallet className="h-5 w-5 opacity-70" />
                        </CardTitle>
                        <CardDescription className="text-slate-300">Listo para retirar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold mb-6">$85.00</div>
                        <Button className="w-full bg-white text-black hover:bg-slate-200 font-semibold" size="lg">
                            <ArrowUpRight className="mr-2 h-4 w-4" /> Solicitar Retiro
                        </Button>
                    </CardContent>
                </Card>

                {/* Pending Balance Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Saldo Pendiente</span>
                            <History className="h-5 w-5 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>En proceso de validación (30 días)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold mb-6 text-muted-foreground">$39.50</div>
                        <div className="flex gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                            <History className="h-4 w-4" /> Próxima liberación: 12 Oct
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Transacciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <ArrowUpRight className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Pago por Promoción</p>
                                        <p className="text-xs text-muted-foreground">HörComfort Services • Ref: 9832{i}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-green-600">+$12.50</span>
                                    <p className="text-xs text-muted-foreground">Hoy, 14:30</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
