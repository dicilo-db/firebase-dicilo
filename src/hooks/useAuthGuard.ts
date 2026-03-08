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
  allowedRoles: ('admin' | 'superadmin' | 'team_office' | 'freelancer')[] = ['admin', 'superadmin', 'team_office'],
  requiredPermission?: string
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

    // --- NEW LOGIC: Superadmin Bypass & Granular Permissions ---

    const role = adminUser.role;
    const permissions = adminUser.permissions || [];

    // 1. Superadmin always has access
    if (role === 'superadmin') {
      return;
    }

    // 2. Permission Check
    const hasRequiredPermission = requiredPermission ? permissions.includes(requiredPermission) : false;
    const isRoleAllowed = allowedRoles.includes(role as any);

    // Access granted if they have the specific permission OR if they have one of the allowed roles
    if (hasRequiredPermission || isRoleAllowed) {
      return;
    }

    // Special case for 'admin' role if something was missed
    if (role === 'admin') {
      return;
    }

    // If we reach here, they have NO access
    toast({
      title: t('dashboard.accessDenied'),
      description: requiredPermission 
        ? `Missing permission: ${requiredPermission}` 
        : t('dashboard.noAdminRights'),
      variant: 'destructive',
    });
    router.push('/dashboard');
  }, [adminUser, isUserLoading, router, JSON.stringify(allowedRoles), requiredPermission, t, toast]);

  return { user: adminUser, isLoading: isUserLoading };
};

export type { AdminUser };
