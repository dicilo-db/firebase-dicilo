# Dicilo.net Database Architecture (Firestore Adaptation)

This document outlines the Firestore data model adapted from the proposed SQL schema to support Freelancers, Internationalization (i18n), and Campaign Pools.

## 1. Collections & Structure

### `users` / `private_profiles` (Users)
Extends the existing user profile.
- **`preferredLanguage`** `(string)`: ISO 639-1 code (e.g., 'es', 'en', 'de'). Index this field.
- **`isFreelancer`** `(boolean)`: From previous onboarding.
- **`walletStatus`** `(string)`: 'active', 'pending_setup'.
- **`revolutTag`** `(string)`: Payment identifier.

### `campaigns` (Campaigns)
Stores campaign configuration, logic, and financials.
- **`id`** `(string)`: Document ID.
- **`clientId`** `(string)`: Reference to the business/user creating it.
- **`status`** `(enum)`: 'draft', 'active', 'paused', 'completed'.
- **`budget_total`** `(number)`: Total budget allocated (exposing for admin/client).
- **`budget_remaining`** `(number)`: Real-time remaining budget. Indexed for "Gray Mode".
- **`cost_per_action`** `(number)`: Amount charged to client per click/action (e.g., 0.50).
- **`reward_per_action`** `(number)`: Amount paid to freelancer per click/action (e.g., 0.30).
- **`daily_cap_per_user`** `(number)`: Max actions/clicks paid per freelancer per day (Fair Play).
- **`default_language`** `(string)`: Main language of the campaign.
- **`translations`** `(map)`: I18n content.
  ```json
  {
    "es": { "title": "...", "description": "...", "promo_text": "..." },
    "en": { "title": "...", "description": "...", "promo_text": "..." }
  }
  ```
- **`images`** `(array)`: Campaign assets.
- **`createdAt`** `(timestamp)`

### `campaign_actions` (User Actions / Transactions)
Records every billable event (click, verified share) for fraud control, limits, and payments.
- **`id`** `(string)`: Auto-generated.
- **`campaignId`** `(string)`: Reference.
- **`freelancerId`** `(string)`: Reference.
- **`languageCode`** `(string)`: The language context of the action.
- **`status`** `(enum)`: 'pending', 'approved', 'rejected'.
- **`rewardAmount`** `(number)`: Snapshot of `reward_per_action` at time of event.
- **`createdAt`** `(timestamp)`: For daily limit checks.

> **Index Requirement**: Compound index on `(freelancerId, campaignId, createdAt)` to efficiently count today's actions for the `daily_cap_per_user` check.

### `languages` (Configuration)
Can be a collection or a hardcoded config. Should contain:
- **`code`** `(string)`: PK ('es', 'en').
- **`name`** `(string)`: Display name.
- **`flag_icon`** `(string)`: URL or emoji.
- **`isActive`** `(boolean)`.

## 2. Implementation logic

### Pool & Budget Logic
- **Decrement**: When a valid `campaign_action` is recorded, decrement `budget_remaining` by `cost_per_action`.
- **Gray Mode**: If `budget_remaining` < `cost_per_action`, update status to 'gray_mode' (visible but not paid/active).

### Fair Play Logic
- Before recording a paid action, query `campaign_actions` for the `freelancerId` + `campaignId` where `createdAt` > start of today.
- If count >= `daily_cap_per_user`, the action is recorded as `status: 'rejected'` (or 'capped') and `rewardAmount: 0`.

### I18n Logic
- Frontend fetches campaign.
- Checks `user.preferredLanguage`.
- Tries to pick `campaign.translations[user.preferredLanguage]`.
- Fallback to `campaign.default_language` or first available.

---
*Based on SQL Architecture Request Step 2332*
