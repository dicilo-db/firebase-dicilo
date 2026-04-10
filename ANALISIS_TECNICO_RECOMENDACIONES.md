# TECHNISCHE ANALYSE: EMPFEHLUNGSSYSTEM UND DASHBOARD

**Datum:** 24. September 2025
**Zweck:** Dieses Dokument bietet eine umfassende technische Beschreibung des Empfehlungssystems, einschließlich des Einreichungsformulars, der Backend-Logik in Firebase und des "Formulare Dashboards" (Formular-Dashboard). Ziel ist es, jede Komponente zu dokumentieren, um ihr Verständnis und ihre präzise Nachbildung zu ermöglichen.

---

## 1. Systemübersicht

Das System ermöglicht es einem Benutzer (dem "Empfehlenden"), eine Empfehlung über einen Dicilo-Kunden (ein B2B-Unternehmen) an einen oder mehrere Freunde (die "Empfänger") zu senden. Das System verarbeitet diese Empfehlungen, verwaltet die Zustimmung der Empfänger und sammelt Statistiken, die in einem speziellen Dashboard im Administrationspanel angezeigt werden.

**Akteure:**

1.  **Empfehlender:** Ein Endbenutzer, der das Formular ausfüllt.
2.  **Empfänger:** Die Person, die die Empfehlung erhält.
3.  **B2B-Kunde:** Das empfohlene Dicilo-Unternehmen.
4.  **Administrator:** Der Benutzer des Admin-Panels, der das Dashboard anzeigt.

**Funktionsablauf:**

1.  Der Empfehlende füllt das Empfehlungsformular auf der Landingpage eines Kunden oder auf einer allgemeinen Seite aus.
2.  Beim Absenden wird eine Firebase Function aufgerufen, die einen Haupteintrag für die Empfehlung und individuelle Aufgaben für jeden Empfänger erstellt.
3.  Eine weitere automatische Funktion wird für jede Aufgabe ausgelöst und sendet eine E-Mail oder Nachricht an den Empfänger mit einem Link zur Annahme oder Ablehnung der Zustimmung zum Empfang von Informationen.
4.  Die Antwort des Empfängers aktualisiert den Status seiner Aufgabe.
5.  Das Administrations-Dashboard fragt die Daten aus diesen Sammlungen ab und aggregiert sie, um Echtzeit-Statistiken anzuzeigen.

---

## 2. Backend-Architektur (Firebase)

Dies ist die zentrale Logik, die sich in `functions/src/index.ts` befindet.

### 2.1. Sammlungen in Firestore

Es werden zwei Hauptsammlungen verwendet:

**a) `recommendations`**
Speichert den Haupteintrag jeder Formulareinreichung.

- **Dokumenten-ID:** Automatisch generierte ID.
- **Felder:**
  - `recommenderName` (string): Name des Empfehlenden.
  - `recommenderEmail` (string): E-Mail des Empfehlenden.
  - `clientId` (string): ID des empfohlenen B2B-Kunden.
  - `lang` (string): Sprache, in der gesendet wurde ('de', 'en', 'es').
  - `createdAt` (Timestamp): Erstellungsdatum.
  - `status` (string): Allgemeiner Status ('pending', 'completed').
  - `recipientsCount` (number): Gesamtzahl der Empfänger.
  - `acceptedCount` (number): Zähler der Empfänger, die zugestimmt haben. Wird mit `FieldValue.increment(1)` aktualisiert.

**b) `recommendation_tasks`**
Speichert eine individuelle Aufgabe für jeden Empfänger in einer Empfehlung.

- **Dokumenten-ID:** Automatisch generierte ID.
- **Felder:**
  - `recommendationId` (string): ID des übergeordneten Dokuments in der `recommendations`-Sammlung.
  - `recipientName` (string): Name des Empfängers.
  - `recipientContact` (string): E-Mail oder WhatsApp des Empfängers.
  - `contactType` (string): 'email' oder 'whatsapp'.
  - `status` (string): Status der Aufgabe: `'pending'` -> `'sent'` -> `'accepted'` | `'declined'`.
  - `createdAt` (Timestamp): Erstellungsdatum.
  - `sentAt` (Timestamp): Datum des Versands der Zustimmung.
  - `handledAt` (Timestamp): Datum, an dem der Empfänger geantwortet hat.
  - `clientId` (string): ID des B2B-Kunden (denormalisiert für Abfragen).
  - `recommenderName` (string): Name des Empfehlenden (denormalisiert).

### 2.2. Firebase Functions

**a) `submitRecommendation` (Callable Function)**

- **Aufruf:** Wird vom Frontend (dem Empfehlungsformular) mit den Formulardaten aufgerufen.
- **Input:** `{ recommenderName, recommenderEmail, recipients: [{name, email, whatsapp}], clientId, lang }`
- **Logik:**
  1.  Validiert, dass alle erforderlichen Felder vorhanden sind.
  2.  Erstellt einen **Schreib-Batch** in Firestore.
  3.  Erstellt das Hauptdokument in der `recommendations`-Sammlung mit den Daten des Empfehlenden.
  4.  Iteriert über die `recipients`-Liste und erstellt für jeden ein neues Dokument in der `recommendation_tasks`-Sammlung.
  5.  Führt den Batch aus (`batch.commit()`), um alle Dokumente atomar zu speichern.
  6.  Gibt ein `{ success: true }` an das Frontend zurück.

**b) `taskWorker` (Firestore Trigger - `onDocumentCreated`)**

- **Trigger:** Wird automatisch jedes Mal ausgeführt, wenn ein neues Dokument in `recommendation_tasks/{taskId}` erstellt wird.
- **Logik:**
  1.  Liest die Daten der neu erstellten Aufgabe (Name des Empfängers, Kontakt, Sprache usw.).
  2.  Generiert zwei eindeutige Zustimmungs-URLs, die die `taskId` enthalten: `consentAccept` und `consentDecline`.
  3.  Wenn `contactType` 'email' ist, wird eine HTML-E-Mail unter Verwendung von i18n-Vorlagen erstellt.
  4.  Verwendet den `sendMail`-Dienst (definiert in `email.ts`), um die E-Mail an den Empfänger zu senden.
  5.  Aktualisiert den Status der Aufgabe in `recommendation_tasks` auf `'sent'`.

**c) `consentAccept` und `consentDecline` (HTTPS Functions)**

- **Aufruf:** Dies sind öffentliche URLs, die der Empfänger durch Klicken auf die Links in der E-Mail besucht.
- **Logik (`handleConsent`):**
  1.  Empfängt die `taskId` als Parameter in der URL.
  2.  Sucht das Aufgabendokument in `recommendation_tasks`.
  3.  Aktualisiert den `status` der Aufgabe auf `'accepted'` oder `'declined'`.
  4.  Wenn der Status `'accepted'` ist, wird das Hauptdokument in `recommendations` aktualisiert, indem `acceptedCount` inkrementiert wird.
  5.  Zeigt dem Benutzer eine einfache Dankesseite an.

---

## 3. Frontend: Formular-Dashboard (`/admin/forms-dashboard`)

Diese Seite, die im Bild zu sehen ist, dient der Visualisierung der durch das Empfehlungssystem generierten Daten.

### 3.1. Navigations-Tabs

- **Übersicht:** Die Hauptansicht.
- **Empfehler:** Liste der Benutzer, die Empfehlungen gesendet haben.
- **Empfohlene:** Liste der Empfänger, die Empfehlungen erhalten haben.
- **Berichte:** Bereich zum Konfigurieren und Herunterladen von Berichten.
- **Einstellungen:** Spezifische Einstellungen für das Formular.

### 3.2. Modul "Übersicht"

Dies ist die im Bild gezeigte Ansicht und enthält zwei Hauptkomponenten:

**a) KPI-Karte (Key Performance Indicators)**

- **Gesendet gesamt:** Wird durch Zählen der Gesamtzahl der Dokumente in der `recommendation_tasks`-Sammlung ermittelt.
- **Akzeptiert:** Wird durch Zählen der Dokumente in `recommendation_tasks` ermittelt, bei denen `status == 'accepted'`.
- **Ausstehend:** Wird durch Zählen der Dokumente in `recommendation_tasks` ermittelt, bei denen `status == 'pending'` oder `status == 'sent'`.
- **Abgelehnt:** Wird durch Zählen der Dokumente in `recommendation_tasks` ermittelt, bei denen `status == 'declined'`.
- **Implementierung:** Diese Daten können mit `getCountFromServer`-Abfragen von Firestore für eine optimale Leistung oder durch eine Echtzeit-Subscription der Sammlung und Aggregation der Daten auf dem Client abgerufen werden.

**b) Formular zum Senden von Empfehlungen (Empfehlungsformular)**

- **Zweck:** Obwohl es sich im Admin-Dashboard befindet, ist dies dieselbe Formularkomponente, die auch auf öffentlichen Seiten (wie der Landingpage eines Kunden) verwendet würde.
- **Komponenten:**
  - Inputs für `recommenderName` und `recommenderEmail`.
  - Logik zum dynamischen Hinzufügen von Feldern für `recipients` (der Button "Weiteren Empfohlenen hinzufügen").
  - Selects, Checkboxes und Textareas für die restlichen Felder des Formulars.
- **Sende-Logik:** Beim Klick auf "Empfehlung senden" wird die Funktion `submitRecommendation` mit den Formulardaten aufgerufen.

### 3.3. Andere Module (im Bild nicht im Detail sichtbar)

- **Tab "Empfehler":** Würde eine Abfrage an die `recommendations`-Sammlung durchführen und nach `recommenderEmail` gruppieren, um eine Liste der aktivsten Empfehler anzuzeigen.
- **Tab "Empfohlene":** Würde eine Abfrage an die `recommendation_tasks`-Sammlung durchführen, um eine Tabelle mit allen Empfängern, ihrem Status und dem Namen des Empfehlenden anzuzeigen.

Diese umfassende Analyse deckt alle Aspekte des Empfehlungssystems ab und bietet eine solide Grundlage für dessen Nachbildung oder Wartung.
