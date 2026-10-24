"""Tests for legal citation extraction across case law, statutory, and constitutional references."""

import pytest
from draftmate_ai.citation_verification.extraction import CitationExtractor
from draftmate_ai.citation_verification.schemas import CitationType
from draftmate_ai.shared.document_models import ProcessedDocument, StructuralElement, ElementType, DocumentMetadata


def test_extract_scc_case_citation():
    text = (
        "The Supreme Court affirmed the basic structure doctrine in "
        "Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225, para 45."
    )
    extractor = CitationExtractor()
    citations = extractor.extract_from_text(text)

    assert len(citations) >= 1
    cit = citations[0]
    assert cit.citation_type == CitationType.CASE_LAW
    assert cit.case_name == "Kesavananda Bharati v. State of Kerala"
    assert cit.year == 1973
    assert cit.volume == "4"
    assert cit.reporter == "SCC"
    assert cit.page == "225"
    assert cit.pinpoint == "para 45"
    assert "basic structure doctrine" in cit.associated_proposition.lower()
    assert "(1973) 4 SCC 225" in cit.raw_citation


def test_extract_air_and_insc_citations():
    text = (
        "In Maneka Gandhi v. Union of India, AIR 1978 SC 597, the right to travel abroad was upheld. "
        "Further, in 2023 INSC 582, the bench clarified constitutional parameters."
    )
    extractor = CitationExtractor()
    citations = extractor.extract_from_text(text)

    assert len(citations) >= 2
    air_cit = next(c for c in citations if c.reporter == "AIR")
    assert air_cit.year == 1978
    assert air_cit.page == "597"
    assert "Maneka Gandhi" in (air_cit.case_name or "")

    insc_cit = next(c for c in citations if c.reporter == "INSC")
    assert insc_cit.year == 2023
    assert insc_cit.page == "582"


def test_extract_statutory_and_constitutional_citations():
    text = (
        "The applicant sought interim injunction under Section 9 of the Arbitration and Conciliation Act, 1996. "
        "The right to life is protected under Article 21 of the Constitution of India."
    )
    extractor = CitationExtractor()
    citations = extractor.extract_from_text(text)

    statute_cit = next(c for c in citations if c.citation_type == CitationType.STATUTE)
    assert "Arbitration and Conciliation Act" in statute_cit.statute_name
    assert statute_cit.section_number == "9"

    const_cit = next(c for c in citations if c.citation_type == CitationType.CONSTITUTIONAL)
    assert "Constitution of India" in const_cit.statute_name
    assert "Article 21" in const_cit.section_number


def test_extract_from_processed_document():
    doc = ProcessedDocument(
        elements=[
            StructuralElement(
                element_id="el_1",
                element_type=ElementType.PARAGRAPH,
                original_text="As held in K.S. Puttaswamy v. Union of India, (2017) 10 SCC 1, privacy is a fundamental right.",
                normalized_text="As held in K.S. Puttaswamy v. Union of India, (2017) 10 SCC 1, privacy is a fundamental right.",
                page_number=3,
            )
        ],
        metadata=DocumentMetadata(
            document_id="doc_citations_test",
            filename="brief.docx",
            file_type="docx",
            file_size_bytes=1000,
            sha256_checksum="abc1234",
            extraction_method="test",
            created_at="2026-10-25T00:00:00Z",
        ),
        raw_text="As held in K.S. Puttaswamy v. Union of India, (2017) 10 SCC 1, privacy is a fundamental right.",
    )

    extractor = CitationExtractor()
    citations = extractor.extract_from_document(doc)

    assert len(citations) == 1
    cit = citations[0]
    assert cit.document_id == "doc_citations_test"
    assert cit.page_number == 3
    assert cit.clause_or_element_id == "el_1"
    assert cit.year == 2017
    assert cit.reporter == "SCC"

