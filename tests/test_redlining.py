"""Tests for genuine text diffs, change acceptance/rejection, reconstruction, and DOCX export."""

import io
import pytest
import docx
from draftmate_ai.contract_review.redlining import RedlineEngine, compute_text_diff_operations
from draftmate_ai.contract_review.schemas import Finding, IssueCategory, SeverityLevel, ReviewStatus


def test_diff_operations():
    """Test token-level diff tagging."""
    orig = "Contractor shall use best efforts to deliver."
    prop = "Contractor shall use commercially reasonable efforts to deliver."

    ops = compute_text_diff_operations(orig, prop)
    tags = [op[0] for op in ops]
    assert "replace" in tags
    assert "equal" in tags


def test_redline_accept_reject_lifecycle():
    """Test interactive accepting and rejecting of changes."""
    base_text = "Vendor shall use best efforts to complete the milestone. Invoices are paid in 60 days."
    engine = RedlineEngine(original_text=base_text)

    finding1 = Finding(
        finding_id="f1",
        category=IssueCategory.AMBIGUOUS_WORDING,
        severity=SeverityLevel.MEDIUM,
        title="Best efforts",
        explanation="Ambiguous standard",
        original_text="best efforts",
        suggested_revision="commercially reasonable efforts",
        risk_if_unaddressed="Risk",
    )

    finding2 = Finding(
        finding_id="f2",
        category=IssueCategory.PAYMENT_TERMS,
        severity=SeverityLevel.LOW,
        title="Payment days",
        explanation="60 days is slow",
        original_text="60 days",
        suggested_revision="30 days",
        risk_if_unaddressed="Risk",
    )

    chg1 = engine.create_change_from_finding(finding1)
    chg2 = engine.create_change_from_finding(finding2)

    assert len(engine.changes) == 2
    assert chg1.status == ReviewStatus.PENDING

    # Accept change 1, reject change 2
    assert engine.accept_change(chg1.change_id) is True
    assert engine.reject_change(chg2.change_id) is True

    # Reconstruct revised document
    revised = engine.reconstruct_document(mode="revised")
    assert "commercially reasonable efforts" in revised
    assert "60 days" in revised  # Rejected change 2 retains original 60 days

    # Reconstruct original document
    original = engine.reconstruct_document(mode="original")
    assert original == base_text


def test_redline_markup_rendering():
    """Test inline markup format with deletions and additions."""
    base_text = "Contractor shall use best efforts to deliver."
    engine = RedlineEngine(original_text=base_text)

    finding = Finding(
        finding_id="f1",
        category=IssueCategory.AMBIGUOUS_WORDING,
        severity=SeverityLevel.MEDIUM,
        title="Ambiguity",
        explanation="Best efforts",
        original_text="best efforts",
        suggested_revision="commercially reasonable efforts",
        risk_if_unaddressed="Risk",
    )
    engine.create_change_from_finding(finding)

    markup = engine.reconstruct_document(mode="markup")
    assert "[-best efforts-]" in markup
    assert "[+commercially reasonable efforts+]" in markup


def test_redline_docx_export():
    """Test generating a valid DOCX file with tracked changes styling."""
    base_text = "Vendor shall use best efforts to complete the task."
    engine = RedlineEngine(original_text=base_text)

    finding = Finding(
        finding_id="f1",
        category=IssueCategory.AMBIGUOUS_WORDING,
        severity=SeverityLevel.MEDIUM,
        title="Ambiguity",
        explanation="Best efforts",
        original_text="best efforts",
        suggested_revision="commercially reasonable efforts",
        risk_if_unaddressed="Risk",
    )
    engine.create_change_from_finding(finding)

    docx_bytes = engine.export_to_docx(mode="markup")
    assert len(docx_bytes) > 0
    assert docx_bytes.startswith(b"PK\x03\x04")

    # Verify docx can be parsed and contains runs
    doc = docx.Document(io.BytesIO(docx_bytes))
    paragraphs = doc.paragraphs
    assert len(paragraphs) > 0
    # Check runs in first paragraph
    runs = paragraphs[0].runs
    assert any(r.font.strike is True for r in runs)
    assert any(r.font.underline is True for r in runs)

