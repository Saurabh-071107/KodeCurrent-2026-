"""Style adaptation feature module."""
import json
import uuid
import structlog
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from app.config import get_settings
from app.core.model_router import get_router, LLMMessage
from app.features.document_parsing import parse_document
from app.features.document_management import get_document_chunks
from app.schemas import (
    StyleProfile,
    StyleExtractionRequest,
    StyleExtractionResponse,
    StyleApplicationRequest,
    StyleApplicationResponse,
    DraftResponse,
)
from app.features.chunking import DocumentChunk

logger = structlog.get_logger(__name__)


class StyleExtractionError(Exception):
    """Style extraction specific errors."""
    pass


class StyleApplicationError(Exception):
    """Style application specific errors."""
    pass


STYLE_EXTRACTION_PROMPT = """You are an expert legal document style analyzer. Analyze a reference document and extract its style profile.

EXTRACT THE FOLLOWING STYLE ELEMENTS:

1. HEADING HIERARCHY:
   - Number of heading levels used
   - Numbering scheme (e.g., 1., 1.1., (a), (i))
   - Formatting (bold, caps, underline, font size hints)
   - Spacing before/after headings

2. PARAGRAPH FORMATTING:
   - Indentation (first line, hanging, none)
   - Line spacing (single, 1.5, double)
   - Paragraph spacing (before/after)
   - Alignment (left, justified, center)

3. LIST FORMATTING:
   - Bullet styles (●, ■, -, *, •)
   - Numbered list formats (1., 1), (1), i., I.)
   - Nesting indentation
   - Punctuation after numbers/bullets

4. TONE AND SENTENCE STYLE:
   - Formality level (very formal, formal, semi-formal, plain)
   - Sentence length tendency (short, medium, long)
   - Sentence complexity (simple, moderate, complex)
   - Voice (active, passive, mixed)
   - Common transitional phrases

5. TERMINOLOGY:
   - Defined terms (capitalized terms with definitions)
   - Preferred terminology (e.g., "shall" vs "must", "party" vs "party")
   - Terms to avoid
   - Abbreviation conventions

6. TABLE FORMATTING:
   - Border style (none, single, double, grid)
   - Header row formatting (bold, shaded, caps)
   - Cell padding/alignment
   - Caption placement

7. SIGNATURE BLOCKS:
   - Layout (single line, block, aligned)
   - Components (name, title, date, witness, notary)
   - Spacing and alignment

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "heading_styles": [
    {"level": 1, "numbering": "1.", "format": "bold", "spacing_before": "12pt", "spacing_after": "6pt"},
    {"level": 2, "numbering": "1.1", "format": "bold", "spacing_before": "6pt", "spacing_after": "3pt"}
  ],
  "paragraph_style": {
    "indentation": "first_line",
    "line_spacing": "1.15",
    "spacing_before": "0pt",
    "spacing_after": "6pt",
    "alignment": "justified"
  },
  "list_styles": [
    {"type": "bullet", "symbol": "•", "indent": "0.5in", "punctuation": "none"},
    {"type": "numbered", "format": "1.", "indent": "0.5in", "punctuation": "."}
  ],
  "tone_indicators": {
    "formality": "formal",
    "sentence_length": "medium",
    "complexity": "moderate",
    "voice": "active",
    "common_transitions": ["Furthermore,", "Additionally,", "However,"]
  },
  "avg_sentence_length": 18.5,
  "sentence_complexity": "moderate",
  "defined_terms": [
    {"term": "Agreement", "definition": "This License Agreement"},
    {"term": "Parties", "definition": "Licensor and Licensee collectively"}
  ],
  "preferred_terms": {"shall": "must", "prior to": "before"},
  "avoid_terms": ["hereby", "herein", "aforementioned"],
  "table_style": {
    "borders": "grid",
    "header_format": "bold",
    "cell_padding": "0.08in",
    "alignment": "left"
  },
  "signature_blocks": [
    {"layout": "block", "components": ["name", "title", "date"], "witness_line": true, "notary_line": false}
  ]
}"""


STYLE_APPLICATION_PROMPT = """You are an expert legal document formatter. Apply a style profile to a draft document.

CRITICAL RULES:
1. PRESERVE ALL USER CONTENT - facts, names, dates, amounts, legal conclusions, specific clauses
2. ONLY apply formatting/style changes - headings, paragraphs, lists, terminology, tables, signatures
3. DO NOT copy confidential info, names, or unrelated clauses from the reference document
4. DO NOT change legal meaning or substance
5. Flag any content that cannot be restyled without legal review

APPLY THESE STYLE ELEMENTS:
- Heading hierarchy and numbering
- Paragraph and list formatting
- Terminology preferences (replace terms where legally safe)
- Table formatting
- Signature block format
- Tone adjustments (sentence structure, transitions)

OUTPUT FORMAT: Return ONLY valid JSON matching this exact structure:
{
  "restyled_draft": {
    "document_type": "...",
    "title": "...",
    "sections": [
      {"title": "...", "content": "...", "order": 0, "is_placeholder": false}
    ],
    "assumptions": [...],
    "warnings": [...],
    "placeholders": [...],
    "review_status": "...",
    "disclaimer": "..."
  },
  "changes_summary": [
    {"type": "heading", "location": "Section 1", "description": "Applied heading level 1 style: bold, numbered 1."},
    {"type": "terminology", "location": "Section 3", "description": "Replaced 'shall' with 'must' per style profile"},
    {"type": "list", "location": "Section 2", "description": "Applied bullet style: • with 0.5in indent"}
  ],
  "warnings": [
    "Legal conclusion in Section 4 not restyled - requires attorney review",
    "Defined term 'Confidential Information' preserved from original draft"
  ]
}"""


async def extract_style_profile(request: StyleExtractionRequest) -> StyleExtractionResponse:
    """
    Extract style profile from a reference document.
    
    Args:
        request: StyleExtractionRequest with document_id
        
    Returns:
        StyleExtractionResponse with extracted style profile
    """
    settings = get_settings()
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Get document chunks
    chunks = await get_document_chunks(request.document_id)
    if not chunks:
        raise ValueError(f"No chunks found for document {request.document_id}. Document may not be processed.")
    
    # Combine text from chunks
    full_text = "\n\n".join(chunk.text for chunk in chunks)
    
    # Truncate if too long (keep first 15000 chars for style analysis)
    if len(full_text) > 15000:
        full_text = full_text[:15000] + "\n\n[TRUNCATED FOR ANALYSIS]"
    
    system_prompt = STYLE_EXTRACTION_PROMPT
    user_prompt = f"Analyze the following document and extract its style profile:\n\n{full_text}"
    
    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    try:
        logger.info("style_extraction_started", document_id=request.document_id)
        
        response = await adapter.chat(messages, temperature=0.2, max_tokens=4096)
        parsed = _parse_style_response(response.content)
        
        profile = StyleProfile(
            profile_id=str(uuid.uuid4()),
            source_document_id=request.document_id,
            source_filename=f"document_{request.document_id}",
            heading_styles=parsed.get("heading_styles", []),
            paragraph_style=parsed.get("paragraph_style", {}),
            list_styles=parsed.get("list_styles", []),
            tone_indicators=parsed.get("tone_indicators", {}),
            avg_sentence_length=parsed.get("avg_sentence_length"),
            sentence_complexity=parsed.get("sentence_complexity"),
            defined_terms=parsed.get("defined_terms", []),
            preferred_terms=parsed.get("preferred_terms", {}),
            avoid_terms=parsed.get("avoid_terms", []),
            table_style=parsed.get("table_style", {}),
            signature_blocks=parsed.get("signature_blocks", []),
        )
        
        logger.info("style_extraction_completed", document_id=request.document_id, profile_id=profile.profile_id)
        
        return StyleExtractionResponse(
            profile=profile,
            warnings=["Style profile extracted from document text only; visual formatting may not be fully captured."]
        )
        
    except json.JSONDecodeError as e:
        logger.error("style_extraction_json_error", error=str(e))
        raise ValueError(f"LLM returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error("style_extraction_error", error_type=type(e).__name__, error=str(e))
        raise ValueError(f"Style extraction failed: {str(e)}")


def _parse_style_response(content: str) -> dict:
    """Parse and clean LLM response for style extraction."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


async def apply_style_profile(request: StyleApplicationRequest) -> StyleApplicationResponse:
    """
    Apply a style profile to a draft document.
    
    Args:
        request: StyleApplicationRequest with draft and style profile
        
    Returns:
        StyleApplicationResponse with restyled draft
    """
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Build prompts
    system_prompt = STYLE_APPLICATION_PROMPT
    
    # Build user prompt with draft and style profile
    draft = request.draft
    profile = request.profile
    
    parts = [
        f"Apply the following style profile to the draft document:\n",
        f"STYLE PROFILE:\n",
        f"Heading styles: {json.dumps(profile.heading_styles, indent=2)}\n",
        f"Paragraph style: {json.dumps(profile.paragraph_style, indent=2)}\n",
        f"List styles: {json.dumps(profile.list_styles, indent=2)}\n",
        f"Tone indicators: {json.dumps(profile.tone_indicators, indent=2)}\n",
        f"Avg sentence length: {profile.avg_sentence_length}\n",
        f"Sentence complexity: {profile.sentence_complexity}\n",
        f"Defined terms: {json.dumps(profile.defined_terms, indent=2)}\n",
        f"Preferred terms: {json.dumps(profile.preferred_terms, indent=2)}\n",
        f"Avoid terms: {json.dumps(profile.avoid_terms, indent=2)}\n",
        f"Table style: {json.dumps(profile.table_style, indent=2)}\n",
        f"Signature blocks: {json.dumps(profile.signature_blocks, indent=2)}\n\n",
        "DRAFT TO RESTYLE:\n",
        f"Title: {draft.title}\n",
        f"Document type: {draft.document_type.value}\n\n",
    ]
    
    for section in draft.sections:
        parts.append(f"\n--- {section.title} (Order: {section.order}) ---\n{section.content}\n")
    
    if request.target_sections:
        parts.append(f"\nTARGET SECTIONS: {', '.join(request.target_sections)}\n")
    
    if request.preserve_content:
        parts.append("\nIMPORTANT: Preserve all user content - facts, names, dates, amounts, legal conclusions. Only apply formatting/style.\n")
    
    parts.append("\nReturn ONLY the JSON structure specified in the system prompt.")
    
    user_prompt = "".join(parts)
    
    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    try:
        logger.info("style_application_started", draft_type=draft.document_type.value)
        
        response = await adapter.chat(messages, temperature=0.2, max_tokens=6000)
        parsed = _parse_style_response(response.content)
        
        # Parse restyled draft
        restyled_data = parsed.get("restyled_draft", {})
        restyled_draft = DraftResponse.model_validate(restyled_data)
        
        changes_summary = parsed.get("changes_summary", [])
        warnings = parsed.get("warnings", [])
        
        logger.info("style_application_completed", changes=len(changes_summary))
        
        return StyleApplicationResponse(
            restyled_draft=restyled_draft,
            changes_summary=changes_summary,
            warnings=warnings,
        )
        
    except json.JSONDecodeError as e:
        logger.error("style_application_json_error", error=str(e))
        raise ValueError(f"LLM returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error("style_application_error", error_type=type(e).__name__, error=str(e))
        raise ValueError(f"Style application failed: {str(e)}")