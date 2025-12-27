import { app } from './firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

const db = getFirestore(app);

export interface AdminUser {
  uid: string;
  email: string | null;
  role: 'admin' | 'superadmin' | 'team_office';
}

/**
 * Checks if a user has an admin role by inspecting their ID token claims.
 * This is the secure way to check for admin privileges on the client-side.
 * @param user The Firebase User object from onAuthStateChanged or after login.
 * @returns An AdminUser object if the user is an admin, otherwise null.
 */
export async function checkAdminRole(user: User): Promise<AdminUser | null> {
  try {
    // Forzar recarga del token es crucial para obtener los claims más recientes.
    const idTokenResult = await user.getIdTokenResult(true);
    const claims = idTokenResult.claims;

    // Check custom claim 'admin' or explicit allowed roles
    if (
      claims.admin === true ||
      ['admin', 'superadmin', 'team_office'].includes(claims.role as string)
    ) {
      return {
        uid: user.uid,
        email: user.email,
        role: claims.role as 'admin' | 'superadmin' | 'team_office',
      };
    }
    return null;
  } catch (error) {
    console.error('Error checking admin role from token claims:', error);
    return null;
  }
}
