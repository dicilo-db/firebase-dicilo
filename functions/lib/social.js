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
exports.onCommunityPostCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
/**
 * Triggered on community post creation.
 * Rewards the user with 1 DP and records the transaction/action.
 */
exports.onCommunityPostCreated = (0, firestore_1.onDocumentCreated)('community_posts/{postId}', (event) => __awaiter(void 0, void 0, void 0, function* () {
    const snapshot = event.data;
    if (!snapshot) {
        logger.info('No data in post, exiting.');
        return;
    }
    const post = snapshot.data();
    if (!post || !post.userId) {
        logger.info('Post missing data or userId, exiting.');
        return;
    }
    const userId = post.userId;
    const postId = event.params.postId;
    const db = admin.firestore();
    try {
        yield db.runTransaction((t) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Update Wallet
            const walletRef = db.collection('wallets').doc(userId);
            const walletDoc = yield t.get(walletRef);
            if (!walletDoc.exists) {
                // If wallet doesn't exist, create it with 1 DP
                t.set(walletRef, {
                    userId,
                    balance: 1,
                    totalEarned: 1,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            else {
                t.update(walletRef, {
                    balance: admin.firestore.FieldValue.increment(1),
                    totalEarned: admin.firestore.FieldValue.increment(1),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            // 2. Register Transaction in History
            const trxRef = db.collection('wallet_transactions').doc();
            t.set(trxRef, {
                userId,
                amount: 1,
                type: 'COMMUNITY_POST_REWARD',
                description: 'Recompensa por publicación en comunidad',
                postId,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            // 3. Register Action for Statistics (Dashboard Stats relies on this)
            const actionRef = db.collection('user_campaign_actions').doc();
            t.set(actionRef, {
                userId,
                actionType: 'community_post_reward',
                rewardAmount: 1,
                companyName: 'Comunidad',
                companyId: 'community',
                postId,
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
        }));
        logger.info(`Successfully rewarded user ${userId} for post ${postId}`);
    }
    catch (error) {
        logger.error(`Error rewarding user ${userId} for post ${postId}:`, error);
    }
}));
