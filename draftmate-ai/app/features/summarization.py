"""Document summarization feature module."""
import json
from typing import Any, Dict, List, Optional

import structlog

from app.core.model_router import get_router, LLMMessage
from app.features.document_management import get_document_chunks
from app.schemas import (
    SummarizationRequest,
    SummarizationResponse,
    RetrievalResult,
)

logger = structlog.get_logger(__name__)


class SummarizationError(Exception):
    """Summarization specific errors."""
    pass


SUMMARIZATION_SYSTEM_PROMPT = """You are an expert legal document summarizer. Create concise, accurate summaries of legal documents.

CRITICAL RULES:
1. Base the summary ONLY on the provided document text
2. Do NOT invent facts, names, dates, amounts, or legal conclusions
3. Include page/section references when available
4. Flag when information is missing or unclear
5. Distinguish between facts in the document and your analysis

SUMMARY FOCUS AREAS:
- Key facts, parties, and their roles
- Important dates and deadlines
- Key obligations and commitments
- Potential risks and issues
- Legal citations and authorities referenced
- Unresolved placeholders or missing information

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "summary": "Concise summary text...",
  "key_facts": ["fact 1", "fact 2"],
  "parties": ["Party A - role", "Party B - role"],
  "key_dates": ["2024-01-15: Move-out date", "2024-02-01: Deadline"],
  "obligations": ["Party A must pay $X by date", "Party B must deliver Y"],
  "risks": ["Risk description with reference"],
  "citations": ["Legal citation 1", "Legal citation 2"],
  "references": ["Section 1, para 2", "Page 3"],
  "warnings": ["Warning about limitations"]
}"""


def build_summarization_prompt(request: 'SummarizationRequest', document_text: str, chunks: List[Dict[str, Any]]) -> str:
    """Build the user prompt for summarization."""
    parts = [
        f"Summarize the following legal document ({request.detail_level} detail level):\n",
        f"DOCUMENT TEXT:\n{document_text[:20000]}\n\n",
    ]
    
    if request.focus_areas:
        parts.append("FOCUS AREAS:")
        for area in request.focus_areas:
            parts.append(f"  - {area}")
        parts.append("")
    
    parts.append("\nReturn ONLY the JSON structure specified in the system prompt.")
    
    return "".join(parts)


async def summarize_document(request: SummarizationRequest) -> SummarizationResponse:
    """
    Generate a summary of an uploaded legal document.
    
    Args:
        request: SummarizationRequest with document_id and options
        
    Returns:
        SummarizationResponse with summary and extracted information
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
    system_prompt = SUMMARIZATION_SYSTEM_PROMPT
    user_prompt = build_summarization_prompt(request, document_text, [])
    
    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    try:
        logger.info(
            "summarization_started",
            document_id=request.document_id,
            detail_level=request.detail_level,
            chunks=len(chunks),
        )
        
        response = await adapter.chat(messages, temperature=0.2, max_tokens=4096)
        
        # Parse JSON response
        parsed = _parse_summarization_response(response.content)
        
        # Extract citations from chunks
        citations = _extract_citations_from_chunks(chunks)
        
        # Extract references
        references = _extract_references(chunks)
        
        logger.info(
            "summarization_completed",
            document_id=request.document_id,
            summary_length=len(parsed.get("summary", "")),
        )
        
        return SummarizationResponse(
            document_id=request.document_id,
            summary=parsed.get("summary", ""),
            detail_level=request.detail_level,
            key_facts=parsed.get("key_facts", []),
            parties=parsed.get("parties", []),
            key_dates=parsed.get("key_dates", []),
            obligations=parsed.get("obligations", []),
            risks=parsed.get("risks", []),
            citations=citations,
            references=references,
            warnings=parsed.get("warnings", []),
        )
        
    except json.JSONDecodeError as e:
        logger.error("summarization_json_error", error=str(e), response_preview=response.content[:200])
        raise ValueError(f"LLM returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error("summarization_error", error_type=type(e).__name__, error=str(e))
        raise ValueError(f"Summarization failed: {str(e)}")


def _parse_summarization_response(content: str) -> Dict[str, Any]:
    """Parse and clean LLM response for summarization."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


def _extract_citations_from_chunks(chunks: List[Any]) -> List[str]:
    """Extract legal citations from document chunks."""
    import re
    
    full_text = "\n\n".join(chunk.text if hasattr(chunk, "text") else chunk.get("text", "") for chunk in chunks)
    citations = []
    
    # Statute patterns
    statute_patterns = [
        r'\b\d+\s+[A-Z][a-z]+\.?\s+(?:Code|Stat(?:utes)?|Annotated)\s+§\s*\d+(?:\.\d+)*(?:\([^)]+\))*',
        r'\b(?:U\.?S\.?C\.?|U\.?S\.?\s+Code)\s+§\s*\d+(?:\.\d+)*',
        r'\b(?:C\.?F\.?R\.?|C\.?\s*F\.?\s*R\.?)\s+§\s*\d+(?:\.\d+)*',
    ]
    
    # Case patterns
    case_patterns = [
        r'\b[A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+,?\s+\d+\s+[A-Z][a-z]+\.?\s+\d+\s+\(\d{4}\)',
    ]
    
    for pattern in statute_patterns + case_patterns:
        for match in re.finditer(pattern, full_text, re.IGNORECASE):
            citations.append(match.group(0).strip())
    
    return list(set(citations))[:20]  # Deduplicate and limit


def _extract_references(chunks: List[Any]) -> List[str]:
    """Extract page/section references from chunks."""
    references = []
    for chunk in chunks:
        meta = chunk.metadata if hasattr(chunk, "metadata") else chunk.get("metadata", {})
        page = getattr(chunk, "page_number", None) or (meta.get("page_number") if isinstance(meta, dict) else None)
        src = getattr(chunk, "source_filename", None) or (chunk.get("source_filename") if isinstance(chunk, dict) else None)
        if page and src:
            references.append(f"Page {page} ({src})")
        elif page:
            references.append(f"Page {page}")
        elif src:
            references.append(f"Source: {src}")
    return list(set(references))[:20]


import hashlib