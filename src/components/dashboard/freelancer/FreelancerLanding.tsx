
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, MessageCircle, Share2, MonitorPlay } from 'lucide-react';

export function FreelancerLanding() {
    return (
        <div className="flex flex-col items-center space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">

            {/* Hero Section */}
            <div className="w-full relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                    src="/images/freelancer-team.png"
                    alt="Dicilo Freelancer Team"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 md:p-12 text-white">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">Monetiza tu influencia y tiempo con la Red de Partners de Dicilo</h1>
                    <p className="text-lg md:text-xl opacity-90 max-w-2xl">
                        En Dicilo.net no solo conectamos empresas con clientes; creamos oportunidades para profesionales digitales como tú.
                    </p>
                </div>
            </div>

            {/* Intro Text */}
            <div className="text-center max-w-3xl space-y-4">
                <p className="text-lg text-muted-foreground">
                    Únete a nuestro equipo de Freelancers y genera ingresos impulsando la visibilidad de nuestros socios comerciales.
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <Mail className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">📢 Campañas de Email Marketing</h3>
                            <p className="text-sm text-muted-foreground">Utiliza nuestras herramientas para enviar newsletters y promociones segmentadas de nuestros clientes a tus propias listas o bases de datos gestionadas.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                            <MessageCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">💬 Interacción Directa</h3>
                            <p className="text-sm text-muted-foreground">Genera valor real comentando estratégicamente y gestionando la conversación en los posteos de nuestros clientes.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex gap-4">
                        <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            <Share2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">📲 Difusión de Productos</h3>
                            <p className="text-sm text-muted-foreground">Publica y promociona productos seleccionados del catálogo Dicilo en tus redes o plataformas.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-primary/20 bg-primary/5">
                    <CardContent className="p-6 flex gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                            <MonitorPlay className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">🚀 Próximamente: Automatización con Display Ads</h3>
                            <p className="text-sm text-muted-foreground">Estamos desarrollando nuestra plataforma de Display Ads. Muy pronto podrás gestionar y rentabilizar espacios publicitarios (banners) dentro de la red Dicilo y sitios asociados de forma automática. ¡Posiciónate ahora!</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* CTA Section */}
            <div className="bg-slate-50 dark:bg-slate-900 w-full p-8 rounded-2xl text-center space-y-6">
                <h2 className="text-2xl font-bold">¿Te interesa empezar a facturar con tu actividad digital?</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Cada acción cuenta y queremos explicarte nuestro plan de comisiones y herramientas al detalle.
                </p>

                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 h-12 text-lg shadow-lg hover:translate-y-[-2px] transition-all" asChild>
                    <a href="mailto:partners@dicilo.net?subject=Solicitud%20Registro%20Freelancer&body=Hola%2C%20estoy%20interesado%20en%20unirme%20como%20Freelancer%20a%20la%20red%20Dicilo.">
                        Contactar con el Equipo de Partners
                    </a>
                </Button>
                <p className="text-xs text-muted-foreground">Hablemos hoy mismo para activar tu cuenta de Freelancer.</p>
            </div>
        </div>
    );
}
