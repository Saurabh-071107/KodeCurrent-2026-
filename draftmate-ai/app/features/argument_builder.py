"""Argument builder feature module."""
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
    ArgumentBuilderRequest,
    ArgumentBuilderResponse,
    ArgumentOutline,
    DraftResponse,
    FactExtractionResponse,
    Jurisdiction,
    RedlineOperation,
    RedlineOperationType,
    FindingSeverity,
    ReviewFinding,
)

logger = structlog.get_logger(__name__)


class ArgumentBuilderError(Exception):
    """Argument builder specific errors."""
    pass


ARGUMENT_BUILDER_SYSTEM_PROMPT = """You are an expert legal argument strategist specializing in Indian law. Generate structured, evidence-grounded legal argument outlines for lawyers.

CRITICAL RULES:
1. NEVER invent facts, evidence, legal authorities, or case law
2. Base arguments ONLY on provided facts, evidence, and legal research
3. Every argument must be grounded in supplied facts and evidence
4. Clearly distinguish between: primary arguments, alternative arguments, rebuttals, constitutional arguments
5. For each argument, identify: weaknesses, adverse authority, missing prerequisites
6. Prioritize arguments by legal relevance and evidentiary support
6. Do NOT invent a numerical probability of winning
7. Do NOT imply guaranteed successful outcome
8. Flag where additional documents or facts are needed

ARGUMENT TYPES:
- PRIMARY: Main argument supporting client's position
- ALTERNATIVE: Alternative legal theory or fallback position
- REBUTTAL: Direct response to specific opposition argument
- CONSTITUTIONAL: Arguments based on constitutional provisions
- ALTERNATIVE: Fallback or alternative legal theory

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "arguments": [
    {
      "argument_id": "arg_abc123",
      "issue": "Legal issue or question of law",
      "material_facts": ["Relevant fact 1", "Relevant fact 2"],
      "supporting_evidence": ["Evidence with doc ref 1", "Evidence with doc ref 2"],
      "legal_provisions": ["Constitutional Article X", "Statute Section Y"],
      "supporting_authorities": [{"case_name": "Case Name", "court": "Court", "citation": "Citation", "ratio": "Ratio decidendi", "relevance": "Why relevant"}],
      "legal_reasoning": "Application of law to facts",
      "proposed_argument": "Proposed submission text",
      "expected_counterargument": "Expected opposition response",
      "rebuttal": "Rebuttal to expected counterargument",
      "weaknesses": ["Weakness 1", "Adverse authority"],
      "additional_documents_needed": ["Doc needed 1"],
      "proposed_relief": "Proposed relief or outcome",
      "priority": 1,
      "argument_type": "primary|alternative|rebuttal|constitutional",
      "confidence": 0.0-1.0
    }
  ]
}"""


ARGUMENT_BUILDER_USER_PROMPT = """Generate structured legal argument outlines based on the following case materials:

CASE INFORMATION:
{case_info}

FACTS:
{facts_text}

EVIDENCE:
{evidence_text}

OPPOSITION ARGUMENTS (if any):
{opposition_args}

LEGAL RESEARCH:
{legal_research}

ARGUMENT TYPE REQUESTED: {argument_type}
MAX ARGUMENTS: {max_arguments}
JURISDICTION: {jurisdiction}

REQUIREMENTS:
- Generate up to {max_arguments} structured argument outlines
- Each argument must be grounded in the provided facts and evidence
- Include: issue, material facts, supporting evidence, legal provisions, authorities, reasoning, proposed argument, expected counterargument, rebuttal, weaknesses, additional documents needed, proposed relief
- Prioritize by legal relevance and evidentiary support
- Include alternative arguments if requested
- Include rebuttals to expected counterarguments if requested
- Include constitutional arguments where applicable
- Flag weaknesses, adverse authority, missing prerequisites
- Provide structured written-submission outline and oral submission outline

Return ONLY the JSON structure specified in the system prompt."""


def build_argument_builder_prompt(request, case_info: str, facts_text: str, evidence_text: str, opposition_args: str, legal_research: str) -> str:
    """Build the user prompt for argument generation."""
    parts = [
        ARGUMENT_BUILDER_USER_PROMPT.format(
            case_info=case_info,
            facts_text=facts_text,
            evidence_text=evidence_text,
            opposition_args=opposition_args,
            legal_research=legal_research,
            argument_type=request.argument_type,
            max_arguments=request.max_arguments,
            jurisdiction=request.jurisdiction,
        ),
        "\nReturn ONLY the JSON structure specified in the system prompt."
    ]
    return "\n".join(parts)


async def generate_arguments(request: 'ArgumentBuilderRequest') -> 'ArgumentBuilderResponse':
    """
    Generate structured legal argument outlines for a case.
    
    Args:
        request: ArgumentBuilderRequest with case details, facts, evidence, and preferences
        
    Returns:
        ArgumentBuilderResponse with structured argument outlines
    """
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Gather case documents
    case_chunks = []
    if request.case_id:
        from app.features.case_workspace import get_case_documents_chunks
        case_chunks = await get_case_documents_chunks(request.case_id)
    
    # Get evidence chunks if document IDs provided
    evidence_chunks = []
    # Could add document_ids to request if needed
    
    # Build context
    case_info = f"Case ID: {request.case_id}\nArgument Type: {request.argument_type}\nJurisdiction: {request.jurisdiction}"
    if request.issues:
        case_info += f"\nIssues to address: {', '.join(request.issues)}"
    
    if case_chunks:
        full_text = "\n\n".join(c.text for c in case_chunks)
        facts_text = full_text[:12000]
        evidence_text = full_text[12000:20000] if len(full_text) > 12000 else facts_text[:5000]
    else:
        facts_text = "Facts from case context"
        evidence_text = "Evidence from case context"
        
    opposition_args = f"Target argument to rebut: {request.target_argument}" if request.target_argument else "Opposition arguments from uploaded case documents"
    legal_research = f"Applicable legal provisions and authorities for jurisdiction: {request.jurisdiction}"
    
    system_prompt = ARGUMENT_BUILDER_SYSTEM_PROMPT
    user_prompt = build_argument_builder_prompt(
        request,
        case_info=case_info,
        facts_text=facts_text,
        evidence_text=evidence_text,
        opposition_args=opposition_args,
        legal_research=legal_research,
    )
    
    messages = [
        LLMMessage(role="system", content=ARGUMENT_BUILDER_SYSTEM_PROMPT),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    try:
        logger.info("argument_builder_started", 
                   case_id=request.case_id,
                   argument_type=request.argument_type,
                   max_args=request.max_arguments)
        
        response = await adapter.chat(messages, temperature=0.3, max_tokens=8192)
        
        parsed = _parse_argument_response(response.content)
        
        # Parse arguments
        arguments = []
        for arg_data in parsed.get("arguments", []):
            arguments.append(ArgumentOutline(**arg_data))
        
        alternative_args = []
        for arg_data in parsed.get("alternative_arguments", []):
            alternative_args.append(ArgumentOutline(**arg_data))
        
        rebuttals = []
        for arg_data in parsed.get("rebuttals", []):
            rebuttals.append(ArgumentOutline(**arg_data))
        
        constitutional_args = []
        for arg_data in parsed.get("constitutional_arguments", []):
            constitutional_args.append(ArgumentOutline(**arg_data))
        
        logger.info("argument_builder_completed", 
                   case_id=request.case_id,
                   primary_args=len(arguments),
                   alt_args=len(alternative_args),
                   rebuttals=len(rebuttals))
        
        return ArgumentBuilderResponse(
            case_id=request.case_id,
            arguments=arguments,
            alternative_arguments=alternative_args,
            rebuttals=rebuttals,
            constitutional_arguments=constitutional_args,
            argument_outline=parsed.get("argument_outline", ""),
            oral_submission_outline=parsed.get("oral_submission_outline", ""),
            weaknesses_summary=parsed.get("weaknesses_summary", []),
            additional_documents_needed=parsed.get("additional_documents_needed", []),
            research_gaps=parsed.get("research_gaps", []),
            disclaimer="These are AI-generated argument outlines for lawyer review. Not legal advice. Verify all authorities independently.",
        )
        
    except json.JSONDecodeError as e:
        logger.error("argument_builder_json_error", error=str(e))
        raise ArgumentBuilderError(f"LLM returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error("argument_builder_error", error_type=type(e).__name__, error=str(e))
        raise ArgumentBuilderError(f"Argument generation failed: {str(e)}")


def _parse_argument_response(content: str) -> Dict[str, Any]:
    """Parse and clean LLM response for argument builder."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


# Helper to generate written submission outline
def generate_written_submission_outline(arguments: List['ArgumentOutline']) -> str:
    """Generate a structured written submission outline from arguments."""
    outline = ["WRITTEN SUBMISSION OUTLINE\n", "=" * 50, "\n"]
    
    for i, arg in enumerate(arguments, 1):
        outline.append(f"\n{i}. ISSUE: {arg.issue}")
        outline.append(f"   Type: {arg.argument_type.upper()}")
        outline.append(f"   Priority: {arg.priority}")
        if arg.material_facts:
            outline.append(f"   MATERIAL FACTS:")
            for fact in arg.material_facts:
                outline.append(f"   - {fact}")
        if arg.legal_provisions:
            outline.append(f"   LEGAL PROVISIONS:")
            for prov in arg.legal_provisions:
                outline.append(f"   - {prov}")
        if arg.supporting_authorities:
            outline.append(f"   AUTHORITIES:")
            for auth in arg.supporting_authorities:
                outline.append(f"   - {auth.get('case_name', 'Unknown')} ({auth.get('citation', 'No citation')})")
        outline.append(f"   ARGUMENT: {arg.proposed_argument[:200]}...")
        outline.append(f"   REBUTTAL: {arg.rebuttal[:200]}...")
        if arg.weaknesses:
            outline.append(f"   WEAKNESSES: {', '.join(arg.weaknesses)}")
        outline.append("")
    
    return "\n".join(outline)


def generate_oral_submission_outline(arguments: List['ArgumentOutline']) -> str:
    """Generate a concise oral submission outline."""
    outline = ["ORAL SUBMISSION OUTLINE\n", "=" * 50, "\n"]
    
    for i, arg in enumerate(arguments, 1):
        outline.append(f"{i}. {arg.issue}")
        outline.append(f"   Key Point: {arg.proposed_argument[:150]}...")
        if arg.rebuttal:
            outline.append(f"   Rebuttal: {arg.rebuttal[:150]}...")
        outline.append("")
    
    return "\n".join(outline)


import json