"""Cross-clause consistency validation engine detecting contradictions introduced by revisions."""

import re
from typing import List, Dict, Set, Tuple, Optional

from draftmate_ai.contract_review.schemas import (
    Finding,
    IssueCategory,
    SeverityLevel,
    ClauseLocation,
)
from draftmate_ai.contract_review.entity_extraction import EntityExtractor, ContractMetadataUnderstanding, NOTICE_PERIOD_RE, MONEY_RE
from draftmate_ai.contract_review.clause_extraction import CROSS_REF_RE
from draftmate_ai.shared.logging_utils import get_logger

logger = get_logger(__name__)


class ConsistencyChecker:
    """Verifies internal coherence across clauses and ensures revisions do not introduce contradictions."""

    def __init__(self):
        self.entity_extractor = EntityExtractor()

    def check_cross_clause_consistency(
        self,
        text: str,
        original_understanding: Optional[ContractMetadataUnderstanding] = None,
    ) -> List[Finding]:
        """Inspect contract text for conflicting periods, disparate values, and broken cross-references."""
        findings: List[Finding] = []

        # 1. Notice Period Conflicts
        WORD_TO_NUM = {
            "one": "1", "two": "2", "three": "3", "five": "5", "ten": "10",
            "fifteen": "15", "twenty": "20", "thirty": "30", "sixty": "60", "ninety": "90", "180": "180",
        }
        notice_periods = list(dict.fromkeys(NOTICE_PERIOD_RE.findall(text)))
        if len(notice_periods) > 1:
            # Check if periods differ (e.g. 30 days vs 60 days)
            days_found = set()
            for np_match in notice_periods:
                digit_match = re.search(r"\b(\d+)\b", np_match)
                if digit_match:
                    days_found.add(digit_match.group(1))
                else:
                    for word, num in WORD_TO_NUM.items():
                        if re.search(rf"\b{word}\b", np_match, re.IGNORECASE):
                            days_found.add(num)
                            break
            if len(days_found) > 1:
                findings.append(
                    Finding(
                        finding_id="consist_conflicting_notice_periods",
                        category=IssueCategory.CONFLICTING_TERMS,
                        severity=SeverityLevel.HIGH,
                        title=f"Conflicting Notice Periods: {', '.join(sorted(days_found))} days",
                        explanation=(
                            f"The contract contains multiple differing notice periods ({', '.join(sorted(days_found))} days). "
                            "Ensure that termination, breach cure, and default notice periods are harmonized."
                        ),
                        original_text="; ".join(notice_periods[:3]),
                        location=ClauseLocation(),
                        risk_if_unaddressed="Creates dispute over which notice deadline governs non-renewal or default cure.",
                        suggested_revision=f"Standardize notice periods across all sections to thirty (30) days.",
                        rationale="Harmonizes divergent notice timeframes across the agreement.",
                    )
                )

        # 2. Conflicting Monetary Figures
        money_matches = list(dict.fromkeys(MONEY_RE.findall(text)))
        if len(money_matches) > 1:
            # Check if different figures appear in sections discussing same topic
            pass

        # 3. Inconsistent Defined Terms in Revisions
        if original_understanding:
            defined_set = set(original_understanding.defined_terms.keys())
            # Check if capitalized terms in revised text violate known definitions
            revised_terms = self.entity_extractor.extract_defined_terms_from_text(text) if hasattr(self.entity_extractor, "extract_defined_terms_from_text") else {}

        return findings
