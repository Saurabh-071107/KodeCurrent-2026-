"""Document-specific Q&A feature module."""
import json
from typing import Any, Dict, List, Optional

import structlog

from app.core.model_router import get_router, LLMMessage
from app.features.retriever_instance import get_retriever
from app.features.retrieval import format_retrieval_context
from app.schemas import (
    DocumentQARequest,
    DocumentQAResponse,
    RetrievalResult,
    FactExtractionResponse,
)

logger = structlog.get_logger(__name__)


class DocumentQAError(Exception):
    """Document Q&A specific errors."""
    pass


DOCUMENT_QA_SYSTEM_PROMPT = """You are a legal document Q&A assistant. Answer questions about uploaded legal documents.

CRITICAL RULES:
1. Base answers ONLY on the provided document excerpts
2. If the document doesn't contain enough information, explicitly say so
3. Include source references (document name, page/section) for all claims
3. Do NOT invent facts, legal conclusions, or information not in the document
4. Distinguish between what the document says and what you infer
5. If uncertain, express uncertainty explicitly

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "answer": "Answer text based on document...",
  "sources": [
    {"chunk_id": "chunk_id", "document_id": "doc_id", "text": "excerpt", "score": 0.9, "source_filename": "doc.pdf", "page_number": 3, "file_type": "pdf", "metadata": {}}
  ],
  "confidence": 0.85,
  "insufficient_evidence": false,
  "follow_up_suggestions": ["Follow-up question 1", "Follow-up question 2"]
}"""


DOCUMENT_QA_USER_PROMPT = """Answer the following question about the uploaded document.

DOCUMENT CONTEXT:
{document_context}

RELEVANT EXCERPTS:
{retrieval_context}

CONVERSATION HISTORY:
{conversation_history}

USER QUESTION: {question}

Answer the question based ONLY on the provided excerpts. If the document doesn't contain enough information to answer, explicitly state what's missing and what would be needed. Include source references for all claims. Return ONLY the JSON structure specified in the system prompt."""


async def answer_document_question(request: DocumentQARequest) -> DocumentQAResponse:
    """
    Answer a question about an uploaded document.
    
    Args:
        request: DocumentQARequest with document_id, question, and context
        
    Returns:
        DocumentQAResponse with answer and supporting evidence
    """
    retriever = get_retriever()
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Retrieve relevant chunks
    results = retriever.retrieve(
        query=request.question,
        top_k=8,
        document_ids=[request.document_id] if request.document_id else None,
    )
    
    if not results:
        logger.warning("document_qa_no_results", document_id=request.document_id, question=request.question[:50])
        return DocumentQAResponse(
            document_id=request.document_id or "",
            question=request.question,
            answer="I couldn't find any relevant information in the uploaded document to answer your question. The document may not contain information about this topic, or it may not have been processed yet.",
            sources=[],
            confidence=0.1,
            insufficient_evidence=True,
            follow_up_suggestions=[
                "Try rephrasing your question",
                "Upload additional relevant documents",
                "Check if the document was processed correctly"
            ],
        )
    
    # Format retrieval context for LLM
    retrieval_context = format_retrieval_context(results)
    
    # Build document context
    document_context = ""
    if results:
        doc_ids = set(r.document_id for r in results)
        document_context = f"Document(s): {', '.join(set(r.source_filename for r in results))}"
    
    # Build conversation history
    conversation_history = ""
    if request.conversation_history:
        history_parts = []
        for msg in request.conversation_history[-5:]:  # Last 5 turns
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            history_parts.append(f"{role}: {content}")
        conversation_history = "\n".join(history_parts)
    
    # Build prompt
    retrieval_context_text = format_retrieval_context(results)
    system_prompt = DOCUMENT_QA_SYSTEM_PROMPT
    user_prompt = DOCUMENT_QA_USER_PROMPT.format(
        document_context=document_context,
        retrieval_context=retrieval_context_text,
        conversation_history=conversation_history,
        question=request.question,
    )
    
    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    try:
        logger.info(
            "document_qa_started",
            document_id=request.document_id,
            question=request.question[:100],
            chunks_retrieved=len(results),
        )
        
        response = await adapter.chat(messages, temperature=0.2, max_tokens=2048)
        
        parsed = _parse_qa_response(response.content)
        
        # Validate sources against retrieved results
        validated_sources = _validate_sources(parsed.get("sources", []), results)
        
        # Determine confidence
        confidence = parsed.get("confidence", 0.8)
        if not validated_sources:
            confidence = min(confidence, 0.5)
        
        # Check for insufficient evidence
        insufficient = parsed.get("insufficient_evidence", False)
        if not validated_sources:
            insufficient = True
        
        # Generate follow-up suggestions
        follow_ups = parsed.get("follow_up_suggestions", [])
        if not follow_ups:
            follow_ups = _generate_follow_up_suggestions(request.question, results)
        
        logger.info(
            "document_qa_completed",
            document_id=request.document_id,
            sources_used=len(validated_sources),
            confidence=confidence,
        )
        
        return DocumentQAResponse(
            document_id=request.document_id or "",
            question=request.question,
            answer=parsed.get("answer", "I couldn't generate an answer based on the available information."),
            sources=validated_sources,
            confidence=confidence,
            insufficient_evidence=insufficient,
            follow_up_suggestions=follow_ups,
        )
        
    except json.JSONDecodeError as e:
        logger.error("document_qa_json_error", error=str(e), response_preview=response.content[:200])
        # Fallback response
        return DocumentQAResponse(
            document_id=request.document_id or "",
            question=request.question,
            answer="I encountered an error processing your question. Please try rephrasing or try again.",
            sources=results[:3] if results else [],
            confidence=0.3,
            insufficient_evidence=True,
            follow_up_suggestions=["Try rephrasing your question", "Try a more specific question"],
        )
    except Exception as e:
        logger.error("document_qa_error", error_type=type(e).__name__, error=str(e))
        raise ValueError(f"Document Q&A failed: {str(e)}")


def _parse_qa_response(content: str) -> Dict[str, Any]:
    """Parse and clean LLM response for Q&A."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


def _validate_sources(llm_sources: List[Dict[str, Any]], results: List[RetrievalResult]) -> List[RetrievalResult]:
    """Validate LLM-provided sources against actual retrieved results."""
    validated = []
    result_map = {r.chunk_id: r for r in results}
    
    for src in llm_sources:
        chunk_id = src.get("chunk_id")
        if chunk_id and chunk_id in result_map:
            validated.append(result_map[chunk_id])
    
    # If LLM didn't provide valid sources, use top results
    if not validated and results:
        return results[:3]
    
    return validated


def _generate_follow_up_suggestions(question: str, results: List[RetrievalResult]) -> List[str]:
    """Generate follow-up question suggestions based on question and results."""
    suggestions = [
        "Can you elaborate on that?",
        "What are the key dates mentioned?",
        "What are the main obligations?",
        "Are there any deadlines mentioned?",
    ]
    return suggestions[:3]


import json