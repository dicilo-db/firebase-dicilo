
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { User } from 'firebase/auth';
import { updatePrivateProfile } from '@/app/actions/profile';
import { Loader2, ArrowRight, Wallet, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface FreelancerLandingProps {
    user?: User;
}

export function FreelancerLanding({ user }: FreelancerLandingProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
    const [revolutTag, setRevolutTag] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirmAge = () => {
        if (isAgeConfirmed) setStep(2);
    };

    const handleActivateFreelancer = async (skip: boolean = false) => {
        if (!user) {
            toast({ title: "Error", description: "No se ha detectado el usuario autenticado.", variant: "destructive" });
            return;
        }

        // If not skipping, validate tag
        if (!skip && revolutTag.length < 3) {
            toast({
                title: "Formato inválido",
                description: "Por favor ingresa un Revtag válido (ej: @usuario) o selecciona 'Omitir' si no deseas configurarlo ahora.",
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);
        try {
            const formattedTag = !skip && revolutTag.startsWith('@') ? revolutTag : (!skip ? `@${revolutTag}` : null);

            const result = await updatePrivateProfile(user.uid, {
                isFreelancer: true,
                ...(formattedTag && { revolutTag: formattedTag }), // Only update tag if provided
                walletStatus: skip ? 'pending_setup' : 'active',
                onboardingCompletedAt: new Date().toISOString(),
                freelancerStatus: 'active'
            });

            if (result.success) {
                toast({
                    title: "¡Bienvenido al Equipo Freelancer!",
                    description: skip
                        ? "Tu perfil ha sido activado. Recuerda configurar tu Wallet más adelante para recibir pagos."
                        : "Tu perfil ha sido activado y tu cuenta Revolut vinculada correctamente.",
                });
                // Force hard refresh to update context and UI
                window.location.reload();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                title: "Error de activación",
                description: error.message || "Hubo un problema al guardar tu perfil.",
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto p-4 animate-in fade-in duration-500">

            {/* Steps Indicator */}
            <div className="flex items-center space-x-4 mb-8">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold transition-colors ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
                <div className={`h-1 w-12 rounded bg-muted overflow-hidden`}>
                    <div className={`h-full bg-primary transition-all duration-500 ${step >= 2 ? 'w-full' : 'w-0'}`} />
                </div>
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold transition-colors ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
            </div>

            <Card className="w-full max-w-lg shadow-2xl border-t-4 border-t-primary">

                {step === 1 && (
                    <>
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">Requisitos para Freelancers</CardTitle>
                            <CardDescription>
                                Para garantizar la calidad y legalidad de nuestra red, necesitamos confirmar algunos datos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-100 flex gap-3 text-amber-900 dark:text-amber-100">
                                <div className="font-bold text-lg">18+</div>
                                <p className="text-sm">Debes ser mayor de edad para recibir pagos y firmar acuerdos de colaboración con nuestras marcas asociadas.</p>
                            </div>

                            <div className="flex items-start space-x-3 pt-2">
                                <Checkbox
                                    id="age-check"
                                    checked={isAgeConfirmed}
                                    onCheckedChange={(c) => setIsAgeConfirmed(c === true)}
                                    className="mt-1"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor="age-check" className="text-base font-medium cursor-pointer">
                                        Confirmo que tengo 18 años o más.
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Entiendo que proveer información falsa puede resultar en la suspensión de mi cuenta.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full h-12 text-lg"
                                onClick={handleConfirmAge}
                                disabled={!isAgeConfirmed}
                            >
                                Continuar <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </>
                )}

                {step === 2 && (
                    <>
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                                <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-2xl">Configuración de Wallet</CardTitle>
                            <CardDescription>
                                Utiliza tu cuenta Revolut para recibir pagos instantáneos en tu Wallet.
                                <span className="block mt-1 text-xs opacity-80">(Opcional para registro, requerido para retiros automáticos)</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">

                            {/* Revolut Info Box */}
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border space-y-4">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="space-y-1 text-center sm:text-left">
                                        <h4 className="font-semibold text-sm">¿No tienes cuenta Revolut?</h4>
                                        <p className="text-xs text-muted-foreground">Ábrela gratis para activar tu Wallet automáticamente.</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 text-blue-600 border-blue-200" onClick={() => window.open('https://revolut.com/referral/dicilokey', '_blank')}>
                                        Abrir Cuenta <ExternalLink className="ml-2 h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="revtag">Tu Revtag de Revolut (Si tienes)</Label>
                                    <Input
                                        id="revtag"
                                        placeholder="@usuario"
                                        className="text-lg h-12"
                                        value={revolutTag}
                                        onChange={(e) => setRevolutTag(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Si lo configuras ahora, tu Wallet quedará activa inmediatamente.</p>
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter className="flex-col gap-3">
                            <Button
                                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                                onClick={() => handleActivateFreelancer(false)}
                                disabled={isLoading || revolutTag.length < 3}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-5 w-5" /> Guardar y Activar Wallet
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full text-muted-foreground"
                                onClick={() => handleActivateFreelancer(true)}
                                disabled={isLoading}
                            >
                                Omitir por ahora (Activaré mi Wallet después)
                            </Button>
                        </CardFooter>
                    </>
                )}

            </Card>

            <p className="mt-8 text-center text-xs text-muted-foreground max-w-sm">
                Al activar tu cuenta, aceptas los Términos y Condiciones de Colaboración de Dicilo Network.
            </p>
        </div>
    );
}
