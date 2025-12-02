'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import EditClientForm from '@/app/admin/clients/[id]/edit/EditClientForm';
import { ClientData } from '@/app/admin/clients/[id]/edit/page';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { useTranslation } from 'react-i18next';
import { Loader2, LogOut } from 'lucide-react';
import { checkAdminRole } from '@/lib/auth';

const auth = getAuth(app);
const db = getFirestore(app);

const DashboardSkeleton = () => (
    <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
        </div>
        <div className="rounded-lg border p-6">
            <Skeleton className="mb-6 h-10 w-full" />
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        </div>
    </div>
);

export default function DashboardPage() {
    const router = useRouter();
    const { t } = useTranslation(['login', 'admin']); // Load admin for the form
    const [user, setUser] = useState<User | null>(null);
    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);
            const adminUser = await checkAdminRole(currentUser);
            setIsAdmin(!!adminUser);
            await fetchClientData(currentUser.uid);
        });

        return () => unsubscribe();
    }, [router]);

    const fetchClientData = async (uid: string) => {
        try {
            // 1. Check 'clients' collection for ownerUid
            const clientsRef = collection(db, 'clients');
            const q = query(clientsRef, where('ownerUid', '==', uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                const data = docSnap.data();
                const serializableData = JSON.parse(
                    JSON.stringify(data, (key, value) => {
                        if (
                            value &&
                            value.hasOwnProperty('seconds') &&
                            value.hasOwnProperty('nanoseconds')
                        ) {
                            return new Date(value.seconds * 1000).toISOString();
                        }
                        return value;
                    })
                );
                setClientData({ id: docSnap.id, ...serializableData } as ClientData);
            } else {
                // 2. Fallback: Check 'registrations' collection
                // This handles cases where the client document wasn't created properly
                const registrationsRef = collection(db, 'registrations');
                const qReg = query(registrationsRef, where('ownerUid', '==', uid));
                const regSnapshot = await getDocs(qReg);

                if (!regSnapshot.empty) {
                    const regDoc = regSnapshot.docs[0];
                    const regData = regDoc.data();

                    // Only proceed if it's a business type
                    if (['retailer', 'premium'].includes(regData.registrationType)) {
                        const clientName = regData.businessName || `${regData.firstName} ${regData.lastName}`;
                        // Construct a temporary client object from registration data
                        const tempClientData: any = {
                            id: 'temp_from_registration', // Special ID to indicate it's not from clients collection
                            clientName: clientName,
                            clientLogoUrl: regData.imageUrl || '',
                            clientTitle: `Bienvenido a ${clientName}`,
                            clientSubtitle: 'Esta es tu página de aterrizaje. ¡Edítala desde el panel de administración!',
                            products: [],
                            slug: clientName.toLowerCase().replace(/ /g, '-'), // Simple slugify
                            socialLinks: { instagram: '', facebook: '', linkedin: '' },
                            strengths: [],
                            testimonials: [],
                            translations: {},
                            ownerUid: uid,
                            registrationId: regDoc.id,
                            // Add other fields mapped from registration
                            description: regData.description,
                            address: regData.address,
                            phone: regData.phone,
                            website: regData.website,
                            category: regData.category,
                        };
                        setClientData(tempClientData as ClientData);
                        return; // Found data, exit
                    }
                }

                setError('no_client_found');
            }
        } catch (err: any) {
            console.error('Error fetching client data:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                <Header />
                <main className="container mx-auto flex-grow p-4">
                    <DashboardSkeleton />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="container mx-auto flex-grow p-4">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">
                        {t('successTitle')}
                    </h1>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <Button variant="default" onClick={() => router.push('/admin')}>
                                {t('adminPanel')}
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            {t('logout')}
                        </Button>
                    </div>
                </div>

                {error === 'no_client_found' ? (
                    <div className="rounded-lg border p-8 text-center">
                        <h2 className="text-xl font-semibold">Willkommen!</h2>
                        <p className="mt-2 text-muted-foreground">
                            Wir konnten kein Unternehmen finden, das mit Ihrem Konto verknüpft ist.
                            Bitte kontaktieren Sie den Support, wenn Sie glauben, dass dies ein Fehler ist.
                        </p>
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                        Error: {error}
                    </div>
                ) : clientData ? (
                    <EditClientForm initialData={clientData} />
                ) : null}
            </main>
        </div>
    );
}
