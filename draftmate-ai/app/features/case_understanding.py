"""Case understanding and chronology feature module."""
import json
import uuid
import structlog
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.config import get_settings
from app.core.model_router import get_router, LLMMessage
from app.features.document_management import get_document_chunks
from app.features.retriever_instance import get_retriever
from app.schemas import (
    CaseBriefRequest,
    CaseBriefResponse,
    PartyInfo,
    DateInfo,
    FactExtractionResponse,
    ExtractedFact,
    PartyRoleInfo,
    DateInfo,
    ReviewFinding,
    FindingCategory,
    FindingSeverity,
)

logger = structlog.get_logger(__name__)


class CaseUnderstandingError(Exception):
    """Case understanding specific errors."""
    pass


CASE_BRIEF_SYSTEM_PROMPT = """You are an expert legal analyst specializing in Indian law. Analyze uploaded case documents and create a comprehensive case brief with chronological timeline.

CRITICAL RULES:
1. Base ALL analysis ONLY on the provided document text
2. NEVER invent facts, names, dates, amounts, or legal conclusions
2. Clearly distinguish between: allegations, admissions, denials, documentary evidence, court findings, and AI-generated hypotheses
3. Reference specific documents, pages, and sections for every finding
4. Flag conflicting versions of facts rather than silently resolving them
3. Distinguish between: allegations, admissions, denials, documentary evidence, court findings
4. Identify what is missing, not just what is present

ANALYSIS FOCUS:
- Parties and their roles (claimant, defendant, petitioner, respondent, etc.)
- Court, jurisdiction, case type
- Claims, defences, relief sought
- Material facts vs disputed facts
- Procedural history and court orders
- Important dates and deadlines
- Evidence associated with each material proposition
- Admissions, denials, inconsistencies between documents
- Missing documents or information needed

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "case_name": "string",
  "parties": [{"name": "string", "role": "claimant|respondent|plaintiff|defendant|petitioner|respondent_petition|sender|recipient|lessor|lessee|licensor|licensee|party_a|party_b|other", "confidence": 0.0-1.0, "reasoning": "string"}],
  "court": "string or null",
  "jurisdiction": "string or null",
  "case_type": "string or null",
  "case_number": "string or null",
  "claims": ["string"],
  "defences": ["string"],
  "relief_sought": ["string"],
  "material_facts": ["string"],
  "disputed_facts": ["string"],
  "procedural_history": ["string"],
  "important_dates": [{"date": "YYYY-MM-DD", "description": "string", "is_approximate": true/false}],
  "evidence_summary": ["string"],
  "admissions": ["string"],
  "denials": ["string"],
  "inconsistencies": ["string"],
  "missing_information": ["string"],
  "timeline": [{"date": "YYYY-MM-DD", "event": "string", "source_doc": "doc_id", "page": 1}],
  "evidence_map": {"proposition": ["chunk_id1", "chunk_id2"]},
  "missing_documents": ["string"],
  "confidence_assessment": "string"
}"""


def build_case_brief_prompt(request, document_text: str, chunks) -> str:
    """Build the user prompt for case brief generation."""
    parts = [
        f"Analyze the following case documents and create a comprehensive case brief with chronological timeline:\n",
        f"DOCUMENT TEXT:\n{document_text[:25000]}\n\n",
    ]
    
    if request.include_opposition_analysis:
        parts.append("INCLUDE OPPOSITION ANALYSIS:\n")
        parts.append("- Compare client and opposition positions\n")
        parts.append("- Identify unsupported allegations by opposition\n")
        parts.append("- Find contradictions in opposition submissions\n\n")
    
    if request.include_legal_research:
        parts.append("INCLUDE LEGAL RESEARCH SUGGESTIONS:\n")
        parts.append("- Identify relevant constitutional provisions\n")
        parts.append("- Identify applicable statutes and rules\n")
        parts.append("- Identify relevant precedents\n\n")
    
    parts.append("\nReturn ONLY the JSON structure specified in the system prompt.")
    
    return "".join(parts)


def _parse_case_brief_response(content: str) -> Dict[str, Any]:
    """Parse and clean LLM response for case brief."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


async def generate_case_brief(request: 'CaseBriefRequest') -> 'CaseBriefResponse':
    """
    Generate a case brief with chronological timeline from uploaded documents.
    
    Args:
        request: CaseBriefRequest with case_id and options
        
    Returns:
        CaseBriefResponse with case brief and chronology
    """
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Get document chunks for the case
    chunks = await get_case_documents_chunks(request.case_id)
    if not chunks:
        raise ValueError(f"No processed documents found for case {request.case_id}")
    
    # Combine text from chunks
    document_text = "\n\n".join(chunk.text for chunk in chunks)
    
    # Build prompts
    system_prompt = CASE_BRIEF_SYSTEM_PROMPT
    user_prompt = build_case_brief_prompt(request, document_text, chunks)
    
    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    try:
        logger.info("case_brief_started", case_id=request.case_id)
        
        response = await adapter.chat(messages, temperature=0.2, max_tokens=8192)
        
        # Parse JSON response
        parsed = _parse_case_brief_response(response.content)
        
        # Convert to response model
        timeline = parsed.get("timeline", [])
        for item in timeline:
            item["date"] = item.get("date", "")
            item["event"] = item.get("event", "")
            item["source_doc"] = item.get("source_doc", "")
            item["page"] = item.get("page")
        
        response_obj = CaseBriefResponse(
            case_id=request.case_id,
            case_name=parsed.get("case_name", "Unknown"),
            parties=[PartyInfo(**p) for p in parsed.get("parties", [])],
            court=parsed.get("court"),
            jurisdiction=parsed.get("jurisdiction"),
            case_type=parsed.get("case_type"),
            case_number=parsed.get("case_number"),
            claims=parsed.get("claims", []),
            defences=parsed.get("defences", []),
            relief_sought=parsed.get("relief_sought", []),
            material_facts=parsed.get("material_facts", []),
            disputed_facts=parsed.get("disputed_facts", []),
            procedural_history=parsed.get("procedural_history", []),
            important_dates=[DateInfo(**d) for d in parsed.get("important_dates", [])],
            evidence_summary=parsed.get("evidence_summary", []),
            admissions=parsed.get("admissions", []),
            denials=parsed.get("denials", []),
            inconsistencies=parsed.get("inconsistencies", []),
            missing_information=parsed.get("missing_information", []),
            timeline=timeline,
            evidence_map=parsed.get("evidence_map", {}),
            missing_documents=parsed.get("missing_documents", []),
            confidence_assessment=parsed.get("confidence_assessment", ""),
        )
        
        logger.info("case_brief_completed", case_id=request.case_id)
        return response_obj
        
    except json.JSONDecodeError as e:
        logger.error("case_brief_json_error", error=str(e))
        raise CaseUnderstandingError(f"LLM returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error("case_brief_error", error_type=type(e).__name__, error=str(e))
        raise CaseUnderstandingError(f"Case brief generation failed: {str(e)}")


async def get_case_documents_chunks(case_id: str):
    """Get all chunks for all documents in a case."""
    from app.features.case_workspace import get_case_documents_chunks as _get_chunks
    return await _get_chunks(case_id)


# Need to import at the end to avoid circular imports
import json