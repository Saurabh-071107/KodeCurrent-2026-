# DraftMate AI — Python FastAPI Service Integration Specification

**Reference Document:** `docs/AI_SERVICE_INTEGRATION.md`  
**Backend Client:** `backend/src/services/aiClient.ts`  
**Python Service Entry Point:** `draftmate-ai/app/main.py`  
**Pydantic Engine:** Pydantic v2  
**Service Endpoint Default:** `http://localhost:8000`

---

## 1. Architectural Overview

DraftMate AI decouples identity, persistence, and session management (Node.js) from intensive NLP, vector retrieval, and LLM inference (Python FastAPI). The Node.js backend acts as a trusted gateway to the Python AI service:
- Client browsers **never** communicate directly with the Python AI microservice.
- Node.js validates and sanitizes incoming user requests before dispatching them to FastAPI.
- Node.js validates FastAPI responses before persisting them to MongoDB Atlas or returning them to the Next.js client.

```
[ Frontend: Next.js ] ──HTTP/JWT──▶ [ Gateway: Express 5 ] ──Internal HTTP──▶ [ AI: FastAPI ]
                                           │                                        │
                                           ▼                                        ▼
                                   [ MongoDB Atlas ]                        [ Vector DB / LLM ]
```

---

## 2. Pydantic v2 Schema Contracts

### 2.1 Fact Extraction (`/api/v1/extract-facts`)
Extracts structured facts, party names, chronological dates, and statutory sections from narrative legal text.

**FastAPI Request Model (`FactExtractionRequest`):**
```python
class FactExtractionRequest(BaseModel):
    document_text: str
    extraction_type: Optional[str] = "general"
```

**FastAPI Response Model (`FactExtractionResponse`):**
```python
class FactExtractionResponse(BaseModel):
    case_type: Optional[str] = None
    parties: Dict[str, Any] = Field(default_factory=dict)
    key_dates: List[Dict[str, str]] = Field(default_factory=list)
    allegations: List[str] = Field(default_factory=list)
    statutory_provisions: List[str] = Field(default_factory=list)
    financial_claims: List[Dict[str, Any]] = Field(default_factory=list)
    summary: str
```

### 2.2 Evidence-Grounded Legal Drafting (`/api/v1/generate-draft`)
Synthesizes legally grounded pleadings and contracts. **Requires a valid structured `FactExtractionResponse` object in `facts`.**

**FastAPI Request Model (`DraftRequest`):**
```python
class DraftRequest(BaseModel):
    template_type: str
    facts: FactExtractionResponse
    jurisdiction: Optional[str] = "High Court of Delhi"
    custom_instructions: Optional[str] = None
```

**FastAPI Response Model (`DraftResponse`):**
```python
class DraftResponse(BaseModel):
    draft_title: str
    content: str
    citations_included: List[str]
    suggested_amendments: List[str]
    metadata: Dict[str, Any]
```

### 2.3 Citation Verification (`/api/v1/verify-citations`)
Verifies extracted authorities against statutory law and Supreme Court case holdings.

**FastAPI Request Model (`CitationVerificationRequest`):**
```python
class CitationVerificationRequest(BaseModel):
    text: str
    jurisdiction: Optional[str] = "India"
```

**FastAPI Response Model (`CitationVerificationResponse`):**
```python
class CitationRecord(BaseModel):
    raw_citation: str
    case_title: Optional[str] = None
    canonical_citation: Optional[str] = None
    court: Optional[str] = None
    bench: Optional[str] = None
    year: Optional[int] = None
    is_verified: bool
    status: str  # "verified", "mismatched", "not_found", "overruled"
    holding_summary: Optional[str] = None

class CitationVerificationResponse(BaseModel):
    verified_count: int
    unverified_count: int
    results: List[CitationRecord]
```

### 2.4 Legal Document Review & Redlining (`/api/v1/review-document`)
Analyzes contracts and documents for liabilities, non-standard clauses, and legal risks.

**FastAPI Request Model (`ReviewRequest`):**
```python
class ReviewRequest(BaseModel):
    document_text: str
    contract_type: Optional[str] = "commercial"
```

**FastAPI Response Model (`ReviewResponse`):**
```python
class RiskItem(BaseModel):
    clause: str
    risk_level: str  # "high", "medium", "low"
    explanation: str
    recommended_amendment: str

class ReviewResponse(BaseModel):
    overall_score: int
    critical_risks: int
    findings: List[RiskItem]
```

---

## 3. Resilience, Timeouts & Error Propagation

### 3.1 Timeout Policies
- Fact Extraction: 30 seconds
- Draft Generation: 60 seconds (due to complex chain-of-thought grounding)
- Citation Verification: 25 seconds
- Document Review: 45 seconds

### 3.2 Error Handling & Fallbacks
1. **Upstream Unavailable (`ECONNREFUSED` / `503`):**  
   Node.js catches connection failures and returns:
   ```json
   {
     "error": {
       "code": "AI_SERVICE_UNAVAILABLE",
       "message": "AI analysis service is temporarily offline. Please try again shortly."
     }
   }
   ```
2. **Schema Inconsistency / Upstream Malformed Response (`502`):**  
   Node.js validates the returned JSON. If mandatory fields are missing, returns an explicit `AI_RESPONSE_INVALID` error rather than passing unvalidated objects to the client.
3. **Zero Fabrication Policy:**  
   If the citation verification service cannot locate a judgment in its vector corpus, it marks `is_verified: false` and `status: "not_found"`. It **never** fabricates citations or holdings.
