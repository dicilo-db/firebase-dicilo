# Incident: State Persistence & Auto-Navigation / Redirection
## Date: 2026-03-27

### Issues Reported
1. **Admin Panel - DiciPoints**: Upon completing a manual payment or adjusting user points, the UI unexpectedly forced the modal to close immediately, preventing users from reviewing the transaction result or downloading the receipt.
2. **Community Module**: Commenting on community posts or returning to the community page after switching mobile browser tabs resulted in a reset, taking the user back to the primary dashboard view abruptly. This interrupted user workflows and felt unprofessional.

### Root Causes
- **Aggressive Server Cache Revalidation**: In `src/app/actions/wallet.ts` and `src/app/actions/campaign-engagement.ts`, server actions utilized Next.js `revalidatePath()` on generic paths (`/dashboard`, `/admin/dicipoints`, etc.). This causes the active client layout to invalidate instantly. During a client-side mutation, invalidating the parent layout forces the React component tree to remount entirely—wiping localized UI states such as open modals, form inputs, or pending result screens.
- **Form Bubbling on Comments**: `CommentSection.tsx` featured `<Button>` components lacking the explicit `type="button"` property, occasionally triggering implicit HTTP form submissions inside certain layouts or nested components, causing a hard page refresh or redirect.

### Fixes Applied
1. **DiciPoints Stability**: Removed calls to `revalidatePath('/admin/dicipoints')` and `revalidatePath('/admin/private-users')` in `wallet.ts`. Real-time UI synchronization is currently handled correctly via React state, meaning the full server re-render was both unnecessary and actively harmful to UX.
2. **Community Stability**: Removed calls to `revalidatePath('/dashboard')` everywhere necessary. Added explicit `type="button"`, `e.preventDefault()`, and `e.stopPropagation()` handles to all interactive UI components in `CommentSection.tsx` to stop submit bubbling and ensure smooth asynchronous interactions.

### Impact
These updates remove jarring auto-redirects out of user workflows, giving back manual review time after key interactions like payments, and maintaining community scrolling positions without kicking the user out of their session.
