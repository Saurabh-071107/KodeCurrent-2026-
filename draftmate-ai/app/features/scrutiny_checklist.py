"""Scrutiny checklist feature module."""
import uuid
import structlog
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.config import get_settings
from app.core.model_router import get_router, LLMMessage
from app.features.document_management import get_document_chunks
from app.features.retriever_instance import get_retriever
from app.schemas import (
    ScrutinyChecklistRequest,
    ScrutinyChecklistResponse,
    ScrutinyChecklistItem,
    FindingSeverity,
    ReviewFinding,
    FactExtractionResponse,
    DraftResponse,
)

logger = structlog.get_logger(__name__)


class ScrutinyChecklistError(Exception):
    """Scrutiny checklist specific errors."""
    pass


SCRUTINY_CHECKLIST_SYSTEM_PROMPT = """You are an expert legal reviewer conducting a comprehensive scrutiny of legal documents for Indian litigation.

Run a systematic checklist across ALL categories A-F. For each item, return a status: PASS, ISSUE_FOUND, NEEDS_REVIEW, or NOT_APPLICABLE.

CHECKLIST CATEGORIES:

A. FACTS AND PLEADINGS:
A.1 Conflicting facts, dates, names, amounts
A.2 Missing material facts
A.3 Admissions and denials
A.4 Internal contradictions
A.5 Inconsistency between pleadings and supporting documents

B. EVIDENCE:
B.1 Unsupported factual assertions
B.2 Missing annexures or referenced documents
B.3 Inconsistencies between evidence and pleadings
B.4 Potential authenticity, admissibility, chain-of-custody questions
B.5 Missing corroboration and evidentiary gaps
B.6 Burden and standard of proof where applicable

C. LEGAL RESEARCH:
C.1 Incorrect or incomplete citations
C.2 Statutory amendments and applicable versions
C.3 Constitutional applicability
C.4 Relevant binding and persuasive precedents
C.5 Adverse authority and distinguishing facts
C.6 Subsequent treatment and current validity where verifiable
C.7 Unsupported legal propositions

D. PROCEDURE:
D.1 Jurisdiction and maintainability
D.2 Limitation and delay
D.3 Standing and locus where applicable
D.4 Procedural compliance and filing requirements
D.5 Burden of proof and relevant procedural objections
D.6 Available remedies and relief

E. ARGUMENT QUALITY:
E.1 Logical gaps and unsupported inferences
E.2 Missing elements of a legal test
E.3 Weak causal connections
E.4 Counterarguments and rebuttals
E.5 Inconsistent positions
E.6 Unaddressed adverse facts
E.7 Overstatement or mischaracterization of authority
E.8 Questions the judge may raise
E.9 Points requiring additional evidence or lawyer confirmation

F. FINAL PREPARATION:
F.1 Prioritized issues for oral argument
F.2 Draft written-submission outline
F.3 Potential questions from the bench
F.4 Concise responses for counsel to evaluate
F.4 Documents and authorities to keep ready
F.5 Unresolved research tasks

RULES:
1. NEVER mark PASS unless you have verified the item from the documents
2. Mark ISSUE_FOUND when you identify a specific problem
3. Mark NEEDS_REVIEW when information is insufficient to determine
4. Mark NOT_APPLICABLE when the item doesn't apply to this case type
5. Each item MUST include: item_id, category, sub_category, description, status, explanation, evidence_reference, severity
6. Provide a summary with counts by category and overall status

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "items": [
    {
      "item_id": "check_A1",
      "category": "A",
      "sub_category": "A.1",
      "description": "Conflicting facts, dates, names, amounts",
      "status": "PASS|ISSUE_FOUND|NEEDS_REVIEW|NOT_APPLICABLE",
      "explanation": "Detailed explanation of finding",
      "evidence_reference": "doc_id:chunk_id or section reference",
      "severity": "critical|high|medium|low|info"
    }
  ]
}"""


SCRUTINY_CHECKLIST_USER_PROMPT = """Run a comprehensive scrutiny checklist on the following case materials.

CASE INFORMATION:
{case_info}

DRAFT DOCUMENT (if provided):
{draft_text}

FACTS:
{facts_text}

EVIDENCE/DOCUMENTS:
{evidence_text}

JURISDICTION: {jurisdiction}

Run the complete scrutiny checklist (Categories A-F). For each item, provide: item_id, category, sub_category, description, status (PASS/ISSUE_FOUND/NEEDS_REVIEW/NOT_APPLICABLE), explanation, evidence_reference, severity.

Return ONLY the JSON structure specified in the system prompt."""


def build_scrutiny_prompt(case_info: str, draft_text: str, facts_text: str, evidence_text: str, jurisdiction: str) -> str:
    """Build the user prompt for scrutiny checklist."""
    parts = [
        f"Run comprehensive scrutiny checklist on the following case materials:\n",
        f"CASE INFORMATION:\n{case_info}\n\n",
        f"DRAFT DOCUMENT:\n{draft_text[:10000]}\n\n",
        f"FACTS:\n{facts_text}\n\n",
        f"EVIDENCE/DOCUMENTS:\n{evidence_text[:15000]}\n\n",
        f"JURISDICTION: {jurisdiction}\n\n",
        "Run complete scrutiny checklist (Categories A-F). Return ONLY the JSON structure specified."
    ]
    return "\n".join(parts)


async def run_scrutiny_checklist(request: 'ScrutinyChecklistRequest') -> 'ScrutinyChecklistResponse':
    """
    Run comprehensive scrutiny checklist on case materials.
    
    Args:
        request: ScrutinyChecklistRequest with case_id, optional draft, and categories
        
    Returns:
        ScrutinyChecklistResponse with all checklist items and summary
    """
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Gather case materials
    case_chunks = []
    draft_text = ""
    facts_text = ""
    evidence_text = ""
    
    if request.draft_document_id:
        from app.features.document_management import get_document_chunks
        chunks = await get_document_chunks(request.draft_document_id)
        for chunk in chunks:
            if "draft" in chunk.metadata.get("document_type", "").lower():
                draft_text += chunk.text + "\n\n"
            else:
                case_chunks.append(chunk)
    
    if request.case_id:
        from app.features.case_workspace import get_case_documents_chunks
        chunks = await get_case_documents_chunks(request.case_id)
        for chunk in chunks:
            if not any(c.chunk_id == chunk.chunk_id for chunk in case_chunks):
                case_chunks.append(chunk)
    
    # Build facts text
    from app.features.document_management import get_document_store
    store = get_document_store()
    
    facts_text = "Facts from case documents:\n"
    for chunk in case_chunks:
        facts_text += f"- {chunk.text[:500]}... (from {chunk.source_filename}, p.{chunk.page_number})\n"
    
    evidence_text = ""
    for chunk in case_chunks:
        evidence_text += f"[{chunk.chunk_id}] {chunk.text[:300]}... (Source: {chunk.source_filename}, p.{chunk.page_number})\n\n"
    
    # Build case info
    case_info = f"Case ID: {request.case_id}"
    jurisdiction = "India"
    
    # Build prompts
    system_prompt = SCRUTINY_CHECKLIST_SYSTEM_PROMPT
    user_prompt = build_scrutiny_prompt("", "", "", "", "")
    
    user_prompt = f"""Run a comprehensive scrutiny checklist on the following case materials.

CASE INFORMATION:
{request.case_id}

DRAFT DOCUMENT:
Not provided in this request

FACTS:
{facts_text[:5000]}

EVIDENCE/DOCUMENTS:
{evidence_text[:10000]}

JURISDICTION: India

Run the complete scrutiny checklist (Categories A-F). For each item, provide: item_id, category, sub_category, description, status (PASS/ISSUE_FOUND/NEEDS_REVIEW/NOT_APPLICABLE), explanation, evidence_reference, severity.

Return ONLY the JSON structure specified in the system prompt."""
    
    messages = [
        LLMMessage(role="system", content=SCRUTINY_CHECKLIST_SYSTEM_PROMPT),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    try:
        logger.info("scrutiny_checklist_started", case_id=request.case_id)
        
        response = await adapter.chat(messages, temperature=0.2, max_tokens=8192)
        
        parsed = _parse_scrutiny_response(response.content)
        
        # Validate findings
        items = [ScrutinyChecklistItem.model_validate(item) for item in parsed.get("items", [])]
        
        # Build summary
        summary = _build_scrutiny_summary(items)
        
        # Determine overall status
        overall_status = _determine_overall_status(items)
        
        # Compute document hash
        document_hash = _compute_document_hash(request.draft_document_id or request.case_id or "case_scrutiny")
        
        logger.info("scrutiny_checklist_completed", 
                   case_id=request.case_id,
                   items_count=len(items),
                   overall_status=overall_status)
        
        return ScrutinyChecklistResponse(
            case_id=request.case_id,
            items=items,
            summary=summary,
            overall_status=overall_status,
            document_hash=document_hash,
        )
        
    except json.JSONDecodeError as e:
        logger.error("scrutiny_checklist_json_error", error=str(e))
        raise ScrutinyChecklistError(f"LLM returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error("scrutiny_checklist_error", error_type=type(e).__name__, error=str(e))
        raise ScrutinyChecklistError(f"Scrutiny checklist failed: {str(e)}")


def _parse_scrutiny_response(content: str) -> Dict[str, Any]:
    """Parse and clean LLM response for scrutiny checklist."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


def _build_scrutiny_summary(items: List[ScrutinyChecklistItem]) -> dict:
    """Build summary statistics from checklist items."""
    by_category: Dict[str, int] = {}
    by_status: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}
    
    for item in items:
        by_category[item.category] = by_category.get(item.category, 0) + 1
        by_status[item.status] = by_status.get(item.status, 0) + 1
        by_severity[item.severity.value] = by_severity.get(item.severity.value, 0) + 1
    
    return {
        "total_items": len(items),
        "by_category": by_category,
        "by_status": by_status,
        "by_severity": by_severity,
    }


def _determine_overall_status(items: List[ScrutinyChecklistItem]) -> str:
    """Determine overall checklist status."""
    issue_count = sum(1 for i in items if i.status == "ISSUE_FOUND")
    needs_review_count = sum(1 for i in items if i.status == "NEEDS_REVIEW")
    critical_issues = sum(1 for i in items if i.status == "ISSUE_FOUND" and i.severity == FindingSeverity.CRITICAL)
    
    if critical_issues > 0:
        return "CRITICAL_ISSUES"
    elif issue_count > 0:
        return "ISSUES_FOUND"
    elif needs_review_count > 0:
        return "NEEDS_REVIEW"
    else:
        return "PASS"


def _compute_document_hash(document_id: str) -> str:
    """Compute hash of document for staleness detection."""
    import hashlib
    # In a real implementation, would fetch document and hash it
    return hashlib.sha256(document_id.encode()).hexdigest()[:16]


import json
import hashlib