# Incident Report: Superadmin Permissions Fix

## Problem Description
The user `programmhh1@gmail.com` (Superadmin) reported inability to edit data in the registration or portal, despite having Superadmin role assigned.

## Root Cause Analysis
1.  **Missing Custom Claims:** It is highly likely that the `role: superadmin` custom claim was missing or outdated on the Firebase Auth user object.
2.  **Missing Admin Record:** The `admins/{uid}` document, which triggers the claim assignment, might have been missing or mismatched.
3.  **Missing Profile Record:** The `private_profiles/{uid}` document, often used by the frontend for granular permission checks, might have been missing.

## Resolution
Created and executed a temporary Cloud Function `fixSuperAdmin` (HTTPS Request) that performed the following actions specifically for `programmhh1@gmail.com`:

1.  **Auth Lookup:** Verified the user exists in Firebase Auth.
2.  **Force Claims:** Manually set `admin: true` and `role: 'superadmin'` claims on the user object.
3.  **Ensure Admin Doc:** Created/Updated `admins/{uid}` with `role: 'superadmin'` to ensure consistency.
4.  **Ensure Profile Doc:** Created/Updated `private_profiles/{uid}` with `role: 'superadmin'` and `permissions: ['all']` to satisfy frontend checks.
5.  **Revoke Tokens:** Revoked refresh tokens to force the client to fetch a new token (with new claims) upon next login.

## Result
The function executed successfully:
> "Success! Fixed Superadmin permissions for programmhh1@gmail.com. Please logout and login again."

## Actions for User
The user **MUST LOG OUT AND LOG IN AGAIN** for the changes to take effect.
