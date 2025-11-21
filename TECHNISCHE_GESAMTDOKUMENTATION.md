# TECHNISCHE GESAMTDOKUMENTATION: DICILO.NET

**Datum:** 22. September 2025
**Zweck:** Dieses Dokument dient als umfassende technische Referenz für Entwickler. Es beschreibt die Architektur, die Datenstrukturen, die Authentifizierungsmechanismen und die Kernfunktionalitäten der Dicilo.net-Plattform, um eine präzise Wartung, Weiterentwicklung und Replikation zu ermöglichen.

---

## 1. Technologische Architektur

- **Framework:** Next.js (App Router) mit React und TypeScript.
- **Authentifizierung:** **Firebase Authentication** für die Benutzerverwaltung (E-Mail/Passwort), ergänzt durch **Custom Claims** zur rollenbasierten Zugriffskontrolle.
- **Datenbank:** **Firestore** als NoSQL-Echtzeitdatenbank zur Speicherung aller Anwendungsdaten.
- **Backend-Logik:** **Firebase Functions** (Node.js mit TypeScript) für automatisierte und sichere Aufgaben wie die Rollenvergabe und die Synchronisation mit externen Systemen.
- **UI & Styling:** Tailwind CSS und `shadcn/ui` für ein modernes und wiederverwendbares Komponentensystem.
- **Formular-Management:** `react-hook-form` in Kombination mit `zod` zur Validierung von Schemata.
- **Geocodierung:** Öffentlicher Dienst **Nominatim** (OpenStreetMap) für die clientseitige Geocodierung von Adressen.
- **Karten:** **Leaflet.js** für interaktive Karten.

---

## 2. Authentifizierung und Autorisierung (Rollenbasiertes System)

Dies ist der sicherheitskritischste Teil des Systems.

### Rollenübersicht
- **Superadmin:** Höchste Berechtigungsstufe. Kann andere Admins verwalten und kritische Systemaktionen ausführen.
- **Admin:** Kann den Inhalt der Plattform verwalten (Unternehmen, Kunden etc.), hat aber keinen Zugriff auf systemkritische Aktionen.
- **Client (Kunde):** Zukünftige Rolle für Geschäftsinhaber zur Selbstverwaltung ihrer Landing-Pages.
- **Öffentlicher Benutzer:** Anonymer Benutzer ohne Login.

### Implementierung

1.  **Firebase Authentication:** Dient als primärer Identitätsprovider. Benutzer (Admins) werden hier mit E-Mail und Passwort angelegt.

2.  **Firestore-Sammlung `admins`:**
    - Dies ist die "Source of Truth" für Admin-Rollen.
    - Jedes Dokument hat die **Firebase User UID** als Dokumenten-ID.
    - Jedes Dokument enthält ein Feld `role` (string) mit dem Wert `"admin"` oder `"superadmin"`.

3.  **Cloud Function `onAdminWrite` (Backend):**
    - **Trigger:** Diese Funktion wird **automatisch** bei jeder Erstellung, Änderung oder Löschung eines Dokuments in der `admins`-Sammlung ausgeführt.
    - **Logik:**
        1.  Liest die Rolle aus dem geänderten Firestore-Dokument.
        2.  Verwendet das Firebase **Admin SDK**, um sichere **Custom Claims** (`{ admin: true, role: '...' }`) direkt in das Authentifizierungstoken des Benutzers zu schreiben.
        3.  Bei Löschung oder Herabstufung der Rolle werden die Claims auf `null` gesetzt, wodurch der Admin-Zugriff widerrufen wird.
        4.  **Wichtig:** Widerruft die Refresh-Tokens des Benutzers (`revokeRefreshTokens`), um eine sofortige Anwendung der neuen Berechtigungen zu erzwingen.

4.  **`useAuthGuard` Hook (Frontend):**
    - Dieser Hook wird auf jeder geschützten Admin-Seite (`/admin/*`) verwendet.
    - **Logik:**
        1.  Überprüft den Authentifizierungsstatus des Benutzers.
        2.  Erzwingt eine Aktualisierung des ID-Tokens (`user.getIdToken(true)`), um die neuesten Custom Claims abzurufen.
        3.  Prüft, ob `token.claims.admin === true` und ob `token.claims.role` eine erlaubte Rolle ist.
        4.  Bei unzureichenden Berechtigungen wird der Benutzer ausgeloggt und zur Login-Seite (`/admin`) weitergeleitet.

---

## 3. Struktur der Firestore-Datenbank

- **`businesses`**: Speichert Informationen über die Unternehmen, die im öffentlichen Suchportal erscheinen.
  - **Felder:** `name`, `category`, `description`, `location`, `address`, `coords` (GeoPoint), `imageUrl`, `website`, `phone`, `rating`, `currentOfferUrl`, etc.

- **`clients`**: Speichert Daten für "Premium"- oder "Retailer"-Kunden, die eine personalisierte Landing-Page haben.
  - **Felder:** `clientName`, `slug` (für die URL), `clientType`, `clientLogoUrl`, sowie verschachtelte Objekte für dynamische Inhalte wie `headerData`, `bodyData`, `infoCards`, `graphics`, `products`.

- **`pricing_plans`**: Definiert die Preispläne, die auf `/planes` angezeigt werden.
  - **Felder:** `title`, `price`, `period`, `features` (Array), `isPopular`, `language`.

- **`registrations`**: Speichert die Einreichungen aus dem öffentlichen Registrierungsformular.

- **`feedbacks`**: Speichert Einreichungen aus dem Feedback-Formular.

- **`admins`**: (Siehe Abschnitt Authentifizierung).

- **`analyticsEvents`**: Protokolliert Benutzerinteraktionen von der Suchseite (Suchen, Klicks).

- **`recommendations` & `recommendation_tasks`**: Verwalten das Empfehlungssystem.

---

## 4. Kernmodule und deren Logik

### 4.1. Suchseite (`/`)
- **Technologie:** Serverseitiges Rendering (SSR) in Next.js zur initialen Datenladung. Clientseitige Logik für Interaktivität.
- **Komponente:** `dicilo-search-page.tsx`.
- **Logik:**
    - Filtert die Liste der Unternehmen clientseitig basierend auf der Benutzereingabe (`searchQuery`).
    - Normalisiert Text (`normalizeText`) für eine fehlertolerante Suche.
    - Nutzt **Leaflet.js** zur Darstellung der Karte. Interaktionen (Klick auf eine Karte) zentrieren die Karte auf das entsprechende Unternehmen und öffnen ein Popup.
    - Das Popup wird dynamisch mit den Geschäftsdaten und Aktionslinks (Website, Angebot, Karte) generiert.
    - Klicks innerhalb des Popups werden über die `/api/analytics/log` API protokolliert.

### 4.2. Admin-Panel (`/admin`)

#### Dashboard (`/admin/dashboard`)
- Dient als zentraler Navigationspunkt.
- **Superadmin-Bereich:** Zeigt Schaltflächen an, die gesicherte Cloud Functions aufrufen:
    - `seedDatabaseCallable`: Befüllt die Datenbank mit Testdaten.
    - `syncExistingCustomersToErp`: Sendet Registrierungsdaten an ein externes ERP-System über einen Webhook.

#### Kundenverwaltung (`/admin/clients/[id]/edit`)
- **Komponente:** `EditClientForm.tsx`.
- **Herausforderung:** Verwaltung eines tief verschachtelten Firestore-Dokuments über ein einziges Formular.
- **Lösung beim Speichern:**
    1.  Beim Absenden des Formulars wird zuerst der **aktuelle** Stand des Dokuments aus Firestore geholt (`getDoc`).
    2.  Die Formulardaten werden mittels `lodash.merge` rekursiv mit den Originaldaten zusammengeführt.
    3.  **Vorteil:** Dies verhindert das versehentliche Überschreiben und den Verlust von Daten in Unterfeldern, die im Formular nicht bearbeitet wurden. Nur geänderte Felder werden aktualisiert.
    4.  Verwendet `useFieldArray` für dynamische Listen wie "Social Links" oder "Info Cards".

#### Empfehlungssystem-Dashboard (`/admin/forms-dashboard`)
- Visualisiert aggregierte Daten aus den `recommendations` und `recommendation_tasks` Sammlungen.
- KPIs (Gesendet, Akzeptiert, Ausstehend) werden mittels `getCountFromServer` für eine performante Zählung ermittelt.
- Stellt das gleiche Empfehlungsformular dar, das auch auf den öffentlichen Seiten verwendet wird, um neue Empfehlungen direkt aus dem Admin-Panel zu initiieren.

---

## 5. Wichtige Backend-Funktionen (`functions/src/index.ts`)

- **`promoteToClient` (Callable):** Wandelt einen Eintrag aus `businesses` in einen neuen Eintrag in `clients` um. Erstellt eine Basis-Landingpage-Struktur.
- **`submitRecommendation` (Callable):** Nimmt Formulardaten entgegen, erstellt einen Haupteintrag in `recommendations` und einzelne Aufgaben für jeden Empfänger in `recommendation_tasks`.
- **`taskWorker` (Firestore Trigger):** Löst aus, wenn eine neue Aufgabe in `recommendation_tasks` erstellt wird. Sendet eine E-Mail mit Zustimmungslinks an den Empfänger.
- **`consentAccept` / `consentDecline` (HTTPS):** Öffentliche Endpunkte, die den Status einer Empfehlungsaufgabe aktualisieren, wenn ein Empfänger auf einen Link in der E-Mail klickt.

Dieses Dokument bietet eine solide Grundlage zum Verständnis der technischen Zusammenhänge der Dicilo.net-Plattform.
