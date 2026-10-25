# DraftMate AI — Database Architecture & Data Dictionary

**Database Engine:** MongoDB Atlas  
**Object Document Mapper:** Mongoose v8.2.0  
**Host Architecture:** Distributed Replica Set with TLS 1.3 Encryption-at-Rest and In-Transit  
**Reference Document:** `docs/DATABASE_DESIGN.md`

---

## 1. Data Models & Schemas

### 1.1 `users` Collection
Stores user identity, role-based attributes, and onboarding metadata.

```typescript
interface IUser {
  mobile: string;                     // E.164 formatted string (e.g., +919876543210)
  email?: string;                     // Normalized lowercase email
  passwordHash?: string;              // Argon2 or bcrypt hash
  role: 'advocate' | 'student' | 'citizen' | 'firm_admin' | 'admin';
  fullName?: string;
  barRegistrationNumber?: string;     // Unique bar membership identifier for advocates
  experienceYears?: number;
  specializations?: string[];
  jurisdiction?: string;
  isOnboarded: boolean;               // Default: false
  isVerified: boolean;                // Default: false (manual or API verified)
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes:**
- `{ mobile: 1 }`: Unique index
- `{ email: 1 }`: Unique sparse index
- `{ role: 1 }`: Single field index for filtering

---

### 1.2 `otps` Collection
Manages short-lived, rate-limited cryptographic challenges.

```typescript
interface IOtp {
  mobile: string;                     // Target phone number
  otpHash: string;                    // SHA-256 hash of the 6-digit random code
  attempts: number;                   // Incremented on every incorrect guess (Max: 5)
  isLocked: boolean;                  // True if attempts >= 5
  lastRequestedAt: Date;              // Enforces 60-second resend cooldown
  expiresAt: Date;                    // Expiration timestamp (5 minutes from creation)
}
```
**Indexes:**
- `{ mobile: 1 }`: Fast lookup index
- `{ expiresAt: 1 }`: MongoDB TTL index (`expireAfterSeconds: 0`) for automatic background purging

---

### 1.3 `refreshtokens` Collection
Tracks refresh token sessions, rotation lineages, and replay prevention.

```typescript
interface IRefreshToken {
  tokenHash: string;                  // SHA-256 hash of the generated refresh token
  userId: mongoose.Types.ObjectId;    // Foreign key -> users._id
  familyId: string;                   // UUID grouping tokens across successive rotations
  isRevoked: boolean;                 // Set to true upon rotation or explicit logout
  expiresAt: Date;                    // Expiration timestamp (7 days)
}
```
**Indexes:**
- `{ tokenHash: 1 }`: Unique lookup index
- `{ userId: 1 }`: Index for revoking all sessions for a compromised user
- `{ familyId: 1 }`: Group index for lineage invalidation during replay attacks
- `{ expiresAt: 1 }`: MongoDB TTL index (`expireAfterSeconds: 0`)

---

### 1.4 `drafts` Collection
Stores legal drafts, extracted facts, version history, and generation metadata.

```typescript
interface IDraft {
  userId: mongoose.Types.ObjectId;    // Owner identity (IDOR boundary)
  title: string;
  documentType: string;               // e.g., 'bail_application', 'legal_notice', 'slp'
  content: string;                    // Full markdown or formatted legal draft
  facts?: Record<string, any>;        // Structured facts extracted by AI service
  metadata?: Record<string, any>;     // Court, parties, jurisdiction, citations
  version: number;                    // Incrementing version counter
  status: 'drafting' | 'reviewing' | 'verified' | 'finalized';
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes:**
- `{ userId: 1, updatedAt: -1 }`: Compound index for efficient user document sorting
- `{ userId: 1, documentType: 1 }`: Compound index for category filtering

---

### 1.5 `cases` Collection
Maintains litigation matters, court dockets, and calendar hearings.

```typescript
interface ICase {
  userId: mongoose.Types.ObjectId;    // Managing advocate / user ID
  caseNumber: string;                 // e.g., "CRL.A. 142/2026"
  title: string;                      // "State vs. Vikram Singh"
  court: string;                      // "High Court of Delhi"
  judge?: string;
  clientId?: mongoose.Types.ObjectId; // Foreign key -> clients._id
  opposingParty?: string;
  opposingCounsel?: string;
  status: 'active' | 'pending' | 'disposed' | 'appealed';
  filingDate?: Date;
  nextHearingDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes:**
- `{ userId: 1, status: 1 }`: Fast lookup for active case dockets
- `{ userId: 1, caseNumber: 1 }`: Quick retrieval by court filing number

---

### 1.6 `clients` Collection
Stores client contact records and matter associations.

```typescript
interface IClient {
  userId: mongoose.Types.ObjectId;    // Advocate / firm owner
  name: string;
  email?: string;
  phone: string;
  address?: string;
  matter?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes:**
- `{ userId: 1, name: 1 }`: Compound index for client search

---

### 1.7 `documents` Collection
Tracks uploaded case files, evidence, and contracts.

```typescript
interface IDocument {
  userId: mongoose.Types.ObjectId;    // Uploader identity
  originalName: string;               // e.g. "Rental_Agreement.pdf"
  storageKey: string;                 // Sanitized UUID key: doc_<uuid>.pdf
  mimeType: string;                   // 'application/pdf' | 'application/vnd.openxmlformats...'
  size: number;                       // Bytes (Max: 26,214,400)
  checksum?: string;                  // SHA-256 hash of file contents for verification
  extractedText?: string;             // Parsed text corpus for AI review
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes:**
- `{ userId: 1, createdAt: -1 }`: Compound index for recent document queries

---

## 2. Multi-Tenancy & Data Isolation Model

DraftMate AI enforces a single-database multi-tenant design using logical isolation:

1. **Owner Binding:** Every resource schema (`Draft`, `Case`, `Client`, `Document`, `Event`, `Note`) includes `userId: mongoose.Types.ObjectId` referencing the authenticated user.
2. **Mandatory Query Scoping:** All database queries (`find`, `findOne`, `findOneAndUpdate`, `deleteOne`) are explicitly bound to the caller's JWT:
   ```typescript
   // Guaranteed IDOR-safe pattern
   const record = await Draft.findOne({ _id: req.params.id, userId: req.user._id });
   if (!record) {
     return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
   }
   ```
3. **No Blind Trust:** Client-supplied fields like `ownerUserId`, `userId`, `firmId`, or `role` in HTTP request bodies are rejected or overwritten with server-authenticated context.
4. **Firm Multi-Tenancy Ready:** Schemas support optional `firmId: ObjectId` fields allowing collaborative access across law firm members with role-based checks.
