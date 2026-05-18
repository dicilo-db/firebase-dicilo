'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessPlan } from '@/types/business';
import { CheckCircle2, XCircle } from 'lucide-react';

export function BusinessRegistrationForm() {
    const [plan, setPlan] = useState<BusinessPlan>('basic');
    
    // Dynamic rules based on plan
    const rules = {
        basic: {
            products: 0,
            landing: 'No',
            support: 'Básico',
            ia: false
        },
        starter: {
            products: 24,
            landing: 'No',
            support: 'Email',
            ia: false
        },
        minorista: {
            products: 300,
            landing: 'Básica',
            support: 'Prioritario',
            ia: true
        },
        premium: {
            products: 600,
            landing: 'Premium',
            support: 'WhatsApp + Premium',
            ia: true
        }
    };

    const currentRules = rules[plan];

    return (
        <Card className="max-w-3xl mx-auto shadow-md">
            <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-2xl text-blue-700">Registro de Empresa</CardTitle>
                <CardDescription>Selecciona un plan y completa tus datos comerciales básicos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
                
                {/* Plan Selection */}
                <div className="space-y-3">
                    <Label className="text-lg font-semibold">Selección de Plan</Label>
                    <Select value={plan} onValueChange={(value) => setPlan(value as BusinessPlan)}>
                        <SelectTrigger className="w-full text-lg h-12">
                            <SelectValue placeholder="Selecciona un plan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="basic">Plan Básico (€0)</SelectItem>
                            <SelectItem value="starter">Plan Starter (€1.452/año)</SelectItem>
                            <SelectItem value="minorista">Plan Minorista (€4.320/año) - Recomendado</SelectItem>
                            <SelectItem value="premium">Plan Premium (€5.990/año)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Plan Permissions Summary */}
                <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                    <h3 className="font-semibold text-blue-800 mb-3">Permisos del Plan {plan.toUpperCase()}</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span>Máx. Productos: <strong className="text-slate-800">{currentRules.products}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            {currentRules.landing === 'No' ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
                            <span>Landing Page: <strong className="text-slate-800">{currentRules.landing}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span>Soporte: <strong className="text-slate-800">{currentRules.support}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            {currentRules.ia ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                            <span>Inteligencia Artificial: <strong className="text-slate-800">{currentRules.ia ? 'Sí' : 'No'}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Form Fields (Dynamic rendering based on plan) */}
                <div className="space-y-4">
                    <Label className="text-lg font-semibold border-b pb-2 block">Datos Generales</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nombre de la Empresa</Label>
                            <Input placeholder="Ej. Restaurante Bella" />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoría Principal</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gastronomia">Gastronomía</SelectItem>
                                    <SelectItem value="retail">Tienda (Retail)</SelectItem>
                                    <SelectItem value="servicios">Servicios</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Premium/Minorista only fields */}
                    {plan === 'premium' || plan === 'minorista' ? (
                        <div className="space-y-4 pt-4 border-t border-dashed mt-4">
                            <Label className="text-lg font-semibold text-purple-700">Configuración Avanzada ({plan})</Label>
                            <div className="space-y-2">
                                <Label>Prompt Personalizado IA (Configuración de tu asistente virtual)</Label>
                                <textarea 
                                    className="w-full flex min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Describe cómo debería actuar la IA al atender a tus clientes..."
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

            </CardContent>
            <CardFooter className="bg-slate-50 border-t justify-between">
                <Button variant="outline">Cancelar</Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Completar Registro</Button>
            </CardFooter>
        </Card>
    );
}
