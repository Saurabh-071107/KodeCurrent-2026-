"""Tests for contract clause extraction, taxonomy classification, and cross-reference mapping."""

import pytest
from draftmate_ai.document_processing import ingest_document
from draftmate_ai.contract_review.clause_extraction import (
    ClauseExtractor,
    classify_clause_taxonomy,
    detect_contract_title_and_type,
)


def test_clause_extraction_hierarchy(sample_pdf_bytes):
    """Test extracting structured clause hierarchy and taxonomy categories."""
    doc = ingest_document(source=sample_pdf_bytes, filename="agreement.pdf")
    extractor = ClauseExtractor()
    hierarchy = extractor.extract_clauses(doc)

    assert hierarchy.contract_type in ("Master Services Agreement", "General Contract")
    assert len(hierarchy.clauses) > 0

    # Check taxonomies
    taxonomies = {c.taxonomy_category for c in hierarchy.clauses}
    assert "DEFINITIONS" in taxonomies
    assert "PAYMENT_TERMS" in taxonomies or "GENERAL" in taxonomies


def test_classify_clause_taxonomy():
    """Test keyword-based legal clause classification."""
    assert classify_clause_taxonomy("Tenant shall indemnify and hold harmless Landlord") == "INDEMNIFICATION"
    assert classify_clause_taxonomy("Recipient shall hold all Confidential Information in secrecy") == "CONFIDENTIALITY"
    assert classify_clause_taxonomy("In no event shall aggregate liability exceed the total fees paid") == "LIMITATION_OF_LIABILITY"
    assert classify_clause_taxonomy("This Agreement shall be governed by Delaware law") == "GOVERNING_LAW"


def test_detect_contract_type(sample_legal_text):
    """Test identifying contract type from text semantics."""
    doc = ingest_document(source=sample_legal_text.encode("utf-8"), filename="lease.txt")
    title, c_type = detect_contract_title_and_type(doc)

    assert c_type == "Commercial Lease Agreement"
    assert "COMMERCIAL LEASE" in (title or "")


def test_broken_cross_reference_detection():
    """Test identifying broken cross references pointing to missing clauses."""
    contract_text = (
        "ARTICLE 1: CONFIDENTIALITY\n\n"
        "Section 1.1 Scope. Confidential Information shall be handled as set forth in Section 9.4.\n\n"
        "Section 1.2 Term. This agreement remains in effect for 2 years."
    )
    doc = ingest_document(source=contract_text.encode("utf-8"), filename="test_xref.txt")
    extractor = ClauseExtractor()
    hierarchy = extractor.extract_clauses(doc)

    assert len(hierarchy.broken_cross_references) > 0
    broken_sources, broken_targets = zip(*hierarchy.broken_cross_references)
    assert any("Section 9.4" in target for target in broken_targets)

