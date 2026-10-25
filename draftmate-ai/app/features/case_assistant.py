"""Case-specific conversational assistant module."""
import json
import structlog
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.config import get_settings
from app.core.model_router import get_router, LLMMessage
from app.features.case_workspace import get_case_documents_chunks
from app.features.retriever_instance import get_retriever
from app.schemas import (
    CaseAssistantRequest,
    CaseAssistantResponse,
    RetrievalResult,
    CitationSource,
    RedlineOperation,
    RedlineOperationType,
    FindingSeverity,
)

logger = structlog.get_logger(__name__)


CASE_ASSISTANT_SYSTEM_PROMPT = """You are an expert legal case assistant. Help lawyers with their case by answering questions, explaining clauses, finding contradictions, and suggesting edits.

You have access to the case documents and can retrieve relevant passages.

RULES:
1. Base answers ONLY on the case documents and provided context
2. If the document doesn't contain enough information, explicitly say so
3. Include source references (document name, page/section) for all claims
4. Distinguish between: document facts, legal analysis, and suggestions
5. If suggesting edits, propose them as redline operations for user confirmation
6. Require explicit confirmation for destructive/bulk edits
7. Never fabricate legal authorities, facts, or evidence
8. If uncertain, express uncertainty explicitly

SUPPORTED COMMANDS:
- Summarize the case / specific document
- Explain a clause in plain language
- Revise a specified paragraph
- Find contradictions or missing information
- Suggest an edit
- Find missing information
- Compare client vs opposition positions
- Suggest legal research topics
- Generate argument outlines

OUTPUT FORMAT: Return ONLY valid JSON:
{
  "command_type": "summarize|explain_clause|revise_paragraph|find_contradictions|suggest_edit|find_missing_info|compare_positions|suggest_research|generate_arguments",
  "response_text": "Natural language response to user",
  "action_required": false,
  "proposed_changes": [
    {
      "operation_id": "case_redline_1",
      "operation_type": "replace",
      "target_location": "Section 3, Paragraph 2",
      "original_text": "The party shall...",
      "proposed_text": "The party must...",
      "explanation": "Replace 'shall' with 'must' for clarity per style guide",
      "risk_level": "low",
      "related_finding_ids": [],
      "evidence_ids": [],
      "depends_on": []
    }
  ],
  "target_location": "Section 3",
  "explanation": "Explanation of what was done",
  "requires_confirmation": false,
  "follow_up_suggestions": ["Follow-up question 1", "Follow-up question 2"]
}"""

CASE_ASSISTANT_USER_PROMPT = """Process this question or command about the case.

CASE CONTEXT:
{case_context}

USER QUERY: {command_text}

Process this query and respond with the JSON structure specified. If the command requests edits, propose them as redline operations requiring confirmation."""


class CaseAssistantError(Exception):
    """Case assistant specific errors."""
    pass


async def process_case_command(request: CaseAssistantRequest) -> CaseAssistantResponse:
    """
    Process a voice/text command or question about a case.
    
    Args:
        request: CaseAssistantRequest with question/command and context
        
    Returns:
        CaseAssistantResponse with response and any proposed changes
    """
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    query_text = request.question or request.command_text or ""
    
    # Gather case context from workspace documents
    chunks = await get_case_documents_chunks(request.case_id)
    case_context_parts = [f"Case ID: {request.case_id}"]
    
    retrieved_sources: List[RetrievalResult] = []
    if chunks:
        # Use retriever for semantic or keyword match
        try:
            retriever = get_retriever()
            results = retriever.retrieve(query=query_text, top_k=5)
            if results:
                case_context_parts.append("\nRelevant Case Excerpts:")
                for r in results[:4]:
                    case_context_parts.append(f"[{r.source_filename}] {r.text[:350]}")
                    if request.include_sources:
                        retrieved_sources.append(r)
        except Exception as e:
            logger.warning("retrieval_failed_falling_back_to_chunks", error=str(e))
        
        if not retrieved_sources and chunks:
            case_context_parts.append("\nCase Document Samples:")
            for c in chunks[:4]:
                case_context_parts.append(f"[{c.source_filename}] {c.text[:350]}")
    
    if request.conversation_history:
        case_context_parts.append("\nConversation History:")
        for turn in request.conversation_history[-4:]:
            q = turn.get("question") or turn.get("user") or ""
            a = turn.get("answer") or turn.get("assistant") or ""
            if q:
                case_context_parts.append(f"User: {q}")
            if a:
                case_context_parts.append(f"Assistant: {a}")
    
    case_context = "\n".join(case_context_parts)
    
    system_prompt = CASE_ASSISTANT_SYSTEM_PROMPT
    user_prompt = CASE_ASSISTANT_USER_PROMPT.format(
        case_context=case_context,
        command_text=query_text,
    )
    
    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    try:
        logger.info("case_assistant_command_received", 
                   case_id=request.case_id,
                   command=query_text[:100])
        
        response = await adapter.chat(messages, temperature=0.3, max_tokens=4096)
        
        parsed = _parse_case_assistant_response(response.content)
        
        # Parse proposed edits
        proposed_edits: Optional[List[RedlineOperation]] = None
        raw_changes = parsed.get("proposed_changes") or parsed.get("proposed_edits")
        if raw_changes:
            proposed_edits = []
            for ch in raw_changes:
                try:
                    proposed_edits.append(RedlineOperation.model_validate(ch))
                except Exception:
                    pass
            if not proposed_edits:
                proposed_edits = None
        
        requires_conf = bool(parsed.get("requires_confirmation", False) or (proposed_edits and len(proposed_edits) > 0))
        action_req = bool(parsed.get("action_required", False) or (proposed_edits and len(proposed_edits) > 0))
        
        answer_text = parsed.get("response_text") or parsed.get("answer") or "I have processed your request."
        explanation_text = parsed.get("explanation") or answer_text
        
        logger.info("case_assistant_command_processed", 
                   case_id=request.case_id,
                   command_type=parsed.get("command_type"),
                   has_changes=bool(proposed_edits))
        
        return CaseAssistantResponse(
            case_id=request.case_id,
            question=query_text,
            answer=answer_text,
            sources=retrieved_sources,
            legal_sources=[],
            confidence=float(parsed.get("confidence", 0.8)),
            action_required=action_req,
            proposed_edits=proposed_edits,
            explanation=explanation_text,
            requires_confirmation=requires_conf,
            follow_up_suggestions=parsed.get("follow_up_suggestions", []),
        )
        
    except json.JSONDecodeError as e:
        logger.error("case_assistant_json_error", error=str(e))
        return CaseAssistantResponse(
            case_id=request.case_id,
            question=query_text,
            answer="I had trouble processing that request. Could you please rephrase it?",
            sources=[],
            legal_sources=[],
            confidence=0.5,
            action_required=False,
            proposed_edits=None,
            explanation="JSON parsing error in assistant processing",
            requires_confirmation=False,
            follow_up_suggestions=[],
        )
    except Exception as e:
        logger.error("case_assistant_error", error_type=type(e).__name__, error=str(e))
        raise CaseAssistantError(f"Case assistant processing failed: {str(e)}")


def _parse_case_assistant_response(content: str) -> Dict[str, Any]:
    """Parse and clean LLM response for case assistant."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)
