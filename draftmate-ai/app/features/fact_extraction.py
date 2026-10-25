"""Fact extraction feature module."""
import json
import logging
from typing import Any

import structlog
from pydantic import ValidationError

from app.core.model_router import get_router, LLMMessage
from app.core.prompts import get_fact_extraction_prompt, build_fact_extraction_user_prompt
from app.schemas import FactExtractionRequest, FactExtractionResponse, DocumentType, Jurisdiction

logger = structlog.get_logger(__name__)


class FactExtractionError(Exception):
    """Fact extraction specific errors."""

    pass


async def extract_facts(request: FactExtractionRequest) -> FactExtractionResponse:
    """
    Extract structured facts from a legal problem description.

    Args:
        request: FactExtractionRequest with problem description and context

    Returns:
        FactExtractionResponse with extracted facts, parties, dates, gaps, etc.

    Raises:
        FactExtractionError: If extraction fails
    """
    router = get_router()
    adapter = router.primary

    if not adapter:
        raise FactExtractionError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")

    # Build prompts
    jurisdiction_str = request.jurisdiction.value if request.jurisdiction else None
    system_prompt = get_fact_extraction_prompt(request.document_type, jurisdiction_str)

    # Convert request to dict for prompt building
    request_dict = {
        "problem_description": request.problem_description,
        "document_type": request.document_type.value,
        "jurisdiction": jurisdiction_str,
        "parties": [p.model_dump() for p in request.parties] if request.parties else [],
        "important_dates": [d.model_dump() for d in request.important_dates] if request.important_dates else [],
        "objective": request.objective,
        "context": request.context,
    }
    user_prompt = build_fact_extraction_user_prompt(request_dict)

    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]

    try:
        logger.info(
            "fact_extraction_started",
            document_type=request.document_type.value,
            jurisdiction=jurisdiction_str,
            problem_length=len(request.problem_description),
        )

        response = await adapter.chat(messages, temperature=0.2, max_tokens=4096)

        # Parse and validate JSON response
        parsed = _parse_fact_extraction_response(response.content)

        # Validate against schema
        validated = FactExtractionResponse.model_validate(parsed)

        logger.info(
            "fact_extraction_completed",
            document_type=request.document_type.value,
            facts_count=len(validated.user_provided_facts) + len(validated.inferred_facts),
            parties_count=len(validated.parties_and_roles),
            missing_count=len(validated.missing_information),
        )

        return validated

    except json.JSONDecodeError as e:
        logger.error("fact_extraction_json_error", error=str(e), response_preview=response.content[:200])
        raise FactExtractionError(f"LLM returned invalid JSON: {str(e)}")
    except ValidationError as e:
        logger.error("fact_extraction_validation_error", error=str(e), response_preview=response.content[:200])
        raise FactExtractionError(f"LLM response failed validation: {str(e)}")
    except Exception as e:
        logger.error("fact_extraction_error", error_type=type(e).__name__, error=str(e))
        raise FactExtractionError(f"Fact extraction failed: {str(e)}")


def _parse_fact_extraction_response(content: str) -> dict[str, Any]:
    """Parse and clean LLM response for fact extraction."""
    # Try to extract JSON from response (in case there's extra text)
    content = content.strip()

    # Find JSON object
    start = content.find("{")
    end = content.rfind("}") + 1

    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)

    json_str = content[start:end]
    return json.loads(json_str)