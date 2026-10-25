"""General legal AI assistant feature module."""
import json
from typing import Any, Dict, List, Optional

import structlog

from app.core.model_router import get_router, LLMMessage
from app.features.retriever_instance import get_retriever
from app.schemas import (
    LegalAssistantRequest,
    LegalAssistantResponse,
    CitationSource,
    RetrievalResult,
    Jurisdiction,
)

logger = structlog.get_logger(__name__)


class LegalAssistantError(Exception):
    """Legal assistant specific errors."""
    pass


LEGAL_ASSISTANT_SYSTEM_PROMPT = """You are a knowledgeable legal AI assistant. Provide accurate, well-sourced legal information.

CRITICAL RULES:
1. Provide general legal information ONLY - never legal advice for specific situations
2. Always cite sources when making legal claims
3. Distinguish between general legal principles and jurisdiction-specific rules
4. Ask for jurisdiction when it materially affects the answer
5. Clearly distinguish between settled law and areas of uncertainty
6. NEVER fabricate cases, statutes, citations, or legal authorities
7. If no authoritative source is available, say so explicitly

SOURCE HANDLING:
- Use provided legal sources when available
- If no sources configured, state limitations clearly
- Distinguish between: existence of authority, support for proposition, current validity
- Use statuses: VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED, NOT_CHECKED

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "answer": "Answer text with citations...",
  "sources": [
    {"title": "Source Title", "url": "https://...", "excerpt": "Relevant excerpt", "jurisdiction": "California"}
  ],
  "confidence": 0.8,
  "disclaimer": "Standard disclaimer text",
  "limitations": ["Limitation 1", "Limitation 2"],
  "follow_up_suggestions": ["Follow-up question 1", "Follow-up question 2"]
}"""


LEGAL_ASSISTANT_USER_PROMPT = """Answer the following legal question.

USER QUESTION: {question}

JURISDICTION: {jurisdiction}

CONVERSATION HISTORY:
{conversation_history}

RELEVANT LEGAL SOURCES:
{source_context}

Answer the question based on general legal principles and the provided sources. If jurisdiction is critical and not specified, note that. Distinguish general principles from jurisdiction-specific rules. Include citations. Return ONLY the JSON structure specified in the system prompt."""


async def answer_legal_question(request: LegalAssistantRequest) -> LegalAssistantResponse:
    """
    Answer a general legal question using authoritative sources.
    
    Args:
        request: LegalAssistantRequest with question and context
        
    Returns:
        LegalAssistantResponse with answer and sources
    """
    router = get_router()
    adapter = router.primary
    retriever = get_retriever()
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Retrieve relevant legal sources if available
    source_context = "No authoritative legal sources configured. General principles only."
    sources: List[CitationSource] = []
    
    # Try to retrieve from configured legal sources
    try:
        if hasattr(retriever, 'embedding_retriever') and retriever.embedding_retriever._enabled:
            # Could add legal-specific retrieval here
            pass
    except Exception:
        pass  # Sources not configured
    
    # Build context
    jurisdiction_str = request.jurisdiction.value if request.jurisdiction else "Not specified (please specify for accurate answer)"
    
    conversation_history = ""
    if request.conversation_history:
        history_parts = []
        for msg in request.conversation_history[-5:]:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            conversation_history += f"{role}: {content}\n"
    
    # Build prompt
    system_prompt = LEGAL_ASSISTANT_SYSTEM_PROMPT
    user_prompt = LEGAL_ASSISTANT_USER_PROMPT.format(
        question=request.question,
        jurisdiction=jurisdiction_str,
        conversation_history=conversation_history,
        source_context=source_context,
    )
    
    messages = [
        LLMMessage(role="system", content=LEGAL_ASSISTANT_SYSTEM_PROMPT),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    try:
        logger.info(
            "legal_assistant_started",
            question=request.question[:100],
            jurisdiction=request.jurisdiction.value if request.jurisdiction else "unspecified",
        )
        
        response = await adapter.chat(messages, temperature=0.3, max_tokens=4096)
        
        parsed = _parse_legal_response(response.content)
        
        # Build default disclaimer
        disclaimer = parsed.get("disclaimer", 
            "This is general legal information, not legal advice. "
            "Consult a qualified attorney for your specific situation.")
        
        # Add jurisdiction-specific disclaimer if needed
        if not request.jurisdiction:
            disclaimer += " This answer is based on general legal principles; jurisdiction-specific rules may differ."
        
        limitations = parsed.get("limitations", [])
        if not request.jurisdiction:
            limitations.append("Jurisdiction not specified; answer based on general principles only.")
        if not parsed.get("sources"):
            limitations.append("No authoritative sources configured; answer based on general legal knowledge only.")
        
        follow_ups = parsed.get("follow_up_suggestions", [])
        if not follow_ups:
            follow_ups = _generate_follow_ups(request.question)
        
        logger.info(
            "legal_assistant_completed",
            question=request.question[:100],
            jurisdiction=request.jurisdiction.value if request.jurisdiction else "unspecified",
            sources_count=len(parsed.get("sources", [])),
        )
        
        return LegalAssistantResponse(
            question=request.question,
            answer=parsed.get("answer", "I couldn't generate an answer. Please try rephrasing your question."),
            jurisdiction=request.jurisdiction.value if request.jurisdiction else None,
            sources=parsed.get("sources", []),
            confidence=parsed.get("confidence", 0.7),
            disclaimer=disclaimer,
            limitations=limitations,
            follow_up_suggestions=parsed.get("follow_up_suggestions", _generate_follow_ups(request.question)),
        )
        
    except json.JSONDecodeError as e:
        logger.error("legal_assistant_json_error", error=str(e))
        # Fallback response
        return LegalAssistantResponse(
            question=request.question,
            answer="I encountered an error processing your question. Please try rephrasing.",
            jurisdiction=request.jurisdiction.value if request.jurisdiction else None,
            sources=[],
            confidence=0.3,
            disclaimer="This is general legal information, not legal advice. Consult a qualified attorney for your specific situation.",
            limitations=["Error processing request; answer may be incomplete."],
            follow_up_suggestions=["Try rephrasing your question", "Specify a jurisdiction for more accurate answer"],
        )
    except Exception as e:
        logger.error("legal_assistant_error", error_type=type(e).__name__, error=str(e))
        raise ValueError(f"Legal assistant failed: {str(e)}")


def _parse_legal_response(content: str) -> Dict[str, Any]:
    """Parse and clean LLM response for legal assistant."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


def _generate_follow_ups(question: str) -> List[str]:
    """Generate follow-up question suggestions."""
    return [
        "Can you explain how this applies in [specific jurisdiction]?",
        "What are the exceptions to this rule?",
        "What are the practical implications?",
        "What are the relevant statutes or cases?",
    ]


import json