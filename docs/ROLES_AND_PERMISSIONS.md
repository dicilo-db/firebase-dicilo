# Dicilo Permissions & Roles System

## Roles Overview

The system implements a hierarchical role-based access control (RBAC) system using Firebase Custom Claims (`admin` and `role`).

### 1. Superadmin
*   **Role Identifier:** `superadmin`
*   **Description:** Highest level of access.
*   **Capabilities:**
    *   **Full Access:** Can view and edit all modules.
    *   **Configuration:** Can manage Pricing Plans, Ad Banners, Categories (Translations), and AI Knowledge.
    *   **Destructive Actions:** Can DELETE records (Businesses, Registrations, Clients, etc.).
    *   **Deactivation:** Can change active status of modules.
    *   **Requirement:** Must register a reason when deleting components (enforced via frontend workflow).

### 2. Admin
*   **Role Identifier:** `admin`
*   **Description:** Management level access.
*   **Capabilities:**
    *   **View All:** Can see all modules and records.
    *   **Configuration:** Can manage Pricing Plans, Ad Banners, Categories (Translations), and AI Knowledge ("Improvements", "Text Expansion").
    *   **Restrictions:** Cannot delete core records (Businesses, Registrations, Clients). Cannot perform high-level deactivations reserved for Superadmin.

### 3. Team Office
*   **Role Identifier:** `team_office`
*   **Description:** Operational staff for data entry and maintenance.
*   **Capabilities:**
    *   **View All:** Can see records relevant to operations.
    *   **Edits:** Can modify text and details of Registrations, Clients, and Businesses ("Modificaciones en texto").
    *   **Restrictions:** Cannot access or modify system configuration (Pricing, Categories, AI). Cannot delete records.

## Technical Implementation

### Firebase Auth Claims
*   All roles (`superadmin`, `admin`, `team_office`) receive the claim `admin: true` to grant access to the Admin Dashboard routes.
*   A specific `role` claim is set to the string value of the role (`'superadmin'`, `'admin'`, `'team_office'`) to enforce fine-grained permissions.

### Firestore Rules Logic
*   `isSuperAdmin()`: Checks `request.auth.token.role == 'superadmin'`.
*   `isAdmin()`: Checks if role is `admin` OR `superadmin`.
*   `isTeamOffice()`: Checks if role is `team_office`, `admin`, OR `superadmin`. (Inheritance model for basic record editing).
*   `hasDashboardAccess()`: Checks `request.auth.token.admin == true`.

### Specific Collection Permissions

| Collection | Superadmin | Admin | Team Office | Public/User |
| :--- | :--- | :--- | :--- | :--- |
| **Registrations** | Read, Update, **Delete** | Read, Update | Read, Update | Read (Own), Create |
| **Businesses** | Read, Update, **Delete** | Read, Update | Read, Update | Read |
| **Clients** | Read, Update, **Delete** | Read, Update | Read, Update | Read |
| **Categories** | Read, Write | Read, Write | Read only | Read |
| **Pricing/Ads** | Read, Write | Read, Write | Read only | Read |
| **AI Knowledge** | Read, Write | Read, Write | No Access | - |
| **Tickets** | Read, Update, **Delete** | Read, Update | Read, Update | Read (Own), Create |

## Adding Users
To assign a role, create a document in the `admins` collection with the user's UID and the field `role`:
```json
// admins/{uid}
{
  "role": "superadmin" // or "admin", "team_office"
}
```
The Cloud Function `onAdminWrite` will automatically sync this to the user's custom claims.
