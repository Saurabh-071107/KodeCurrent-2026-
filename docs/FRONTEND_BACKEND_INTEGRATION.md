# DraftMate AI — Frontend-Backend Integration Specification

**Reference Document:** `docs/FRONTEND_BACKEND_INTEGRATION.md`  
**Frontend Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS  
**Backend Framework:** Node.js, Express 5, TypeScript, MongoDB Atlas  
**AI Microservice:** Python FastAPI (port 8000)

---

## 1. Authentication & Session Architecture

The integration between Next.js and Express is encapsulated within `Frontend/Website/lib/api.ts`.

### 1.1 Token Lifecycle
1. **Login / OTP Verification:** Upon successful authentication, the server returns an `accessToken` (short-lived, 15m) and `refreshToken` (7d).
2. **Persistence:** The `accessToken` and `refreshToken` are stored securely. Every outgoing HTTP request passes through `api.fetchWithAuth()` which injects:
   ```http
   Authorization: Bearer <accessToken>
   ```
3. **401 Interception & Refresh:** If an access token expires:
   - The client intercepts the `401 Unauthorized`.
   - Sends a single refresh request to `POST /api/v1/auth/refresh-token` with header `x-refresh-token: <refreshToken>`.
   - If successful, updates the local access token and retries the original request.
   - If the refresh token is expired or revoked (403), the client clears credentials and redirects cleanly to `/login` without looping.

---

## 2. Screen-to-Endpoint Integration Matrix

| Frontend Route / Screen | User Role(s) | Primary User Actions | Backend Endpoint(s) | Request Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| **`/login`** | All | Password login or initiate OTP | `POST /api/v1/auth/login`<br>`POST /api/v1/auth/request-otp` | `{ email, password }` or `{ mobile }` |
| **`/otp`** | All | Submit 6-digit OTP | `POST /api/v1/auth/verify-otp` | `{ mobile, otp }` |
| **`/register`** | All | Create account with default role | `POST /api/v1/auth/register` | `{ fullName, email, mobile, password, role }` |
| **`/onboarding`** | New Accounts | Complete professional profile | `POST /api/v1/auth/onboarding` | `{ role, barRegistrationNumber, experienceYears, specializations, jurisdiction }` |
| **`/draft`** | Advocate, Student, Law Firm | 1. Extract facts from text<br>2. Generate draft<br>3. Save/Update draft<br>4. Verify citations<br>5. Export file | `POST /api/v1/ai/extract-facts`<br>`POST /api/v1/ai/generate-draft`<br>`POST /api/v1/drafts`<br>`PUT /api/v1/drafts/:id`<br>`POST /api/v1/ai/verify-citations`<br>`GET /api/v1/drafts/:id/export` | `{ documentText, extractionType }`<br>`{ templateType, facts, jurisdiction }`<br>`{ title, content, documentType }`<br>`{ content }`<br>`{ text }`<br>`?format=pdf` or `?format=docx` |
| **`/cases`** | Advocate, Law Firm | 1. View docket<br>2. Create case<br>3. Update hearing dates | `GET /api/v1/cases`<br>`POST /api/v1/cases`<br>`PUT /api/v1/cases/:id` | `?status=active`<br>`{ caseNumber, title, court, clientId }`<br>`{ status, nextHearingDate, notes }` |
| **`/clients`** | Advocate, Law Firm | 1. Directory lookup<br>2. Register client<br>3. Edit details | `GET /api/v1/clients`<br>`POST /api/v1/clients`<br>`PUT /api/v1/clients/:id` | `?page=1&limit=20`<br>`{ name, email, phone, address, matter }`<br>`{ phone, address }` |
| **`/verify`** | Advocate, Law Firm, Citizen | Upload contract for risk review and verification | `POST /api/v1/documents/upload`<br>`POST /api/v1/ai/review` | `multipart/form-data (file)`<br>`{ documentId, reviewType }` |
| **`/research`** | All | Query Bare Acts, statutes, and citations | `GET /api/v1/research/search`<br>`GET /api/v1/research/bare-acts/:actId` | `?q=anticipatory+bail+section+438`<br>Path parameter `actId` |
| **`/moot-court`** | Student, Advocate | AI Judge bench questioning and oral argument scoring | `POST /api/v1/moot-court/session`<br>`POST /api/v1/moot-court/evaluate` | `{ topic, role, argumentText }`<br>`{ sessionId, transcript }` |
| **`/citizen`** | Citizen | Plain language legal advisory and rights education | `POST /api/v1/citizen/assist` | `{ query: "Can landlord evict without 30 days notice in Delhi?" }` |
| **`/translate`**| All | Translate legal text into regional Indian languages | `POST /api/v1/ai/translate` | `{ text, targetLanguage: "hi" \| "ta" \| "te" \| "bn" }` |

---

## 3. UI State Handling Standards

To ensure a seamless and responsive user experience across mobile, tablet, and desktop:

1. **Loading States:** Every asynchronous button (e.g., "Generate Draft", "Verify Citations", "Upload Document") disables itself and displays an animated spinner with context-aware text (e.g., "Analyzing document with AI...").
2. **Error States:** Server-side validation errors (`error.code: "VALIDATION_ERROR"`) display directly adjacent to relevant form inputs. General network or 500 errors display a non-intrusive Toast notification with retry options.
3. **Empty States:** When a user with an empty database logs in (e.g., zero drafts or zero cases), high-aesthetic empty state illustrations appear guiding the user with actionable primary CTAs (e.g., "Create Your First Legal Draft").
4. **Optimistic Updates:** Local UI states (e.g., drafting editor content) autosave with debounce (1500ms) to prevent loss of work during intermittent connectivity.
