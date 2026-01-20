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
import { useTranslation } from 'react-i18next';
import { Loader2, LogOut, User as UserIcon, Coins } from 'lucide-react';
import { checkAdminRole } from '@/lib/auth';
import { PrivateDashboard } from '@/components/dashboard/PrivateDashboard';

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
    const { t } = useTranslation(['login', 'admin', 'common']); // Load admin for the form
    const [user, setUser] = useState<User | null>(null);
    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [privateProfile, setPrivateProfile] = useState<any | null>(null);
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
            await fetchDashboardData(currentUser);
        });

        return () => unsubscribe();
    }, [router]);

    const fetchDashboardData = async (currentUser: User) => {
        try {
            const uid = currentUser.uid;

            // 1. Check 'clients' collection for ownerUid (Business Users)
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
                setIsLoading(false);
                return;
            }

            // 2. Check 'private_profiles' collection (Private Users - Existing)
            const profileRef = doc(db, 'private_profiles', uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                const pData = profileSnap.data();
                const serializableProfile = JSON.parse(
                    JSON.stringify(pData, (key, value) => {
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
                setPrivateProfile(serializableProfile);
                setIsLoading(false);
                return;
            }

            // 3. Fallback: Check 'registrations' collection to determine type and initialize if needed
            const registrationsRef = collection(db, 'registrations');
            const qReg = query(registrationsRef, where('ownerUid', '==', uid));
            const regSnapshot = await getDocs(qReg);

            if (!regSnapshot.empty) {
                const regDoc = regSnapshot.docs[0];
                const regData = regDoc.data();

                // If it's a business type but client doc missing (shouldn't happen often, but handled)
                if (['retailer', 'premium'].includes(regData.registrationType)) {
                    // ... (Existing fallback logic for business) ...
                    const clientName = regData.businessName || `${regData.firstName} ${regData.lastName}`;
                    const tempClientData: any = {
                        id: 'temp_from_registration',
                        clientName: clientName,
                        clientLogoUrl: regData.imageUrl || '',
                        clientTitle: `Bienvenido a ${clientName}`,
                        clientSubtitle: 'Esta es tu página de aterrizaje. ¡Edítala desde el panel de administración!',
                        products: [],
                        slug: clientName.toLowerCase().replace(/ /g, '-'),
                        socialLinks: { instagram: '', facebook: '', linkedin: '' },
                        strengths: [],
                        testimonials: [],
                        translations: {},
                        ownerUid: uid,
                        registrationId: regDoc.id,
                        description: regData.description,
                        address: regData.address,
                        phone: regData.phone,
                        website: regData.website,
                        category: regData.category,
                    };
                    setClientData(tempClientData as ClientData);
                    setIsLoading(false);
                    return;
                }

                // If it's a PRIVATE user (or donor)
                if (regData.registrationType === 'private' || regData.registrationType === 'donor') {
                    // Initialize Private Profile via API
                    try {
                        const response = await fetch('/api/private-user/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                uid: uid,
                                email: currentUser.email,
                                firstName: regData.firstName,
                                lastName: regData.lastName,
                                phoneNumber: regData.whatsapp || regData.contactNumber || '', // Adjust field name if needed
                                contactType: regData.contactType
                            }),
                        });

                        if (response.ok) {
                            const result = await response.json();
                            setPrivateProfile(result.profile);
                        } else {
                            console.error('Failed to create private profile');
                            setError('failed_create_profile');
                        }
                    } catch (apiError) {
                        console.error('API Error:', apiError);
                        setError('api_error');
                    }
                    setIsLoading(false);
                    return;
                }
            }

            setError('no_client_found');
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
                <main className="container mx-auto flex-grow p-4">
                    <DashboardSkeleton />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <main className="container mx-auto flex-grow p-4">
                {!privateProfile && (
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold">
                            {/* Title changes based on context */}
                            {t('successTitle')}
                        </h1>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => router.push('/dashboard/dicicoin')}>
                                <Coins className="mr-2 h-4 w-4" />
                                DiciCoin
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/dashboard/profile')}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                Profil bearbeiten
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/dashboard/tickets')}>
                                <Loader2 className="mr-2 h-4 w-4" />
                                {t('tickets.title', 'Tickets')}
                            </Button>
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
                )}

                {error === 'no_client_found' ? (
                    <div className="rounded-lg border p-8 text-center">
                        <h2 className="text-xl font-semibold">{t('common:dashboard.welcome')}</h2>
                        <p className="mt-2 text-muted-foreground">
                            {t('common:dashboard.noCompanyFound')}
                        </p>
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                        Error: {error}
                    </div>
                ) : clientData ? (
                    <EditClientForm initialData={clientData} />
                ) : privateProfile && user ? (
                    <PrivateDashboard user={user} profile={privateProfile} />
                ) : null}
            </main>
        </div>
    );
}
