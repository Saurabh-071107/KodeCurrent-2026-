"""Document review feature module."""
import hashlib
import json
import re
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

import structlog
from pydantic import ValidationError

from app.core.model_router import get_router, LLMMessage
from app.schemas import (
    DraftResponse,
    FactExtractionResponse,
    Jurisdiction,
    ReviewFinding,
    ReviewRequest,
    ReviewResponse,
    FindingCategory,
    FindingSeverity,
    DraftSection,
)

logger = structlog.get_logger(__name__)


class ReviewError(Exception):
    """Review specific errors."""
    pass


REVIEW_SYSTEM_PROMPT = """You are an expert legal document reviewer. Analyze a legal document draft for issues.

CRITICAL RULES:
1. NEVER invent facts, citations, or issues not present in the draft
2. Base findings ONLY on the provided draft text and facts
3. Reference specific paragraphs/sections by their titles or order
4. Distinguish between objective issues and subjective suggestions
5. Flag all unresolved placeholders explicitly
5. If evidence IDs are provided, check claims against evidence

REVIEW FOCUS AREAS:
- Ambiguous language and undefined terms
- Contradictory facts or clauses within the draft
- Missing information and unresolved placeholders
- Inconsistent parties, dates, amounts, terminology, obligations
- Unsupported factual claims (not in facts, not in evidence)
- Potentially missing clauses for document type/jurisdiction (label as suggestions)
- Structural inconsistencies and broken cross-references

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "findings": [
    {
      "finding_id": "review_abc123",
      "category": "ambiguous_language|undefined_term|contradiction|missing_information|unresolved_placeholder|inconsistent_party|inconsistent_date|inconsistent_amount|inconsistent_terminology|inconsistent_obligation|unsupported_claim|missing_clause|structural_inconsistency|broken_cross_reference",
      "severity": "critical|high|medium|low|info",
      "location": "Section 1 / Paragraph 3 / 'Header'",
      "description": "Specific description of the issue",
      "suggested_correction": "Specific suggested fix or improvement",
      "evidence_ids": ["chunk_id1", "chunk_id2"],
      "related_finding_ids": ["review_xyz789"],
      "uncertainty": "Any limitations in this finding",
      "confidence": 0.85
    }
  ]
}"""


def compute_document_hash(draft: DraftResponse) -> str:
    """Compute a stable hash of the draft content for staleness detection."""
    content = json.dumps(draft.model_dump(), sort_keys=True, default=str)
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def build_review_prompt(request: ReviewRequest) -> str:
    """Build the user prompt for review."""
    draft = request.draft
    facts = request.facts
    
    parts = [
        f"Review the following {draft.document_type.value.replace('_', ' ').title()} draft:\n",
        f"DOCUMENT TITLE: {draft.title}\n",
        "DOCUMENT SECTIONS:\n",
    ]
    
    for section in draft.sections:
        parts.append(f"\n--- {section.title} (Order: {section.order}) ---\n{section.content}\n")
    
    parts.append("\nORIGINAL FACTS:\n")
    if facts.user_provided_facts:
        parts.append("User-Provided Facts:")
        for f in facts.user_provided_facts:
            parts.append(f"  - {f.fact} (confidence: {f.confidence})")
        parts.append("")
    
    if facts.inferred_facts:
        parts.append("Inferred Facts (assumptions):")
        for f in facts.inferred_facts:
            parts.append(f"  - {f.fact} (confidence: {f.confidence})")
        parts.append("")
    
    if facts.parties_and_roles:
        parts.append("Parties:")
        for p in facts.parties_and_roles:
            parts.append(f"  - {p.name}: {p.role.value} (confidence: {p.confidence})")
        parts.append("")
    
    if facts.important_dates:
        parts.append("Important Dates:")
        for d in facts.important_dates:
            approx = " (approx)" if d.is_approximate else ""
            parts.append(f"  - {d.date}: {d.description}{approx}")
        parts.append("")
    
    if facts.assumptions:
        parts.append("Assumptions:")
        for a in facts.assumptions:
            parts.append(f"  - {a}")
        parts.append("")
    
    if facts.missing_information:
        parts.append("Missing Information:")
        for m in facts.missing_information:
            parts.append(f"  - {m}")
        parts.append("")
    
    if draft.placeholders:
        parts.append("Document Placeholders:")
        for p in draft.placeholders:
            parts.append(f"  - {p}")
        parts.append("")
    
    if request.jurisdiction:
        parts.append(f"JURISDICTION: {request.jurisdiction.value}\n")
    
    if request.custom_checks:
        parts.append("CUSTOM REVIEW CRITERIA:")
        for c in request.custom_checks:
            parts.append(f"  - {c}")
        parts.append("")
    
    parts.append("\nReturn ONLY the JSON structure specified in the system prompt.")
    
    return "".join(parts)


async def review_draft(request: ReviewRequest) -> ReviewResponse:
    """
    Review a legal document draft for issues.
    
    Args:
        request: ReviewRequest with draft, facts, and options
        
    Returns:
        ReviewResponse with findings and summary
    """
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Build prompts
    jurisdiction_str = request.jurisdiction.value if request.jurisdiction else None
    system_prompt = REVIEW_SYSTEM_PROMPT
    user_prompt = build_review_prompt(request)
    
    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    try:
        logger.info(
            "review_started",
            document_type=request.draft.document_type.value,
            jurisdiction=jurisdiction_str,
            sections=len(request.draft.sections),
        )
        
        response = await adapter.chat(messages, temperature=0.2, max_tokens=4096)
        
        # Parse JSON response
        parsed = _parse_review_response(response.content)
        
        # Validate findings
        findings = [ReviewFinding.model_validate(f) for f in parsed.get("findings", [])]
        
        # Compute document hash
        document_hash = compute_document_hash(request.draft)
        
        # Build summary
        summary = _build_summary(findings)
        
        logger.info(
            "review_completed",
            document_type=request.draft.document_type.value,
            findings_count=len(findings),
            summary=summary,
        )
        
        return ReviewResponse(
            findings=findings,
            summary=summary,
            document_hash=document_hash,
        )
        
    except json.JSONDecodeError as e:
        logger.error("review_json_error", error=str(e), response_preview=response.content[:200])
        raise ValueError(f"LLM returned invalid JSON: {str(e)}")
    except ValidationError as e:
        logger.error("review_validation_error", error=str(e))
        raise ValueError(f"LLM response failed validation: {str(e)}")
    except Exception as e:
        logger.error("review_error", error_type=type(e).__name__, error=str(e))
        raise ValueError(f"Review failed: {str(e)}")


def _parse_review_response(content: str) -> Dict[str, Any]:
    """Parse and clean LLM response for review."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


def _build_summary(findings: List[ReviewFinding]) -> dict:
    """Build summary statistics from findings."""
    by_category: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}
    
    for f in findings:
        by_category[f.category.value] = by_category.get(f.category.value, 0) + 1
        by_severity[f.severity.value] = by_severity.get(f.severity.value, 0) + 1
    
    return {
        "total_findings": len(findings),
        "by_category": by_category,
        "by_severity": by_severity,
    }