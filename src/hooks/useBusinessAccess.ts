'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type BusinessPlan = 'basic' | 'starter' | 'retailer' | 'premium' | 'none';

interface BusinessContextData {
    plan: BusinessPlan;
    businessId: string | null;
    clientId: string | null;
    isLoading: boolean;
    name: string | null;
}

export function useBusinessAccess() {
    const { user } = useAuth();
    const [data, setData] = useState<BusinessContextData>({
        plan: 'none',
        businessId: null,
        clientId: null,
        isLoading: true,
        name: null
    });

    useEffect(() => {
        let isMounted = true;

        async function fetchBusinessTier() {
            if (!user?.email) {
                if (isMounted) setData(prev => ({ ...prev, isLoading: false }));
                return;
            }

            try {
                // 1. Check Clients collection (Starter, Retailer, Premium)
                const clientsRef = collection(db, 'clients');
                const qClient = query(clientsRef, where('email', '==', user.email), limit(1));
                const clientSnap = await getDocs(qClient);

                if (!clientSnap.empty) {
                    const clientData = clientSnap.docs[0].data();
                    const bId = clientData.businessId || null;
                    const cType = (clientData.clientType as string) || 'starter'; // Default fallback

                    let resolvedPlan: BusinessPlan = 'none';
                    if (cType.toLowerCase() === 'premium') resolvedPlan = 'premium';
                    else if (cType.toLowerCase() === 'retailer') resolvedPlan = 'retailer';
                    else resolvedPlan = 'starter'; // catches 'starter' and others

                    if (isMounted) {
                        setData({
                            plan: resolvedPlan,
                            businessId: bId,
                            clientId: clientSnap.docs[0].id,
                            isLoading: false,
                            name: clientData.clientName || clientData.name || null
                        });
                    }
                    return;
                }

                // 2. Check Businesses collection directly (Basic)
                const busRef = collection(db, 'businesses');
                const qBus = query(busRef, where('email', '==', user.email), limit(1));
                const busSnap = await getDocs(qBus);

                if (!busSnap.empty) {
                    const busData = busSnap.docs[0].data();
                    if (isMounted) {
                        setData({
                            plan: 'basic',
                            businessId: busSnap.docs[0].id,
                            clientId: null,
                            isLoading: false,
                            name: busData.name || null
                        });
                    }
                    return;
                }

                // Found nothing
                if (isMounted) setData(prev => ({ ...prev, isLoading: false }));

            } catch (err) {
                console.error("Error evaluating business access:", err);
                if (isMounted) setData(prev => ({ ...prev, isLoading: false }));
            }
        }

        fetchBusinessTier();

        return () => { isMounted = false; };
    }, [user]);

    return data;
}
