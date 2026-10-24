"""Tests for hybrid issue detection, ambiguity recognition, placeholders, and severity."""

import pytest
from draftmate_ai.document_processing import ingest_document
from draftmate_ai.contract_review.issue_detection import ContractIssueDetector
from draftmate_ai.contract_review.schemas import SeverityLevel, IssueCategory, ReviewPosture


@pytest.fixture
def flawed_contract_doc():
    flawed_text = """MASTER SERVICES AGREEMENT

This Agreement is entered into by Alpha Corp ("Client") and Beta Solutions LLC ("Vendor").

ARTICLE 1. SERVICES AND PERFORMANCE
Section 1.1 Standard. Vendor shall use best efforts to complete the deliverables promptly.
Section 1.2 Specifications. Deliverables shall comply with requirements in Section 8.5.

ARTICLE 2. COMPENSATION AND RENEWAL
Section 2.1 Fees. Client shall pay Vendor [INSERT FEE AMOUNT] within 30 days of invoice.
Section 2.2 Term. This agreement shall automatically renew for successive one-year terms.

ARTICLE 3. INDEMNIFICATION
Section 3.1 Indemnity. Vendor shall indemnify and hold harmless Client from any claims.
"""
    return ingest_document(source=flawed_text.encode("utf-8"), filename="flawed_msa.txt")


def test_issue_detection_ambiguous_wording(flawed_contract_doc):
    """Test detecting ambiguous phrases ('best efforts', 'promptly')."""
    detector = ContractIssueDetector(posture=ReviewPosture.NEUTRAL)
    _, _, findings = detector.analyze_all_issues(flawed_contract_doc)

    ambig_findings = [f for f in findings if f.category == IssueCategory.AMBIGUOUS_WORDING]
    assert len(ambig_findings) >= 2
    titles = [f.title for f in ambig_findings]
    assert any("best efforts" in t for t in titles)
    assert any("promptly" in t for t in titles)


def test_issue_detection_broken_cross_reference(flawed_contract_doc):
    """Test detecting reference to non-existent Section 8.5."""
    detector = ContractIssueDetector()
    _, _, findings = detector.analyze_all_issues(flawed_contract_doc)

    xref_findings = [f for f in findings if f.category == IssueCategory.BROKEN_CROSS_REFERENCE]
    assert len(xref_findings) >= 1
    assert any("Section 8.5" in f.title for f in xref_findings)
    assert xref_findings[0].severity in (SeverityLevel.HIGH, SeverityLevel.CRITICAL)


def test_issue_detection_unfilled_placeholders(flawed_contract_doc):
    """Test detecting bracketed placeholder markers like [INSERT FEE AMOUNT]."""
    detector = ContractIssueDetector()
    _, _, findings = detector.analyze_all_issues(flawed_contract_doc)

    missing_info = [f for f in findings if f.category == IssueCategory.MISSING_INFORMATION]
    assert len(missing_info) >= 1
    assert any("INSERT FEE AMOUNT" in f.title for f in missing_info)


def test_issue_detection_missing_provisions(flawed_contract_doc):
    """Test flagging missing mandatory provisions for an MSA (e.g. Limitation of Liability, Governing Law)."""
    detector = ContractIssueDetector(posture=ReviewPosture.BUYER_FRIENDLY)
    _, _, findings = detector.analyze_all_issues(flawed_contract_doc)

    missing_provs = [f for f in findings if f.category == IssueCategory.MISSING_PROVISION or f.category == IssueCategory.LIABILITY_LIMITATIONS]
    assert len(missing_provs) >= 1
    assert any("Liability" in f.title or "Governing Law" in f.title for f in missing_provs)


def test_issue_finding_structure_integrity(flawed_contract_doc):
    """Ensure all Finding objects satisfy the strict schema requirements."""
    detector = ContractIssueDetector()
    _, _, findings = detector.analyze_all_issues(flawed_contract_doc)

    assert len(findings) > 0
    for f in findings:
        assert f.finding_id
        assert f.category
        assert f.severity in SeverityLevel
        assert f.title
        assert f.explanation
        assert f.original_text
        assert f.risk_if_unaddressed

