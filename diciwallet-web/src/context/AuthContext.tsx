'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isFreelancer?: boolean;
}

interface UserWallet {
  balance: number;      // DP - Dicipoints de Dicilo
  balanceDC: number;    // DC - DiciCoins digitales
  totalPaidEur: number; // EUR acumulados pagados sobre monedas físicas
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  wallet: UserWallet | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  wallet: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setWallet(null);
        setLoading(false);
        return;
      }

      // 1. Escuchar perfil privado del usuario en private_profiles (mismo que Dicilo.net)
      const profileRef = doc(db, 'private_profiles', currentUser.uid);
      const unsubscribeProfile = onSnapshot(profileRef, async (profileSnap) => {
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || currentUser.email || '',
            role: data.role || 'user',
            isFreelancer: data.isFreelancer || false,
          });
        } else {
          // Si no existe el perfil (registro nuevo desde DiciWallet), lo creamos básico
          const basicProfile = {
            firstName: currentUser.displayName?.split(' ')[0] || 'Usuario',
            lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || 'DiciWallet',
            email: currentUser.email || '',
            role: 'user',
            createdAt: new Date(),
          };
          await setDoc(profileRef, basicProfile);
          setProfile(basicProfile);
        }
      });

      // 2. Escuchar monedero del usuario en wallets (mismo que Dicilo.net)
      const walletRef = doc(db, 'wallets', currentUser.uid);
      const unsubscribeWallet = onSnapshot(walletRef, async (walletSnap) => {
        if (walletSnap.exists()) {
          const data = walletSnap.data();
          setWallet({
            balance: data.balance || 0,
            balanceDC: data.balanceDC || 0,
            totalPaidEur: data.totalPaidEur || 0,
          });
        } else {
          // Si no existe la wallet en Dicilo, la inicializamos
          const initialWallet = {
            balance: 0,
            balanceDC: 0,
            totalPaidEur: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await setDoc(walletRef, initialWallet);
          setWallet(initialWallet);
        }
      });

      setLoading(false);

      return () => {
        unsubscribeProfile();
        unsubscribeWallet();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setWallet(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, wallet, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
