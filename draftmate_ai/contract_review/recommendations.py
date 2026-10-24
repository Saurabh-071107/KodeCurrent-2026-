"""Revision generator providing concrete alternative wording, assumptions, and legal rationales."""

import re
from typing import List, Optional, Tuple
from pydantic import BaseModel, Field

from draftmate_ai.contract_review.schemas import Finding, ReviewPosture, IssueCategory
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


class RevisionOption(BaseModel):
    """An alternative proposal for resolving a contractual finding."""
    option_name: str  # e.g. "Balanced Mutual", "Client-Favorable", "Pro-Payee"
    proposed_text: str
    rationale: str
    material_changes: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    jurisdictional_notes: List[str] = Field(default_factory=list)
    requires_user_input: bool = False


class RecommendationEngine:
    """Generates concrete replacement wording tailored to review posture while avoiding hallucinated terms."""

    def __init__(self, posture: ReviewPosture = ReviewPosture.NEUTRAL):
        self.posture = posture

    def generate_recommendation_options(self, finding: Finding) -> List[RevisionOption]:
        """Generate concrete revision options for a given finding."""
        options: List[RevisionOption] = []
        orig = finding.original_text

        # 1. Ambiguous Wording
        if finding.category == IssueCategory.AMBIGUOUS_WORDING:
            if "best efforts" in orig.lower():
                options.append(
                    RevisionOption(
                        option_name="Commercially Reasonable Efforts (Standard)",
                        proposed_text=orig.replace("best efforts", "commercially reasonable efforts"),
                        rationale="Replaces burdensome and uncertain 'best efforts' with established commercial standard.",
                        material_changes=["Lowered standard from best efforts to commercially reasonable efforts."],
                        assumptions=["Parties intended standard commercial diligence rather than exhaustive expenditures."],
                    )
                )
                options.append(
                    RevisionOption(
                        option_name="Defined Metric Alternative",
                        proposed_text=orig.replace("best efforts", "commercially reasonable efforts not to exceed [CAP AMOUNT/HOURS]"),
                        rationale="Sets an explicit upper ceiling on obligation expenditure.",
                        material_changes=["Added explicit cap parameter to obligation."],
                        requires_user_input=True,
                    )
                )

        # 2. Liability Cap
        elif finding.category == IssueCategory.LIABILITY_LIMITATIONS:
            if "unilateral" in finding.title.lower() or "one-sided" in finding.title.lower():
                options.append(
                    RevisionOption(
                        option_name="Mutual Liability Cap",
                        proposed_text=orig.replace("Vendor's", "Either party's").replace("Contractor's", "Either party's"),
                        rationale="Provides bilateral protection so both parties share identical risk limits.",
                        material_changes=["Expanded cap applicability from unilateral to bilateral."],
                    )
                )
            else:
                options.append(
                    RevisionOption(
                        option_name="Standard 12-Month Trailing Fee Cap",
                        proposed_text=(
                            "IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY ARISING UNDER THIS AGREEMENT "
                            "EXCEED THE TOTAL AMOUNTS PAID OR PAYABLE HEREUNDER IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM."
                        ),
                        rationale="Standard commercial liability allocation tied to contract value.",
                        material_changes=["Added bilateral aggregate cap tied to 12-month fees."],
                    )
                )

        # 3. Automatic Renewal
        elif finding.category == IssueCategory.TERMINATION_RENEWAL:
            options.append(
                RevisionOption(
                    option_name="30-Day Notice Opt-Out",
                    proposed_text=(
                        f"{orig} provided that either party may terminate by providing at least thirty (30) days' "
                        "written notice of non-renewal prior to the expiration of the current term."
                    ),
                    rationale="Prevents unintended automatic lock-in by providing a 30-day non-renewal window.",
                    material_changes=["Inserted 30-day prior written non-renewal notice requirement."],
                )
            )

        # 4. Broken Cross-Reference
        elif finding.category == IssueCategory.BROKEN_CROSS_REFERENCE:
            options.append(
                RevisionOption(
                    option_name="Correction Placeholder",
                    proposed_text=finding.suggested_revision or orig,
                    rationale="Flags the broken citation for insertion of the authentic intended section.",
                    requires_user_input=True,
                )
            )

        # Default fallback
        if not options and finding.suggested_revision:
            options.append(
                RevisionOption(
                    option_name="Recommended Revision",
                    proposed_text=finding.suggested_revision,
                    rationale=finding.rationale or "Resolves identified contractual risk.",
                )
            )

        return options

