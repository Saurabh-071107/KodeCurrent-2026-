"""Provenance tracking and citation verification utilities.

Ensures every extracted passage and generated citation can be traced back to its
exact source location without fabrication.
"""

import re
import difflib
from typing import Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field

from draftmate_ai.shared.exceptions import VerificationMismatchError
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


class VerificationResult(BaseModel):
    """Result of validating a quotation against source text."""
    is_verified: bool
    match_type: str = Field(description="'exact', 'normalized', 'fuzzy', or 'none'")
    confidence: float = Field(ge=0.0, le=1.0)
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    matched_text: Optional[str] = None
    failure_reason: Optional[str] = None


class ProvenanceRecord(BaseModel):
    """Immutable audit trail for an extracted or cited passage."""
    document_id: str
    chunk_id: Optional[str] = None
    source_text: str = Field(description="Full text of the source chunk or element.")
    quoted_text: str = Field(description="Verbatim or cited passage.")
    page_number: Optional[int] = None
    section_heading: Optional[str] = None
    clause_number: Optional[str] = None
    paragraph_number: Optional[int] = None
    extraction_method: str = "unknown"
    document_metadata: Dict[str, Any] = Field(default_factory=dict)
    char_offset_start: Optional[int] = None
    char_offset_end: Optional[int] = None
    confidence_score: float = 1.0
    is_verified: bool = True


def normalize_whitespace_and_punctuation(text: str) -> str:
    """Normalize whitespace, smart quotes, and dashes for resilient comparison."""
    # Replace curly quotes and apostrophes
    s = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    # Replace dashes
    s = s.replace("—", "-").replace("–", "-")
    # Collapse multiple whitespaces/newlines to single space
    s = re.sub(r"\s+", " ", s).strip()
    return s


def verify_passage_in_source(
    quoted_passage: str,
    source_text: str,
    fuzzy_threshold: float = 0.85,
    raise_on_mismatch: bool = False,
) -> VerificationResult:
    """Validate whether a quoted passage occurs in the corresponding source text.

    Args:
        quoted_passage: The passage claimed to be from the source.
        source_text: The authentic extracted source text.
        fuzzy_threshold: Minimum similarity threshold (0.0 - 1.0) for fuzzy matches.
        raise_on_mismatch: If True, raises VerificationMismatchError when not verified.

    Returns:
        VerificationResult with verification status, offsets, confidence, and match type.
    """
    if not quoted_passage or not quoted_passage.strip():
        result = VerificationResult(
            is_verified=False,
            match_type="none",
            confidence=0.0,
            failure_reason="Quoted passage is empty or whitespace.",
        )
        if raise_on_mismatch:
            raise VerificationMismatchError(result.failure_reason)
        return result

    if not source_text or not source_text.strip():
        result = VerificationResult(
            is_verified=False,
            match_type="none",
            confidence=0.0,
            failure_reason="Source text is empty.",
        )
        if raise_on_mismatch:
            raise VerificationMismatchError(result.failure_reason)
        return result

    target = quoted_passage.strip()

    # 1. Exact Substring Match
    idx = source_text.find(target)
    if idx != -1:
        return VerificationResult(
            is_verified=True,
            match_type="exact",
            confidence=1.0,
            start_offset=idx,
            end_offset=idx + len(target),
            matched_text=source_text[idx : idx + len(target)],
        )

    # 2. Case-Insensitive Exact Match
    lower_source = source_text.lower()
    lower_target = target.lower()
    idx_lower = lower_source.find(lower_target)
    if idx_lower != -1:
        return VerificationResult(
            is_verified=True,
            match_type="normalized",
            confidence=0.98,
            start_offset=idx_lower,
            end_offset=idx_lower + len(target),
            matched_text=source_text[idx_lower : idx_lower + len(target)],
        )

    # 3. Regex / Whitespace & Punctuation Insensitive Match
    # Pre-normalize quotes and dashes in target so re.escape creates standard escape tokens
    std_target = (
        target.replace("“", '"')
        .replace("”", '"')
        .replace("‘", "'")
        .replace("’", "'")
        .replace("—", "-")
        .replace("–", "-")
    )
    norm_pattern = re.escape(std_target)
    # Allow arbitrary whitespace between words
    norm_pattern = re.sub(r"\\\s+", r"\\s+", norm_pattern)
    # Allow curly/straight quote and dash tolerance in source text
    norm_pattern = norm_pattern.replace(r'\"', r'["“”]').replace(r"\'", r"['‘’]")
    norm_pattern = norm_pattern.replace(r"\-", r"[\-—–]")

    match = re.search(norm_pattern, source_text, flags=re.IGNORECASE)
    if match:
        return VerificationResult(
            is_verified=True,
            match_type="normalized",
            confidence=0.95,
            start_offset=match.start(),
            end_offset=match.end(),
            matched_text=source_text[match.start() : match.end()],
        )

    # 4. Sliding Window Fuzzy Match
    # For passages with minor OCR noise or transcription errors
    target_len = len(target)
    best_ratio = 0.0
    best_span: Optional[Tuple[int, int]] = None
    step = max(1, target_len // 6)
    window_sizes = [
        target_len,
        int(target_len * 0.9),
        int(target_len * 1.1),
    ]

    for w_size in window_sizes:
        if w_size <= 0:
            continue
        for i in range(0, max(1, len(source_text) - w_size + 1), step):
            window = source_text[i : i + w_size]
            matcher = difflib.SequenceMatcher(None, target, window)
            ratio = matcher.ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_span = (i, i + w_size)

    if best_ratio >= fuzzy_threshold and best_span is not None:
        start_idx, end_idx = best_span
        return VerificationResult(
            is_verified=True,
            match_type="fuzzy",
            confidence=round(best_ratio, 3),
            start_offset=start_idx,
            end_offset=end_idx,
            matched_text=source_text[start_idx:end_idx],
        )

    # Failed verification
    reason = (
        f"Quoted passage could not be verified in source text. "
        f"Best similarity was {best_ratio:.2f} (threshold {fuzzy_threshold:.2f})."
    )
    result = VerificationResult(
        is_verified=False,
        match_type="none",
        confidence=round(best_ratio, 3),
        failure_reason=reason,
    )

    if raise_on_mismatch:
        raise VerificationMismatchError(reason, details={"best_similarity": best_ratio})

    return result


def build_provenance_record(
    document_id: str,
    quoted_text: str,
    source_text: str,
    chunk_id: Optional[str] = None,
    page_number: Optional[int] = None,
    section_heading: Optional[str] = None,
    clause_number: Optional[str] = None,
    paragraph_number: Optional[int] = None,
    extraction_method: str = "unknown",
    document_metadata: Optional[Dict[str, Any]] = None,
    fuzzy_threshold: float = 0.85,
) -> ProvenanceRecord:
    """Create a verified provenance record linking a quotation to its authenticated source."""
    verification = verify_passage_in_source(
        quoted_passage=quoted_text,
        source_text=source_text,
        fuzzy_threshold=fuzzy_threshold,
        raise_on_mismatch=False,
    )

    # If verification failed or offsets unavailable, do not fabricate them
    char_start = verification.start_offset if verification.is_verified else None
    char_end = verification.end_offset if verification.is_verified else None

    return ProvenanceRecord(
        document_id=document_id,
        chunk_id=chunk_id,
        source_text=source_text,
        quoted_text=quoted_text,
        page_number=page_number,
        section_heading=section_heading,
        clause_number=clause_number,
        paragraph_number=paragraph_number,
        extraction_method=extraction_method,
        document_metadata=document_metadata or {},
        char_offset_start=char_start,
        char_offset_end=char_end,
        confidence_score=verification.confidence,
        is_verified=verification.is_verified,
    )
