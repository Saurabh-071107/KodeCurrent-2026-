"""Redlining feature module."""
import hashlib
import json
from typing import Any, Dict, List, Optional, Tuple

import structlog

from app.core.model_router import get_router, LLMMessage
from app.schemas import (
    DraftResponse,
    FactExtractionResponse,
    Jurisdiction,
    ReviewResponse,
    RedlineOperation,
    RedlineOperationType,
    RedlineRequest,
    RedlineResponse,
    RedlineDecision,
    RedlineDecisionsRequest,
    RedlineDecisionsResponse,
    RedlinePreviewRequest,
    RedlinePreviewResponse,
    FindingSeverity,
    DraftSection,
    RedlinePreviewRequest,
)

logger = structlog.get_logger(__name__)


class RedliningError(Exception):
    """Redlining specific errors."""
    pass


REDLINE_SYSTEM_PROMPT = """You are an expert legal document editor. Generate precise redline edit operations for a legal draft.

CRITICAL RULES:
1. NEVER rewrite unrelated text - only target specific issues
2. Each operation must have a clear, verifiable target location
3. Original text must EXACTLY match the current draft
4. Use INSERT, DELETE, or REPLACE operations
5. Explain the rationale and risk level for each edit
5. Link operations to review findings and evidence when available
6. Avoid overlapping/conflicting operations
7. Prefer minimal, focused edits over large rewrites

OPERATION TYPES:
- INSERT: Add new text at a specific location (original_text can be empty or context)
- DELETE: Remove existing text (proposed_text empty)
- REPLACE: Replace specific text with new text (both original and proposed required)

OUTPUT FORMAT: Return ONLY valid JSON:
{
  "operations": [
    {
      "operation_id": "redline_abc123",
      "operation_type": "insert|delete|replace",
      "target_location": "Section 3.2, Paragraph 1",
      "original_text": "Exact text to be replaced or context for insert",
      "proposed_text": "New text to insert or replace with",
      "explanation": "Why this edit is needed",
      "risk_level": "low|medium|high|critical",
      "related_finding_ids": ["review_xyz789"],
      "evidence_ids": ["chunk_id1"],
      "depends_on": ["redline_other_id"]
    }
  ]
}"""


def compute_document_hash(draft: DraftResponse) -> str:
    """Compute a stable hash of the draft content."""
    import hashlib
    content = json.dumps(draft.model_dump(), sort_keys=True, default=str)
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def build_redline_prompt(request: RedlineRequest) -> str:
    """Build the user prompt for redline generation."""
    draft = request.draft
    review = request.review_response
    facts = request.facts
    
    parts = [
        f"Generate redline edits for the following {draft.document_type.value.replace('_', ' ').title()} draft:\n",
        f"DOCUMENT TITLE: {draft.title}\n",
        f"DOCUMENT HASH: {compute_document_hash(draft)}\n",
        "DOCUMENT SECTIONS:\n",
    ]
    
    for section in draft.sections:
        parts.append(f"\n--- {section.title} (Order: {section.order}) ---\n{section.content}\n")
    
    if review and review.findings:
        parts.append("\nREVIEW FINDINGS TO ADDRESS:\n")
        for f in review.findings:
            parts.append(f"  [{f.finding_id}] {f.category.value} ({f.severity.value}): {f.description}")
            if f.suggested_correction:
                parts.append(f"    Suggested: {f.suggested_correction}")
            parts.append(f"    Location: {f.location}")
            parts.append("")
    
    parts.append("ORIGINAL FACTS:\n")
    if facts.user_provided_facts:
        parts.append("User-Provided Facts:")
        for f in facts.user_provided_facts:
            parts.append(f"  - {f.fact}")
        parts.append("")
    
    if facts.parties_and_roles:
        parts.append("Parties:")
        for p in facts.parties_and_roles:
            parts.append(f"  - {p.name}: {p.role.value}")
        parts.append("")
    
    if draft.placeholders:
        parts.append("Document Placeholders (should be resolved):")
        for p in draft.placeholders:
            parts.append(f"  - {p}")
        parts.append("")
    
    if request.jurisdiction:
        parts.append(f"JURISDICTION: {request.jurisdiction.value}\n")
    
    parts.append(f"\nGenerate up to {request.max_operations} focused redline operations.")
    parts.append("\nReturn ONLY the JSON structure specified in the system prompt.")
    
    return "".join(parts)


async def generate_redlines(request: RedlineRequest) -> RedlineResponse:
    """
    Generate redline edit operations for a draft.
    
    Args:
        request: RedlineRequest with draft, optional review, facts
        
    Returns:
        RedlineResponse with proposed operations
    """
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    system_prompt = REDLINE_SYSTEM_PROMPT
    user_prompt = build_redline_prompt(request)
    
    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    try:
        logger.info(
            "redline_started",
            document_type=request.draft.document_type.value,
            has_review=request.review_response is not None,
            max_operations=request.max_operations,
        )
        
        response = await adapter.chat(messages, temperature=0.2, max_tokens=4096)
        
        parsed = _parse_redline_response(response.content)
        
        # Validate operations
        operations = [RedlineOperation.model_validate(op) for op in parsed.get("operations", [])]
        
        # Validate against current draft
        validated_ops = _validate_operations(operations, request.draft)
        
        document_hash = compute_document_hash(request.draft)
        
        logger.info(
            "redline_completed",
            document_type=request.draft.document_type.value,
            operations_count=len(validated_ops),
            document_hash=document_hash,
        )
        
        return RedlineResponse(
            operations=validated_ops,
            document_hash=document_hash,
        )
        
    except json.JSONDecodeError as e:
        logger.error("redline_json_error", error=str(e), response_preview=response.content[:200])
        raise ValueError(f"LLM returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error("redline_error", error_type=type(e).__name__, error=str(e))
        raise ValueError(f"Redline generation failed: {str(e)}")


def _parse_redline_response(content: str) -> Dict[str, Any]:
    """Parse and clean LLM response for redlines."""
    import json
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


def _validate_operations(operations: List[RedlineOperation], draft: DraftResponse) -> List[RedlineOperation]:
    """Validate that operation targets exist in the current draft."""
    validated = []
    draft_text = _get_full_draft_text(draft)
    
    for op in operations:
        # Check if original_text exists in draft (for REPLACE and DELETE)
        if op.operation_type in (RedlineOperationType.REPLACE, RedlineOperationType.DELETE):
            if op.original_text and op.original_text not in draft_text:
                logger.warning("redline_validation_failed", 
                    operation_id=op.operation_id, 
                    reason="original_text not found in draft")
                continue  # Skip stale operations
        
        # Check for conflicts with already validated operations
        if _has_conflict(op, validated):
            logger.warning("redline_conflict_detected", operation_id=op.operation_id)
            continue
        
        validated.append(op)
    
    return validated


def _has_conflict(new_op: RedlineOperation, existing: List[RedlineOperation]) -> bool:
    """Check if a new operation conflicts with existing ones."""
    # Simple conflict detection: same target_location with overlapping operations
    for ex in existing:
        if ex.target_location == new_op.target_location:
            if ex.operation_type == RedlineOperationType.DELETE and new_op.operation_type != RedlineOperationType.INSERT:
                return True
            if ex.operation_type == RedlineOperationType.REPLACE and new_op.operation_type in (RedlineOperationType.REPLACE, RedlineOperationType.DELETE):
                return True
    return False


def _get_full_draft_text(draft: DraftResponse) -> str:
    """Get full text of draft for validation."""
    return "\n\n".join(f"{s.title}\n{s.content}" for s in draft.sections)


def apply_redline_operations(draft: DraftResponse, operations: List[RedlineOperation]) -> DraftResponse:
    """Apply accepted redline operations to a draft, returning a new draft."""
    # Get full text
    sections = [{"title": s.title, "content": s.content, "order": s.order, "is_placeholder": s.is_placeholder} 
                for s in draft.sections]
    
    # Build full text with section markers
    full_text = "\n\n".join(f"[[SECTION:{s['title']}]]\n{s['content']}" for s in sections)
    
    # Sort operations by position in text (approximate - we'd need better position tracking)
    # For now, apply in order but this is a simplification
    applied_text = full_text
    
    for op in operations:
        if op.operation_type == RedlineOperationType.REPLACE and op.original_text in applied_text:
            applied_text = applied_text.replace(op.original_text, op.proposed_text, 1)
        elif op.operation_type == RedlineOperationType.DELETE and op.original_text in applied_text:
            applied_text = applied_text.replace(op.original_text, "", 1)
        elif op.operation_type == RedlineOperationType.INSERT:
            # Insert at target location - find the section
            target_marker = f"[[SECTION:{op.target_location}]]"
            if target_marker in applied_text:
                idx = applied_text.index(target_marker) + len(target_marker) + 1
                applied_text = applied_text[:idx] + op.proposed_text + "\n" + applied_text[idx:]
    
    # Parse back to sections (simplified)
    new_sections = []
    parts = applied_text.split("[[SECTION:")
    for part in parts[1:]:
        if "]]" in part:
            title, content = part.split("]]", 1)
            new_sections.append(DraftSection(
                title=title.strip(),
                content=content.strip(),
                order=0,
                is_placeholder=False
            ))
    
    return DraftResponse(
        document_type=draft.document_type,
        title=draft.title,
        sections=new_sections,
        assumptions=draft.assumptions,
        warnings=draft.warnings,
        placeholders=draft.placeholders,
        review_status=draft.review_status,
        disclaimer=draft.disclaimer,
    )


# In-memory storage for redline decisions
_redline_store: Dict[str, Dict[str, Any]] = {}


async def apply_redline_decisions(request: RedlineDecisionsRequest) -> RedlineDecisionsResponse:
    """
    Apply user accept/reject decisions to redline operations.
    
    Args:
        request: RedlineDecisionsRequest with document hash and decisions
        
    Returns:
        RedlineDecisionsResponse with applied/rejected operations
    """
    # Retrieve stored redline operations for this document hash
    stored = _redline_store.get(request.document_hash)
    if not stored:
        raise ValueError(f"No redline operations found for document hash: {request.document_hash}")
    
    operations = stored["operations"]
    draft = stored["draft"]
    
    applied = []
    rejected = []
    conflicts = []
    
    # Build operation map
    op_map = {op.operation_id: op for op in operations}
    
    # Process decisions
    for decision in request.decisions:
        op = op_map.get(decision.operation_id)
        if not op:
            conflicts.append({"operation_id": decision.operation_id, "reason": "Operation not found"})
            continue
        
        if decision.accepted:
            applied.append(op.operation_id)
        else:
            rejected.append(op.operation_id)
    
    # Check for conflicts among accepted operations
    accepted_ops = [op for op in operations if op.operation_id in applied]
    if _has_conflicts_in_set(accepted_ops):
        conflicts.append({"reason": "Accepted operations have conflicts", "operations": [o.operation_id for o in accepted_ops]})
    
    # Apply accepted operations to draft
    updated_draft = None
    if applied:
        updated_draft = apply_redline_operations(draft, [op for op in operations if op.operation_id in applied])
    
    # Compute new document hash
    new_hash = compute_document_hash(updated_draft) if updated_draft else request.document_hash
    
    # Store updated state
    _redline_store[new_hash] = {
        "operations": [op for op in operations if op.operation_id not in applied],
        "draft": updated_draft or draft,
    }
    
    return RedlineDecisionsResponse(
        applied_operations=applied,
        rejected_operations=rejected,
        conflicts=conflicts,
        updated_draft=updated_draft,
        new_document_hash=new_hash,
    )


def _has_conflicts_in_set(operations: List[RedlineOperation]) -> bool:
    """Check if a set of operations has internal conflicts."""
    for i, op1 in enumerate(operations):
        for op2 in operations[i+1:]:
            if _has_conflict(op1, [op2]):
                return True
    return False


async def get_redline_preview(request: RedlinePreviewRequest) -> RedlinePreviewResponse:
    """
    Get preview of document with accepted redline changes.
    
    Args:
        request: RedlinePreviewRequest with document hash
        
    Returns:
        RedlinePreviewResponse with original and preview drafts
    """
    stored = _redline_store.get(request.document_hash)
    if not stored:
        raise ValueError(f"No redline state found for document hash: {request.document_hash}")
    
    original_draft = stored.get("original_draft", stored["draft"])
    current_draft = stored["draft"]
    operations = stored["operations"]
    
    # Build changes summary
    changes_summary = []
    for op in operations:
        changes_summary.append({
            "operation_id": op.operation_id,
            "type": op.operation_type.value,
            "location": op.target_location,
            "explanation": op.explanation,
        })
    
    return RedlinePreviewResponse(
        original_draft=original_draft,
        preview_draft=current_draft,
        changes_summary=changes_summary,
    )


def store_redline_state(document_hash: str, operations: List[RedlineOperation], draft: DraftResponse, original_draft: Optional[DraftResponse] = None) -> None:
    """Store redline state for later decision processing."""
    _redline_store[document_hash] = {
        "operations": operations,
        "draft": draft,
        "original_draft": original_draft or draft,
    }


def get_redline_state(document_hash: str) -> Optional[Dict[str, Any]]:
    """Retrieve stored redline state."""
    return _redline_store.get(document_hash)