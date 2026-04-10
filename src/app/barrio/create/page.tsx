'use client';

import { useState } from 'react';
import { RecommendationFormContent } from '@/components/RecommendationForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateRecommendationPage() {
    const router = useRouter();
    const [success, setSuccess] = useState(false);

    const handleSuccess = () => {
        setSuccess(true);
        // Optional: Redirect after delay or show success message
        setTimeout(() => {
            router.push('/barrio/hamburg'); // Or back to where they came from
        }, 2000);
    };

    if (success) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-3xl">
                    ✓
                </div>
                <h1 className="text-2xl font-bold mb-2">¡Recomendación Enviada!</h1>
                <p className="text-gray-600 mb-6">Gracias por compartir con tu comunidad. Tu recomendación aparecerá pronto.</p>
                <Button onClick={() => router.push('/barrio/hamburg')}>Volver a la Comunidad</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="mb-6">
                    <Link href="/barrio/hamburg" className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver al Barrio
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Nueva Recomendación</CardTitle>
                        <CardDescription>
                            Comparte un lugar especial, un servicio o una experiencia con tu comunidad.
                            Asegúrate de indicar la <strong>Ciudad</strong> correcta para que aparezca en el barrio adecuado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecommendationFormContent
                            onSuccess={handleSuccess}
                            onCancel={() => router.back()}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
