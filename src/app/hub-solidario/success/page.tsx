import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function HubSolidarioSuccess() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-green-50/30 p-4 font-sans">
            <Card className="w-full max-w-lg border-t-[10px] border-t-green-500 shadow-xl text-center">
                <CardHeader className="space-y-4 pt-8">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">¡Postulación Recibida!</CardTitle>
                    <CardDescription className="text-base mt-2 px-6">
                        Hemos recibido tu solicitud y tu documento probatorio de forma segura. El equipo de Dicilo revisará la información y te notificará por correo electrónico cuando tu perfil de Apoyo Social sea activado.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                    <Button asChild className="bg-slate-800 text-white hover:bg-slate-900 mt-4">
                        <Link href="/">Volver a Dicilo.net</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
