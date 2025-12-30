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

    // 2. Check Granular Permission (if required)
    if (requiredPermission) {
      // If user has the specific permission, access granted regardless of role
      if (permissions.includes(requiredPermission)) {
        return;
      }
      // If NOT, continue to check role matches (maybe role implies permission? - usually keep separate)
      // Check if current role is implicitly allowed?
      // But usually "requiredPermission" means specifically that. 
      // If the user DOES NOT have the permission, we fail here UNLESS the allowedRoles match covers it?
      // Let's assume strict check if 'requiredPermission' is provided.
      // Actually, sometimes a Role (like 'admin') should implicitly have 'access_ads_manager'.
      // Let's verify if we want implicit role mappings.
      // For 'admin', we usually expect full access except superadmin stuff.
      if (role === 'admin') {
        return;
      }

      // If failed permission check:
      toast({
        title: t('dashboard.accessDenied'),
        description: `Missing permission: ${requiredPermission}`,
        variant: 'destructive',
      });
      router.push('/dashboard'); // Redirect to safe zone
      return;
    }

    // 3. Standard Role Check (Legacy behavior for pages without granular requirement)
    if (!allowedRoles.includes(role)) {
      toast({
        title: t('dashboard.accessDenied'),
        description: t('dashboard.noAdminRights'),
        variant: 'destructive',
      });
      // Redirect instead of signout to allow user to go back to their allowed area
      router.push('/dashboard');
    }
  }, [adminUser, isUserLoading, router, allowedRoles, requiredPermission, t, toast]);

  return { user: adminUser, isLoading: isUserLoading };
};

export type { AdminUser };
