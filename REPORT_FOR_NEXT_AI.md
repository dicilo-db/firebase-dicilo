# Report: AI Bot Logic & API Key Fixes

## Critical Updates (Session: 2026-01-03)

### 1. API Key Configuration
*   **Action:** Updated `.env` and `.env.local` with the user-provided Vertex AI API Key.
*   **Code Change:** Modified `src/ai/genkit.ts` to explicitly use `process.env.GEMINI_API_KEY` for the Google AI plugin.

### 2. Logic Improvements (`src/ai/flows/website-chat-flow.ts`)
*   **Deterministic Email Trap:** Implemented a Regex-based interceptor. If the user input contains an email address:
    *   The system **automatically** executes the `sendMessage` tool immediately, bypassing the LLM's decision loop.
    *   This prevents infinite loops where the bot asks for an email repeatedly.
*   **Strict Language Rules:** Added "Few-Shot Examples" to the System Prompt to enforce response translation (e.g., if Context is German but User asks in Spanish -> Respond in Spanish).
*   **RAG Tool:** Integrated `retrieveCompanyInfo` tool to allow the bot to fetch deep knowledge about specific companies found in the directory.
*   **"No Apology" Rule:** Instructed the bot to ask for an email directly without saying "I can't" or "Sorry" when data is missing.

### 3. Current Status
*   **API:** Configured with valid key.
*   **Flow:** Hardened against hallucinations and loops.
*   **Tools:** Message sending is now prioritized and deterministic for email inputs.

## Next Steps
*   Verify n8n webhook functional status (external).
*   Monitor logs for successful email dispatch.

### 4. RAG & Knowledge Engine Tuning (Session 2: 2026-01-03 Late)
*   **Recommendation Policy:** Relaxed prompt rules to encourage "partial matches". If a user asks for "Family Trip to Germany" and we have a generic "German Travel Agency", the bot now suggests it instead of saying "Not found".
*   **Language Enforcement 2.0:** Implemented a critical post-RAG instruction. The bot is forced to ignore the language of the retrieved database content (often German) and construct the final answer *only* in the user's input language.
*   **Intelligent Deduplication:** Updated `knowledge-retriever.ts` to deduplicate agencies based on Slug or Normalized Name. This prevents showing "Club Inviajes" and "Inviajes - Reisen Club" as two separate entities.
*   **Client Value Filtering:** Implemented a strict filter in `knowledge-retriever.ts`. The AI **only** accesses clients with types: `Starter`, `Retailer` (Minorista), or `Premium`. Basic/Free users are excluded from AI recommendations.
*   **Full Directory Access:** Removed the 150-document limit on the directory fetch to ensure 100% visibility of the catalog.
*   **Frontend UI:** Updated `AiChatWidget` with a definitive, authoritative welcome message and removed the loading flicker.

## Next Steps
*   **n8n Webhook:** Still requires validation for email delivery.
### 5. Final UI & Logic Refinements (Session 3: 2026-01-04)
*   **Mobile UX Overhaul:** Replaced the chat Input field with a smart `Textarea` that auto-expands (grows downwards) as usage requested. Fixed `Enter` key behavior to ensure seamless submission on both desktop and mobile, while allowing multiline input.
*   **Prompt Engineering 3.0:** Refactored the `website-chat-flow.ts` System Prompt to include a "Hidden Thought" mechanism and stricter "Silent Execution" rules. The bot is now explicitly forbidden from announcing "I will use tool X" and is programmed to detect user language and auto-translate any retrieved German/English RAG data into that language before responding.
*   **Category Search:** Added logic to "SCAN" the directory for generic category matches (e.g., "African Restaurants") and proactively query them, rather than asking the user for a specific name first.
*   **Crash Fix:** Resolved a critical client-side crash (`Cannot read properties of undefined`) by hardening the `chatAction` response check in `AiChatWidget.tsx` and refactoring `actions/chat.ts` to ensuring it always returns a response object (catching internal flow errors). Also removed redundant history fetching logic to streamline performance.
*   **Firefox Mobile & Responsive Fixes:**
    *   **Chat Widget Overflow:** Adjusted Chat Card width to `w-[calc(100vw-2rem)]` on mobile to ensure it fits perfectly within the screen with 1rem margins, solving the "out of size" issue.
    *   **Menu Overlap:** Lowered Chat Widget `z-index` from 50 to 40. This ensures the Mobile Navigation Menu (z-50) correctly overlays the chat button/window instead of being obscured by it ("Menu looks bad" fix).
*   **Language Enforcement 3.1 (RAG Loop):** Added extremely strict prompts *inside* the RAG execution loop (post-tool use) to force the model to acknowledge that retrieved data is raw (German/English) and explicit instructions to TRANSLATE it to the user's detected language before finalizing the answer. This addresses the "Dental Clinic" mixed-language issue.
*   **Context Freshness Logic:** Detected an issue where the bot would get "stuck" on a previous failed query (e.g., repeatedly saying "I can't find Travelposting" even after the user switched topics).
    *   **Fix:** Reduced history window from 30 to 10 lines to prioritize recent context.
    *   **Fix:** Added a `=== 🧠 REGLA DE ATENCIÓN (FRESH START) ===` block to the system prompt, explicitly instructing the AI to forget previous failures if the topic changes and treating each new query independently.
