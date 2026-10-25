"""Citation verification for case documents."""
import json
import structlog
import re
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.config import get_settings
from app.core.model_router import get_router, LLMMessage
from app.features.document_management import get_document_chunks
from app.features.retriever_instance import get_retriever
from app.schemas import (
    CitationVerificationCaseRequest,
    CitationVerificationCaseResponse,
    CitationVerificationResult,
    CitationStatus,
    CitationSource,
    Citation,
)

logger = structlog.get_logger(__name__)


class CitationVerificationCaseError(Exception):
    """Citation verification case specific errors."""
    pass


CITATION_EXTRACTION_PROMPT = """You are an expert legal citation extractor. Extract all legal citations from case documents.

CITATION TYPES TO EXTRACT:
- Constitutional provisions (e.g., "Article 21 of the Constitution of India", "Article 226")
- Statutes (e.g., "Section 9 of the Code of Civil Procedure, 1908", "Section 378 IPC")
- Cases (e.g., "Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225")
- Regulations (e.g., "Rule 11 of the Civil Procedure Code")
- Constitutional provisions (e.g., "Article 21", "Article 226")
- Rules (e.g., "Order 7 Rule 11 CPC")
- Ordinances, notifications, and other legal authorities

RULES:
1. Extract ONLY citations actually present in the documents
2. For each citation, identify what proposition the document claims it supports
3. Normalize the citation to a standard form
4. Note the location (document, section, page) where it appears

OUTPUT FORMAT: Return ONLY valid JSON:
{
  "citations": [
    {
      "citation_id": "cite_abc123",
      "raw_text": "Article 21 of the Constitution of India",
      "normalized_form": "Article 21, Constitution of India",
      "location": "Document doc_123, Section 3, Page 5",
      "proposed_proposition": "Right to life includes right to livelihood"
    }
  ]
}"""

CITATION_VERIFICATION_PROMPT = """You are a legal citation verification assistant for Indian law. Verify whether a citation exists and supports the stated proposition.

RULES:
1. NEVER invent sources, URLs, excerpts, or verification results
2. If no authoritative source integration is available, return NOT_CHECKED
3. Distinguish between: existence of authority, support for proposition, current status
4. Use these statuses:
   - VERIFIED: Authority exists, supports proposition, current status confirmed
   - PARTIALLY_VERIFIED: Authority exists but only partially supports proposition OR status not fully confirmed
   - UNVERIFIED: Authority exists but does not support proposition OR cannot be located
   - NOT_CHECKED: No source integration configured or unable to check

For each citation, provide:
- Status
- Authoritative sources found (title, URL, excerpt, jurisdiction, retrieval timestamp)
- Whether source supports the stated proposition
- Whether current legal status was checked
- Notes/limitations

OUTPUT FORMAT: Return ONLY valid JSON:
{
  "results": [
    {
      "citation_id": "cite_abc123",
      "status": "verified|partially_verified|unverified|not_checked",
      "sources": [
        {
          "title": "Constitution of India",
          "url": "https://legislative.gov.in/constitution-of-india",
          "retrieved_at": "2024-01-15T10:30:00Z",
          "excerpt": "Article 21 - Protection of life and personal liberty...",
          "jurisdiction": "India"
        }
      ],
      "supports_proposition": true,
      "current_status_checked": true,
      "notes": "Verified via official legislative.gov.in",
      "checked_at": "2024-01-15T10:30:00Z"
    }
  ]
}"""


# Citation regex patterns for Indian legal citations
INDIAN_STATUTE_PATTERNS = [
    r'(?:Section|Sec\.?)\s+\d+[A-Z]?(?:\s+of\s+)?(?:the\s+)?(?:Code|Act|Statute|Ordinance|Regulation)',
    r'(?:Article|Art\.?)\s+\d+[A-Z]?(?:\s+of\s+)?(?:the\s+)?(?:Constitution|Statute)',
    r'(?:Order|O\.)\s+\d+\s+Rule\s+\d+',
    r'(?:Schedule|Sch\.?)\s+[IVX\d]+',
    r'(?:Rule|R\.)\s+\d+',
    r'(?:Order|O\.)\s+\d+',
]

INDIAN_CASE_PATTERNS = [
    r'\b[A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+,?\s+\(\d{4}\)\s+\d+\s+[A-Z][a-z]+\.?\s+\d+\s+\(\d{4}\)',
    r'\b\d{4}\s+[A-Z][a-z]+\.?\s+\d+\s+\(\d{4}\)',
    r'\b[A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+\s+\(\d{4}\)\s+\d+\s+SCC\s+\d+',
]

CONSTITUTION_PATTERNS = [
    r'\bArticle\s+\d+[A-Z]?(?:\s+of\s+the\s+Constitution\s+of\s+India)?',
    r'\bArticle\s+\d+[A-Z]?(?:\s+of\s+the\s+Constitution)?',
]


def extract_citations_from_case_documents(chunks: List) -> List[Citation]:
    """Extract citations from case document chunks."""
    full_text = "\n\n".join(f"[{c.chunk_id}] {c.text}" for c in chunks)
    
    potential_citations = []
    
    # Extract statutes
    for pattern in INDIAN_STATUTE_PATTERNS:
        for match in re.finditer(pattern, full_text, re.IGNORECASE):
            start = max(0, match.start() - 100)
            end = min(len(full_text), match.end() + 100)
            context = full_text[start:end].strip()
            potential_citations.append({
                "raw_text": match.group(0).strip(),
                "context": context[:200],
                "type": "statute",
            })
    
    # Extract cases
    for pattern in INDIAN_CASE_PATTERNS:
        for match in re.finditer(pattern, full_text, re.IGNORECASE):
            start = max(0, match.start() - 100)
            end = min(len(full_text), match.end() + 100)
            context = full_text[start:end].strip()
            potential_citations.append({
                "raw_text": match.group(0).strip(),
                "context": context[:200],
                "type": "case",
            })
    
    # Extract constitutional provisions
    for pattern in CONSTITUTION_PATTERNS:
        for match in re.finditer(pattern, full_text, re.IGNORECASE):
            start = max(0, match.start() - 50)
            end = min(len(full_text), match.end() + 50)
            context = full_text[start:end].strip()
            potential_citations.append({
                "raw_text": match.group(0).strip(),
                "context": context[:200],
                "type": "constitution",
            })
    
    # Also look for common citation keywords
    citation_keywords = ["§", "section", "Section", "Sec.", "Article", "Article", "clause", "Clause", "rule", "Rule", "Order", "Schedule"]
    for keyword in citation_keywords:
        for match in re.finditer(rf'\b{re.escape(keyword)}\b', full_text, re.IGNORECASE):
            start = max(0, match.start() - 100)
            end = min(len(full_text), match.end() + 150)
            context = full_text[start:end].strip()
            if len(context) > 15:
                potential_citations.append({
                    "raw_text": context[:300],
                    "context": context[:200],
                    "type": "other",
                })
    
    # Deduplicate
    seen = set()
    unique_citations = []
    for c in potential_citations:
        key = c["raw_text"].strip()[:100]
        if key not in seen:
            seen.add(key)
            unique_citations.append(c)
    
    # Convert to Citation objects
    citations = []
    for i, c in enumerate(unique_citations[:40]):  # Limit
        citation_id = f"cite_{hashlib.md5(c['raw_text'].encode()).hexdigest()[:8]}"
        citations.append(Citation(
            citation_id=citation_id,
            raw_text=c['raw_text'].strip()[:500],
            normalized_form=_normalize_citation(c['raw_text']),
            location=c.get('context', '')[:200],
            proposed_proposition=_infer_proposition(c['raw_text']),
        ))
    
    return citations


def _normalize_citation(text: str) -> str:
    """Normalize citation to standard form."""
    text = re.sub(r'\s+', ' ', text.strip())
    text = re.sub(r'Section\s+', '§ ', text, flags=re.IGNORECASE)
    text = re.sub(r'Sec\.\s*', '§ ', text, flags=re.IGNORECASE)
    text = re.sub(r'Article\s+', 'Art. ', text, flags=re.IGNORECASE)
    text = re.sub(r'Art\.\s*', 'Art. ', text, flags=re.IGNORECASE)
    text = re.sub(r'Section\s+', '§ ', text, flags=re.IGNORECASE)
    return text[:300]


def _infer_proposition(text: str) -> str:
    """Infer what proposition the citation supports from context."""
    text_lower = text.lower()
    if any(kw in text_lower for kw in ['fundamental right', 'article 21', 'article 14', 'article 19']):
        return "Fundamental rights protection"
    if any(kw in text_lower for kw in ['writ', 'article 226', 'article 32', 'mandamus', 'certiorari']):
        return "Writ jurisdiction and remedies"
    if any(kw in text_lower for kw in ['limitation', 'limitation act', 'period of limitation']):
        return "Limitation and prescription"
    if any(kw in text_lower for kw in ['res judicata', 'estoppel', 'issue estoppel']):
        return "Res judicata and estoppel principles"
    if any(kw in text_lower for kw in ['specific performance', 'injunction', 'temporary injunction']):
        return "Equitable relief and specific performance"
    if any(kw in text_lower for kw in ['evidence', 'burden of proof', 'onus']):
        return "Burden and standard of proof"
    return "Legal authority for stated proposition"


class CaseCitationVerificationAdapter:
    """Adapter for verifying citations in case documents."""
    
    def __init__(self):
        self.sources_configured = False
    
    async def verify(self, citation: Citation, jurisdiction: Optional[str] = None) -> 'CitationVerificationResult':
        """Verify a single citation."""
        # Check if we have any legal source integrations configured
        from app.schemas import CitationVerificationResult, CitationStatus, CitationSource
        
        # For now, return NOT_CHECKED with clear reason
        return CitationVerificationResult(
            citation_id=citation.citation_id,
            status=CitationStatus.NOT_CHECKED,
            sources=[],
            supports_proposition=None,
            current_status_checked=False,
            notes="No authoritative legal source integration configured. Citation verification requires integration with legal databases (e.g., Indian Kanoon, Manupatra, SCC Online, Indian Kanoon API, Legislative.gov.in, India Code, Supreme Court website).",
            checked_at=datetime.utcnow(),
        )


# Global adapter instance
_verification_adapter = None


def get_verification_adapter() -> 'CaseCitationVerificationAdapter':
    """Get the citation verification adapter."""
    global _verification_adapter
    if _verification_adapter is None:
        _verification_adapter = CaseCitationVerificationAdapter()
    return _verification_adapter


async def verify_citations_in_case(request: 'CitationVerificationCaseRequest') -> 'CitationVerificationCaseResponse':
    """
    Verify citations in case documents.
    
    Args:
        request: CitationVerificationCaseRequest with case_id and options
        
    Returns:
        CitationVerificationCaseResponse with verification results
    """
    # Get case documents
    from app.features.case_workspace import get_case_documents_chunks
    chunks = await get_case_documents_chunks(request.case_id)
    
    if not chunks:
        raise ValueError(f"No processed documents found for case {request.case_id}")
    
    # Extract citations
    citations = extract_citations_from_case_documents(chunks)
    
    if getattr(request, "citation_ids", None):
        citations = [c for c in citations if c.citation_id in request.citation_ids]
    
    if not citations:
        return CitationVerificationCaseResponse(
            case_id=request.case_id,
            results=[],
            summary={"no_citations_found": 1},
            sources_configured=False,
            disclaimer="No citations found in the case documents.",
        )
    
    # Verify each citation
    adapter = get_verification_adapter()
    results = []
    
    for citation in citations:
        try:
            result = await adapter.verify(citation, getattr(request, "jurisdiction", "India"))
            results.append(result)
        except Exception as e:
            logger.error("citation_verification_error", citation_id=citation.citation_id, error=str(e))
            results.append(CitationVerificationResult(
                citation_id=citation.citation_id,
                status=CitationStatus.NOT_CHECKED,
                sources=[],
                supports_proposition=None,
                current_status_checked=False,
                notes=f"Verification error: {str(e)}",
                checked_at=datetime.utcnow(),
            ))
    
    # Build summary
    summary = {}
    for r in results:
        summary[r.status.value] = summary.get(r.status.value, 0) + 1
    
    return CitationVerificationCaseResponse(
        case_id=request.case_id,
        results=results,
        summary=summary,
        sources_configured=False,
        disclaimer="Citation verification based on available sources. Verify independently. No authoritative legal source integration currently configured.",
    )


import hashlib