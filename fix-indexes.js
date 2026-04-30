const fs = require('fs');

const path = 'firestore.indexes.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Add missing indexes
const missing = [
    {
        "collectionGroup": "community_posts",
        "queryScope": "COLLECTION",
        "fields": [
            { "fieldPath": "city", "order": "ASCENDING" },
            { "fieldPath": "createdAt", "order": "DESCENDING" }
        ]
    },
    {
        "collectionGroup": "community_posts",
        "queryScope": "COLLECTION",
        "fields": [
            { "fieldPath": "city", "order": "ASCENDING" },
            { "fieldPath": "createdAt", "order": "ASCENDING" }
        ]
    },
    {
        "collectionGroup": "recommendations",
        "queryScope": "COLLECTION",
        "fields": [
            { "fieldPath": "city", "order": "ASCENDING" },
            { "fieldPath": "createdAt", "order": "DESCENDING" }
        ]
    },
    {
        "collectionGroup": "recommendations",
        "queryScope": "COLLECTION",
        "fields": [
            { "fieldPath": "city", "order": "ASCENDING" },
            { "fieldPath": "createdAt", "order": "ASCENDING" }
        ]
    },
    {
        "collectionGroup": "trustboard_posts",
        "queryScope": "COLLECTION",
        "fields": [
            { "fieldPath": "neighborhood", "order": "ASCENDING" },
            { "fieldPath": "status", "order": "ASCENDING" }
        ]
    },
    {
        "collectionGroup": "trustboard_posts",
        "queryScope": "COLLECTION",
        "fields": [
            { "fieldPath": "category", "order": "ASCENDING" },
            { "fieldPath": "neighborhood", "order": "ASCENDING" },
            { "fieldPath": "status", "order": "ASCENDING" }
        ]
    }
];

// Deduplicate
const exists = (idx) => {
    return data.indexes.some(ex => {
        if (ex.collectionGroup !== idx.collectionGroup) return false;
        if (ex.fields.length !== idx.fields.length) return false;
        for (let i = 0; i < ex.fields.length; i++) {
            if (ex.fields[i].fieldPath !== idx.fields[i].fieldPath) return false;
            if (ex.fields[i].order !== idx.fields[i].order) return false;
        }
        return true;
    });
};

missing.forEach(idx => {
    if (!exists(idx)) {
        data.indexes.push(idx);
    }
});

fs.writeFileSync(path, JSON.stringify(data, null, 4));
console.log("Indexes updated.");
