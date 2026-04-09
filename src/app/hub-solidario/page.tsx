'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart, UploadCloud } from 'lucide-react';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { app } from '@/lib/firebase';

const db = getFirestore(app);
const storage = getStorage(app);

function HubSolidarioForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    
    const token = searchParams.get('invitacion');
    const emailFromUrl = searchParams.get('email');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        story: '',
        helpLink: ''
    });

    useEffect(() => {
        // Simple client-side check. Perfect validation should happen server-side.
        if (!token || !emailFromUrl) {
            router.push('/403');
        }
    }, [token, emailFromUrl, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!file) {
            toast({ title: 'Error', description: 'Por favor adjunte un documento probatorio.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload file securely to 'apoyo_social_docs'
            const storageRef = ref(storage, `apoyo_social_docs/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);

            // 2. Save Application to Firestore pending table
            await addDoc(collection(db, 'apoyo_social_requests'), {
                name: formData.name,
                email: emailFromUrl, // Secure it via the invite
                category: formData.category,
                story: formData.story,
                helpLink: formData.helpLink,
                documentUrl: downloadUrl,
                status: 'pending',
                tokenUsed: token,
                createdAt: serverTimestamp()
            });

            toast({
                title: 'Postulación Enviada',
                description: 'Su solicitud ha sido enviada con éxito. El equipo de Dicilo revisará su caso a la brevedad.',
            });

            // Redirect to a clean success state or clear form
            setFormData({ name: '', category: '', story: '', helpLink: '' });
            setFile(null);
            router.push('/hub-solidario/success');
        } catch (error: any) {
            console.error('Submission error:', error);
            toast({ title: 'Error interno', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token || !emailFromUrl) {
        return <div className="min-h-screen flex items-center justify-center">Verificando acceso...</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-50/30 p-4 font-sans">
            <Card className="w-full max-w-2xl border-t-[10px] border-t-green-500 shadow-xl">
                <CardHeader className="text-center space-y-4 pt-8">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <Heart className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold text-slate-800">Apoyo Social Dicilo</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Invitación exclusiva para <strong>{emailFromUrl}</strong>.<br />
                            Cuéntanos tu historia para que podamos ayudarte a difundirla de manera profesional y gratuita.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Proyecto / Persona</Label>
                            <Input 
                                id="name" 
                                placeholder="Ej: Santuario Animal Feliz o Apoyo Solidario para Salud" 
                                required 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría de Impacto</Label>
                            <Select required value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una categoría..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="salud">Urgencia Médica (Salud)</SelectItem>
                                    <SelectItem value="discapacidad">Emprendimiento por Discapacidad</SelectItem>
                                    <SelectItem value="ong">Organización sin fines de lucro / Santuario</SelectItem>
                                    <SelectItem value="subsistencia">Apoyo Económico por Subsistencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="story">Tu historia (¿Qué apoyo necesitas?)</Label>
                            <p className="text-xs text-muted-foreground mb-2 mt-1">
                                Ejemplos de guía:<br/>
                                • "Estamos necesitando de su ayuda debido a complicaciones que tuve tras un accidente reciente..."<br/>
                                • "Somos una organización sin fines de lucro que apoya a familias en situación de calle..."<br/>
                                • "Mi situación es muy difícil; no encuentro empleo y necesito ayuda para la medicación de mi hijo..."
                            </p>
                            <Textarea 
                                id="story" 
                                className="min-h-[140px]"
                                placeholder="Escribe tu historia aquí..." 
                                required 
                                maxLength={1200}
                                value={formData.story}
                                onChange={(e) => setFormData({...formData, story: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="helpLink">Enlace para Ayudarte (Opcional pero recomendado)</Label>
                            <Input 
                                id="helpLink" 
                                type="url"
                                placeholder="https://wa.me/... o Enlace de recolección de fondos" 
                                value={formData.helpLink}
                                onChange={(e) => setFormData({...formData, helpLink: e.target.value})}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Donde quieres que la gente dé clic en tu banner.
                            </p>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-justify leading-relaxed text-sm text-green-900 shadow-sm">
                            <p>
                                Sabemos que quizás te avergüence solicitar ayuda, pero <strong>todos somos vulnerables en algún momento</strong>. Aunque no podemos asegurarte que por aquí resolveremos todos tus problemas, estamos dispuestos a colocar nuestro granito de arena para que la mayor cantidad de ayuda llegue a ti. <br/><br/>
                                Por favor, sube documentos que demuestren tu situación actual (como órdenes médicas, certificados de incapacidad laboral o recetas de alto costo). No se trata de desconfianza; al contrario, queremos ayudar con total transparencia para que los donantes se sientan seguros de apoyarte.
                            </p>
                        </div>

                        <div className="space-y-2 p-4 border-2 border-dashed border-green-300 rounded-lg bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition-colors">
                            <UploadCloud className="h-8 w-8 text-green-500 mb-2" />
                            <Label htmlFor="file" className="cursor-pointer font-semibold text-green-700">
                                {file ? file.name : 'Sube tu documento probatorio (PDF, JPG, PNG)'}
                            </Label>
                            <Input 
                                id="file" 
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                className="hidden" 
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded flex items-start gap-2">
                            <input type="checkbox" required className="mt-1" id="terms" />
                            <label htmlFor="terms">Acepto que Dicilo verifique la veracidad de esta situación y me comprometo a usar los recursos estrictamente para el fin declarado. Entiendo que los banners generados llevarán marca de agua de pertenencia al programa.</label>
                        </div>

                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando Postulación...
                                </>
                            ) : (
                                "Enviar Postulación Segura"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function HubSolidarioPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4">Cargando acceso seguro...</div>}>
            <HubSolidarioForm />
        </Suspense>
    );
}
