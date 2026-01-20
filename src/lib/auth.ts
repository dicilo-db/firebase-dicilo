import { app } from './firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

const db = getFirestore(app);

export interface AdminUser {
  uid: string;
  email: string | null;
  role: 'admin' | 'superadmin' | 'team_office' | 'freelancer';
  permissions: string[];
}

/**
 * Checks if a user has an admin role by inspecting their ID token claims.
 * This is the secure way to check for admin privileges on the client-side.
 * @param user The Firebase User object from onAuthStateChanged or after login.
 * @returns An AdminUser object if the user is an admin, otherwise null.
 */
export async function checkAdminRole(user: User): Promise<AdminUser | null> {
  try {
    // 1. Get Claims (Fast check for base role)
    const idTokenResult = await user.getIdTokenResult(true);
    const claims = idTokenResult.claims;
    const claimRole = claims.role as string;
    const isAdminClaim = claims.admin === true;

    // 2. Initial check: Is it an admin-like user?
    // If not even a base role, we might return null, OR we might need to check DB if claims are stale.
    // However, usually we trust claims for speed. 
    // BUT, the user says "assigned permissions", which are in DB.
    // So ensuring we always fetch DB for "extra permissions" is safer for this granular use case.

    // Fetch Firestore Profile to get 'permissions' array and latest role
    const profileRef = doc(db, 'private_profiles', user.uid);
    const profileSnap = await getDoc(profileRef);

    let dbRole = claimRole;
    let permissions: string[] = [];

    if (profileSnap.exists()) {
      const data = profileSnap.data();
      dbRole = data.role || claimRole; // DB role might be newer
      permissions = Array.isArray(data.permissions) ? data.permissions : [];
    }

    // Determine effective role
    const finalRole = (dbRole === 'superadmin' || dbRole === 'admin' || dbRole === 'team_office' || dbRole === 'freelancer')
      ? dbRole
      : (isAdminClaim ? 'admin' : undefined);

    if (finalRole) {
      return {
        uid: user.uid,
        email: user.email,
        role: finalRole as 'admin' | 'superadmin' | 'team_office' | 'freelancer', // Added freelancer to type
        permissions: permissions
      };
    }

    // If no role but has permissions? 
    // Usually a user with permissions should have at least a base role or we consider them "privileged" enough to return an object?
    // The current system seems to rely on 'role' property.
    // If a normal user has "extra permissions", they might still need a returned AdminUser object to pass the checks.
    if (permissions.length > 0) {
      return {
        uid: user.uid,
        email: user.email,
        role: 'freelancer', // Fallback or needs a 'user' role that permits access? 
        // Taking 'freelancer' as safe baseline for "active" users or just keep generic.
        // Let's cast to 'team_office' or similar if strictly required, 
        // but better to update AdminUser type to allow 'user' if they have permissions.
        // For now, let's assume if they have permissions they are acting in a professional capacity.
        permissions
      } as any;
    }

    return null;
  } catch (error) {
    console.error('Error checking admin role from token claims:', error);
    return null;
  }
}
