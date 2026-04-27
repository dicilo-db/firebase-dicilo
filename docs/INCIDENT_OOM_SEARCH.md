# Incident Report: Serverless Out Of Memory (OOM) on Search
**Date:** April 2026

## The Problem
The production frontend went completely blank (ERR_TIMED_OUT) and the server returned HTTP 500 errors.
Upon checking the Firebase Functions logs for the Next.js SSR renderer (`ssrgeosearchfq4i9`), the following critical error was found:
`Memory limit of 256 MiB exceeded with 257 MiB used. Consider increasing the memory limit, see https://cloud.google.com/functions/docs/configuring/memory`

### Root Cause
The codebase was executing a **Full Table Scan** without limits in two critical locations:
1. `src/app/page.tsx`: Inside `getBusinesses()`, which loaded all `businesses` and `clients` just to map coordinates to Ad Banners.
2. `src/app/api/search/nearest/route.ts`: Inside `getCachedData()`, which loaded all documents to perform a server-side text-search and Haversine distance calculation in memory.

As the database grew past 10,000 records, the raw JSON payload size combined with the V8 JavaScript engine overhead exceeded the 256MB memory limit assigned to the function container. When traffic spiked or cold starts occurred, the container crashed before it could return the HTML.

## The Architectural Fix

### 1. Removing Unnecessary Fetching (`src/app/page.tsx`)
The `getAds` function was refactored. Instead of requiring a massive array of 10,000 businesses passed as an argument, it now iterates through the active ads, and if an ad needs coordinates to calculate local reach:
- It fetches **only the specific document** associated with the `clientId`.
- If no ID is provided, it does a quick `limit(1)` exact-match query by name.
This reduces the memory footprint of `page.tsx` from ~50MB to a few Kilobytes.

### 2. Firestore Projections (`src/app/api/search/nearest/route.ts`)
While `route.ts` still needs to load records to perform full-text search and sorting in memory, we implemented **Firestore Projections**.
Instead of using `.get()` which downloads the entire document (including massive `bodyData`, HTML content, and rich descriptions), we now use `.select(...)`:
```typescript
const selectedFields = [
    'name', 'clientName', 'category', 'location', 
    'coordinates', 'lat', 'lng', 'latitude', 'longitude',
    'visibility_settings', 'clientType', 'tier_level', 'active', 
    'clientLogoUrl', 'imageUrl', 'address', 'phone', 'email', 'slug'
];
db.collection('businesses').select(...selectedFields).get();
```
This forces Firebase to send over the network ONLY the requested keys. It cuts the memory usage by over 90%, easily fitting within standard Serverless limits.

### 3. Increased Function Capacity
As a safety net, `firebase.json` was updated to explicitly request `1GiB` of memory for the `frameworksBackend` to ensure ample headroom during traffic spikes.

## Lessons for Next Time
- **Never do `db.collection('...').get()` without a limit** in a serverless function unless you are absolutely sure the collection size is strictly capped.
- Always use `.select(...)` if you only need a subset of fields from a large number of documents.
- The global `cachedBusinesses` memory pattern is an anti-pattern in high-scale Serverless Next.js. Memory drops between invocations and cold starts will trigger massive database reads that can spike billing and crash containers.
