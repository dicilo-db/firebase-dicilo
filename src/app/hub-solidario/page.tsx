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

// Simple localized dictionary for hub-solidario since it doesn't use the standard i18next layer easily 
// (it's a public landing accessible specifically via invite token).
const translations: any = {
    es: {
        title: "Apoyo Social Dicilo",
        invitationExclusive: "Invitación exclusiva para",
        tellUsStory: "Cuéntanos tu historia para que podamos ayudarte a difundirla de manera profesional y gratuita.",
        language: "Idioma: Español",
        orgNameLabel: "Nombre del Proyecto / Persona",
        orgNameHolder: "Ej: Santuario Animal Feliz o Apoyo Solidario para Salud",
        categoryLabel: "Categoría de Impacto",
        catPlaceholder: "Selecciona una categoría...",
        catHealth: "Urgencia Médica (Salud)",
        catDisability: "Emprendimiento por Discapacidad",
        catNgo: "Organización sin fines de lucro / Santuario",
        catSub: "Apoyo Económico por Subsistencia",
        storyLabel: "Tu historia (¿Qué apoyo necesitas?)",
        storyGuide: "Ejemplos de guía:\n• \"Estamos necesitando de su ayuda debido a complicaciones que tuve tras un accidente reciente...\"\n• \"Somos una organización sin fines de lucro que apoya a familias en situación de calle...\"\n• \"Mi situación es muy difícil; no encuentro empleo y necesito ayuda para la medicación de mi hijo...\"",
        storyPlaceholder: "Escribe tu historia aquí...",
        storyLengthCheck: "caracteres",
        helpLinkLabel: "Enlace para Ayudarte (Opcional pero recomendado)",
        helpLinkHolder: "https://wa.me/... o Enlace de recolección de fondos",
        disclaimerBox: "Sabemos que quizás te avergüence solicitar ayuda, pero <strong>todos somos vulnerables en algún momento</strong>. Aunque no podemos asegurarte que por aquí resolveremos todos tus problemas, estamos dispuestos a colocar nuestro granito de arena para que la mayor cantidad de ayuda llegue a ti. <br/><br/>Por favor, sube documentos que demuestren tu situación actual (como órdenes médicas, certificados de incapacidad laboral o recetas de alto costo). No se trata de desconfianza; al contrario, queremos ayudar con total transparencia para que los donantes se sientan seguros de apoyarte.",
        uploadDocLabel: "Sube tu documento probatorio (PDF, JPG, PNG)",
        uploading: "Procesando Postulación...",
        terms: "Acepto que Dicilo verifique la veracidad de esta situación y me comprometo a usar los recursos estrictamente para el fin declarado. Entiendo que los banners generados llevarán marca de agua de pertenencia al programa.",
        submitBtn: "Enviar Postulación Segura",
        errorDoc: "Por favor adjunte un documento probatorio.",
        successTitle: "Postulación Enviada",
        successDesc: "Su solicitud ha sido enviada con éxito. El equipo de Dicilo revisará su caso a la brevedad.",
        errorTitle: "Error interno",
        verifying: "Verificando acceso..."
    },
    en: {
        title: "Dicilo Social Support",
        invitationExclusive: "Exclusive invitation for",
        tellUsStory: "Tell us your story so we can help you spread it professionally and for free.",
        language: "Language: English",
        orgNameLabel: "Project / Person Name",
        orgNameHolder: "Ex: Happy Animal Sanctuary or Health Solidarity Support",
        categoryLabel: "Impact Category",
        catPlaceholder: "Select a category...",
        catHealth: "Medical Emergency (Health)",
        catDisability: "Disability Entrepreneurship",
        catNgo: "Non-profit Organization / Sanctuary",
        catSub: "Subsistence Economic Support",
        storyLabel: "Your story (What support do you need?)",
        storyGuide: "Guide examples:\n• \"We are in need of your help due to complications I had after a recent accident...\"\n• \"We are a non-profit organization supporting homeless families...\"\n• \"My situation is very difficult; I can't find a job and I need help for my child's medication...\"",
        storyPlaceholder: "Write your story here...",
        storyLengthCheck: "characters",
        helpLinkLabel: "Link to Help You (Optional but recommended)",
        helpLinkHolder: "https://wa.me/... or Fundraising Link",
        disclaimerBox: "We know you might feel embarrassed to ask for help, but <strong>we are all vulnerable at some point</strong>. Although we cannot assure you that we will solve all your problems here, we are willing to do our part so that as much help as possible reaches you. <br/><br/>Please upload documents that demonstrate your current situation (such as medical orders, disability certificates, or high-cost prescriptions). This is not about mistrust; on the contrary, we want to help with absolute transparency so that donors feel confident supporting you.",
        uploadDocLabel: "Upload your evidentiary document (PDF, JPG, PNG)",
        uploading: "Processing Application...",
        terms: "I accept that Dicilo verifies the veracity of this situation and I commit to using the resources strictly for the declared purpose. I understand that generated banners will carry a watermark belonging to the program.",
        submitBtn: "Send Secure Application",
        errorDoc: "Please attach a proof document.",
        successTitle: "Application Sent",
        successDesc: "Your application has been successfully sent. The Dicilo team will review your case shortly.",
        errorTitle: "Internal Error",
        verifying: "Verifying access..."
    },
    de: {
        title: "Dicilo Soziale Unterstützung",
        invitationExclusive: "Exklusive Einladung für",
        tellUsStory: "Erzählen Sie uns Ihre Geschichte, damit wir Ihnen helfen können, sie professionell und kostenlos zu verbreiten.",
        language: "Sprache: Deutsch",
        orgNameLabel: "Projekt- / Personenname",
        orgNameHolder: "Bsp: Glückliches Tierschutzgebiet oder Gesundheitssolidaritätsunterstützung",
        categoryLabel: "Auswirkungskategorie",
        catPlaceholder: "Wählen Sie eine Kategorie...",
        catHealth: "Medizinischer Notfall (Gesundheit)",
        catDisability: "Unternehmertum bei Behinderung",
        catNgo: "Gemeinnützige Organisation / Schutzgebiet",
        catSub: "Wirtschaftliche Unterstützung zum Lebensunterhalt",
        storyLabel: "Ihre Geschichte (Welche Unterstützung benötigen Sie?)",
        storyGuide: "Beispiele zur Orientierung:\n• \"Wir benötigen Ihre Hilfe aufgrund von Komplikationen nach einem kürzlichen Unfall...\"\n• \"Wir sind eine gemeinnützige Organisation, die obdachlose Familien unterstützt...\"\n• \"Meine Situation ist sehr schwierig; ich finde keinen Job und brauche Hilfe für die Medikamente meines Kindes...\"",
        storyPlaceholder: "Schreiben Sie Ihre Geschichte hier...",
        storyLengthCheck: "Zeichen",
        helpLinkLabel: "Link, um Ihnen zu helfen (Optional, aber empfohlen)",
        helpLinkHolder: "https://wa.me/... oder Spendenlink",
        disclaimerBox: "Wir wissen, dass es Ihnen vielleicht peinlich ist, um Hilfe zu bitten, aber <strong>wir alle sind irgendwann verletzlich</strong>. Obwohl wir Ihnen nicht versichern können, dass wir hier alle Ihre Probleme lösen werden, sind wir bereit, unseren Teil dazu beizutragen, damit Sie so viel Hilfe wie möglich erreicht. <br/><br/>Bitte laden Sie Dokumente hoch, die Ihre aktuelle Situation belegen (wie z. B. ärztliche Verordnungen, Arbeitsunfähigkeitsbescheinigungen oder teure Rezepte). Das hat nichts mit Misstrauen zu tun; im Gegenteil, wir möchten mit absoluter Transparenz helfen, damit Spender Vertrauen haben, Sie zu unterstützen.",
        uploadDocLabel: "Laden Sie Ihr Nachweisdokument hoch (PDF, JPG, PNG)",
        uploading: "Bewerbung wird verarbeitet...",
        terms: "Ich akzeptiere, dass Dicilo den Wahrheitsgehalt dieser Situation überprüft, und ich verpflichte mich, die Ressourcen strikt für den angegebenen Zweck zu verwenden. Ich verstehe, dass generierte Banner ein Wasserzeichen des Programms tragen werden.",
        submitBtn: "Sichere Bewerbung senden",
        errorDoc: "Bitte hängen Sie ein Nachweisdokument an.",
        successTitle: "Bewerbung gesendet",
        successDesc: "Ihre Bewerbung wurde erfolgreich gesendet. Das Dicilo-Team wird Ihren Fall in Kürze prüfen.",
        errorTitle: "Interner Fehler",
        verifying: "Zugriff wird überprüft..."
    }
}

function HubSolidarioForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    
    const token = searchParams.get('invitacion');
    const emailFromUrl = searchParams.get('email');
    const rawLang = searchParams.get('lang') || 'es';
    const lang = ['es', 'en', 'de'].includes(rawLang) ? rawLang : 'es';
    const t = translations[lang];

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        story: '',
        helpLink: ''
    });

    useEffect(() => {
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
            toast({ title: 'Error', description: t.errorDoc, variant: 'destructive' });
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
                title: t.successTitle,
                description: t.successDesc,
            });

            setFormData({ name: '', category: '', story: '', helpLink: '' });
            setFile(null);
            router.push('/hub-solidario/success');
        } catch (error: any) {
            console.error('Submission error:', error);
            toast({ title: t.errorTitle, description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token || !emailFromUrl) {
        return <div className="min-h-screen flex items-center justify-center">{t.verifying}</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-50/30 p-4 font-sans">
            <Card className="w-full max-w-2xl border-t-[10px] border-t-green-500 shadow-xl">
                <CardHeader className="text-center space-y-4 pt-8">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <Heart className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold text-slate-800">{t.title}</CardTitle>
                        <CardDescription className="text-base mt-2">
                            {t.invitationExclusive} <strong>{emailFromUrl}</strong>.<br />
                            {t.tellUsStory}
                        </CardDescription>
                        <div className="mt-4 inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-800 text-sm font-medium rounded-full border border-emerald-200">
                            {t.language}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t.orgNameLabel}</Label>
                            <Input 
                                id="name" 
                                placeholder={t.orgNameHolder} 
                                required 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">{t.categoryLabel}</Label>
                            <Select required value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.catPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="salud">{t.catHealth}</SelectItem>
                                    <SelectItem value="discapacidad">{t.catDisability}</SelectItem>
                                    <SelectItem value="ong">{t.catNgo}</SelectItem>
                                    <SelectItem value="subsistencia">{t.catSub}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 relative">
                            <Label htmlFor="story" className="flex justify-between items-center w-full">
                                <span>{t.storyLabel}</span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${formData.story.length > 1400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                    {formData.story.length} / 1500 {t.storyLengthCheck}
                                </span>
                            </Label>
                            <p className="text-xs text-muted-foreground mb-2 mt-1 whitespace-pre-line">
                                {t.storyGuide}
                            </p>
                            <Textarea 
                                id="story" 
                                className="min-h-[160px] resize-y"
                                placeholder={t.storyPlaceholder} 
                                required 
                                maxLength={1500}
                                value={formData.story}
                                onChange={(e) => setFormData({...formData, story: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="helpLink">{t.helpLinkLabel}</Label>
                            <Input 
                                id="helpLink" 
                                type="url"
                                placeholder={t.helpLinkHolder} 
                                value={formData.helpLink}
                                onChange={(e) => setFormData({...formData, helpLink: e.target.value})}
                            />
                        </div>

                        <div 
                            className="bg-green-50 border border-green-200 rounded-lg p-4 text-justify leading-relaxed text-sm text-green-900 shadow-sm"
                            dangerouslySetInnerHTML={{ __html: t.disclaimerBox }}
                        />

                        <div className="space-y-2 p-4 border-2 border-dashed border-green-300 rounded-lg bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition-colors">
                            <UploadCloud className="h-8 w-8 text-green-500 mb-2" />
                            <Label htmlFor="file" className="cursor-pointer font-semibold text-green-700 text-center">
                                {file ? file.name : t.uploadDocLabel}
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
                            <label htmlFor="terms">{t.terms}</label>
                        </div>

                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t.uploading}
                                </>
                            ) : (
                                t.submitBtn
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4"><Loader2 className="animate-spin text-green-600" /></div>}>
            <HubSolidarioForm />
        </Suspense>
    );
}
