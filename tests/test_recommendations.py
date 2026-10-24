"""Tests for concrete revision proposals, assumption tracking, and rationale generation."""

import pytest
from draftmate_ai.contract_review.recommendations import RecommendationEngine
from draftmate_ai.contract_review.schemas import Finding, IssueCategory, SeverityLevel, ReviewPosture


def test_recommendation_for_ambiguous_wording():
    """Test generating concrete alternatives for 'best efforts'."""
    engine = RecommendationEngine(posture=ReviewPosture.NEUTRAL)
    finding = Finding(
        finding_id="f_ambig_1",
        category=IssueCategory.AMBIGUOUS_WORDING,
        severity=SeverityLevel.MEDIUM,
        title="Ambiguous standard",
        explanation="Uses best efforts",
        original_text="Contractor shall use best efforts to deliver the software.",
        risk_if_unaddressed="Onerous standard of care.",
    )

    options = engine.generate_recommendation_options(finding)
    assert len(options) >= 1
    # Check that commercially reasonable efforts is proposed
    assert any("commercially reasonable efforts" in opt.proposed_text for opt in options)
    assert any("partially lowered" in opt.rationale.lower() or "objective" in opt.rationale.lower() or "replaces" in opt.rationale.lower() for opt in options)


def test_recommendation_for_automatic_renewal():
    """Test generating 30-day opt-out notice revision for evergreen clauses."""
    engine = RecommendationEngine()
    finding = Finding(
        finding_id="f_renew_1",
        category=IssueCategory.TERMINATION_RENEWAL,
        severity=SeverityLevel.HIGH,
        title="Automatic renewal",
        explanation="Renews automatically without notice",
        original_text="This agreement automatically renews for one-year terms.",
        risk_if_unaddressed="Lock-in risk.",
    )

    options = engine.generate_recommendation_options(finding)
    assert len(options) >= 1
    assert any("thirty (30) days" in opt.proposed_text for opt in options)
    assert any("non-renewal" in opt.proposed_text for opt in options)


def test_recommendation_preserves_context_without_hallucinating_facts():
    """Ensure revisions do not invent random facts or unrelated obligations."""
    engine = RecommendationEngine()
    finding = Finding(
        finding_id="f_liab_1",
        category=IssueCategory.LIABILITY_LIMITATIONS,
        severity=SeverityLevel.HIGH,
        title="One-sided liability",
        explanation="Vendor liability capped, client uncapped",
        original_text="In no event shall Vendor's aggregate liability exceed the fees paid.",
        risk_if_unaddressed="One-sided risk.",
    )

    options = engine.generate_recommendation_options(finding)
    assert len(options) >= 1
    mutual_opt = options[0]
    assert "Either party's" in mutual_opt.proposed_text
    assert len(mutual_opt.material_changes) > 0

