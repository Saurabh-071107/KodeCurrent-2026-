# Backend Plan: Legal Drafting Studio

Kodekurrent Season 2 · DraftMate AI Legal Drafting Studio

Stack: Node.js + Express (TypeScript), Postgres, file storage. The AI module is built by the AI engineers and plugged in later.

---

## 1. Core idea: the AI module is a plug-in

The backend never depends on how the AI works. It talks to one interface, the **AI port**. Until the AI engineers deliver, a **mock adapter** returns realistic canned responses, so the frontend and the rest of the backend can be built and demoed now.

```
Frontend → Express routes → services → AI port (interface)
                                          ├─ MockAiAdapter     (now)
                                          ├─ HttpAiAdapter     (AI engineers' service, later)
                                          └─ InProcessAdapter  (AI code imported directly, optional)
```

- Switch with one env variable: `AI_MODE=mock | http | inprocess`.
- Routes, database, auth and frontend do not change when the real AI arrives.
- Everything crossing the port is validated with zod schemas, so a bad AI response fails loudly at the boundary and not deep inside the app.

---

## 2. What the backend owns vs what the AI module owns

| Backend owns | AI module owns (plugged in later) |
|---|---|
| Auth, roles, permissions | Pre-draft check |
| Database, file storage | Draft generation and style profile |
| Upload endpoints, template manager | Citation and verification |
| Case tracker, legal library, tools | Markdown conversion |
| Word/PDF export | Translation (Hindi, Gujarati) |
| Voice gateway contract and confirmation gate | Procedure Planner |
| Rate limiting, request logging, error handling | Student mode (AI courtroom, exam, moot) |
| Job queue, caching, SSE streaming plumbing | LLM calls (Gemini), prompts, skills |

Note: the AI engineers also own the LLM rate limiter and response cache for Gemini. The backend adds its own per-user limits and role checks in front.

---

## 3. Folder structure

```
apps/api/src/
  index.ts                 # app bootstrap
  config.ts                # env, AI_MODE, limits
  middleware/              # auth, rbac, errorHandler, requestLog, userRateLimit
  routes/
    auth.ts  docs.ts  templates.ts  draft.ts  verify.ts
    research.ts  translate.ts  student.ts  tracker.ts
    library.ts  tools.ts  voice.ts  export.ts  team.ts
  services/                # business logic, one per module
  ai/
    port.ts                # THE interface (section 4)
    schemas.ts             # zod request/response schemas for every AI call
    mock.ts                # canned responses for the demo
    http.ts                # calls the AI engineers' service
    inprocess.ts           # optional: imports AI code directly
    index.ts               # picks adapter from AI_MODE
  db/                      # migrations, queries
  adapters/
    courts/                # case tracker sources (live + cached demo)
    sources/               # legal library / authority sources
  voice/                   # command contract, confirmation gate
  export/                  # docx and pdf builders
  jobs/                    # queue workers
```

---

## 4. The AI port (the contract)

Every AI call goes through this interface. The AI engineers implement it (over HTTP or in-process). The mock implements it today.

```ts
export interface AiPort {
  // Documents
  convertToMarkdown(input: { fileId: string }): Promise<{ markdown: string; structure: ClauseNode[] }>;

  // Drafting
  preCheck(input: { skillId: string; templateMd: string; facts: Record<string, string> }): Promise<PreCheckResult>;
  extractStyleProfile(input: { docIds: string[] }): Promise<StyleProfile>;
  generateDraft(input: DraftRequest): AsyncIterable<DraftChunk>;      // streamed
  editDraft(input: EditRequest): AsyncIterable<DraftChunk>;           // streamed

  // Verification (one shared function for all modules)
  verify(input: { text: string; context?: "draft" | "research" | "courtroom" | "translation" }): Promise<VerificationReport>;

  // Translation
  translate(input: { text: string; to: "hi" | "gu" | "en"; glossaryId?: string }): Promise<TranslateResult>;
  askInLanguage(input: { docId: string; question: string; lang: "hi" | "gu" | "en" }): Promise<{ answer: string }>;

  // Research and planning
  researchChat(input: ChatRequest): AsyncIterable<ChatChunk>;          // streamed, with sources
  planProcedure(input: { facts: string; forum: string; stage: string }): Promise<ProcedurePlan>;

  // Student mode
  courtroomTurn(input: { sessionId: string; role: "judge" | "opposing"; argument: string }): Promise<CourtroomTurn>;
  gradeExam(input: { questionId: string; answer: string }): Promise<ExamFeedback>;

  // Health
  health(): Promise<{ ok: boolean; remainingToday?: number }>;
}
```

### Shared result shapes

```ts
type VerificationStatus = "verified" | "partial" | "unverified";

interface CitationResult {
  raw: string;
  kind: "case" | "statute" | "other";
  status: VerificationStatus;
  sourceUrl?: string;
  note?: string;
}

interface VerificationReport {
  citations: CitationResult[];
  legacyFlags: { raw: string; legacySection: string; replacement?: string; note: string }[];
  consistency: { issue: string; location?: string }[];
}

interface PreCheckResult {
  ready: boolean;
  missing: { field: string; question: string }[];
  warnings: string[];
}
```

Rules for the whole system:
- The model alone never marks a citation `verified`. Only a fetched source can.
- Unknown authority → `unverified`, never invented.
- Every research answer and planner step carries source links.

### Error contract

All AI errors use one shape so the backend and frontend can react consistently:

```ts
{ code: "RATE_LIMITED" | "QUOTA_EXHAUSTED" | "INVALID_INPUT" | "SOURCE_UNAVAILABLE" | "AI_FAILED",
  message: string, retryAfterSeconds?: number }
```

- `RATE_LIMITED` → the backend queues or retries and the frontend shows "queued".
- `QUOTA_EXHAUSTED` → show a clear message and switch to demo mode if enabled.

---

## 5. Making the later switch painless

- **Mock first, with realistic data.** `mock.ts` returns believable drafts, a verification report with one verified, one partial, one unverified citation and one legacy IPC flag, a Hindi and Gujarati translation sample, a procedure plan, and a courtroom turn. This lets the whole golden path work today.
- **Contract tests.** Write one test per port method that runs against whichever adapter is active. When the AI engineers deliver, run the same tests against `http` mode. Passing tests mean the swap is safe.
- **Feature flags per method.** Allow `AI_OVERRIDES=verify:http,translate:mock` so you can plug in the AI one method at a time as each is ready.
- **Version the contract.** Put a `contractVersion` in `/ai/health`. Both sides agree on it, and a mismatch is reported clearly.
- **No AI logic in routes.** Routes call services, services call the port. Nothing in `routes/` imports an SDK or builds a prompt.
- **Demo mode.** A recorded-response cache (owned by the AI side) must also be switchable from the backend, so the final demo never depends on live quota.

---

## 6. API routes (backend → frontend)

| Method and path | Purpose | Calls AI port |
|---|---|---|
| `POST /auth/login` | Login, returns role | no |
| `GET /me` | Current user, role, allowed modules | no |
| `POST /docs/upload` | Store a file, convert to Markdown | `convertToMarkdown` |
| `GET /templates`, `POST /templates` | Template manager | no |
| `POST /draft/precheck` | Missing-field questions | `preCheck` |
| `POST /draft/generate` (stream) | Draft from template and facts | `generateDraft` |
| `POST /draft/edit` (stream) | Edit part of a draft | `editDraft` |
| `POST /verify` | Verification report | `verify` |
| `POST /research/chat` (stream) | Research with sources | `researchChat` |
| `POST /research/plan-procedure` | Procedure roadmap | `planProcedure` |
| `POST /translate` | Translate to Hindi or Gujarati | `translate` |
| `POST /translate/ask` | Question answered in a language | `askInLanguage` |
| `POST /student/courtroom/start`, `/turn` | AI live courtroom | `courtroomTurn` |
| `POST /student/exam/grade` | Exam and moot grading | `gradeExam` |
| `GET /tracker/case/:cnr` | Case status, hearings, orders | no (AI adds summary later) |
| `GET /library/search`, `GET /library/:id` | Acts and judgments | no |
| `POST /tools/*` | Compare, limitation, court fee | no |
| `POST /voice/command`, `POST /voice/confirm` | Voice contract | no (see section 8) |
| `POST /export/:draftId?format=docx\|pdf` | Export | no |
| `GET /ai/health` | AI status and remaining quota | `health` |

---

## 7. Auth, roles and permissions

- Roles: `student`, `advocate`, `firm_admin`, `citizen`.
- A `roles.ts` map: role → modules and skill ids. The backend enforces it on every route and on skill selection.
- The AI module receives the user's role as context but never decides permissions.
- Hackathon shortcut: a simple login that issues a JWT with the role. Do not ship the demo-only `x-role` header to production.
- Every request is logged (user, route, AI call count) for debugging and for the demo.

---

## 8. Voice gateway contract

The voice agent runs through another gateway.

1. The gateway sends the transcript to `POST /voice/command`.
2. The backend turns it into a structured command: `{ action, target?, params, summary }`. If the AI module is not plugged in yet, a simple rule-based parser handles the demo commands.
3. For consequential actions (overwrite, delete, export) the backend returns `needsConfirm: true` with a plain-language summary and a one-time token that expires after about two minutes.
4. Nothing runs until `POST /voice/confirm` receives that token.

Route voice through the backend so role checks and rate limits apply to it too.

---

## 9. Case tracker

- One endpoint: `GET /tracker/case/:cnr`.
- Fixed response: parties, court, status, next hearing, order history.
- Adapters: a live source (best effort) and a cached demo dataset. The backend tries live first and falls back to cache.
- Always flag whether data is live or cached in the response. The frontend must not present cached data as live.
- The AI summary of the latest order is optional and added later through the AI port.

---

## 10. Database (Postgres)

Core tables:

- `users` (id, name, email, role, created_at)
- `documents` (id, owner_id, type, filename, storage_path, markdown, created_at)
- `templates` (id, owner_id, org_id, name, skill_id, markdown, placeholders, created_at)
- `style_profiles` (id, doc_hash, profile_json, created_at)
- `drafts` (id, owner_id, skill_id, template_id, content, facts_json, version, created_at, updated_at)
- `verification_reports` (id, draft_id, report_json, created_at)
- `matters` (id, org_id, title, created_by)
- `followed_cases` (id, user_id, cnr, created_at)
- `library_items` (id, kind, title, citation, body, source_url) and `bookmarks`
- `courtroom_sessions` (id, user_id, case_file_json, turns_json, score_json, created_at)
- `ai_call_log` (id, user_id, method, status, latency_ms, created_at)
- `voice_pending` (token, user_id, command_json, expires_at)

Keep migrations in the repo and seed demo data (a sample template, a sample reference document, demo cases) so a fresh install runs the golden path immediately.

---

## 11. Cross-cutting concerns

- **Streaming:** the backend relays AI streams to the frontend with SSE, supports cancellation, and closes cleanly on errors.
- **Per-user limits:** an Express limiter in front of AI routes so one user cannot burn the shared Gemini quota. Report `retryAfterSeconds` to the frontend.
- **Jobs:** long tasks (conversion, large translations) run through a queue and report status. Redis is optional for the hackathon; an in-process queue is enough to start.
- **Caching:** cache by content hash (conversion, translation chunks, style profiles) so repeat demo actions cost nothing.
- **File handling:** limit file types and size, store uploads outside the web root, and never log document contents.
- **Privacy:** free-tier Gemini prompts may be used for training, so the demo should use sample documents only. Show that notice in the upload flow, and say in the pitch that production would use a paid or enterprise tier.
- **Error handling:** one error middleware, using the error contract from section 4.

---

## 12. Build order

1. Project setup, config, error handling, auth and roles
2. Database, migrations, seed data
3. **AI port, schemas and mock adapter** (before any AI-dependent route)
4. Upload, templates, drafting routes (with streaming) against the mock
5. Verification and translation routes against the mock
6. Export (Word and PDF)
7. Case tracker with demo data, library, tools
8. Voice contract and confirmation gate
9. Student and research routes
10. **Plug in the real AI adapter**, run contract tests, then switch method by method

Steps 1 to 6 give you the full golden path with mocked AI, so the frontend is never blocked.

---

## 13. Integration checklist (when the AI engineers deliver)

- [ ] Same zod schemas on both sides (or generated from one source)
- [ ] Contract tests pass in `http` or `inprocess` mode
- [ ] Error codes map to the agreed shape
- [ ] Streaming works end to end, including cancellation
- [ ] Verification result is identical for drafting, research, translation and courtroom
- [ ] Demo mode and recorded cache work with no network
- [ ] `/ai/health` reports status and remaining quota
- [ ] Hindi and Gujarati output reviewed by a fluent reader

---

## 14. Open questions

- Will the AI engineers expose an HTTP service, or hand over code to import? This decides `http` vs `inprocess`.
- Who owns the shared zod schemas, and where do they live?
- Which legal data source backs the library, citation resolution and the planner's case retrieval?
- Which voice gateway is used, and what format does its transcript arrive in?
- Is Redis available, or should jobs and caches stay in-process for now?
