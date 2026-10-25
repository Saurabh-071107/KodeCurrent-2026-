# DraftMate AI — Security & Threat Modeling Architecture

**Classification:** Confidentially Reviewed / Production Hardened  
**Reference Document:** `docs/SECURITY.md`  
**Compliance Standard:** OWASP Top 10 (2021/2026), ISO/IEC 27001 Data Privacy Alignment

---

## 1. Security Architecture Overview

DraftMate AI handles sensitive legal documents, litigation strategies, and confidential client data. The platform incorporates defense-in-depth principles across transport, authentication, authorization, data isolation, and upstream AI microservices.

```
       [ Client Browser / Next.js ]
                    │
                    ▼ (TLS 1.3 / Strict CORS / Bearer JWT)
         [ Node.js API Gateway ]
        ┌───────────┴───────────┐
        ▼                       ▼
  [ MongoDB Atlas ]      [ Python AI Engine ]
  (Scoped Queries)       (Internal VPC / Token Auth)
```

---

## 2. Threat Vector Mitigation Matrix

| Threat / Vulnerability | OWASP Risk | Hardened Mitigation in DraftMate AI |
| :--- | :--- | :--- |
| **Bypass of OTP Challenges** | A07: Identification and Authentication Failures | - OTPs generated using CSPRNG (`crypto.randomInt`).<br>- Stored as SHA-256 hashes (`otpHash`). Plaintext never persisted.<br>- Test OTP bypass disabled in production; permitted only when `NODE_ENV === 'test'` and `ALLOW_TEST_OTP_BYPASS === 'true'`. |
| **OTP Brute-Force & Flooding** | A04: Insecure Design | - 60-second cooldown enforced between resends per phone number.<br>- 5-attempt threshold triggers permanent lockout (`isLocked: true`, HTTP 423). |
| **Privilege Escalation** | A01: Broken Access Control | - Public registration restricts roles to `advocate`, `student`, and `citizen`.<br>- Privileged roles (`admin`, `firm_admin`) rejected during signup. |
| **Insecure Direct Object Reference (IDOR)** | A01: Broken Access Control | - Every database lookup explicitly filters by `{ _id: id, userId: req.user._id }`.<br>- Attempting to access another user's draft or case yields an immediate 404/403. |
| **Token Theft & Replay Attacks** | A07: Identification and Authentication Failures | - Refresh tokens rotated upon every single use.<br>- Family tracking detects reuse of revoked tokens and immediately invalidates all descendants in the family. |
| **Malicious File Upload & Path Traversal** | A03: Injection / A08: Software and Data Integrity | - Whitelist strictly limited to `.pdf`, `.docx`, `.txt`.<br>- 25 MB hard size ceiling enforced.<br>- Storage keys generated as random UUIDs (`doc_${crypto.randomUUID()}`). Paths containing `..`, `/`, `\` stripped. |
| **Secret Exposure** | A05: Security Misconfiguration | - Real credentials scrubbed from Git tracking.<br>- `.env.example` provided with non-functional placeholders.<br>- Startup configuration validation halts process if production secrets are missing. |

---

## 3. Implementation Details

### 3.1 Cryptographic OTP Workflow
```typescript
// backend/src/controllers/auth.controller.ts
const otpCode = crypto.randomInt(100000, 1000000).toString();
const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

// Stored in MongoDB:
await Otp.findOneAndUpdate(
  { mobile },
  { otpHash, attempts: 0, isLocked: false, lastRequestedAt: new Date(), expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  { upsert: true }
);
```

### 3.2 Refresh Token Rotation with Replay Detection
```typescript
// When refresh token is presented:
const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
const existingRecord = await RefreshToken.findOne({ tokenHash: incomingHash });

if (existingRecord.isRevoked) {
  // Replay attack detected: revoke all tokens belonging to this family immediately!
  await RefreshToken.updateMany({ familyId: existingRecord.familyId }, { isRevoked: true });
  return res.status(403).json({ error: { code: 'TOKEN_REVOKED', message: 'Compromised session family invalidated' } });
}
```

### 3.3 IDOR Boundary Scoping
```typescript
// backend/src/controllers/api.controller.ts
export const getDraft = async (req: AuthenticatedRequest, res: Response) => {
  const draft = await Draft.findOne({ _id: req.params.id, userId: req.user._id });
  if (!draft) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Draft not found or access denied' } });
  }
  res.json({ draft });
};
```

---

## 4. Operational Best Practices
1. **Production Transport:** Must be hosted exclusively behind TLS 1.3 reverse proxies with HSTS headers enabled.
2. **Database Network Isolation:** MongoDB Atlas IP access lists restricted to the application cluster VPC / static NAT gateway IPs.
3. **Audit Logging:** Security events (failed OTP attempts, token family revocations, privileged access rejections) logged with request correlation IDs and sanitized payloads (no PII or raw secrets).
