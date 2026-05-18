'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { BusinessProfile } from '@/types/business';
import { checkAdminRole } from '@/lib/auth';

interface BusinessAuthContextType {
    companyId: string | null;
    companyProfile: BusinessProfile | null;
    isImpersonating: boolean;
    isLoading: boolean;
    exitImpersonation: () => void;
}

const BusinessAuthContext = createContext<BusinessAuthContextType>({
    companyId: null,
    companyProfile: null,
    isImpersonating: false,
    isLoading: true,
    exitImpersonation: () => {},
});

export const useBusinessAuth = () => useContext(BusinessAuthContext);

export function BusinessAuthProvider({ children }: { children: React.ReactNode }) {
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [companyProfile, setCompanyProfile] = useState<BusinessProfile | null>(null);
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const auth = getAuth(app);
        const db = getFirestore(app);

        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (!user) {
                // Not logged in at all
                router.push('/admin');
                return;
            }

            try {
                // Check for Impersonation (Modo Dios)
                const impersonateId = localStorage.getItem('impersonateCompanyId');
                
                if (impersonateId) {
                    // Check if they are actually an admin
                    const adminData = await checkAdminRole(user);
                    if (adminData && (adminData.role === 'superadmin' || adminData.role === 'admin' || adminData.role === 'team_office')) {
                        // Load the impersonated profile
                        const docRef = doc(db, 'business_profiles', impersonateId);
                        const snap = await docRef.get();
                        
                        if (snap.exists()) {
                            setIsImpersonating(true);
                            setCompanyId(impersonateId);
                            setCompanyProfile({ id: snap.id, ...snap.data() } as BusinessProfile);
                            setIsLoading(false);
                            return;
                        } else {
                            console.warn("Impersonated company not found. Falling back to normal flow.");
                            localStorage.removeItem('impersonateCompanyId');
                        }
                    } else {
                        localStorage.removeItem('impersonateCompanyId');
                    }
                }

                // Normal Flow: Find a business profile owned by this user
                const profilesRef = collection(db, 'business_profiles');
                const q = query(profilesRef, where('ownerUid', '==', user.uid));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    // For now, if they own multiple, just pick the first one. 
                    // TODO: Add a company switcher UI later.
                    const firstDoc = snapshot.docs[0];
                    setCompanyId(firstDoc.id);
                    setCompanyProfile({ id: firstDoc.id, ...firstDoc.data() } as BusinessProfile);
                } else {
                    // No company found. Maybe redirect to creation page?
                    // But maybe they are already on /business/profile (the creation page).
                    setCompanyId(null);
                    setCompanyProfile(null);
                }
            } catch (error) {
                console.error("Error loading B2B auth context:", error);
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const exitImpersonation = () => {
        localStorage.removeItem('impersonateCompanyId');
        setIsImpersonating(false);
        setCompanyId(null);
        setCompanyProfile(null);
        router.push('/admin/b2b-profiles'); // Redirect back to Admin
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-slate-500 font-medium animate-pulse">Cargando Ecosistema B2B...</p>
                </div>
            </div>
        );
    }

    // If not impersonating and no company found, we should ensure they can only access the registration page.
    // For now, we will just let the pages handle it (e.g. Dashboard will say "Create profile").

    return (
        <BusinessAuthContext.Provider value={{ companyId, companyProfile, isImpersonating, isLoading, exitImpersonation }}>
            {children}
        </BusinessAuthContext.Provider>
    );
}
