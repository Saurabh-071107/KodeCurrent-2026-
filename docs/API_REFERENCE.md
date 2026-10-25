# DraftMate AI — REST API Reference Manual

**API Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api/v1` (Development) / `https://api.draftmate.ai/api/v1` (Production)  
**Protocol:** REST over HTTPS  
**Authentication Scheme:** HTTP Bearer JSON Web Token (`Authorization: Bearer <accessToken>`)

---

## 1. Authentication & Session Endpoints (`/auth`)

### 1.1 Request One-Time Password (OTP)
Initiates a cryptographic OTP challenge sent via SMS or returned in test mode.
- **Route:** `POST /api/v1/auth/request-otp`
- **Access:** Public (Rate-limited: 60s cooldown per identifier)
- **Request Body:**
  ```json
  {
    "mobile": "+919876543210"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "message": "OTP sent successfully",
      "mobile": "+919876543210",
      "cooldown": 60
    }
    ```
  - `429 Too Many Requests`: Resend attempted within 60-second cooldown.
  - `423 Locked`: Too many failed attempts (exceeded 5 attempts).

### 1.2 Verify OTP
Verifies the cryptographic hash of the OTP and issues initial session credentials.
- **Route:** `POST /api/v1/auth/verify-otp`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "mobile": "+919876543210",
    "otp": "839201"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "message": "OTP verified successfully",
      "user": {
        "id": "671ad49b8c0e21a4f091ab10",
        "mobile": "+919876543210",
        "role": "advocate",
        "isOnboarded": true
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "refreshToken": "7c9f80a9e1..."
    }
    ```
  - `400 Bad Request`: Invalid or expired OTP.
  - `423 Locked`: Maximum failed verification attempts reached.

### 1.3 User Registration
Registers a new user with standard credentials.
- **Route:** `POST /api/v1/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "fullName": "Adv. Rajesh Sharma",
    "email": "rajesh.sharma@example.com",
    "mobile": "+919876543210",
    "password": "StrongPassword123!",
    "role": "advocate"
  }
  ```
- **Responses:**
  - `201 Created`: User created and tokens issued.
  - `400 Bad Request`: Email/Mobile already registered or disallowed role escalation.

### 1.4 User Login
Authenticates existing user with password credentials.
- **Route:** `POST /api/v1/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "rajesh.sharma@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Responses:**
  - `200 OK`: Returns user profile, `accessToken`, and `refreshToken`.
  - `401 Unauthorized`: Invalid credentials.

### 1.5 Rotate Refresh Token
Rotates an existing refresh token for a fresh token pair. Employs replay attack protection.
- **Route:** `POST /api/v1/auth/refresh-token`
- **Access:** Public (Requires valid Refresh Token in header)
- **Headers:** `x-refresh-token: <refreshToken>` or Body `{ "refreshToken": "<token>" }`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "refreshToken": "new_hex_token_string..."
    }
    ```
  - `403 Forbidden`: Token revoked or replay attack detected (entire session family invalidated).

### 1.6 User Logout
Revokes the active refresh token.
- **Route:** `POST /api/v1/auth/logout`
- **Access:** Authenticated (Bearer Token)
- **Responses:**
  - `200 OK`: `{ "message": "Successfully logged out" }`

### 1.7 Onboarding Completion
Updates user profile and role-specific details. Identity is strictly derived from the JWT (`req.user._id`).
- **Route:** `POST /api/v1/auth/onboarding`
- **Access:** Authenticated (Bearer Token)
- **Request Body:**
  ```json
  {
    "role": "advocate",
    "fullName": "Adv. Rajesh Sharma",
    "barRegistrationNumber": "D/1429/2015",
    "experienceYears": 9,
    "specializations": ["Criminal", "Constitutional"],
    "jurisdiction": "High Court of Delhi"
  }
  ```
- **Responses:**
  - `200 OK`: Updated user profile with `isOnboarded: true`.

---

## 2. Core Legal Drafting Endpoints (`/drafts`)

### 2.1 List User Drafts
- **Route:** `GET /api/v1/drafts`
- **Access:** Authenticated (Bearer Token)
- **Query Params:** `page` (default: 1), `limit` (default: 20), `status` (optional)
- **Response:**
  ```json
  {
    "drafts": [
      {
        "_id": "671ad49b8c0e21a4f091ab25",
        "title": "Bail Application - Section 437 CrPC",
        "documentType": "bail_application",
        "status": "ready",
        "version": 1,
        "createdAt": "2026-10-25T08:00:00Z",
        "updatedAt": "2026-10-25T08:30:00Z"
      }
    ],
    "total": 1
  }
  ```

### 2.2 Create Draft
- **Route:** `POST /api/v1/drafts`
- **Access:** Authenticated (Bearer Token)
- **Request Body:**
  ```json
  {
    "title": "Special Leave Petition (Civil)",
    "documentType": "slp_civil",
    "content": "IN THE SUPREME COURT OF INDIA...",
    "facts": { "parties": ["Petitioner A", "Respondent B"] },
    "metadata": { "court": "Supreme Court of India" }
  }
  ```
- **Response `201 Created`**: Returns created `Draft` object scoped to `req.user._id`.

### 2.3 Get Draft By ID
- **Route:** `GET /api/v1/drafts/:id`
- **Access:** Authenticated (Bearer Token)
- **Response `200 OK`**: Returns draft details if owner matches `req.user._id`.
- **Response `404 Not Found`**: Returned if draft does not exist or belongs to another user (IDOR prevention).

### 2.4 Update Draft
- **Route:** `PUT /api/v1/drafts/:id`
- **Access:** Authenticated (Bearer Token)
- **Request Body:** `{ "content": "Updated legal text...", "title": "Revised SLP" }`
- **Response `200 OK`**: Returns updated draft with incremented version.

### 2.5 Delete Draft
- **Route:** `DELETE /api/v1/drafts/:id`
- **Access:** Authenticated (Bearer Token)
- **Response `200 OK`**: `{ "message": "Draft deleted successfully" }`

### 2.6 Export Draft
- **Route:** `GET /api/v1/drafts/:id/export`
- **Access:** Authenticated (Bearer Token)
- **Query Params:** `format=pdf` or `format=docx`
- **Response:** File attachment stream (`Content-Type: application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).

---

## 3. Case & Client Management (`/cases`, `/clients`)

### 3.1 Cases API
- `GET /api/v1/cases`: List authorized cases for authenticated user.
- `POST /api/v1/cases`: Create case record with case number, court, client ID, status.
- `GET /api/v1/cases/:id`: Retrieve single case with IDOR ownership validation.
- `PUT /api/v1/cases/:id`: Update case status, hearing dates, notes.
- `DELETE /api/v1/cases/:id`: Archive or delete case.

### 3.2 Clients API
- `GET /api/v1/clients`: List clients owned by authenticated user.
- `POST /api/v1/clients`: Register client contact details and matter description.
- `GET /api/v1/clients/:id`: Retrieve client record.
- `PUT /api/v1/clients/:id`: Update client record.
- `DELETE /api/v1/clients/:id`: Delete client record.

---

## 4. Document Management (`/documents`)

### 4.1 Upload Document
- **Route:** `POST /api/v1/documents/upload`
- **Access:** Authenticated (Bearer Token)
- **Content-Type:** `multipart/form-data`
- **Form Field:** `file` (Max 25 MB; Allowed: `.pdf`, `.docx`, `.txt`)
- **Responses:**
  - `201 Created`:
    ```json
    {
      "message": "File uploaded successfully",
      "document": {
        "id": "671ad49b8c0e21a4f091ab99",
        "originalName": "FIR_Copy_Crime_102.pdf",
        "storageKey": "doc_e3a9c7b2-70b9-44f2-9ad1-9ef0d65b1c09.pdf",
        "mimeType": "application/pdf",
        "size": 1845209,
        "status": "ready"
      }
    }
    ```
  - `400 Bad Request`: Disallowed file type or path traversal detected.
  - `413 Payload Too Large`: File exceeds 25 MB.

---

## 5. AI Service Gateway (`/ai`)

All AI operations proxy securely to the FastAPI AI service with input sanitization and response validation.

### 5.1 Fact Extraction
- **Route:** `POST /api/v1/ai/extract-facts`
- **Request Body:**
  ```json
  {
    "documentText": "FIR registered on 12/04/2026 alleging breach of contract between...",
    "extractionType": "criminal"
  }
  ```
- **Response `200 OK`**: Structured entities, timeline, key allegations, statutory provisions identified.

### 5.2 Evidence-Grounded Drafting
- **Route:** `POST /api/v1/ai/generate-draft`
- **Request Body:**
  ```json
  {
    "templateType": "bail_application",
    "facts": {
      "parties": { "petitioner": "Vikram Singh", "respondent": "State of NCT Delhi" },
      "allegations": ["IPC Section 420"],
      "grounds": ["Lack of criminal antecedents", "Cooperation with investigation"]
    },
    "jurisdiction": "High Court of Delhi"
  }
  ```
- **Response `200 OK`**: Evidence-grounded draft with verified statutory citations.

### 5.3 Citation Verification
- **Route:** `POST /api/v1/ai/verify-citations`
- **Request Body:**
  ```json
  {
    "text": "As held in Arnesh Kumar v. State of Bihar (2014) 8 SCC 273..."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "citations": [
      {
        "citation": "(2014) 8 SCC 273",
        "caseName": "Arnesh Kumar v. State of Bihar",
        "status": "verified",
        "court": "Supreme Court of India",
        "bench": "Chandramauli Kr. Prasad, Pinaki Chandra Ghose",
        "holding": "Directions issued regarding arrest under Section 498-A IPC"
      }
    ]
  }
  ```

---

## 6. Standard Error Format

All error responses adhere to the unified JSON error specification:

```json
{
  "error": {
    "code": "UNAUTHORIZED | VALIDATION_ERROR | FORBIDDEN | NOT_FOUND | RATE_LIMITED | INTERNAL_ERROR",
    "message": "Human-readable explanation of error condition",
    "requestId": "req_8f10b8e2-04b1-419b-a320-b3e1c09e8432"
  }
}
```
