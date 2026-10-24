<<<<<<< HEAD
# Multilingual Document Translation & Voiceover Studio

An end-to-end NLP model and pipeline that extracts text from documents (**DOCX, PDF, PPTX, TXT, MD, HTML**), translates it accurately into **five languages**, and generates high-fidelity **AI Voiceovers (MP3)**:

| Code | Language | Script | Native Name | Voiceover Audio |
| :---: | :---: | :---: | :---: | :---: |
| **`hi`** | Hindi | Devanagari | हिन्दी | 🎙️ High Quality MP3 |
| **`mr`** | Marathi | Devanagari | मराठी | 🎙️ High Quality MP3 |
| **`gu`** | Gujarati | Gujarati | ગુજરાતી | 🎙️ High Quality MP3 |
| **`en`** | English | Latin | English | 🎙️ High Quality MP3 |
| **`te`** | Telugu | Telugu | తెలుగు | 🎙️ High Quality MP3 |

---

## 🌟 Key Features

- **Document Ingestion**:
  - **DOCX**: Extracts paragraphs, headings, bullet lists, and tables.
  - **PDF**: PyMuPDF (`fitz`) and `pypdf` extraction preserving layout and sections.
  - **PPTX**: Slides, shapes, notes, and tables.
  - **TXT / MD / HTML / RTF**: Multi-encoding safe reading (`utf-8`, `utf-8-sig`, `cp1252`, `latin-1`).
- **Parallel Multi-Target Translation**:
  - Concurrent multi-threaded translation into all 5 target languages.
  - Intelligent sentence boundary chunking (`.`, `?`, `!`, `।`).
- **AI Voiceover Studio (TTS)**:
  - Natural speech voiceover synthesis for **Hindi, Marathi, Gujarati, English, and Telugu**.
  - Direct in-memory streaming audio bytes or export to `.mp3` files.
- **Multi-Format Export**:
  - Exports translated documents to **DOCX** (with native Indian script typography), **PDF**, **TXT**, and **MP3** voiceovers.
- **Three Interfaces**:
  1. **Python API**: Direct programmatic access via `DocMultilingualModel`.
  2. **CLI**: Fast terminal tool with `--voiceover` support.
  3. **Interactive Web UI**: Modern Streamlit app with embedded audio players, side-by-side comparison, and bulk ZIP download.

---

## 🚀 Quick Start

### 1. Requirements

Install dependencies:
```bash
pip install -r requirements.txt
```

### 2. Python API Usage

```python
from doc_translator import DocMultilingualModel

# Initialize model
model = DocMultilingualModel()

# Translate a document (DOCX, PDF, PPTX, TXT)
result = model.translate_document(
    "annual_report.pdf",
    target_langs=["hi", "mr", "gu", "en", "te"],
    parallel=True
)

# 1. Access translated text
hindi_text = result.get_text("hi")
marathi_text = result.get_text("mr")
gujarati_text = result.get_text("gu")
telugu_text = result.get_text("te")
english_text = result.get_text("en")

# 2. Generate voiceover audio bytes (MP3)
hindi_audio_bytes = result.to_audio_bytes("hi")
telugu_audio_bytes = result.to_audio_bytes("te")

# 3. Save voiceovers and documents to disk
result.save_voiceover("hi", "report_hindi.mp3")
result.save_voiceover("te", "report_telugu.mp3")

# Bulk save all 5 languages in DOCX, PDF, TXT, and MP3 audio
result.save_all(output_dir="./translated_docs", formats=["docx", "pdf", "txt", "mp3"])
```

### 3. Generate Standalone Voiceover for Any Text

```python
from doc_translator import DocMultilingualModel

model = DocMultilingualModel()

# Directly synthesize voiceover for any text and language
audio_data = model.generate_voiceover(
    "नमस्ते, आप कैसे हैं?",
    lang_code="hi",
    output_path="hindi_greeting.mp3"
)
=======
# DraftMate AI — Legal Document Processing, RAG, Contract Review & Citation Verification Engine

DraftMate AI provides an enterprise-grade document processing, structure analysis, hybrid retrieval, evidence-grounded generation, contract review + redlining, and multi-dimensional citation verification engine designed specifically for legal documents, contracts, agreements, statutes, and citations.

The complete codebase implements:
1. **Shared Foundation & Document Processing Engine** (Chunk 1)
2. **Document Review: Document Processing and RAG** (Chunk 2)
3. **Contract Review & Redlining AI Module** (Chunk 3)
4. **Citation Verification & Unified Integration Pipeline** (Chunk 4)

---

## 1. System Architecture

```text
[PDF / DOCX / TXT]
       │
       ▼
┌────────────────────────────────────────┐
│ Document Ingestion & Format Validation │ (Magic bytes, file size, extensions)
└────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Structure Parser & Normalizer          │ (Clauses, headings, tables, NFKC text)
└────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│ Structure-Aware Chunker                │ (Deterministic, clause & heading aware)
└────────────────────────────────────────┘
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
┌────────────────────────┐    ┌────────────────────────┐
│ Dense Vector Index     │    │ BM25 Lexical Index     │
│ (Chroma Persistent DB) │    │ (rank-bm25 Okapi)      │
└────────────────────────┘    └────────────────────────┘
       │                                 │
       └────────────────┬────────────────┘
                        ▼
┌────────────────────────────────────────┐
│ Reciprocal Rank Fusion (RRF)           │ (Weighted rank fusion)
└────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────┐
│ Cross-Encoder Reranker                 │ (Entity matching, clause alignment)
└────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────┐
│ Evidence-Grounded Generation           │ (Prompt injection defense, abstention)
└────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────┐
│ Evidence Validation Engine             │ (Anti-fabrication, verbatim verification)
└────────────────────────────────────────┘
                        │
                        ▼
               Validated RAGResponse
```

---

## 2. Directory Structure

```text
draftmate_ai_1/
├── draftmate_ai/
│   ├── __init__.py
│   ├── shared/
│   │   ├── __init__.py
│   │   ├── configuration.py        # Centralized settings via pydantic-settings
│   │   ├── document_models.py      # ProcessedDocument, StructuralElement, DocumentChunk
│   │   ├── schemas.py              # Ingestion & citation verification DTOs
│   │   ├── provenance.py           # Verification utilities and anti-fabrication
│   │   ├── logging_utils.py        # Structured logging configuration
│   │   └── exceptions.py           # Custom exception hierarchy
│   ├── document_processing/
│   │   ├── __init__.py
│   │   ├── ingestion.py            # Format validation pipeline
│   │   ├── pdf_extractor.py        # PyMuPDF text, table, and layout extractor
│   │   ├── docx_extractor.py       # python-docx parser with styles & page breaks
│   │   ├── text_extractor.py       # Multi-encoding plain text parser
│   │   ├── ocr.py                  # Tesseract OCR engine & scanned detector
│   │   ├── structure_parser.py     # Legal clause regexes & heading heuristics
│   │   └── chunking.py             # Structure-aware deterministic chunker
│   ├── document_rag/
│   │   ├── __init__.py
│   │   ├── schemas.py              # RAGResponse, SourceReference, RetrievedChunk
│   │   ├── embeddings.py           # BaseEmbeddingModel, Deterministic, OpenAI, Gemini
│   │   ├── indexing.py             # Chroma persistent vector store & lifecycle
│   │   ├── query_processing.py     # Clause extraction & acronym expansion
│   │   ├── reranking.py            # Cross-encoder & lexical rerankers
│   │   ├── retrieval.py            # HybridRetriever (Dense + BM25 + RRF)
│   │   ├── generation.py           # GroundedAnswerGenerator with injection defense
│   │   ├── evidence_validation.py  # Zero-fabrication citation verifier
│   │   └── evaluation.py           # Recall@k, Precision@k, MRR, nDCG, Faithfulness
│   ├── contract_review/
│   │   ├── __init__.py
│   │   ├── schemas.py              # Finding, SeverityLevel, RedlineChange, postures
│   │   ├── clause_extraction.py    # Clause hierarchy, 15-category taxonomy & cross-refs
│   │   ├── entity_extraction.py    # Parties, defined terms, monetary & date extraction
│   │   ├── obligation_extraction.py# Covenants, prohibitions, discretionary permissions
│   │   ├── risk_analysis.py        # Liability caps, indemnification, evergreen notices
│   │   ├── issue_detection.py      # Ambiguities, broken refs, missing mandatory terms
│   │   ├── recommendations.py      # Evidence-grounded revisions & posture adjustments
│   │   ├── redlining.py            # Token/word diff, accept/reject, DOCX export
│   │   ├── cross_clause_analysis.py# Contradiction detection & notice period conflicts
│   │   └── evaluation.py           # Precision, Recall, F1, Grounding & benchmark suite
│   ├── citation_verification/
│   │   ├── __init__.py
│   │   ├── schemas.py              # VerificationStatus, 5 dimensions, ExtractedCitation
│   │   ├── citation_patterns.py    # Indian (SCC, AIR, INSC) & statutory regexes
│   │   ├── extraction.py           # Citation & associated proposition extraction
│   │   ├── normalization.py        # Canonical titles, reporters, court mapping
│   │   ├── source_adapters.py      # Local corpus, India Code, SCI, composite adapter
│   │   ├── metadata_verification.py# Case name, year, court, reporter cross-checks
│   │   ├── proposition_support.py  # Source text comparison, contradiction detection
│   │   ├── pinpoint_verification.py# Paragraph & page existence and support validation
│   │   ├── currency_checks.py      # Subsequent treatment & overruling indices
│   │   ├── verification.py         # Multi-dimensional status classification engine
│   │   └── evaluation.py           # Citation evaluation benchmark & anti-fabrication
│   └── integration.py              # Unified DraftMatePipeline combining all 3 modules
├── document_rag/                   # Root-level module alias re-exporting document_rag
├── contract_review/                # Root-level module alias re-exporting contract_review
├── citation_verification/          # Root-level module alias re-exporting citation_verification
├── evaluation/                     # Master benchmark runners across all modules
│   ├── __init__.py
│   └── benchmark_runner.py
├── tests/
│   ├── conftest.py                 # Synthetic document fixtures
│   ├── test_pdf_extraction.py      # PDF parsing tests
│   ├── test_docx_extraction.py     # DOCX parsing tests
│   ├── test_text_extraction.py     # Plain text & encoding tests
│   ├── test_chunking.py            # Chunking determinism & boundaries
│   ├── test_provenance.py          # Citation matching tests
│   ├── test_structure_parser.py    # Clause pattern & normalizer tests
│   ├── test_ingestion.py           # Format validation tests
│   ├── test_ocr.py                 # Scanned page & OCR fallback tests
│   ├── test_configuration.py       # Configuration tests
│   ├── test_embeddings.py          # Embedding tests & candidate evaluation
│   ├── test_indexing.py            # Index persistence, reindexing, safety
│   ├── test_retrieval.py           # Hybrid RRF retrieval & filtering
│   ├── test_generation.py          # Grounded generation & injection defense
│   ├── test_evidence_validation.py # Citation verification & anti-fabrication
│   ├── test_evaluation.py          # Evaluation metrics & benchmark suite
│   ├── test_clause_extraction.py   # Contract clause taxonomy & cross-refs
│   ├── test_issue_detection.py     # Drafting issues & risk finding validation
│   ├── test_recommendations.py     # Revision generation & posture customization
│   ├── test_redlining.py           # Genuine diffs, accept/reject & DOCX markup export
│   ├── test_consistency.py         # Cross-clause consistency & evaluation suite
│   ├── test_citation_extraction.py # Case law, statutory & constitutional parsing
│   ├── test_normalization.py       # Title, reporter & party normalization
│   ├── test_metadata_verification.py# Bibliographical accuracy verification
│   ├── test_proposition_support.py # Entailment, support & contradiction detection
│   ├── test_verification_status.py # Multi-dimensional status synthesis
│   └── test_citation_integration.py# End-to-end integration across all 3 modules
├── requirements.txt
├── .env.example
└── README.md
```

---

## 3. Installation & Setup

```bash
# Clone/Navigate to workspace
cd draftmate_ai_1

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

---

## 4. Usage Examples

### A. Document Ingestion, Hybrid Retrieval & Grounded QA
```python
from draftmate_ai.document_processing import ingest_document
from draftmate_ai.document_rag.indexing import VectorIndexManager
from draftmate_ai.document_rag.retrieval import HybridRetriever
from draftmate_ai.document_rag.generation import get_llm_client
from draftmate_ai.document_rag.evidence_validation import EvidenceValidator
from draftmate_ai.document_rag.schemas import RetrievalConfig

# 1. Ingest document using Chunk 1 pipeline
doc = ingest_document("path/to/commercial_lease.pdf")

# 2. Index into persistent vector database
index_mgr = VectorIndexManager(storage_dir="./data/vector_store")
index_mgr.index_document(doc)

# 3. Hybrid Retrieval (Dense + BM25 + RRF + Cross-Encoder)
retriever = HybridRetriever(
    index_manager=index_mgr,
    config=RetrievalConfig(top_k=3, semantic_weight=0.6, lexical_weight=0.4),
)
retrieved_chunks = retriever.retrieve("What is the monthly base rent?")

# 4. Evidence-Grounded Generation
llm = get_llm_client(provider="local")  # or "openai"
raw_response = llm.generate_grounded_answer(
    question="What is the monthly base rent?",
    evidence_chunks=retrieved_chunks,
)

# 5. Evidence Validation (Anti-Fabrication Check)
validator = EvidenceValidator(index_manager=index_mgr)
validated_response = validator.validate_response(raw_response, strict_mode=True)

print(f"Question: {validated_response.question}")
print(f"Answer: {validated_response.answer}")
print(f"Abstained: {validated_response.abstained}")
for source in validated_response.sources:
    print(f"  Citation [Doc: {source.document_name}, Page: {source.page}, Clause: {source.clause}]:")
    print(f"    Excerpt: '{source.supporting_excerpt}' (Verified: {source.is_verified})")
```

### B. Benchmark Evaluation
```python
from draftmate_ai.document_rag.evaluation import RAGEvaluator, LEGAL_EVALUATION_DATASET

evaluator = RAGEvaluator(retriever=retriever, llm_client=llm)
report = evaluator.evaluate_queries(queries=LEGAL_EVALUATION_DATASET, top_k=5)

print(f"Evaluation Summary ({report.total_queries} queries):")
print(f"  Recall@5: {report.recall_at_k['recall@5']:.2f}")
print(f"  Precision@1: {report.precision_at_k['precision@1']:.2f}")
print(f"  MRR: {report.mean_reciprocal_rank:.2f}")
print(f"  Citation Correctness: {report.citation_correctness * 100:.1f}%")
print(f"  Appropriate Abstention Rate: {report.appropriate_abstention_rate * 100:.1f}%")
```

### C. Contract Review, Issue Detection & Tracked Redlining
```python
from draftmate_ai.document_processing import ingest_document
from draftmate_ai.contract_review import (
    ContractIssueDetector,
    RedlineEngine,
    ReviewPosture,
    ReviewPolicyConfig,
    ConsistencyChecker,
)

# 1. Ingest contract via Chunk 1 pipeline
doc = ingest_document("path/to/commercial_agreement.docx")

# 2. Issue Detection & Risk Analysis (Vendor Posture)
detector = ContractIssueDetector(
    policy=ReviewPolicyConfig(posture=ReviewPosture.VENDOR_FAVORABLE)
)
review_report = detector.review_contract(doc)

print(f"Contract: {review_report.contract_title} ({review_report.contract_type})")
print(f"Total Issues Detected: {len(review_report.findings)}")
for f in review_report.findings:
    print(f"[{f.severity.value}] {f.category.value}: {f.title}")
    print(f"  Evidence: '{f.original_text}'")
    print(f"  Proposed Revision: '{f.suggested_revision}'")

# 3. Interactive Redlining & Document Reconstruction
engine = RedlineEngine(original_text=doc.raw_text)
for f in review_report.findings:
    engine.create_change_from_finding(f)

# Accept / Reject changes
if engine.changes:
    engine.accept_change(engine.changes[0].change_id)

# Reconstruct formats: 'revised', 'original', or 'markup'
revised_text = engine.reconstruct_document(mode="revised")
markup_diff = engine.reconstruct_document(mode="markup")

# 4. Export Tracked Changes to DOCX (Strikethrough deletions, Underlined insertions)
docx_bytes = engine.export_to_docx(mode="markup")
with open("redlined_contract.docx", "wb") as f:
    f.write(docx_bytes)

# 5. Cross-Clause Consistency Checking
checker = ConsistencyChecker()
consistency_findings = checker.check_cross_clause_consistency(revised_text)
print(f"Post-revision Consistency Issues: {len(consistency_findings)}")
```

### D. Citation Verification Across 5 Dimensions
```python
from draftmate_ai.document_processing import ingest_document
from draftmate_ai.citation_verification import (
    CitationVerificationEngine,
    CitationExtractor,
    VerificationStatus,
)

# 1. Ingest brief or legal judgment
doc = ingest_document("data/constitutional_petition.docx")

# 2. Extract and verify citations across 5 independent dimensions:
#    (Existence, Metadata Accuracy, Proposition Support, Pinpoint Accuracy, Legal Currency)
engine = CitationVerificationEngine()
report = engine.verify_document_citations(doc)

print(f"Total Citations Processed: {report.total_citations}")
print(f"Verified: {report.verified_count} | Conflicting (Overruled/Contradicted): {report.conflicting_count} | Unverified: {report.unverified_count}")

for res in report.results:
    print(f"\nCitation: {res.raw_citation}")
    print(f"  Overall Status: {res.overall_status.value}")
    print(f"  Existence: {res.existence.value} | Matched Authority: {res.matched_authority_title}")
    print(f"  Metadata Accuracy: {res.metadata_accuracy.value}")
    print(f"  Proposition Support: {res.proposition_support.value}")
    print(f"  Pinpoint Accuracy: {res.pinpoint_accuracy.value}")
    print(f"  Legal Currency: {res.legal_currency.value}")
    if res.supporting_excerpts:
        print(f"  Excerpts: {res.supporting_excerpts[0]}")
    if res.currency_notes:
        print(f"  Currency Notes: {res.currency_notes}")
```

### E. Unified Full Pipeline Integration
```python
from draftmate_ai.integration import DraftMatePipeline
from draftmate_ai.contract_review.schemas import ReviewPosture

# Initialize single orchestrator connecting all 3 AI modules
pipeline = DraftMatePipeline(
    vector_storage_dir="./data/vector_store",
    review_posture=ReviewPosture.NEUTRAL,
)

# 1. Run integrated analysis: Ingestion + Citations + Contract Review + RAG Indexing
doc, analysis = pipeline.process_and_analyze_document(
    source="data/commercial_agreement.pdf",
    index_for_rag=True,
    perform_contract_review=True,
)

# 2. Query grounded RAG with evidence verification
rag_response = pipeline.query_document_rag("What is the governing law and arbitration clause?")
print(f"RAG Answer: {rag_response.answer}")
for src in rag_response.sources:
    print(f"  Source: {src.document_name} (Page {src.page}, Clause {src.clause}): '{src.supporting_excerpt}'")

# 3. Export redlined contract with tracked styling
reconstructed_markup, docx_bytes = pipeline.redline_contract(doc, mode="markup")
with open("final_redline.docx", "wb") as f:
    f.write(docx_bytes)
>>>>>>> f0ba063179223ff8b809b3e9d1327ef7cf1a7dea
```

---

<<<<<<< HEAD
## 🖥️ Command-Line Interface (CLI)

Run translation and voiceover generation directly from your terminal:

```bash
# Translate PDF to all 5 languages with voiceover MP3 audio files:
python cli.py document.pdf --targets hi mr gu en te --voiceover --output-dir ./output

# Translate a DOCX document to Hindi and Gujarati with voiceovers:
python cli.py contract.docx --targets hi gu --voiceover --output-dir ./output

# Translate raw text and synthesize audio:
python cli.py "Welcome to the international conference on AI." --targets hi mr gu en te --voiceover
```

---

## 🌐 Interactive Web Studio (Streamlit)

Launch the web studio in your browser:

```bash
streamlit run app.py
```

The web app includes:
- **Audio Players**: Listen to the generated voiceover for each translated language right in your browser.
- **Source Audio**: Listen to the voiceover of the original document text.
- **One-Click Downloads**: Download `.docx`, `.pdf`, `.txt`, and `.mp3` voiceover files individually.
- **Bulk ZIP Export**: Download all translated documents and all `.mp3` voiceover audios in one single ZIP package!

---

## 🧪 Running Unit Tests

Run the full automated test suite (including voiceover tests):

```bash
python test_translator.py
```
*(All 8 unit and integration tests run and pass cleanly).*

---

## 📁 Project Architecture

```
nlp/
├── doc_translator/
│   ├── __init__.py           # Package exports & versioning
│   ├── extractor.py          # Document parsing (DOCX, PDF, PPTX, TXT, MD, HTML)
│   ├── engine.py             # Neural translation engine & multi-threading
│   ├── exporter.py           # Formatted export (DOCX, PDF, TXT, JSON)
│   ├── voiceover.py          # Voiceover audio synthesis for all 5 languages
│   └── model.py              # Unified DocMultilingualModel interface
├── app.py                    # Streamlit web studio with audio players
├── cli.py                    # Command-line interface with --voiceover
├── test_translator.py        # Automated test suite (8 tests)
├── requirements.txt          # Dependencies list
└── README.md                 # Complete documentation
```
=======
## 5. Automated Test Suite & Coverage

The comprehensive test suite covers all four chunks:
* **Chunk 1**: Format validation, text preservation, PDF/DOCX/TXT extractors, deterministic structure-aware chunking, and provenance tracking.
* **Chunk 2**: Embedding generation, L2 normalization, persistent vector indexing, dense + BM25 reciprocal rank fusion (RRF), grounded generation with prompt injection defense, and citation verification.
* **Chunk 3**: Contract clause extraction, 15-category legal taxonomy, entity & defined term extraction, drafting issue detection, liability/indemnity risk analysis, redline text-diff engine, DOCX tracked export, and cross-clause consistency.
* **Chunk 4**: Multi-dimensional citation verification (Existence, Metadata Accuracy, Proposition Support, Pinpoint Accuracy, Legal Currency), Indian citation patterns (SCC, AIR, INSC, SCR, DLT, central statutes), local authoritative legal corpus, external source adapters, and unified pipeline integration.

```bash
# Run complete test suite across all 4 chunks
python -m pytest -v

# Run with line-level coverage report
python -m pytest --cov=draftmate_ai tests/

# Run master evaluation benchmark suite
python evaluation/benchmark_runner.py
```

**Results:**
* **121 passed** out of 121 tests (100% pass rate) in 15.22 seconds.
* **86% total code coverage** across 3,767 statements.

---

## 6. Known Limitations & Disclosure

1. **Local SQLite File Locking on Windows**: Chroma uses an embedded SQLite database (`chroma.sqlite3`). When deleting temporary test directories during rapid fixture teardown on Windows, file handles require `ignore_cleanup_errors=True`.
2. **Reflowable DOCX Page Numbers**: Word documents are reflowable XML files without intrinsic page numbers unless explicit page breaks (`w:br w:type="page"`) are inserted. In the absence of breaks, page 1 is preserved rather than inventing synthetic page numbers.
3. **Lexical BM25 Memory Footprint**: For extremely large document corpuses (> 500,000 chunks), BM25 token frequencies should transition to a distributed inverted index or SQLite FTS5 backend.
4. **Natural Language Fallback in Redlining**: Token-level alignment relies on exact character index boundaries. Complex restructuring spanning multiple discontinuous clauses should be reviewed interactively before batch acceptance.
5. **External Legal Repositories in Sandbox Mode**: Official external sources (India Code, Supreme Court of India digital portal) require unrestricted live internet access and rate limit tokens. In offline or isolated environments, the system transparently reports source limitations and falls back to its verified authoritative local corpus.
6. **Judicial Subtext & Negative Treatment**: Unindexed trial court distinguishing treatments or pending reference petitions cannot be deterministically inferred without ongoing appellate reporter updates. Findings should be confirmed by a licensed legal practitioner.
>>>>>>> f0ba063179223ff8b809b3e9d1327ef7cf1a7dea
