# Favicon Fix

## Problem
The deployed application on Firebase Hosting was displaying the default Firebase favicon instead of the Dicilo brand isotype.

## Root Cause
Next.js App Router prioritizes special files in the `src/app/` directory. There was a `src/app/favicon.ico` file present, which was likely the default Next.js/Firebase placeholder. This file overrode the metadata settings in `layout.tsx`.

## Resolution
1.  **Removed:** Deleted `src/app/favicon.ico` to allow `layout.tsx` metadata and `public/` files to take precedence.
2.  **Updated Assets:** Copied `public/logo.png` to `public/favicon.png` and `public/favicon.ico` to ensure the correct image is served from the public root.
3.  **Updated Metadata:** Modified `src/app/layout.tsx` to explicitly define the icon sources:
    *   `/favicon.png` (type: image/png)
    *   `/favicon.ico` (sizes: any)

## Verification
-   Local verification: Check `localhost:3000` (after build) to ensure correct icon.
-   Deployment: Pending user approval.
