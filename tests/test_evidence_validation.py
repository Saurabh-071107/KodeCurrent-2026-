"""Tests for evidence validation, citation fidelity, and elimination of fabricated excerpts."""

import pytest
from draftmate_ai.document_rag.evidence_validation import EvidenceValidator
from draftmate_ai.document_rag.schemas import RAGResponse, SourceReference, RetrievedChunk


@pytest.fixture
def authentic_chunk():
    return RetrievedChunk(
        chunk_id="chunk_101",
        document_id="doc_alpha",
        document_name="agreement.pdf",
        text="Section 1.01 Confidential Information means all proprietary technical, business, and financial data.",
        original_text="Section 1.01 Confidential Information means all proprietary technical, business, and financial data.",
        page_start=1,
        page_end=1,
        clause_number="Section 1.01",
        section_heading="ARTICLE I - DEFINITIONS",
    )


def test_validate_authentic_citation(authentic_chunk):
    """Test validating an accurate verbatim excerpt from source."""
    validator = EvidenceValidator()
    source_ref = SourceReference(
        document_id="doc_alpha",
        document_name="agreement.pdf",
        chunk_id="chunk_101",
        page=1,
        clause="Section 1.01",
        supporting_excerpt="Confidential Information means all proprietary technical, business, and financial data.",
    )

    response = RAGResponse(
        question="What is Confidential Information?",
        answer="Confidential Information includes technical, business, and financial data.",
        sources=[source_ref],
    )

    validated = validator.validate_response(response, available_chunks=[authentic_chunk], strict_mode=True)

    assert len(validated.sources) == 1
    assert validated.sources[0].is_verified is True
    assert validated.sources[0].confidence >= 0.95


def test_reject_fabricated_citation(authentic_chunk):
    """Test that a fabricated excerpt not present in the chunk is excised in strict mode."""
    validator = EvidenceValidator()
    fake_ref = SourceReference(
        document_id="doc_alpha",
        document_name="agreement.pdf",
        chunk_id="chunk_101",
        supporting_excerpt="The parties agree that all data may be distributed publicly without restriction.",
    )

    response = RAGResponse(
        question="Can data be distributed?",
        answer="Data can be distributed publicly.",
        sources=[fake_ref],
    )

    # In strict mode, fabricated citation is removed
    validated = validator.validate_response(response, available_chunks=[authentic_chunk], strict_mode=True)

    assert len(validated.sources) == 0
    assert any("Unverified citation removed" in l for l in validated.limitations)


def test_non_strict_mode_flags_unverified(authentic_chunk):
    """Test that non-strict mode keeps the citation but marks it is_verified=False."""
    validator = EvidenceValidator()
    fake_ref = SourceReference(
        document_id="doc_alpha",
        document_name="agreement.pdf",
        chunk_id="chunk_101",
        supporting_excerpt="Completely fabricated statement.",
    )

    response = RAGResponse(
        question="Question?",
        answer="Answer.",
        sources=[fake_ref],
    )

    validated = validator.validate_response(response, available_chunks=[authentic_chunk], strict_mode=False)

    assert len(validated.sources) == 1
    assert validated.sources[0].is_verified is False
    assert validated.sources[0].confidence < 0.5


def test_cross_checks_authentic_page_and_clause(authentic_chunk):
    """Test that validator fixes/aligns page and clause from chunk metadata."""
    validator = EvidenceValidator()
    ref_wrong_page = SourceReference(
        document_id="doc_alpha",
        document_name="wrong_doc.pdf",
        chunk_id="chunk_101",
        page=99,  # Incorrect page
        clause="Section 9.9",  # Incorrect clause
        supporting_excerpt="Confidential Information means all proprietary technical",
    )

    response = RAGResponse(
        question="Question?",
        answer="Answer.",
        sources=[ref_wrong_page],
    )

    validated = validator.validate_response(response, available_chunks=[authentic_chunk], strict_mode=True)

    assert len(validated.sources) == 1
    # Check that authentic metadata from chunk replaced incorrect input
    assert validated.sources[0].page == 1
    assert validated.sources[0].clause == "Section 1.01"
    assert validated.sources[0].document_name == "agreement.pdf"

