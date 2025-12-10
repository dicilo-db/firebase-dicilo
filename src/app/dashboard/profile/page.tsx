'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import categoriesData from '@/data/categories.json';

const auth = getAuth(app);
const db = getFirestore(app);

// Schema for the profile form
const profileFormSchema = z.object({
    firstName: z.string().min(2, {
        message: 'Vorname muss mindestens 2 Zeichen lang sein.',
    }),
    lastName: z.string().min(2, {
        message: 'Nachname muss mindestens 2 Zeichen lang sein.',
    }),
    email: z.string().email(),
    phone: z.string().optional(),

    // Interests (Categories)
    interests: z.array(z.string()).default([]),

    // Ad Preferences
    adPreference: z.enum(['all', 'relevant', 'none']).default('relevant'),

    // Contact Channels
    contactChannels: z.object({
        email: z.boolean().default(true),
        whatsapp: z.boolean().default(false),
        telegram: z.boolean().default(false),
        phone: z.boolean().default(false),
    }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function PrivateUserProfilePage() {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            interests: [],
            adPreference: 'relevant',
            contactChannels: {
                email: true,
                whatsapp: false,
                telegram: false,
                phone: false,
            },
        },
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const user = auth.currentUser;
            if (!user) {
                setIsLoading(false);
                return; // Redirect handled by AuthGuard or similar usually
            }

            try {
                const docRef = doc(db, 'private_profiles', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    form.reset({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        email: user.email || '',
                        phone: data.phone || '',
                        interests: data.interests || [],
                        adPreference: data.adPreference || 'relevant',
                        contactChannels: {
                            email: data.contactChannels?.email ?? true,
                            whatsapp: data.contactChannels?.whatsapp ?? false,
                            telegram: data.contactChannels?.telegram ?? false,
                            phone: data.contactChannels?.phone ?? false,
                        },
                    });
                } else {
                    // Pre-fill email at least
                    form.setValue('email', user.email || '');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast({
                    title: 'Fehler',
                    description: 'Profil konnte nicht geladen werden.',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [form, toast]);

    const onSubmit = async (data: ProfileFormValues) => {
        const user = auth.currentUser;
        if (!user) {
            toast({
                title: 'Fehler',
                description: 'Sie sind nicht angemeldet.',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);
        try {
            await setDoc(doc(db, 'private_profiles', user.uid), {
                ...data,
                updatedAt: new Date(),
                uid: user.uid,
            }, { merge: true });

            toast({
                title: 'Erfolg',
                description: 'Ihr Profil wurde aktualisiert.',
            });
        } catch (error) {
            console.error('Error saving profile:', error);
            toast({
                title: 'Fehler',
                description: 'Profil konnte nicht gespeichert werden.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
            <Header />
            <main className="flex-grow container mx-auto p-4 md:p-8 max-w-3xl">
                <h1 className="text-3xl font-bold mb-6">Mein Profil</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Persönliche Daten & Einstellungen</CardTitle>
                        <CardDescription>
                            Verwalten Sie hier Ihre persönlichen Informationen und Präferenzen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                                {/* Personal Info */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Persönliche Informationen</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Vorname</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Max" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nachname</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Mustermann" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>E-Mail</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled />
                                                </FormControl>
                                                <FormDescription>
                                                    Ihre E-Mail-Adresse kann nicht geändert werden.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telefon (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+49 123 456789" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Interests */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Meine Interessen</h3>
                                    <FormDescription>
                                        Wählen Sie Kategorien aus, die Sie interessieren, um passendere Angebote zu erhalten.
                                    </FormDescription>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-4 rounded-md max-h-60 overflow-y-auto">
                                        {categoriesData.map((category) => (
                                            <FormField
                                                key={category.name}
                                                control={form.control}
                                                name="interests"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={category.name}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(category.name)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, category.name])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== category.name
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal text-sm cursor-pointer">
                                                                {category.name}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Ad Preferences */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Werbepräferenzen</h3>
                                    <FormField
                                        control={form.control}
                                        name="adPreference"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Welche Werbung möchten Sie sehen?</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Wählen Sie eine Option" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="all">Alle Angebote anzeigen</SelectItem>
                                                        <SelectItem value="relevant">Nur relevante Angebote (basierend auf Interessen)</SelectItem>
                                                        <SelectItem value="none">Keine personalisierte Werbung</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Contact Channels */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Kontaktkanäle</h3>
                                    <FormDescription>Wie dürfen wir Sie kontaktieren?</FormDescription>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="contactChannels.email"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>E-Mail</FormLabel>
                                                        <FormDescription>
                                                            Newsletter und Angebote per E-Mail.
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="contactChannels.whatsapp"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>WhatsApp</FormLabel>
                                                        <FormDescription>
                                                            Nachrichten direkt auf Ihr Handy.
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="contactChannels.telegram"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Telegram</FormLabel>
                                                        <FormDescription>
                                                            Updates über unseren Telegram-Kanal.
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="contactChannels.phone"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Telefonanruf</FormLabel>
                                                        <FormDescription>
                                                            Wir rufen Sie bei exklusiven Angeboten an.
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Änderungen speichern
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
