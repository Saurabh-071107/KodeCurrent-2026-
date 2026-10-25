# DraftMate AI

AI-powered legal document drafting service. Extracts structured facts from legal problem descriptions and generates initial legal document drafts with document intelligence and RAG capabilities.

## Features

- **Fact Extraction** (`POST /facts`): Analyze legal problem descriptions and extract structured facts, parties, dates, missing information, contradictions, and follow-up questions
- **Document Drafting** (`POST /draft`): Generate legal documents (notices, letters, agreements, demand letters, cease & desist) from extracted facts
- **Document Intelligence** (`POST /documents/upload`, `GET /documents`, `POST /retrieve`): Upload, parse, chunk, and retrieve legal documents (PDF, DOCX, TXT)
- **Evidence-Grounded Drafting** (`POST /draft/evidence-grounded`): Generate documents that cite and use uploaded document evidence with source references
- **Document Review** (`POST /review`): Analyze drafts for ambiguous language, contradictions, missing information, inconsistencies, unsupported claims, and missing clauses
- **Citation Verification** (`POST /citations/verify`): Extract and verify legal citations against authoritative sources with statuses (VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED, NOT_CHECKED)
- **Precise Redlining** (`POST /redline`, `POST /redline/{id}/decisions`, `GET /redline/{id}/preview`): Generate structured INSERT/DELETE/REPLACE operations with user accept/reject workflow
- **Style Adaptation** (`POST /style/extract`, `POST /style/apply`): Extract style profiles from reference documents and apply formatting to drafts
- **Document Export** (`POST /export`, `GET /exports/download/{filename}`): Export drafts to DOCX (always) and PDF (via LibreOffice)
- **Voice Agent** (`POST /voice/command`, `POST /voice/configure`): Voice-driven document interaction with STT/TTS
- **Multi-Provider LLM Support**: Gemini, OpenAI, Anthropic, OpenRouter (OpenAI-compatible)
- **Health Monitoring**: Service and LLM provider health checks
- **Structured Logging**: JSON-formatted logs without sensitive data
- **Comprehensive Testing**: Unit and integration tests with mocked LLM calls

## Quick Start

### Prerequisites

- Python 3.11+
- An LLM API key (Gemini, OpenAI, Anthropic, or OpenRouter)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd draftmate_ai

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# At minimum, set LLM_API_KEY and LLM_MODEL
```

### Configure API Keys

#### Google Gemini (Recommended for Free Tier)
1. Get API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Set in `.env`:
   ```env
   LLM_PROVIDER=gemini
   LLM_API_KEY=your-gemini-api-key
   LLM_MODEL=gemini-1.5-flash
   ```

#### OpenAI
1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set in `.env`:
   ```env
   LLM_PROVIDER=openai
   LLM_API_KEY=your-openai-api-key
   LLM_MODEL=gpt-4o-mini
   ```

#### Anthropic
1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Set in `.env`:
   ```env
   LLM_PROVIDER=anthropic
   LLM_API_KEY=your-anthropic-api-key
   LLM_MODEL=claude-3-5-haiku-20241022
   ```

#### OpenRouter (Access to Multiple Models)
1. Get API key from [OpenRouter](https://openrouter.ai/keys)
2. Set in `.env`:
   ```env
   LLM_PROVIDER=openrouter
   LLM_BASE_URL=https://openrouter.ai/api/v1
   LLM_API_KEY=your-openrouter-api-key
   LLM_MODEL=anthropic/claude-3.5-sonnet
   ```

### Run the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or directly
python -m app.main
```

Server will start at `http://localhost:8000`

- API Documentation: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI Spec: `http://localhost:8000/openapi.json`

### Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_health.py -v

# Run with verbose output
pytest -v --tb=short
```

## API Endpoints

### Health Checks

#### `GET /health`
Basic service health check.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `GET /health/llm`
Check LLM provider connectivity.

**Response:**
```json
[
  {
    "provider": "gemini",
    "model": "gemini-1.5-flash",
    "status": "connected",
    "latency_ms": 150,
    "error": null
  }
]
```

### Fact Extraction

#### `POST /facts`
Extract structured facts from a legal problem description.

**Request:**
```json
{
  "problem_description": "My landlord has not returned my security deposit of $2,000 after I moved out on January 15, 2024...",
  "document_type": "demand_letter",
  "jurisdiction": "us_ca",
  "parties": [
    {"name": "John Doe", "role": "sender", "address": "123 Main St, San Francisco, CA"},
    {"name": "ABC Property Management", "role": "recipient", "address": "456 Market St, San Francisco, CA"}
  ],
  "important_dates": [
    {"date": "2024-01-15", "description": "Move-out date", "is_approximate": false}
  ],
  "objective": "Recover security deposit of $2,000 plus any statutory penalties",
  "context": "California law requires return within 21 days with itemized deductions"
}
```

**Response:**
```json
{
  "user_provided_facts": [
    {"fact": "Security deposit amount is $2,000", "source_text": "security deposit of $2,000", "confidence": 1.0, "is_assumption": false}
  ],
  "inferred_facts": [
    {"fact": "California 21-day statutory deadline has passed", "source_text": "45 days have passed", "confidence": 0.9, "is_assumption": true}
  ],
  "parties_and_roles": [
    {"name": "John Doe", "role": "sender", "confidence": 1.0, "reasoning": "User identifies as tenant sending demand"}
  ],
  "important_dates": [
    {"date": "2024-01-15", "description": "Move-out date", "is_approximate": false}
  ],
  "desired_outcome": "Recover security deposit of $2,000 plus any statutory penalties",
  "missing_information": ["Exact lease start and end dates", "Photos of apartment condition"],
  "contradictions": [],
  "follow_up_questions": ["Do you have photos or a move-out inspection report?"],
  "assumptions": ["California law applies", "No legitimate deductions were made"],
  "uncertainties": ["Whether landlord made any deductions"]
}
```

### Document Management

#### `POST /documents/upload`
Upload and process a document (PDF, DOCX, or TXT).

**Request:** Multipart form with file field.

**Response:**
```json
{
  "id": "uuid",
  "filename": "contract.pdf",
  "file_type": "pdf",
  "file_size": 12345,
  "upload_timestamp": "2024-01-15T10:30:00Z",
  "extraction_status": "completed",
  "extraction_error": null,
  "metadata": {"page_count": 5, "parsed_metadata": {...}},
  "chunk_count": 12
}
```

#### `GET /documents`
List uploaded documents with optional filtering.

**Query Parameters:** `limit`, `offset`, `status_filter`

#### `GET /documents/{document_id}`
Get document details by ID.

#### `DELETE /documents/{document_id}`
Delete a document and its chunks.

### Retrieval

#### `POST /retrieve`
Search uploaded documents for relevant passages using hybrid keyword + embedding search.

**Request:**
```json
{
  "query": "security deposit dispute",
  "document_ids": ["doc-uuid-1", "doc-uuid-2"],
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "chunk_id": "chunk-uuid",
      "document_id": "doc-uuid",
      "text": "The security deposit of $2,000 was not returned...",
      "score": 0.85,
      "source_filename": "lease_agreement.pdf",
      "page_number": 3,
      "file_type": "pdf",
      "metadata": {...}
    }
  ],
  "query": "security deposit dispute",
  "total_results": 5
}
```

### Document Drafting

#### `POST /draft`
Generate a legal document from extracted facts.

**Request:**
```json
{
  "document_type": "demand_letter",
  "facts": { ...fact_extraction_response... },
  "jurisdiction": "us_ca",
  "custom_instructions": "Tone should be firm but professional. Reference California Civil Code 1950.5 as placeholder."
}
```

#### `POST /draft/evidence-grounded`
Generate a legal document grounded in uploaded document evidence.

**Request:**
```json
{
  "document_type": "demand_letter",
  "facts": { ...fact_extraction_response... },
  "query": "security deposit evidence",
  "jurisdiction": "us_ca",
  "document_ids": ["doc-uuid-1"],
  "custom_instructions": "Cite specific lease clauses",
  "max_evidence_chunks": 8
}
```

**Response:**
```json
{
  "draft": { ...draft_response... },
  "evidence_used": [
    {
      "chunk_id": "chunk-uuid",
      "document_id": "doc-uuid",
      "text": "The security deposit of $2,000...",
      "score": 0.85,
      "source_filename": "lease_agreement.pdf",
      "page_number": 3,
      "file_type": "pdf",
      "metadata": {...}
    }
  ],
  "evidence_excerpts": [
    {
      "source_id": 1,
      "chunk_id": "chunk-uuid",
      "document_id": "doc-uuid",
      "source_filename": "lease_agreement.pdf",
      "page_number": 3,
      "excerpt": "The security deposit of $2,000...",
      "score": 0.85
    }
  ],
  "warnings": ["Limited evidence found; draft may require additional supporting documents."],
  "insufficient_evidence": false
}
```

### Document Review

#### `POST /review`
Analyze a legal document draft for issues.

**Request:**
```json
{
  "draft": { ...draft_response... },
  "facts": { ...fact_extraction_response... },
  "jurisdiction": "us_ca",
  "document_ids": ["doc-uuid-1"],
  "custom_checks": ["Check for specific lease terms"]
}
```

**Response:**
```json
{
  "findings": [
    {
      "finding_id": "review_abc123",
      "category": "unresolved_placeholder",
      "severity": "high",
      "location": "Section 'Header', Paragraph 1",
      "description": "Unresolved placeholder [DATE] in header",
      "suggested_correction": "Replace with actual date from facts",
      "evidence_ids": [],
      "related_finding_ids": [],
      "uncertainty": null,
      "confidence": 0.95
    },
    {
      "finding_id": "review_def456",
      "category": "inconsistent_party",
      "severity": "medium",
      "location": "Section 'Parties'",
      "description": "Party name 'John Doe' differs from facts 'Jane Doe'",
      "suggested_correction": "Use consistent party name from facts",
      "evidence_ids": [],
      "related_finding_ids": [],
      "uncertainty": "May be intentional if referring to different person",
      "confidence": 0.8
    }
  ],
  "summary": {
    "total_findings": 2,
    "by_category": {"unresolved_placeholder": 1, "inconsistent_party": 1},
    "by_severity": {"high": 1, "medium": 1}
  },
  "document_hash": "a1b2c3d4e5f6"
}
```

### Citation Verification

#### `POST /citations/verify`
Extract and verify legal citations in a draft.

**Request:**
```json
{
  "draft": { ...draft_response... },
  "jurisdiction": "us_ca",
  "citation_ids": ["cite_abc123"]
}
```

**Response:**
```json
{
  "results": [
    {
      "citation_id": "cite_abc123",
      "status": "not_checked",
      "sources": [],
      "supports_proposition": null,
      "current_status_checked": false,
      "notes": "No authoritative source integration configured. Citation verification requires integration with legal databases (e.g., CourtListener, Caselaw Access Project, LexisNexis, Westlaw, or official government APIs).",
      "checked_at": "2024-01-15T10:30:00Z"
    }
  ],
  "summary": {"not_checked": 1},
  "sources_configured": false
}
```

**Citation Verification Statuses:**
- `VERIFIED` - Authority exists, supports proposition, current status confirmed
- `PARTIALLY_VERIFIED` - Authority exists but only partially supports proposition OR status not fully confirmed
- `UNVERIFIED` - Authority exists but does not support proposition OR cannot be located
- `NOT_CHECKED` - No source integration configured or unable to check

The system never invents citations, URLs, source results, or verification claims. If no authoritative source integration is configured, it returns `NOT_CHECKED` with a clear reason.

### Redlining

#### `POST /redline`
Generate precise redline edit proposals (INSERT, DELETE, REPLACE) for a draft.

**Request:**
```json
{
  "draft": { ...draft_response... },
  "review_response": { ...review_response... },
  "facts": { ...fact_extraction_response... },
  "jurisdiction": "us_ca",
  "max_operations": 20
}
```

**Response:**
```json
{
  "operations": [
    {
      "operation_id": "redline_abc123",
      "operation_type": "replace",
      "target_location": "Section 'Header', Paragraph 1",
      "original_text": "[DATE]",
      "proposed_text": "January 15, 2024",
      "explanation": "Resolve placeholder with actual date from facts",
      "risk_level": "low",
      "related_finding_ids": ["review_abc123"],
      "evidence_ids": [],
      "depends_on": []
    }
  ],
  "document_hash": "a1b2c3d4e5f6"
}
```

#### `POST /redline/{document_id}/decisions`
Accept or reject redline operations.

**Request:**
```json
{
  "document_hash": "a1b2c3d4e5f6",
  "decisions": [
    {"operation_id": "redline_abc123", "accepted": true},
    {"operation_id": "redline_def456", "accepted": false}
  ]
}
```

**Response:**
```json
{
  "applied_operations": ["redline_abc123"],
  "rejected_operations": ["redline_def456"],
  "conflicts": [],
  "updated_draft": { ...draft_response... },
  "new_document_hash": "f6e5d4c3b2a1"
}
```

#### `GET /redline/{document_id}/preview`
Preview the document with accepted redline changes applied.

**Response:**
```json
{
  "original_draft": { ...draft_response... },
  "preview_draft": { ...draft_response... },
  "changes_summary": [
    {
      "operation_id": "redline_abc123",
      "type": "replace",
      "location": "Section 'Header', Paragraph 1",
      "explanation": "Resolve placeholder with actual date from facts"
    }
  ]
}
```

## Supported Document Types

| Type | Description | Typical Use Case |
|------|-------------|------------------|
| `legal_notice` | Formal legal notice | Contract breach notification, lease violations |
| `formal_letter` | Professional correspondence | General legal communication |
| `agreement` | Contract/agreement | Service agreements, NDAs, licenses |
| `demand_letter` | Demand for payment/action | Debt collection, security deposits, damages |
| `cease_desist` | Cease and desist letter | IP infringement, harassment, defamation |

## Supported Jurisdictions

- `us_federal` - US Federal
- `us_ca` - California
- `us_ny` - New York
- `us_tx` - Texas
- `uk` - United Kingdom
- `ca` - Canada
- `au` - Australia
- `other` - Other (specify in context)

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_PROVIDER` | Yes | `gemini` | Provider: gemini, openai, anthropic, openrouter, custom |
| `LLM_BASE_URL` | No | Provider default | Custom API base URL |
| `LLM_API_KEY` | Yes | - | API key for provider |
| `LLM_MODEL` | Yes | - | Model identifier |
| `LLM_TIMEOUT` | No | `30` | Request timeout in seconds |
| `LLM_MAX_RETRIES` | No | `3` | Maximum retry attempts |
| `EMBEDDING_PROVIDER` | No | `local` | Embedding provider: local (sentence-transformers), openai, gemini, openrouter |
| `EMBEDDING_MODEL` | No | `all-MiniLM-L6-v2` | Embedding model identifier |
| `EMBEDDING_BASE_URL` | No | - | Embedding API base URL |
| `EMBEDDING_API_KEY` | No | - | Embedding API key |
| `DOCUMENT_UPLOAD_DIR` | No | `./uploads` | Directory for uploaded files |
| `DOCUMENT_MAX_FILE_SIZE_MB` | No | `50` | Maximum file size in MB |
| `DOCUMENT_ALLOWED_EXTENSIONS` | No | `.pdf,.docx,.txt` | Allowed file extensions |
| `DOCUMENT_CHUNK_SIZE` | No | `500` | Chunk size in characters |
| `DOCUMENT_CHUNK_OVERLAP` | No | `100` | Chunk overlap in characters |
| `DOCUMENT_RETRIEVAL_LIMIT` | No | `10` | Maximum retrieval results |
| `HOST` | No | `0.0.0.0` | Server host |
| `PORT` | No | `8000` | Server port |
| `LOG_LEVEL` | No | `INFO` | Log level |

### Secondary Provider (Optional)

Configure a fallback provider:
```env
LLM_PROVIDER_SECONDARY=openai
LLM_BASE_URL_SECONDARY=
LLM_API_KEY_SECONDARY=your-openai-key
LLM_MODEL_SECONDARY=gpt-4o-mini
```

## Architecture

```
app/
├── main.py                    # FastAPI application entry point
├── config.py                  # Configuration management
├── schemas.py                 # Pydantic request/response models
├── core/
│   ├── model_router.py        # LLM provider adapters and routing
│   ├── prompts.py             # System prompts for fact extraction and drafting
│   └── storage.py             # SQLite-backed document metadata store
└── features/
    ├── fact_extraction.py     # Fact extraction logic
    ├── drafting.py            # Document drafting logic
    ├── document_parsing.py    # PDF/DOCX/TXT parsing
    ├── chunking.py            # Document chunking
    ├── retrieval.py           # Keyword/embedding retrieval
    ├── document_management.py # Document upload, listing, deletion
    ├── evidence_drafting.py   # Evidence-grounded drafting
    ├── review.py              # Document review logic
    ├── citation_verification.py # Citation extraction and verification
    ├── redlining.py           # Redline generation and decisions
    └── retriever_instance.py  # Global retriever instance
tests/
├── conftest.py                # Test fixtures
├── fixtures.py                # Sample data
├── test_health.py             # Health endpoint tests
├── test_fact_extraction.py    # Fact extraction tests
├── test_drafting.py           # Drafting tests
├── test_model_router.py       # Model router tests
├── test_schemas.py            # Schema validation tests
├── test_document_management.py # Document management tests
└── test_chunk3.py             # Review, citation, redlining tests
```

## Key Design Principles

1. **No Fabrication**: LLM never invents facts, names, dates, statutes, or citations
2. **Explicit Assumptions**: All assumptions are clearly marked and separated from facts
3. **Placeholders for Gaps**: Missing information uses clear placeholders like `[PROPERTY_ADDRESS]`
4. **Provider Agnostic**: Swap LLM providers without code changes
5. **Safe Logging**: No secrets or sensitive document content in logs
6. **Legal Disclaimer**: Every draft includes prominent disclaimer

## Known Limitations

- **Scanned PDFs**: OCR is not implemented. Scanned/image-based PDFs will not extract text. Extension point exists for future OCR integration.
- **Embedding Dependencies**: Optional `sentence-transformers` requires PyTorch (~120MB). Keyword-only (BM25) retrieval works without it.
- **Single-User Database**: SQLite database is file-based and not suitable for concurrent multi-user production use.
- **No Document Versioning**: Uploading the same document creates a new entry; no version control.
- **In-Memory Chunk Store**: Chunks are stored in memory; restart loses index (rebuilt on startup from documents).
- **No Authentication/Authorization**: Add auth layer for production use.
- **File Size Limits**: Default 50MB; large documents may need chunked upload.
- **English-Only Embeddings**: Default `all-MiniLM-L6-v2` model is English-optimized.
- **Citation Verification**: No authoritative legal source integration by default. Returns `NOT_CHECKED` unless a custom adapter is provided (e.g., CourtListener, Caselaw Access Project, LexisNexis, Westlaw, official government APIs).
- **Redlining Preview**: Current preview applies changes to full text; fine-grained paragraph-level diffs are not yet implemented.
- **Review Re-run**: Automatic review re-run after accepted redline edits is not yet implemented in this phase.
- **LLM Opinions Not Legal Advice**: Review findings and redline suggestions are AI-generated analysis, not legal verification.

## Development

### Code Quality

```bash
# Format code
black app tests

# Type check
mypy app

# Lint
ruff check app tests
```

### Adding a New Provider

1. Create new adapter class in `app/core/model_router.py` inheriting from `LLMAdapter`
2. Implement abstract methods: `provider_name`, `_build_request`, `_parse_response`, `_get_headers`, `_get_endpoint`
3. Register in `create_adapter()` factory function
4. Add tests in `tests/test_model_router.py`

## Security Considerations

- **Never commit `.env`** - Already in `.gitignore`
- **API keys** - Only loaded from environment, never logged
- **Input validation** - All requests validated via Pydantic
- **Request limits** - Configure via reverse proxy in production
- **CORS** - Currently allows all origins; restrict in production

## Disclaimer

> **This service generates AI-assisted legal document drafts for informational purposes only. It does not constitute legal advice, create an attorney-client relationship, or replace consultation with a qualified attorney. Always have generated documents reviewed by licensed legal counsel before use.**

## License

Proprietary - Internal use only.