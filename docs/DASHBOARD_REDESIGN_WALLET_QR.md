# Dashboard Redesign: Wallet & QR Code

## Overview
We have redesigned the main dashboard overview to include a quick summary of the user's wallet and referral tools, based on the requested design.

## Changes

### 1. New Layout Grid
The "Quick Prompts" section has been replaced by a 3-column grid containing:
1.  **Quick Actions**: Existing action buttons (Go to Wallet, Invite Friends).
2.  **Dicilo Wallet Preview**: A new dark-themed card showing the current balance in DiciPoints (DP) and standard Euro equivalent. It includes a shortcut button to "Show QR for Pay".
3.  **Referral QR Card**: A dedicated card for the user's referral code. It generates a QR code pointing to the registration page with the `ref` parameter. Users can download or share this QR directly.

### 2. Functional Additions
*   **Wallet Data Fetching**: The dashboard now asynchronously fetches the user's wallet data on load to display the balance without needing to navigate to the full wallet view.
*   **QR Generation**: Uses `api.qrserver.com` to dynamically generate QR codes for the unique referral link.
*   **Download & Share**: Added functionality to download the QR code as a PNG or share the link via the native Web Share API.

### 3. Translations
Added the following keys to `common.json` (EN, ES, DE):
*   `dashboard.scanToRegister`
*   `dashboard.myCode`
*   `dashboard.download`

## Technical Details
*   **File Modified**: `src/components/dashboard/PrivateDashboard.tsx`
*   **API Used**: `getWalletData` (Server Action) imported dynamically.
*   **Dependencies**: `lucide-react` icons (CreditCard, Info, Download, QrCode) added.

## Verification
*   **Wallet Card**: Shows correct balance and EUR value. "Show QR" button switches view to Wallet.
*   **QR Card**: Displays the correct Unique Code. QR scans to `/registrieren?ref=CODE`. Download button saves the image. Share button invokes native share or copies link.
