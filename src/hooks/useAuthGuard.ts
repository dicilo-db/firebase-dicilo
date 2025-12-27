// src/hooks/useAuthGuard.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { checkAdminRole, AdminUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const auth = getAuth(app);

export const useAdminUser = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          await user.getIdToken(true);
          const adminData = await checkAdminRole(user);
          setAdminUser(adminData);
        } catch (error) {
          console.error(
            'Error refreshing token or checking admin role:',
            error
          );
          setAdminUser(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setAdminUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user: adminUser, isLoading };
};

export const useAuthGuard = (
  allowedRoles: ('admin' | 'superadmin' | 'team_office')[] = ['admin', 'superadmin', 'team_office']
) => {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation('admin');
  const { user: adminUser, isLoading: isUserLoading } = useAdminUser();

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (!adminUser) {
      // No user is logged in, redirect to login page.
      router.push('/admin');
      return;
    }

    // User is logged in, but does not have the required role.
    if (!adminUser.role || !allowedRoles.includes(adminUser.role)) {
      toast({
        title: t('dashboard.accessDenied'),
        description: t('dashboard.noAdminRights'),
        variant: 'destructive',
      });
      // Actively sign out the user to prevent loops and clear auth state.
      signOut(auth).finally(() => {
        router.push('/admin');
      });
    }
  }, [adminUser, isUserLoading, router, allowedRoles, t, toast]);

  return { user: adminUser, isLoading: isUserLoading };
};

export type { AdminUser };
