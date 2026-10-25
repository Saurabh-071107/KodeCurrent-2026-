"""Opposition and counterargument analysis feature module."""
import json
import uuid
import structlog
from typing import Any, Dict, List, Optional

from app.config import get_settings
from app.core.model_router import get_router, LLMMessage
from app.features.document_management import get_document_chunks
from app.features.retriever_instance import get_retriever
from app.schemas import (
    OppositionComparisonRequest,
    OppositionComparisonResponse,
    PartyInfo,
)

logger = structlog.get_logger(__name__)


class OppositionAnalysisError(Exception):
    """Opposition analysis specific errors."""
    pass


OPPOSITION_ANALYSIS_SYSTEM_PROMPT = """You are an expert legal analyst specializing in Indian litigation. Compare client and opposition documents to identify strengths, weaknesses, and strategic insights.

CRITICAL RULES:
1. NEVER invent facts, citations, or allegations not present in the documents
2. Base ALL findings ONLY on the provided document texts
3. Clearly distinguish between: client's position, opposition's position, documentary evidence, court findings
4. Reference specific documents, pages, and paragraphs for every finding
5. Distinguish between: allegations, admissions, denials, documentary evidence, court findings
6. Flag contradictory versions rather than silently resolving them
7. NEVER recommend concealing adverse facts or misrepresenting evidence

ANALYSIS FOCUS:
- Client's key arguments and their evidentiary support
- Opposition's key arguments and their evidentiary support
- Opposition allegations unsupported by the supplied record
- Contradictions within the opposition's submissions
- Conflicts between opposition's pleadings and their evidence
- Material facts that appear admitted, denied, or disputed
- Potential evidentiary weaknesses in opposition case
- Client's claims that remain unanswered by opposition
- Potential weaknesses in client's own position
- Possible objections the opposition may raise to client's case
- Facts or documents that could undermine a proposed argument

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "client_arguments": ["string"],
  "opposition_arguments": ["string"],
  "unsupported_allegations": ["string"],
  "contradictions_in_opposition": ["string"],
  "conflicts_pleadings_evidence": ["string"],
  "admitted_facts": ["string"],
  "denied_facts": ["string"],
  "disputed_facts": ["string"],
  "evidentiary_weaknesses": ["string"],
  "unanswered_claims": ["string"],
  "client_weaknesses": ["string"],
  "possible_objections": ["string"],
  "evidence_gaps": ["string"],
  "confidence": "string"
}"""


def build_opposition_comparison_prompt(request, client_text: str, opposition_text: str, client_chunks, opposition_chunks) -> str:
    """Build the user prompt for opposition comparison."""
    parts = [
        "Compare the following client and opposition documents:\n",
        "CLIENT DOCUMENTS:\n",
        client_text[:15000],
        "\n\nOPPOSITION DOCUMENTS:\n",
        opposition_text[:15000],
        "\n\nANALYSIS REQUESTED:\n",
        "1. Identify client's key arguments and their evidentiary support\n",
        "2. Identify opposition's key arguments and their evidentiary support\n",
        "3. Identify opposition allegations UNSUPPORTED by the supplied record\n",
        "4. Identify CONTRADICTIONS within opposition's submissions\n",
        "5. Identify CONFLICTS between opposition's pleadings and their evidence\n",
        "6. Identify material facts that appear ADMITTED by opposition\n",
        "7. Identify material facts that appear DENIED by opposition\n",
        "8. Identify material facts that appear DISPUTED\n",
        "8. Identify EVIDENTIARY WEAKNESSES in opposition case\n",
        "9. Identify CLIENT CLAIMS UNANSWERED by opposition\n",
        "10. Identify POTENTIAL WEAKNESSES in client's own position\n",
        "11. Identify POSSIBLE OBJECTIONS opposition may raise to client's case\n",
        "12. Identify EVIDENCE GAPS in both sides' cases\n\n",
        "Return ONLY the JSON structure specified in the system prompt."
    ]
    return "".join(parts)


async def compare_client_opposition(request: 'OppositionComparisonRequest') -> 'OppositionComparisonResponse':
    """
    Compare client and opposition documents to identify strengths, weaknesses, and strategic insights.
    
    Args:
        request: OppositionComparisonRequest with case_id and document IDs
        
    Returns:
        OppositionComparisonResponse with detailed comparison analysis
    """
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Auto-discover documents from case workspace if IDs not provided
    if not request.client_document_ids and not request.opposition_document_ids and request.case_id:
        from app.features.case_workspace import list_case_documents
        docs = await list_case_documents(request.case_id)
        for doc in docs:
            party_side = str(doc.metadata.get("party_side", "")).lower()
            cat = str(doc.metadata.get("category", "")).lower()
            if "opposing" in cat or party_side in ("opposing", "opposition", "defendant", "respondent"):
                request.opposition_document_ids.append(doc.id)
            else:
                request.client_document_ids.append(doc.id)

    # Get client document chunks
    client_chunks = []
    for doc_id in request.client_document_ids:
        chunks = await get_document_chunks(doc_id)
        client_chunks.extend(chunks)
    
    # Get opposition document chunks
    opposition_chunks = []
    for doc_id in request.opposition_document_ids:
        chunks = await get_document_chunks(doc_id)
        opposition_chunks.extend(chunks)
    
    if not client_chunks and not opposition_chunks:
        raise ValueError("No documents found for comparison")
    
    # Combine text
    client_text = "\n\n".join(chunk.text for chunk in client_chunks)
    opposition_text = "\n\n".join(chunk.text for chunk in opposition_chunks)
    
    system_prompt = OPPOSITION_ANALYSIS_SYSTEM_PROMPT
    
    # Build prompts with actual content
    client_text_preview = client_text[:15000] if client_text else "No client documents provided"
    opposition_text_preview = opposition_text[:15000] if opposition_text else "No opposition documents provided"
    
    user_prompt = f"""Compare the following client and opposition documents:

CLIENT DOCUMENTS:
{client_text_preview}

OPPOSITION DOCUMENTS:
{opposition_text_preview}

Return ONLY the JSON structure specified in the system prompt."""

    messages = [
        LLMMessage(role="system", content=OPPOSITION_ANALYSIS_SYSTEM_PROMPT),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    try:
        logger.info("opposition_analysis_started", 
                   client_docs=len(client_chunks), 
                   opposition_docs=len(opposition_chunks))
        
        response = await adapter.chat(messages, temperature=0.2, max_tokens=6000)
        
        parsed = _parse_opposition_response(response.content)
        
        logger.info("opposition_analysis_completed")
        
        return OppositionComparisonResponse(
            case_id=request.case_id,
            client_arguments=parsed.get("client_arguments", []),
            opposition_arguments=parsed.get("opposition_arguments", []),
            unsupported_allegations=parsed.get("unsupported_allegations", []),
            contradictions_in_opposition=parsed.get("contradictions_in_opposition", []),
            conflicts_pleadings_evidence=parsed.get("conflicts_pleadings_evidence", []),
            admitted_facts=parsed.get("admitted_facts", []),
            denied_facts=parsed.get("denied_facts", []),
            disputed_facts=parsed.get("disputed_facts", []),
            evidentiary_weaknesses=parsed.get("evidentiary_weaknesses", []),
            unanswered_claims=parsed.get("unanswered_claims", []),
            client_weaknesses=parsed.get("client_weaknesses", []),
            possible_objections=parsed.get("possible_objections", []),
            evidence_gaps=parsed.get("evidence_gaps", []),
            confidence=parsed.get("confidence", ""),
        )
        
    except json.JSONDecodeError as e:
        logger.error("opposition_analysis_json_error", error=str(e))
        raise OppositionAnalysisError(f"LLM returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error("opposition_analysis_error", error_type=type(e).__name__, error=str(e))
        raise OppositionAnalysisError(f"Opposition analysis failed: {str(e)}")


def _parse_opposition_response(content: str) -> Dict[str, Any]:
    """Parse and clean LLM response for opposition analysis."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


import json