"""Citation verification feature module."""
import json
import re
from typing import Any, Dict, List, Optional
from datetime import datetime

import structlog

from app.core.model_router import get_router, LLMMessage
from app.schemas import (
    DraftResponse,
    Jurisdiction,
    Citation,
    CitationVerificationRequest,
    CitationVerificationResponse,
    CitationVerificationResult,
    CitationStatus,
    CitationSource,
)

logger = structlog.get_logger(__name__)


class CitationVerificationError(Exception):
    """Citation verification specific errors."""
    pass


CITATION_EXTRACTION_PROMPT = """You are an expert legal citation extractor. Extract all legal citations from a draft document.

CITATION TYPES TO EXTRACT:
- Statutes (e.g., "Cal. Civ. Code § 1950.5", "42 U.S.C. § 1983")
- Cases (e.g., "Smith v. Jones, 123 Cal. App. 4th 456 (2004)")
- Regulations (e.g., "29 C.F.R. § 1604.11")
- Court rules (e.g., "Fed. R. Civ. P. 56")
- Constitutional provisions (e.g., "U.S. Const. amend. XIV, § 1")
- Treaties, ordinances, and other legal authorities

RULES:
1. Extract ONLY citations actually present in the draft
2. For each citation, identify what proposition the draft claims it supports
3. Normalize the citation to a standard form
4. Note the location (section title, paragraph) where it appears

OUTPUT FORMAT: Return ONLY valid JSON:
{
  "citations": [
    {
      "citation_id": "cite_abc123",
      "raw_text": "California Civil Code Section 1950.5",
      "normalized_form": "Cal. Civ. Code § 1950.5",
      "location": "Section 3 (Legal Basis), Paragraph 2",
      "proposed_proposition": "Landlord must return security deposit within 21 days"
    }
  ]
}"""


CITATION_VERIFICATION_PROMPT = """You are a legal citation verification assistant. Verify whether a citation exists and supports the stated proposition.

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
          "title": "California Civil Code § 1950.5",
          "url": "https://leginfo.legislature.ca.gov/...",
          "retrieved_at": "2024-01-15T10:30:00Z",
          "excerpt": "A landlord shall return the security deposit within 21 days...",
          "jurisdiction": "California"
        }
      ],
      "supports_proposition": true,
      "current_status_checked": true,
      "notes": "Verified via official California Legislative Information",
      "checked_at": "2024-01-15T10:30:00Z"
    }
  ]
}"""


# Citation regex patterns for common formats
STATUTE_PATTERNS = [
    r'\b\d+\s+[A-Z][a-z]+\.?\s+(?:Code|Stat(?:utes)?|Annotated)\s+§\s*\d+(?:\.\d+)*(?:\([^)]+\))*',
    r'\b(?:U\.?S\.?C\.?|U\.?S\.?\s+Code)\s+§\s*\d+(?:\.\d+)*',
    r'\b(?:C\.?F\.?R\.?|C\.?\s*F\.?\s*R\.?)\s+§\s*\d+(?:\.\d+)*',
    r'\b(?:Fed\.?\s+R\.?\s+Civ\.?\s+P\.?|Fed\.?\s+R\.?\s+Evid\.?)\s+\d+',
]

CASE_PATTERNS = [
    r'\b[A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+,?\s+\d+\s+[A-Z][a-z]+\.?\s+\d+\s+\(\d{4}\)',
    r'\b\d+\s+[A-Z][a-z]+\.?\s+\d+\s+\(\d{4}\)',
]

CONSTITUTION_PATTERNS = [
    r'\b(?:U\.?S\.?\s+)?Const(?:itution)?\.?\s+amend(?:ment)?\.?\s+\w+',
    r'\b(?:U\.?S\.?\s+)?Const(?:itution)?\.?\s+art(?:icle)?\.?\s+\w+',
]


def extract_citations_from_draft(draft: DraftResponse) -> List[Citation]:
    """Extract citations from a draft document using pattern matching and LLM."""
    # First, combine all section text
    full_text = "\n\n".join(f"{s.title}\n{s.content}" for s in draft.sections)
    
    # Use regex to find potential citations
    potential_citations = []
    
    for pattern in STATUTE_PATTERNS:
        for match in re.finditer(pattern, full_text, re.IGNORECASE):
            potential_citations.append({
                "raw_text": match.group(0),
                "type": "statute",
                "location": _find_location(draft, match.start()),
            })
    
    for pattern in CASE_PATTERNS:
        for match in re.finditer(pattern, full_text, re.IGNORECASE):
            potential_citations.append({
                "raw_text": match.group(0),
                "type": "case",
                "location": _find_location(draft, match.start()),
            })
    
    for pattern in CONSTITUTION_PATTERNS:
        for match in re.finditer(pattern, full_text, re.IGNORECASE):
            potential_citations.append({
                "raw_text": match.group(0),
                "type": "constitution",
                "location": _find_location(draft, match.start()),
            })
    
    # Also look for common citation keywords
    citation_keywords = ["§", "section", "Sec.", "Article", "Amendment", "v.", "versus"]
    for keyword in citation_keywords:
        for match in re.finditer(rf'\b{re.escape(keyword)}\b', full_text, re.IGNORECASE):
            start = max(0, match.start() - 50)
            end = min(len(full_text), match.end() + 100)
            context = full_text[start:end].strip()
            if len(context) > 10:
                potential_citations.append({
                    "raw_text": context[:200],
                    "type": "other",
                    "location": _find_location(draft, match.start()),
                })
    
    # Deduplicate by raw_text
    seen = set()
    unique_citations = []
    for c in potential_citations:
        key = c["raw_text"].strip()[:100]
        if key not in seen:
            seen.add(key)
            unique_citations.append(c)
    
    # Convert to Citation objects
    citations = []
    for i, c in enumerate(unique_citations[:30]):  # Limit to 30
        citation_id = f"cite_{hashlib.md5(c['raw_text'].encode()).hexdigest()[:8]}"
        citations.append(Citation(
            citation_id=citation_id,
            raw_text=c['raw_text'].strip()[:500],
            normalized_form=_normalize_citation(c['raw_text']),
            location=c['location'],
            proposed_proposition=_infer_proposition(c['raw_text']),
        ))
    
    return citations


def _find_location(draft: DraftResponse, char_pos: int) -> str:
    """Find the section/paragraph location for a character position."""
    current_pos = 0
    for section in draft.sections:
        section_text = f"{section.title}\n{section.content}"
        if current_pos <= char_pos < current_pos + len(section_text):
            # Estimate paragraph
            para_text = section.content[:char_pos - current_pos - len(section.title) - 1]
            para_num = para_text.count('\n\n') + 1
            return f"Section '{section.title}' (Order {section.order}), Paragraph ~{para_num}"
        current_pos += len(section_text) + 2
    return f"Position {char_pos}"


def _normalize_citation(text: str) -> str:
    """Normalize citation to standard form."""
    # Basic normalization
    text = re.sub(r'\s+', ' ', text.strip())
    text = re.sub(r'Section\s+', '§ ', text, flags=re.IGNORECASE)
    text = re.sub(r'Sec\.\s*', '§ ', text, flags=re.IGNORECASE)
    return text[:200]


def _infer_proposition(text: str) -> str:
    """Infer what proposition the citation supports from context."""
    # Simple heuristic - would be better with LLM
    if 'security deposit' in text.lower():
        return "Security deposit requirements and timelines"
    if 'notice' in text.lower():
        return "Notice requirements"
    if 'terminat' in text.lower():
        return "Termination provisions"
    return "Legal authority for stated proposition"


class CitationVerificationAdapter:
    """Base adapter for authoritative legal source verification."""
    
    async def verify(self, citation: Citation, jurisdiction: Optional[str] = None) -> CitationVerificationResult:
        """Verify a single citation. Subclasses must implement."""
        raise NotImplementedError


class MockCitationAdapter(CitationVerificationAdapter):
    """Mock adapter for testing without real API access."""
    
    def __init__(self):
        self.sources_configured = False
    
    async def verify(self, citation: Citation, jurisdiction: Optional[str] = None) -> CitationVerificationResult:
        """Mock verification - returns NOT_CHECKED with clear reason."""
        return CitationVerificationResult(
            citation_id=citation.citation_id,
            status=CitationStatus.NOT_CHECKED,
            sources=[],
            supports_proposition=None,
            current_status_checked=False,
            notes="No authoritative source integration configured. Citation verification requires integration with legal databases (e.g., CourtListener, Caselaw Access Project, LexisNexis, Westlaw, or official government APIs).",
            checked_at=datetime.utcnow(),
        )


# Global adapter instance
_verification_adapter: Optional[CitationVerificationAdapter] = None


def get_verification_adapter() -> CitationVerificationAdapter:
    """Get the citation verification adapter."""
    global _verification_adapter
    if _verification_adapter is None:
        _verification_adapter = MockCitationAdapter()
    return _verification_adapter


def set_verification_adapter(adapter: CitationVerificationAdapter) -> None:
    """Set a custom verification adapter."""
    global _verification_adapter
    _verification_adapter = adapter


async def verify_citations(request: CitationVerificationRequest) -> CitationVerificationResponse:
    """
    Verify citations in a draft document.
    
    Args:
        request: CitationVerificationRequest with draft and options
        
    Returns:
        CitationVerificationResponse with verification results
    """
    # Extract citations from draft
    citations = extract_citations_from_draft(request.draft)
    
    # Filter to requested citations if specified
    if request.citation_ids:
        citations = [c for c in citations if c.citation_id in request.citation_ids]
    
    # Verify each citation
    adapter = get_verification_adapter()
    results = []
    
    for citation in citations:
        try:
            result = await adapter.verify(citation, request.jurisdiction.value if request.jurisdiction else None)
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
    
    return CitationVerificationResponse(
        results=results,
        summary=summary,
        sources_configured=adapter.sources_configured if hasattr(adapter, 'sources_configured') else False,
    )


import hashlib