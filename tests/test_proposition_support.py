"""Tests for proposition support verification against source judgment passages."""

import pytest
from draftmate_ai.citation_verification.proposition_support import PropositionSupportVerifier
from draftmate_ai.citation_verification.schemas import (
    AuthorityRecord,
    PropositionSupportStatus,
)


@pytest.fixture
def sample_authority():
    return AuthorityRecord(
        authority_id="auth_kb",
        canonical_name="Kesavananda Bharati v. State of Kerala",
        citations=["(1973) 4 SCC 225"],
        court="Supreme Court of India",
        full_text="The basic structure of the Constitution cannot be destroyed or emasculated by Parliament under Article 368.",
        paragraphs={
            "45": "The basic structure of the Constitution is inviolable and cannot be abrogated by constitutional amendment.",
            "292": "A power to amend is not a power to destroy the fundamental institutional pillars of the democratic republic.",
        },
    )


def test_proposition_directly_supported(sample_authority):
    prop = "The basic structure of the Constitution cannot be abrogated by constitutional amendment."
    verifier = PropositionSupportVerifier()
    status, excerpts, explanation = verifier.verify_proposition(prop, sample_authority)

    assert status == PropositionSupportStatus.SUPPORTED
    assert len(excerpts) > 0
    assert any("Paragraph 45" in e for e in excerpts)


def test_proposition_contradicted(sample_authority):
    prop = "Parliament possesses unlimited power to destroy the fundamental institutional pillars of the democratic republic."
    verifier = PropositionSupportVerifier()
    status, excerpts, explanation = verifier.verify_proposition(prop, sample_authority)

    assert status == PropositionSupportStatus.CONTRADICTED
    assert "contradiction detected" in explanation.lower()


def test_proposition_unsupported(sample_authority):
    prop = "A commercial landlord must provide sixty days written notice before drawing down on a security deposit."
    verifier = PropositionSupportVerifier()
    status, excerpts, explanation = verifier.verify_proposition(prop, sample_authority)

    assert status == PropositionSupportStatus.UNSUPPORTED
    assert len(excerpts) == 0


def test_proposition_insufficient_evidence():
    verifier = PropositionSupportVerifier()
    # Authority with no text
    empty_auth = AuthorityRecord(
        authority_id="empty",
        canonical_name="Empty Record",
        citations=["2024 SC 1"],
    )
    status, excerpts, explanation = verifier.verify_proposition("Any claim", empty_auth)
    assert status == PropositionSupportStatus.INSUFFICIENT_EVIDENCE
    assert "inaccessible or empty" in explanation.lower()

