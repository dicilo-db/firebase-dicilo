"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBusinessWrite = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// const db = admin.firestore(); // Moved inside handler
exports.onBusinessWrite = (0, firestore_1.onDocumentWritten)('businesses/{businessId}', (event) => __awaiter(void 0, void 0, void 0, function* () {
    const db = admin.firestore();
    const change = event.data;
    if (!change)
        return; // Should not happen
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;
    // Extract keys. 
    // Note: Your app stores `category_key` strings like "category.slug" and "subcategory.slug"
    // or sometimes just raw strings depending on legacy data.
    // We assume the new standardized format "category.<slug>" is used, but we should handle legacy or raw strings gracefully if possible,
    // or strict parsing. With the new Edit Form, we enforce `category_key`.
    const oldCategoryKey = beforeData === null || beforeData === void 0 ? void 0 : beforeData.category_key;
    const newCategoryKey = afterData === null || afterData === void 0 ? void 0 : afterData.category_key;
    const oldSubKey = beforeData === null || beforeData === void 0 ? void 0 : beforeData.subcategory_key;
    const newSubKey = afterData === null || afterData === void 0 ? void 0 : afterData.subcategory_key;
    // If no change in categories, exit
    if (oldCategoryKey === newCategoryKey && oldSubKey === newSubKey) {
        return;
    }
    const updates = new Map();
    // Helper to accumulate updates
    const addUpdate = (catSlug, subSlug, change) => {
        if (!catSlug)
            return;
        // Strip prefix if present (e.g. "category.foo" -> "foo")
        const cleanCatSlug = catSlug.startsWith('category.') ? catSlug.split('.')[1] : catSlug;
        if (!cleanCatSlug)
            return;
        if (!updates.has(cleanCatSlug)) {
            updates.set(cleanCatSlug, { catChange: 0, subUpdates: new Map() });
        }
        const record = updates.get(cleanCatSlug);
        record.catChange += change;
        if (subSlug) {
            const cleanSubSlug = subSlug.startsWith('subcategory.') ? subSlug.split('.')[1] : subSlug;
            if (cleanSubSlug) {
                const currentSubVal = record.subUpdates.get(cleanSubSlug) || 0;
                record.subUpdates.set(cleanSubSlug, currentSubVal + change);
            }
        }
    };
    // Process Old (Decrement)
    addUpdate(oldCategoryKey, oldSubKey, -1);
    // Process New (Increment)
    addUpdate(newCategoryKey, newSubKey, 1);
    // Apply updates using transactions to ensure safety
    const promises = Array.from(updates.entries()).map((_a) => __awaiter(void 0, [_a], void 0, function* ([catSlug, { catChange, subUpdates }]) {
        if (catChange === 0 && subUpdates.size === 0)
            return;
        const catRef = db.collection('categories').doc(catSlug);
        try {
            yield db.runTransaction((t) => __awaiter(void 0, void 0, void 0, function* () {
                const doc = yield t.get(catRef);
                if (!doc.exists) {
                    // If category doesn't exist, we can't update it. 
                    // This might happen if business has a category that was deleted or legacy.
                    logger.warn(`Category ${catSlug} not found while updating counts.`);
                    return;
                }
                const data = doc.data();
                const currentCount = data.businessCount || 0;
                const newCount = Math.max(0, currentCount + catChange);
                const subcategories = data.subcategories || [];
                let subcategoriesChanged = false;
                const newSubcategories = subcategories.map((sub) => {
                    if (subUpdates.has(sub.id)) {
                        const subChange = subUpdates.get(sub.id);
                        const currentSubCount = sub.businessCount || 0;
                        const newSubCount = Math.max(0, currentSubCount + subChange);
                        subcategoriesChanged = true;
                        return Object.assign(Object.assign({}, sub), { businessCount: newSubCount });
                    }
                    return sub;
                });
                const updateData = { businessCount: newCount };
                if (subcategoriesChanged) {
                    updateData.subcategories = newSubcategories;
                }
                t.update(catRef, updateData);
            }));
        }
        catch (e) {
            logger.error(`Failed to update counts for category ${catSlug}:`, e);
        }
    }));
    yield Promise.all(promises);
}));
