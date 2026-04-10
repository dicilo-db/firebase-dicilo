# Translation Fix: "Update to Client" Keys

## Problem Layout
The user reported that the translation keys for the "Update to Client" feature were being displayed as raw keys (e.g., `businesses.edit.geocode.asStarter`) instead of the translated text.

## Root Cause
Possible reasons:
1.  **Nesting Complexity:** The keys were nested deep within `businesses.edit.geocode`, which might have caused lookup issues or confusion.
2.  **Deployment/Cache:** The previous deployment might not have fully propagated the JSON changes to the user's session, or the user was viewing a cached version.
3.  **Key Length:** While unlikely, shorter/flatter keys are generally safer.

## Solution Implemented
1.  **Refactored JSON:** Moved the translation keys from `businesses.edit.geocode` to a flatter structure under `businesses.edit` in `en/admin.json`, `de/admin.json`, and `es/admin.json`.
    *   `businesses.edit.updateToClient`
    *   `businesses.edit.asStarter`
    *   `businesses.edit.asRetailer`
    *   `businesses.edit.asPremium`
2.  **Updated Component:** Updated `src/app/admin/basic/[id]/edit/page.tsx` to reference these new, flatter keys.
3.  **Source Control:** Pushed changes to Git as requested (`fix: translation keys for update to client`).

## Verification
-   Verified syntax of JSON files.
-   Verified key usage in TypeScript component.
-   **Note:** User requested *not* to deploy yet, so verification on live site is pending next deployment.
