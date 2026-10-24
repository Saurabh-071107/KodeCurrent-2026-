"""Tests for end-to-end citation verification status synthesis and multi-dimensional reporting."""

import pytest
from draftmate_ai.citation_verification.verification import CitationVerificationEngine
from draftmate_ai.citation_verification.schemas import (
    ExtractedCitation,
    CitationType,
    VerificationStatus,
    ExistenceStatus,
    MetadataAccuracyStatus,
    PropositionSupportStatus,
    PinpointAccuracyStatus,
    LegalCurrencyStatus,
)
from draftmate_ai.shared.document_models import ProcessedDocument, StructuralElement, ElementType, DocumentMetadata


@pytest.fixture
def verification_engine():
    return CitationVerificationEngine()


def test_verified_citation(verification_engine):
    extracted = ExtractedCitation(
        citation_id="cit_valid",
        raw_citation="Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225, para 45",
        citation_type=CitationType.CASE_LAW,
        case_name="Kesavananda Bharati v. State of Kerala",
        reporter="SCC",
        volume="4",
        page="225",
        year=1973,
        pinpoint="para 45",
        associated_proposition="The basic structure of the Constitution cannot be abrogated by constitutional amendment.",
    )

    result = verification_engine.verify_citation(extracted)

    assert result.overall_status == VerificationStatus.VERIFIED
    assert result.existence == ExistenceStatus.FOUND
    assert result.metadata_accuracy == MetadataAccuracyStatus.MATCH
    assert result.proposition_support == PropositionSupportStatus.SUPPORTED
    assert result.pinpoint_accuracy == PinpointAccuracyStatus.VERIFIED
    assert result.legal_currency == LegalCurrencyStatus.GOOD_LAW
    assert result.matched_authority_id == "auth_kesavananda_1973"
    assert len(result.supporting_excerpts) > 0


def test_conflicting_status_for_overruled_authority(verification_engine):
    extracted = ExtractedCitation(
        citation_id="cit_overruled",
        raw_citation="ADM Jabalpur v. Shivkant Shukla, (1976) 2 SCC 521",
        citation_type=CitationType.CASE_LAW,
        case_name="ADM Jabalpur v. Shivkant Shukla",
        reporter="SCC",
        volume="2",
        page="521",
        year=1976,
        associated_proposition="Habeas corpus petition is barred during emergency proclamation.",
    )

    result = verification_engine.verify_citation(extracted)

    # Authority is found, but because it is OVERRULED, overall status is CONFLICTING
    assert result.overall_status == VerificationStatus.CONFLICTING
    assert result.legal_currency == LegalCurrencyStatus.OVERRULED
    assert "overruled" in result.currency_notes.lower()


def test_unverified_status_for_fabricated_citation(verification_engine):
    extracted = ExtractedCitation(
        citation_id="cit_fake",
        raw_citation="Fictitious Technologies Ltd. v. Imaginary State Corp., (2025) 99 SCC 1000",
        citation_type=CitationType.CASE_LAW,
        case_name="Fictitious Technologies Ltd. v. Imaginary State Corp.",
        reporter="SCC",
        volume="99",
        page="1000",
        year=2025,
        associated_proposition="Liability cannot be excluded under any circumstances.",
    )

    result = verification_engine.verify_citation(extracted)

    assert result.overall_status == VerificationStatus.UNVERIFIED
    assert result.existence == ExistenceStatus.NOT_FOUND
    assert result.matched_authority_id is None


def test_document_citation_report_aggregation(verification_engine):
    doc = ProcessedDocument(
        elements=[
            StructuralElement(
                element_id="el_1",
                element_type=ElementType.PARAGRAPH,
                original_text=(
                    "Under Section 9 of the Arbitration and Conciliation Act, 1996, the court can grant interim measures. "
                    "In ADM Jabalpur v. Shivkant Shukla, (1976) 2 SCC 521, the court suspended Article 21 rights."
                ),
                normalized_text=(
                    "Under Section 9 of the Arbitration and Conciliation Act, 1996, the court can grant interim measures. "
                    "In ADM Jabalpur v. Shivkant Shukla, (1976) 2 SCC 521, the court suspended Article 21 rights."
                ),
                page_number=1,
            )
        ],
        metadata=DocumentMetadata(
            document_id="doc_composite_citations",
            filename="composite.txt",
            file_type="txt",
            file_size_bytes=200,
            sha256_checksum="def5678",
            extraction_method="test",
            created_at="2026-10-25T00:00:00Z",
        ),
        raw_text="Under Section 9 of the Arbitration and Conciliation Act, 1996, the court can grant interim measures. In ADM Jabalpur v. Shivkant Shukla, (1976) 2 SCC 521, the court suspended Article 21 rights.",
    )

    report = verification_engine.verify_document_citations(doc)

    assert report.total_citations == 2
    assert report.verified_count >= 1  # Section 9 is verified
    assert report.conflicting_count >= 1  # ADM Jabalpur is conflicting (overruled)

