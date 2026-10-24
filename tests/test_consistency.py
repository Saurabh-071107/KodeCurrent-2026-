"""Tests for cross-clause consistency checking and review evaluation benchmarks."""

import pytest
from draftmate_ai.contract_review.cross_clause_analysis import ConsistencyChecker
from draftmate_ai.contract_review.evaluation import (
    evaluate_issue_detection,
    GroundTruthIssue,
)
from draftmate_ai.contract_review.schemas import Finding, IssueCategory, SeverityLevel


def test_consistency_conflicting_notice_periods():
    """Test detecting differing notice periods across clauses in a contract."""
    contract_text = (
        "SECTION 2. TERMINATION.\n"
        "Either party may terminate for convenience upon thirty (30) days prior written notice.\n\n"
        "SECTION 7. DEFAULT AND REMEDIES.\n"
        "Non-breaching party may terminate immediately if default is not cured within sixty (60) days written notice."
    )
    checker = ConsistencyChecker()
    findings = checker.check_cross_clause_consistency(contract_text)

    assert len(findings) > 0
    conflict = findings[0]
    assert conflict.category == IssueCategory.CONFLICTING_TERMS
    assert "30" in conflict.title and "60" in conflict.title


def test_evaluate_issue_detection_metrics():
    """Test precision, recall, and grounding metrics against ground truth."""
    full_text = "Vendor shall use best efforts. Invoices paid in [INSERT DAYS]."

    detected = [
        Finding(
            finding_id="f1",
            category=IssueCategory.AMBIGUOUS_WORDING,
            severity=SeverityLevel.MEDIUM,
            title="Best efforts",
            explanation="Ambiguity",
            original_text="best efforts",
            risk_if_unaddressed="Risk",
        ),
        Finding(
            finding_id="f2",
            category=IssueCategory.MISSING_INFORMATION,
            severity=SeverityLevel.HIGH,
            title="Missing days",
            explanation="Placeholder",
            original_text="[INSERT DAYS]",
            risk_if_unaddressed="Risk",
        ),
    ]

    ground_truth = [
        GroundTruthIssue(
            issue_id="gt1",
            category=IssueCategory.AMBIGUOUS_WORDING,
            expected_severity=SeverityLevel.MEDIUM,
            expected_text_substring="best efforts",
        ),
        GroundTruthIssue(
            issue_id="gt2",
            category=IssueCategory.MISSING_INFORMATION,
            expected_severity=SeverityLevel.HIGH,
            expected_text_substring="[INSERT DAYS]",
        ),
    ]

    report = evaluate_issue_detection(
        detected_findings=detected,
        ground_truth_issues=ground_truth,
        full_contract_text=full_text,
    )

    assert report.precision == 1.0
    assert report.recall == 1.0
    assert report.f1_score == 1.0
    assert report.evidence_grounding_accuracy == 1.0
    assert report.missed_critical_count == 0
    assert report.total_findings_evaluated == 2

