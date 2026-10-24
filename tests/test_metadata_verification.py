"""Tests for citation metadata accuracy verification against authoritative records."""

import pytest
from draftmate_ai.citation_verification.metadata_verification import MetadataVerifier
from draftmate_ai.citation_verification.schemas import (
    ExtractedCitation,
    NormalizedCitation,
    AuthorityRecord,
    MetadataAccuracyStatus,
    CitationType,
)


@pytest.fixture
def sample_authority():
    return AuthorityRecord(
        authority_id="auth_kb",
        canonical_name="Kesavananda Bharati Sripadagalvaru v. State of Kerala",
        citations=["(1973) 4 SCC 225", "AIR 1973 SC 1461"],
        court="Supreme Court of India",
        decision_date="1973-04-24",
    )


def test_metadata_full_match(sample_authority):
    extracted = ExtractedCitation(
        citation_id="cit_1",
        raw_citation="Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225",
        citation_type=CitationType.CASE_LAW,
        case_name="Kesavananda Bharati v. State of Kerala",
        reporter="SCC",
        volume="4",
        page="225",
        year=1973,
    )
    norm = NormalizedCitation(
        canonical_citation="(1973) 4 SCC 225",
        canonical_case_name="Kesavananda Bharati v. State of Kerala",
        normalized_court="Supreme Court of India",
        standard_reporter="SCC",
        year=1973,
        volume="4",
        page="225",
    )

    verifier = MetadataVerifier()
    status, explanation, discrepancies = verifier.verify_metadata(extracted, norm, sample_authority)

    assert status == MetadataAccuracyStatus.MATCH
    assert len(discrepancies) == 0
    assert "matches" in explanation.lower()


def test_metadata_year_mismatch(sample_authority):
    extracted = ExtractedCitation(
        citation_id="cit_2",
        raw_citation="Kesavananda Bharati v. State of Kerala, (1995) 4 SCC 225",
        citation_type=CitationType.CASE_LAW,
        case_name="Kesavananda Bharati v. State of Kerala",
        reporter="SCC",
        volume="4",
        page="225",
        year=1995,  # Contradicts 1973
    )
    norm = NormalizedCitation(
        canonical_citation="(1995) 4 SCC 225",
        canonical_case_name="Kesavananda Bharati v. State of Kerala",
        normalized_court="Supreme Court of India",
        standard_reporter="SCC",
        year=1995,
        volume="4",
        page="225",
    )

    verifier = MetadataVerifier()
    status, explanation, discrepancies = verifier.verify_metadata(extracted, norm, sample_authority)

    assert status == MetadataAccuracyStatus.MISMATCH
    assert any("year 1995 contradicts" in d.lower() for d in discrepancies)


def test_metadata_not_checked_when_authority_none():
    extracted = ExtractedCitation(
        citation_id="cit_3",
        raw_citation="Unknown Case v. Unknown, (2020) 1 SCC 1",
        citation_type=CitationType.CASE_LAW,
    )
    norm = NormalizedCitation(canonical_citation="(2020) 1 SCC 1")

    verifier = MetadataVerifier()
    status, explanation, discrepancies = verifier.verify_metadata(extracted, norm, None)

    assert status == MetadataAccuracyStatus.NOT_CHECKED

