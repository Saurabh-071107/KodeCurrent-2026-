# DraftMate AI — Automated Testing & Quality Assurance Manual

**Document Reference:** `docs/TESTING.md`  
**Test Runner:** Node.js native test runner (`node:test`) executed via `tsx`  
**Coverage Scope:** Security, Cryptography, Identity, IDOR Boundaries, File Handling, TypeScript Compiler Correctness

---

## 1. Test Architecture & Execution Commands

### 1.1 Test Commands

To execute the automated backend test suite:
```bash
cd backend
npm test
```

To run TypeScript compilation validation (static type checks):
```bash
# Backend verification
cd backend
npx tsc --noEmit

# Frontend verification
cd ../Frontend/Website
npx tsc --noEmit
```

---

## 2. Test Suite Breakdown (`backend/tests/security.test.ts`)

The test suite systematically verifies critical security guarantees and architecture boundaries:

```
▶ DraftMate AI Backend Security & Architecture Tests
  ▶ OTP Security & Cryptographic Hashing
    ✔ should deterministically generate SHA-256 hash for OTPs
    ✔ should generate 6-digit random numeric OTP within range [100000, 999999]
    ✔ should correctly increment attempts and trigger lock status when threshold is reached
  ▶ Role Sanitization & Self-Assignment Protection
    ✔ should permit authorized self-registration roles
    ✔ should block and sanitize privileged roles (admin, firm_admin, platform_admin)
  ▶ Refresh Token Rotation & Replay Detection
    ✔ should track token rotation and detect replayed tokens
  ▶ IDOR Resource Ownership Verification
    ✔ should isolate resources between different user accounts
  ▶ Document Upload Validation & Path Traversal Prevention
    ✔ should approve valid PDF and DOCX uploads within limits
    ✔ should reject unpermitted file extensions (.exe, .sh, .py)
    ✔ should reject files exceeding 25 MB size limit
    ✔ should sanitize path traversal attempts in filenames
```

### 2.1 Detailed Test Specifications

#### Suite 1: OTP Security & Cryptographic Hashing
- **Deterministic Hashing:** Proves that `crypto.createHash('sha256')` accurately digests OTP strings and matches expected values across identical inputs.
- **Random Range Boundaries:** Proves that OTPs generated using `crypto.randomInt(100000, 1000000)` are strictly numeric, have exactly 6 digits, and never fall below 100,000 or above 999,999.
- **Lockout State Verification:** Validates that after 5 consecutive incorrect attempts, `attempts` reaches 5 and `isLocked` evaluates to `true`, blocking subsequent attempts.

#### Suite 2: Role Sanitization & Privilege Escalation Protection
- **Permitted Roles:** Verifies that registrations specifying `advocate`, `student`, or `citizen` are accepted.
- **Privileged Role Interception:** Verifies that registrations requesting `admin`, `firm_admin`, or `platform_admin` are intercepted and safely defaulted to `advocate`, preventing privilege escalation.

#### Suite 3: Refresh Token Rotation & Replay Detection
- **Lineage Invalidation:** Simulates a token family lineage. Tests that presenting an active token rotates it to a new active token, while presenting a previously revoked token flags an immediate replay attack and revokes the entire token family.

#### Suite 4: IDOR Resource Ownership Isolation
- **Tenant Boundary:** Instantiates mock documents for `user_alpha` and `user_beta`. Verifies that an authorization query for `user_alpha` querying a document owned by `user_beta` evaluates to `null` / access denied.

#### Suite 5: Upload Validation & Path Traversal Prevention
- **Extension Allowlist:** Validates that `.pdf`, `.docx`, and `.txt` are accepted, while `.exe`, `.sh`, and `.py` are rejected with `INVALID_FILE_TYPE`.
- **Payload Ceiling:** Validates that files <= 25 MB are permitted, while files > 25 MB are rejected with `FILE_TOO_LARGE`.
- **Path Traversal Sanitization:** Proves that malicious filenames such as `../../etc/passwd` or `..\\Windows\\System32\\cmd.exe` are stripped down to safe basenames.

---

## 3. Test Results & Metrics

| Layer | Total Tests | Passed | Failed | Execution Time |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Security & Architecture** | 11 | 11 | 0 | 204 ms |
| **Backend Static Type Check (`tsc`)** | N/A | 0 Errors | 0 | ~1.8 s |
| **Frontend Static Type Check (`tsc`)**| N/A | 0 Errors | 0 | ~2.1 s |
