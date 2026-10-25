"""External document review feature module."""
import hashlib
import json
from typing import Any, Dict, List, Optional

import structlog

from app.core.model_router import get_router, LLMMessage
from app.features.document_management import get_document_chunks
from app.schemas import (
    ExternalReviewRequest,
    ExternalReviewResponse,
    ReviewFinding,
    ReviewResponse,
    RedlineOperation,
    RedlineOperationType,
    FindingSeverity,
    DraftResponse,
    FactExtractionResponse,
)

logger = structlog.get_logger(__name__)


class ExternalReviewError(Exception):
    """External review specific errors."""
    pass


EXTERNAL_REVIEW_SYSTEM_PROMPT = """You are an expert legal document reviewer. Analyze an uploaded legal document for issues.

CRITICAL RULES:
1. NEVER invent facts, citations, or issues not present in the document
2. Base findings ONLY on the provided document text
3. Reference specific paragraphs/sections by their content or position
4. Distinguish between objective issues and subjective suggestions
5. Flag all unresolved placeholders explicitly
6. If known facts are provided, check document claims against them

REVIEW FOCUS AREAS:
- Ambiguous language and undefined terms
- Contradictory facts, names, dates, or amounts within the document
- Missing information and unresolved placeholders
- Inconsistent parties, dates, amounts, terminology, obligations
- Unsupported factual claims (not in document, not in known facts)
- Potentially missing clauses for document type (label as suggestions)
- Structural inconsistencies and broken cross-references
- Risky or one-sided clauses

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


def compute_document_hash(text: str) -> str:
    """Compute a stable hash of the document content for staleness detection."""
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def build_external_review_prompt(request: 'ExternalReviewRequest', document_text: str, chunks: List[Dict[str, Any]]) -> str:
    """Build the user prompt for external document review."""
    parts = [
        f"Review the following legal document for issues:\n",
        f"DOCUMENT TEXT:\n{document_text[:15000]}\n\n",
    ]
    
    if request.facts:
        facts = request.facts
        parts.append("\nKNOWN FACTS FOR COMPARISON:\n")
        if facts.user_provided_facts:
            parts.append("User-Provided Facts:")
            for f in facts.user_provided_facts:
                parts.append(f"  - {f.fact} (confidence: {f.confidence})")
            parts.append("")
        
        if facts.parties_and_roles:
            parts.append("Known Parties:")
            for p in facts.parties_and_roles:
                parts.append(f"  - {p.name}: {p.role.value} (confidence: {p.confidence})")
            parts.append("")
        
        if facts.important_dates:
            parts.append("Known Important Dates:")
            for d in facts.important_dates:
                approx = " (approx)" if d.is_approximate else ""
                parts.append(f"  - {d.date}: {d.description}{approx}")
            parts.append("")
        
        if facts.assumptions:
            parts.append("Known Assumptions:")
            for a in facts.assumptions:
                parts.append(f"  - {a}")
            parts.append("")
        
        if facts.missing_information:
            parts.append("Known Missing Information:")
            for m in facts.missing_information:
                parts.append(f"  - {m}")
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


async def review_external_document(request: ExternalReviewRequest) -> ExternalReviewResponse:
    """
    Review an uploaded legal document for issues.
    
    Args:
        request: ExternalReviewRequest with document_id and options
        
    Returns:
        ExternalReviewResponse with findings and suggested edits
    """
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Get document chunks
    chunks = await get_document_chunks(request.document_id)
    if not chunks:
        raise ValueError(f"No chunks found for document {request.document_id}. Document may not be processed.")
    
    # Combine text from chunks
    document_text = "\n\n".join(chunk.text for chunk in chunks)
    
    # Build prompts
    system_prompt = EXTERNAL_REVIEW_SYSTEM_PROMPT
    user_prompt = build_external_review_prompt(request, document_text, [])
    
    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    try:
        logger.info(
            "external_review_started",
            document_id=request.document_id,
            chunks=len(await get_document_chunks(request.document_id)),
        )
        
        response = await adapter.chat(messages, temperature=0.2, max_tokens=4096)
        
        # Parse JSON response
        parsed = _parse_review_response(response.content)
        
        # Validate findings
        findings = [ReviewFinding.model_validate(f) for f in parsed.get("findings", [])]
        
        # Compute document hash
        document_text = "\n\n".join(chunk.text for chunk in await get_document_chunks(request.document_id))
        document_hash = compute_document_hash(document_text)
        
        # Build summary
        summary = _build_summary(findings)
        
        # Generate suggested edits based on findings
        suggested_edits = _generate_suggested_edits(findings, request.document_id)
        
        logger.info(
            "external_review_completed",
            document_id=request.document_id,
            findings_count=len(findings),
            summary=summary,
        )
        
        return ExternalReviewResponse(
            document_id=request.document_id,
            findings=findings,
            summary=summary,
            document_hash=compute_document_hash("\n\n".join(chunk.text for chunk in await get_document_chunks(request.document_id))),
            suggested_edits=suggested_edits,
        )
        
    except json.JSONDecodeError as e:
        logger.error("external_review_json_error", error=str(e), response_preview=response.content[:200])
        raise ValueError(f"LLM returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error("external_review_error", error_type=type(e).__name__, error=str(e))
        raise ValueError(f"External review failed: {str(e)}")


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


def _generate_suggested_edits(findings: List[ReviewFinding], document_id: str) -> List[RedlineOperation]:
    """Generate suggested redline edits based on review findings."""
    edits = []
    
    for finding in findings:
        if finding.suggested_correction and finding.severity in (FindingSeverity.CRITICAL, FindingSeverity.HIGH, FindingSeverity.MEDIUM):
            # Generate a redline operation for actionable findings
            edit_id = f"edit_{hashlib.md5(f'{finding.finding_id}{finding.suggested_correction}'.encode()).hexdigest()[:8]}"
            
            # Map severity to risk level
            risk_map = {
                FindingSeverity.CRITICAL: FindingSeverity.CRITICAL,
                FindingSeverity.HIGH: FindingSeverity.HIGH,
                FindingSeverity.MEDIUM: FindingSeverity.MEDIUM,
                FindingSeverity.LOW: FindingSeverity.LOW,
                FindingSeverity.INFO: FindingSeverity.INFO,
            }
            
            edit = RedlineOperation(
                operation_id=f"ext_review_{edit_id}",
                operation_type=RedlineOperationType.REPLACE,
                target_location=finding.location,
                original_text="",  # Would need original text from document
                proposed_text=finding.suggested_correction,
                explanation=f"External review finding: {finding.description}. Suggested: {finding.suggested_correction}",
                risk_level=risk_map.get(finding.severity, FindingSeverity.MEDIUM),
                related_finding_ids=[finding.finding_id],
                evidence_ids=finding.evidence_ids,
                depends_on=[],
            )
            edits.append(edit)
    
    return edits