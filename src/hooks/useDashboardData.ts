import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { checkAdminRole } from '@/lib/auth';
import { ClientData } from '@/app/admin/clients/[id]/edit/page';

const auth = getAuth(app);
const db = getFirestore(app);

export function useDashboardData() {
    const router = useRouter();
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
                setPrivateProfile(profileSnap.data());
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

    return { user, clientData, privateProfile, isLoading, error, isAdmin };
}
