# DraftMate AI — Known Limitations & External Dependencies

**Document Reference:** `docs/KNOWN_LIMITATIONS.md`  
**Purpose:** Honest, explicit accounting of external service dependencies, environmental requirements, and architectural boundaries in accordance with Rule D ("No Fake Completion").

---

## 1. External Service & Credential Dependencies

The following features have complete application interfaces, database schemas, and validation logic, but require external third-party subscriptions or API keys in production:

### 1.1 SMS Gateway Provider (Twilio / MSG91 / Kaleyra)
- **Status:** `Blocked by external dependency` (in live production without keys); `Implemented and tested` (in development/test environments).
- **Explanation:** The cryptographic OTP generation, hashing, rate limiting, and attempt tracking are fully implemented and tested. However, physical SMS transmission to mobile devices requires provisioning an SMS gateway provider account and configuring credentials (`SMS_PROVIDER_API_KEY`).
- **Development Fallback:** In test environments (`NODE_ENV=test`), test OTP bypass is supported for automated suites. In staging without SMS credits, OTP codes are logged to secure server-side development consoles.

### 1.2 Real-Time Speech Processing for Moot Court (STT / TTS)
- **Status:** Textual simulation is `Implemented and tested`; Real-time audio is `Blocked by external dependency`.
- **Explanation:** The moot court simulation features complete prompt engineering, judicial bench dialogue, student argument grading, and transcript history. Real-time audio duplexing (voice-to-voice interaction with the AI Judge) requires external speech providers (e.g., ElevenLabs for judicial speech synthesis, Deepgram for courtroom voice recognition).

### 1.3 Bar Council of India Registry Verification
- **Status:** `Partially implemented`
- **Explanation:** Advocate onboarding validates the legal syntax, year, and state code format of Bar Registration Numbers (e.g., `D/1429/2015`). Direct programmatic validation against live state bar council databases is unavailable due to the absence of public, authenticated APIs provided by statutory bar councils in India.

---

## 2. Infrastructure & Environment Dependencies

### 2.1 PDF Rendering Engines (Puppeteer / LibreOffice)
- **Status:** `Implemented and tested` (via buffer generation); Production scale requires containerized binaries.
- **Explanation:** Exporting legal drafts to `.docx` and formatted text is operational. Converting long, multi-page legal briefs with running headers, footers, and court stamps into pixel-perfect PDF files in production requires deploying the backend container with either headless Chromium (`puppeteer`) or `libreoffice-convert` installed in the Docker image.

### 2.2 Live Judicial Judgment Feeds (e-Courts / Supreme Court Portal)
- **Status:** `Implemented and tested` against static vector corpus; Real-time scraping is `Not implemented`.
- **Explanation:** Citation verification cross-references citations against a pre-indexed vector corpus of Landmark Supreme Court judgments and core Bare Acts (IPC, CrPC, CPC, Evidence Act, BNS, BNSS, BSA). Live ingestion of daily causelists and newly pronounced orders requires enterprise data partnerships with legal publishers.

---

## 3. Compliance and Ethical Guardrails

1. **AI Is Not Legal Counsel:** In strict adherence to Advocates Act, 1961 regulations, all AI outputs (drafts, citation analyses, risk reviews) are explicitly presented as draft aids requiring advocate review and verification. The platform does not guarantee automated legal validity.
2. **Zero Hallucination Tolerance:** The platform never fabricates statutory sections or citations to simulate completeness. Where a precedent cannot be verified in the authoritative dataset, it is flagged as `unverified` rather than artificially certified.
