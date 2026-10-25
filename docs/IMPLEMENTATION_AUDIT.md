# DraftMate AI — Implementation Audit & Baseline Analysis

**Document Status:** Complete & Verified Baseline  
**Project:** DraftMate AI (Legal-Tech Platform)  
**Target Repository:** `https://github.com/Saurabh-071107/KodeCurrent-2026-`  
**Date of Audit:** October 2026  

---

## 1. Executive Summary & Repository Structure

An exhaustive audit of the codebase was conducted across all three core software tiers:
1. **Frontend Tier (`Frontend/Website/`):** Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons. Implements full user authentication, role-based onboarding (Advocate, Student, Citizen, Law Firm), legal drafting canvas, case & client management, moot courtroom, legal research, bare acts browser, document verification, and translation.
2. **Backend Gateway Tier (`backend/`):** Node.js, Express 5, TypeScript, MongoDB Atlas via Mongoose. Handles authentication, JWT lifecycle (access + refresh session tracking), tenancy isolation, input validation, document management, and proxies AI requests.
3. **Python AI Service Tier (`draftmate-ai/` & root Python modules):** FastAPI, Pydantic v2, ChromaDB/FAISS vector retrieval, sentence transformers, and LLM orchestration for fact extraction, evidence-grounded drafting, citation verification, contract review/redlining, translation, and citizen assistance.

---

## 2. Component Inventory

### 2.1 Backend (`backend/`)
- **Runtime:** Node.js v20+, Express v5.1.0, TypeScript v5.3.3.
- **Data Layer:** Mongoose v8.2.0 connecting to MongoDB Atlas.
- **Key Modules:**
  - `src/server.ts`: Application bootstrap, CORS, request parsing, health checks, route registration.
  - `src/controllers/auth.controller.ts`: Authentication, cryptographically secure OTP issuance, SHA-256 OTP verification, registration, JWT issuance, atomic refresh token rotation, replay attack detection, onboarding.
  - `src/controllers/api.controller.ts`: Core application controllers (Drafts, Cases, Clients, Events, Notes, Documents, Document Exports).
  - `src/middleware/auth.ts`: JWT authentication & role-based access control.
  - `src/services/aiClient.ts`: Strongly typed client bridging Node.js to Python FastAPI.
  - `src/models/`:
    - `User.ts`: User identity, hashed passwords, roles, verification status.
    - `Otp.ts`: Rate-limited OTP challenges with SHA-256 storage and attempt tracking.
    - `RefreshToken.ts`: Hashed refresh tokens with family tracking and revocation flags.
    - `AppModels.ts`: Mongoose schemas for `Draft`, `Case`, `Client`, `Event`, `Note`, `Document`.

### 2.2 Python AI Service (`draftmate-ai/app/`)
- **Runtime:** Python 3.10+, FastAPI, Pydantic v2, Uvicorn.
- **Entry Point:** `draftmate-ai/app/main.py`.
- **Core Endpoints:**
  - `/api/v1/extract-facts`: Extracts structured legal facts from unstructured statements (`FactExtractionRequest` -> `FactExtractionResponse`).
  - `/api/v1/generate-draft`: Evidence-grounded legal drafting requiring structured fact schema (`DraftRequest` -> `DraftResponse`).
  - `/api/v1/review-document`: Identifies legal risks, anomalies, and recommendations (`ReviewRequest` -> `ReviewResponse`).
  - `/api/v1/verify-citations`: Validates legal citations against verified Indian law corpora (`CitationVerificationRequest` -> `CitationVerificationResponse`).
  - `/api/v1/legal-assistant`: Citizen assistance and legal query resolution (`LegalAssistantRequest` -> `LegalAssistantResponse`).
  - `/api/v1/translate`: Multilingual legal document translation (`TranslateRequest` -> `TranslateResponse`).

### 2.3 Frontend (`Frontend/Website/`)
- **Runtime:** Next.js 16 (App Router), React 19, TypeScript.
- **API Client:** `lib/api.ts` orchestrates HTTP Bearer auth, token refresh, and endpoints.
- **Key Screens:**
  - `app/login/`, `app/register/`, `app/otp/`, `app/onboarding/`: Identity and role enrollment.
  - `app/draft/`: Interactive legal document editor, AI fact extraction, drafting, citation verification.
  - `app/cases/`: Case docket, status tracking, notes, document linking.
  - `app/clients/`: Client directory, contact records, matter associations.
  - `app/research/`: Legal research and Bare Acts search engine.
  - `app/verify/`: AI document verification, checksum inspection, authenticity checks.
  - `app/moot-court/`: AI-powered virtual courtroom simulation for law students.
  - `app/citizen/`: Simplified citizen legal rights assistant.

---

## 3. Implementation Status Matrix

| Feature | Frontend Screen / Action | Node API Route | Auth Requirement | Controller & Service | Database Models | AI Dependency | Implementation Status | Automated Tests | Outstanding Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OTP Generation** | `app/login`, `app/register` | `POST /api/v1/auth/request-otp` | Public (Rate-limited) | `auth.controller.requestOtp` | `Otp`, `User` | None | **Implemented and tested** | `tests/security.test.ts` | SMS Provider credentials |
| **OTP Verification** | `app/otp` | `POST /api/v1/auth/verify-otp` | Public (Rate-limited) | `auth.controller.verifyOtp` | `Otp`, `User`, `RefreshToken` | None | **Implemented and tested** | `tests/security.test.ts` | None |
| **User Registration** | `app/register` | `POST /api/v1/auth/register` | Public | `auth.controller.register` | `User`, `RefreshToken` | None | **Implemented and tested** | `tests/security.test.ts` | None |
| **Token Refresh** | `lib/api.ts` interceptor | `POST /api/v1/auth/refresh-token`| Refresh Token Header | `auth.controller.refreshToken` | `RefreshToken`, `User` | None | **Implemented and tested** | `tests/security.test.ts` | None |
| **Role-Based Onboarding** | `app/onboarding` | `POST /api/v1/auth/onboarding` | Authenticated (JWT) | `auth.controller.updateOnboarding`| `User` | None | **Implemented and tested** | `tests/security.test.ts` | Bar Council/ID verification API |
| **Legal Fact Extraction**| `app/draft` | `POST /api/v1/ai/extract-facts` | Authenticated (JWT) | `api.controller.extractFacts` via `aiClient` | None (Transient) | FastAPI `/api/v1/extract-facts` | **Implemented and tested** | FastApi contract tests | Running Python AI Service |
| **Document Drafting** | `app/draft` | `POST /api/v1/ai/generate-draft` | Authenticated (JWT) | `api.controller.generateDraft` via `aiClient` | `Draft` | FastAPI `/api/v1/generate-draft` | **Implemented and tested** | FastApi contract tests | Running Python AI Service |
| **Draft Persistence & IDOR** | `app/draft` | `GET,POST,PUT,DELETE /api/v1/drafts` | Authenticated (JWT) | `api.controller.*Draft` | `Draft` | None | **Implemented and tested** | `tests/security.test.ts` | None |
| **Document Export (PDF/DOCX)**| `app/draft/export` | `GET /api/v1/drafts/:id/export` | Authenticated (JWT) | `api.controller.exportDraft` | `Draft` | Pandoc / Puppeteer / Buffer | **Implemented and tested** | Export security tests | PDF rendering engine for production |
| **Case Management** | `app/cases` | `GET,POST,PUT,DELETE /api/v1/cases` | Authenticated (JWT) | `api.controller.*Case` | `Case` | None | **Implemented and tested** | `tests/security.test.ts` | None |
| **Client Management** | `app/clients` | `GET,POST,PUT,DELETE /api/v1/clients` | Authenticated (JWT) | `api.controller.*Client` | `Client` | None | **Implemented and tested** | `tests/security.test.ts` | None |
| **Citation Verification**| `app/draft`, `app/research` | `POST /api/v1/ai/verify-citations` | Authenticated (JWT) | `api.controller.verifyCitations` via `aiClient` | None | FastAPI `/api/v1/verify-citations` | **Implemented and tested** | Contract tests | Indian Kanoon / Supreme Court corpus |
| **Document Upload** | `app/verify`, `app/draft` | `POST /api/v1/documents/upload` | Authenticated (JWT) | `api.controller.uploadDocument` | `Document` | None | **Implemented and tested** | `tests/security.test.ts` | S3 / Cloud Object Store in production |
| **Moot Court Simulation**| `app/moot-court` | `POST /api/v1/moot-court/*` | Authenticated (JWT) | `api.controller.mootCourt` | `Case`, `Note` | FastAPI `/api/v1/legal-assistant` | **Implemented, testing incomplete** | Unit tests | Real-time audio STT/TTS |
| **Citizen Assistance** | `app/citizen` | `POST /api/v1/citizen/assist` | Authenticated (JWT) | `api.controller.citizenAssist` | None | FastAPI `/api/v1/legal-assistant` | **Implemented and tested** | AI prompt tests | LLM quota/credits |
| **Document Translation** | `app/translate` | `POST /api/v1/ai/translate` | Authenticated (JWT) | `api.controller.translateDocument` | `Document` | FastAPI `/api/v1/translate` | **Implemented and tested** | Translation schema tests | IndicTrans2 / Bhashini API |
