'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { unsubscribeEmail } from '@/app/actions/unsubscribe';
import { useToast } from '@/hooks/use-toast';
import { MailX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function BajaContent() {
    const searchParams = useSearchParams();
    const tokenEmail = searchParams.get('email') || '';
    const inviteId = searchParams.get('inviteId') || '';
    
    const [email, setEmail] = useState(tokenEmail);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const { toast } = useToast();

    const handleUnsubscribe = async () => {
        if (!email) return;
        setIsSubmitting(true);
        try {
            const res = await unsubscribeEmail(email, inviteId);
            if (res.success) {
                setSuccess(true);
            } else {
                toast({ title: 'Error', description: res.error || 'No se pudo procesar la solicitud.', variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="flex justify-center flex-col items-center p-8 bg-green-50 text-green-900 rounded-xl space-y-4 text-center mx-4 mt-20 max-w-lg shadow-sm border border-green-200">
                <MailX className="w-16 h-16 text-green-600 mb-2" />
                <h2 className="text-2xl font-bold">Solicitud Completada</h2>
                <p>Su dirección <b>{email}</b> ha sido dada de baja de nuestra lista. Respetamos su decisión.</p>
                <p className="text-sm mt-4 text-green-700/80">Usted ha sido dado/a de baja de la lista de dicilo.net de forma exitosa. Si en algún momento desea volver a unirse, puede hacerlo registrándose en dicilo.net directamente.</p>
            </div>
        );
    }

    return (
        <Card className="max-w-md w-full shadow-lg border-red-100">
            <CardHeader className="text-center space-y-2 pb-0 pt-8">
                <div className="mx-auto w-16 h-16 bg-red-100/50 text-red-600 rounded-full flex items-center justify-center mb-2">
                    <MailX className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl text-red-900">Confirmar Baja</CardTitle>
                <CardDescription className="text-base text-slate-600 mt-2 px-2 text-balance leading-relaxed">
                    Lamentamos mucho que no nos quiera acompañar en esta aventura, pero respetamos su decisión.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <p className="text-sm text-slate-500 font-medium text-center">
                    Por favor, confirme el correo electrónico que no desea mantener en la plataforma dicilo.net:
                </p>
                <Input 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    type="email"
                    required
                    className="text-center"
                />
            </CardContent>
            <CardFooter className="pb-8">
                <Button 
                    onClick={handleUnsubscribe} 
                    className="w-full bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    disabled={!email || isSubmitting}
                >
                    {isSubmitting ? 'Procesando baja...' : 'Confirmar Baja Definitiva'}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function BajaPage() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50 p-4 font-sans">
            <Suspense fallback={<div className="text-muted-foreground animate-pulse">Cargando...</div>}>
                <BajaContent />
            </Suspense>
        </div>
    );
}
