# Incident: Serialization & Missing Index Error in Admin Panel
## Date: 2026-03-27

### Issues Reported
1. **Historial de Pagos y Auditoría Error**: When searching for manual transactions using a code and email, the UI returned a red box with error `Cannot read properties of undefined (reading 'success')`.
2. **Caja Registradora Historial**: Manual transactions generated in Dicipoints were not appearing in the 24-transaction recent list, showing "No se encontraron transacciones recientes." instead.

### Root Causes
- **Serialization Failure on Server Action**: The `getFreelancerReportData` function in `dicipoints.ts` was destructurally spreading `...data` from the `wallet_transactions` document straight into the return structure. Because Firestore objects feature encapsulated classes (like internal timestamp trackers inside nested `.meta` properties), Next.js 14 blocks the data transfer from Server to Client and throws a hard Server Error, resulting in `res` being completely `undefined` on the frontend.
- **Missing Composite Index**: The function `getManualPaymentHistory` queried Firestore with `.where('type', 'in', [...])` followed by `.orderBy('timestamp', 'desc')`. Firestore strictly requires a Composite Index for this sequence, otherwise it fails silently and returns `data: []` to the application. 

### Fixes Applied
1. **Explicit Serialization for Auditoría**: Rewrote `getFreelancerReportData` inside `dicipoints.ts` to strictly cherry-pick the exact primitive fields needed (`id, type, amount, description, userId, adminId, currency`). This guarantees compatibility over Next.js' network layer.
2. **In-Memory Query Re-Mapping**: Rewrote `getManualPaymentHistory` inside `wallet.ts` to fetch the globally most recent 300 entries via standard indexed `.orderBy()`, and dynamically filter `.filter()` out the specific transaction types locally in JS without requiring any external Index creation from the Google Cloud Console. Added safe parsing strategies (`?.toDate`) for older stringified formats.

### Impact
Both functions now confidently resolve without missing data flags or server-crash `undefined` errors. 
