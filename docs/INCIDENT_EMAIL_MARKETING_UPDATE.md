# Intelligent Email Marketing & B2B Invitation System

## Incident / Request
The platform needed a more robust, professional, and GDPR-friendly B2B email marketing system. Specifically:
1. Recommenders needed a way to refer to the **Company** dynamically alongside the generic Contact name.
2. An **Unsubscribe Flow** was legally and practically necessary to avoid messaging uninterested parties (preventing SPAM).
3. The links required an aesthetic overhaul, swapping raw anchor tags for **beautiful HTML Custom Buttons**.
4. The registration redirect was landing prospects in the generic "Private" sign-up tab instead of defaulting to the "Business" sign-up mode, which impacted conversion.

## Solutions Implemented

### 1. Unified `{{Company}}` Tag
- **Composer Update:** Modified `EmailMarketingComposer.tsx` to handle `{{Company}}` and `{{Empresa}}`. 
- Added a new optional input field in the composer mapping to `friend.company`.
- **Fallback:** If left empty, it gracefully defaults to the current language's generic equivalent (*la Empresa*, *Company*, *Unternehmen*), or falls back to the friend's personal name depending on the grammatical block.

### 2. Darse de Baja (Unsubscribe System)
- **Tag Integration:** `{{Baja}}` or `{{Unsubscribe}}` tags now expand into an elegant, discreet HTML anchor (`Darse de baja de forma segura`).
- **New Page `/baja`:** Created a dedicated landing page (`src/app/baja/page.tsx`) providing a polite goodbye message and an input form strictly demanding email confirmation.
- **Server Action (`actions/unsubscribe.ts`):** 
  - Adds the target email to a global `unsubscribes` collection.
  - Recursively searches the `recommendations` and `referrals_pioneers` tables to label the prospect as `status: 'unsubscribed'` and `unsubscribed: true`.
  - Sends a notification email to the original Dicilo Recommender, instructing them to cease contact.
  - Sends a final courteous "Unsubscribed successfully" acknowledgment email to the Prospect.
- **Admin Dashboard Visuals:** Added a prominent, red **"Dado de Baja"** pill inside `/admin/recommendations` rendering instantly when the state is toggled.

### 3. Styled HTML Call-to-Action Buttons
- The regex parser in `EmailMarketingComposer.tsx` was enhanced to process `[BOTÓN: Registrarse]`.
- Instead of outputting a plain text URL, it now injects pure inline CSS for a modern, clickable call-to-action button: `<div style="margin: 20px 0;"><a href="..." style="...">$1</a></div>`.

### 4. Zero-Friction B2B Registration Pipeline
- **Smart Link Routing:** The payload builder injects `&type=retailer` automatically into all Dicilo marketing payloads.
- **Auto-Hydration in Form:** Refactored the `useForm` initialization in `RegistrationForm.tsx` to actively snag the URL parameter immediately before the UI hydrates. This surgically prevents React's initial "jump" and locks the Registration Type directly on *Retailer* with the business schema input fields expanded and ready.
