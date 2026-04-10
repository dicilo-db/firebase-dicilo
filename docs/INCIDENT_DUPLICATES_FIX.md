# Incident Report: Data Loss on Duplicate Cleanup

## Problem Description
User reported that some registrations (e.g., Xcala, Perlas de Claridad) lost their information (images, descriptions) and others appeared as duplicates (Carlota Stockar).

## Root Cause Analysis
The `cleanupDuplicates` cloud function contained a logic flaw in how it selected which "duplicate" to keep:
1.  **Priority 1:** Presence of Geocoordinates (`coords`). If a new, empty entry had coordinates (or neither did), it might be preferred.
2.  **Priority 2:** ID format (`slugify(name)`). If a new entry had a "cleaner" ID, it was preferred over a legacy ID.
3.  **Priority 3:** Recency. The script preferred **newer** documents.

**The Fatal Flaw:** If a manual entry (Old, Rich Data, Random ID) existed, and a script/process created a new entry (New, Empty Data, Slug ID), the cleanup logic would see the New Empty entry as "better" (Newer + Better ID) and **delete the Old Rich entry**.

## Resolution
The sorting logic in `functions/src/index.ts` has been completely rewritten to use a **Content Richness Score**:

```typescript
const getScore = (data: any) => {
  let score = 0;
  // Critical: Images contain real value
  if (data.imageUrl && !data.imageUrl.includes('placehold')) score += 50;
  // Critical: Descriptions imply manual effort
  if (data.description && data.description.length > 10) score += 30;
  // Important: Contact info
  if (data.phone) score += 10;
  if (data.website) score += 10;
  // Bonus: Coords
  if (data.coords) score += 5;
  return score;
};
```

## Impact of Fix
*   **Duplicate Handling:** The system will now ALWAYS keep the entry with the most information (Logo, Text, Contact), regardless of how old it is or what its ID looks like.
*   **Data Safety:** Empty duplicates will be deleted, preserving the rich content.

## Recovery
*   The fix has been deployed.
*   **Action Required:** For the specific entries that lost data (Xcala, Perlas), if the "Good" document was already deleted by the *previous* logic, it cannot be automatically restored as the data was not present in `seed-data.json`. These specific records may need manual restoration.
*   **Existing Duplicates:** The cleanup function was run but found 0 *identical name* duplicates. Please ensure the duplicates have the exact same spelling. If they differ (e.g., " Xcala" vs "Xcala"), the system treats them as different businesses.
