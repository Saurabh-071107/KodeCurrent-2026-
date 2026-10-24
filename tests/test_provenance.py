"""Tests for provenance tracking, evidence models, and citation verification."""

import pytest
from draftmate_ai.shared.exceptions import VerificationMismatchError
from draftmate_ai.shared.provenance import (
    verify_passage_in_source,
    build_provenance_record,
    normalize_whitespace_and_punctuation,
)


def test_provenance_exact_match():
    """Test exact substring verification."""
    source = "Section 2.1 Base Rent. Tenant shall pay Landlord base rent in the amount of $5,000 per month."
    quote = "Tenant shall pay Landlord base rent in the amount of $5,000 per month."

    result = verify_passage_in_source(quote, source)
    assert result.is_verified is True
    assert result.match_type == "exact"
    assert result.confidence == 1.0
    assert result.start_offset is not None
    assert result.end_offset is not None
    assert source[result.start_offset : result.end_offset] == quote


def test_provenance_normalized_match():
    """Test verification with varied whitespace, newlines, and smart quotes."""
    source = 'The "Confidential Information" shall remain—at all times—strictly protected.'
    quote = 'The “Confidential Information” shall remain-at all times-strictly protected.'

    result = verify_passage_in_source(quote, source)
    assert result.is_verified is True
    assert result.match_type in ("exact", "normalized")
    assert result.confidence >= 0.90


def test_provenance_fuzzy_match():
    """Test verification with minor character or OCR typos."""
    source = "The Contractor shall perform all services with utmost professional diligence and skill."
    # Minor single word transcription typo ("all service" vs "all services", "diligenc")
    quote = "The Contractor shall perform all service with utmost professional diligenc and skill."

    result = verify_passage_in_source(quote, source, fuzzy_threshold=0.80)
    assert result.is_verified is True
    assert result.match_type == "fuzzy"
    assert result.confidence >= 0.80


def test_provenance_rejection_of_fabricated_quote():
    """Test that a fabricated or nonexistent quote is rejected."""
    source = "Landlord leases commercial property located at 100 Main Street."
    fake_quote = "Tenant shall have the absolute right to purchase the entire building for $1."

    result = verify_passage_in_source(fake_quote, source)
    assert result.is_verified is False
    assert result.match_type == "none"
    assert result.start_offset is None
    assert result.end_offset is None
    assert result.failure_reason is not None


def test_provenance_raise_on_mismatch():
    """Test that raise_on_mismatch triggers VerificationMismatchError."""
    source = "Alpha Corp agrees to provide consulting services."
    fake_quote = "Alpha Corp agrees to pay $10,000,000 immediately."

    with pytest.raises(VerificationMismatchError):
        verify_passage_in_source(fake_quote, source, raise_on_mismatch=True)


def test_build_provenance_record_no_fabrication():
    """Test that build_provenance_record preserves truthful location references and does not fabricate missing ones."""
    source = "Section 4.1 Indemnification. Party A agrees to defend Party B."
    quote = "Party A agrees to defend Party B."

    rec = build_provenance_record(
        document_id="doc_12345",
        chunk_id="doc_12345_chunk_0001",
        quoted_text=quote,
        source_text=source,
        page_number=4,
        section_heading="Indemnification",
        clause_number="Section 4.1",
        paragraph_number=12,
        extraction_method="pymupdf_text",
        document_metadata={"filename": "agreement.pdf"},
    )

    assert rec.is_verified is True
    assert rec.document_id == "doc_12345"
    assert rec.chunk_id == "doc_12345_chunk_0001"
    assert rec.page_number == 4
    assert rec.clause_number == "Section 4.1"
    assert rec.char_offset_start is not None
    assert rec.char_offset_end is not None

    # Now test with fabricated quote where offsets cannot be found
    rec_fake = build_provenance_record(
        document_id="doc_12345",
        quoted_text="Completely fake statement not in source",
        source_text=source,
        page_number=None,  # Location unavailable
    )
    assert rec_fake.is_verified is False
    assert rec_fake.char_offset_start is None
    assert rec_fake.char_offset_end is None
    assert rec_fake.page_number is None  # Never fabricated

